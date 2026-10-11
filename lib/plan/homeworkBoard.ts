import { AssetRecordType, createShapeId, type Editor, type TLShapeId } from "tldraw";
import { focusCamera } from "@/lib/board/placement";
import type { Homework } from "@/lib/plan/readHomework";

const PAGE_W = 680;
const GAP = 48;

/**
 * Lay the homework pages out in a row to the right of the existing board
 * content, locked so students can write on them without dragging them.
 * Pages are named hw-p1, hw-p2… so the tutor can target them.
 */
export function placeHomeworkPages(editor: Editor, hw: Homework): TLShapeId[] {
  if (!hw.pages.length) return [];
  const content = editor.getCurrentPageBounds();
  const vp = editor.getViewportPageBounds();
  let x = content ? content.maxX + 200 : vp.x + 120;
  const y = content ? content.y : vp.y + 80;
  const ids: TLShapeId[] = [];

  editor.run(() => {
    hw.pages.forEach((page, i) => {
      const h = Math.round((page.h / page.w) * PAGE_W);
      const assetId = AssetRecordType.createId();
      editor.createAssets([
        {
          id: assetId,
          typeName: "asset",
          type: "image",
          meta: {},
          props: { name: `${hw.fileName} p${i + 1}`, src: page.dataUrl, w: page.w, h: page.h, mimeType: "image/jpeg", isAnimated: false },
        },
      ]);
      const id = createShapeId();
      editor.createShape({
        id,
        type: "image",
        x,
        y,
        isLocked: true,
        props: { assetId, w: PAGE_W, h },
        meta: { author: "student", homework: true, page: i + 1, alias: `hw-p${i + 1}` },
      });
      ids.push(id);
      x += PAGE_W + GAP;
    });
  });

  const first = editor.getShapePageBounds(ids[0]);
  if (first) focusCamera(editor, first);
  return ids;
}

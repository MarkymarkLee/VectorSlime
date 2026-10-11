import { renderPlaintextFromRichText, type Editor, type TLRichText, type TLShape } from "tldraw";
import type { BoardShapeSummary } from "@/lib/agent/prompt";

const MAX_SHAPES = 60;
const MAX_IMAGE_DIM = 1280;

function shapeText(editor: Editor, shape: TLShape): string | undefined {
  const props = shape.props as Record<string, unknown>;
  if (shape.type === "math") return `LaTeX: ${props.latex}`;
  if (shape.meta?.homework) return `homework sheet, page ${shape.meta.page} (target it as name=hw-p${shape.meta.page}; use region="x,y,w,h" for one problem)`;
  if (shape.type === "widget") return props.url ? `webpage ${props.url}` : `widget "${props.title}"`;
  if (shape.type === "draw" || shape.type === "highlight") return "(handwriting/drawing — see screenshot)";
  if (props.richText) {
    const text = renderPlaintextFromRichText(editor, props.richText as TLRichText).trim();
    if (text) return text;
  }
  if (shape.type === "embed" || shape.type === "bookmark") return String(props.url ?? "");
  return undefined;
}

/** Visible shapes, summarized for the model. */
export function summarizeBoard(editor: Editor): { shapes: BoardShapeSummary[]; ids: TLShape["id"][] } {
  const vp = editor.getViewportPageBounds();
  const selected = new Set(editor.getSelectedShapeIds());
  const visible = editor
    .getCurrentPageShapesSorted()
    .filter((s) => {
      const b = editor.getShapePageBounds(s);
      return b && b.collides(vp);
    })
    .slice(-MAX_SHAPES);

  return {
    ids: visible.map((s) => s.id),
    shapes: visible.map((s) => {
      const b = editor.getShapePageBounds(s)!;
      return {
        id: s.id,
        type: s.type,
        author: s.meta?.author === "tutor" ? "tutor" : "student",
        name: typeof s.meta?.alias === "string" ? s.meta.alias : undefined,
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.w),
        h: Math.round(b.h),
        text: shapeText(editor, s),
        selected: selected.has(s.id) || undefined,
      };
    }),
  };
}

/** PNG (base64, no prefix) of the given shapes, downscaled for the model. */
export async function snapshotBoard(editor: Editor, ids: TLShape["id"][]): Promise<string | undefined> {
  if (!ids.length) return undefined;
  const bounds = editor.getShapesPageBounds(ids);
  if (!bounds) return undefined;
  const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bounds.w, bounds.h));
  try {
    const { blob } = await editor.toImage(ids, { format: "png", background: true, padding: 24, scale, pixelRatio: 1 });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(bin);
  } catch (err) {
    console.warn("Board snapshot failed", err);
    return undefined;
  }
}

import type { Editor, TLShapeId } from "tldraw";
import { usePlan } from "@/lib/plan/store";
import { useSession } from "@/lib/session/store";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Screen-space areas covered by our overlay UI (tutor cam, controls). */
const RESERVED_RIGHT = 400;
const RESERVED_BOTTOM = 120;
// The left rail (plan + chat) covers this much of the screen when expanded.
const reservedLeft = () => (useSession.getState().chatOpen || usePlan.getState().panelOpen ? 345 : 0);
const GAP = 32;

const overlaps = (a: Rect, b: Rect, margin = 0) =>
  a.x < b.x + b.w + margin && a.x + a.w + margin > b.x && a.y < b.y + b.h + margin && a.y + a.h + margin > b.y;

function occupied(editor: Editor, ignore?: TLShapeId): Rect[] {
  const rects: Rect[] = [];
  for (const s of editor.getCurrentPageShapes()) {
    if (s.id === ignore) continue;
    const b = editor.getShapePageBounds(s);
    if (b) rects.push({ x: b.x, y: b.y, w: b.w, h: b.h });
  }
  return rects;
}

const isFree = (r: Rect, taken: Rect[]) => !taken.some((t) => overlaps(r, t, GAP / 2));

/**
 * Pick a spot for a new w×h shape: next to `nearId` if given, else below the
 * previous tutor shape of this turn, else in empty visible space, else to the
 * right of everything.
 */
export function findSpot(editor: Editor, w: number, h: number, opts: { nearId?: string; after?: Rect } = {}) {
  const taken = occupied(editor);

  if (opts.nearId) {
    const b = editor.getShapePageBounds(opts.nearId as TLShapeId);
    if (b) {
      const candidates = [
        { x: b.maxX + GAP, y: b.y },
        { x: b.x, y: b.maxY + GAP },
        { x: b.x - w - GAP, y: b.y },
        { x: b.maxX + GAP, y: b.maxY + GAP },
      ];
      for (const c of candidates) if (isFree({ ...c, w, h }, taken)) return c;
      return candidates[0];
    }
  }

  if (opts.after) {
    const c = { x: opts.after.x, y: opts.after.y + opts.after.h + GAP };
    if (isFree({ ...c, w, h }, taken)) return c;
    const r = { x: opts.after.x + opts.after.w + GAP, y: opts.after.y };
    if (isFree({ ...r, w, h }, taken)) return r;
  }

  const vp = editor.getViewportPageBounds();
  const z = editor.getZoomLevel();
  const left = reservedLeft();
  const usable = {
    x: vp.x + (40 + left) / z,
    y: vp.y + 70 / z,
    w: vp.w - (RESERVED_RIGHT + 40 + left) / z,
    h: vp.h - (RESERVED_BOTTOM + 70) / z,
  };
  const step = 40 / z;
  for (let y = usable.y; y + h <= usable.y + usable.h; y += step) {
    for (let x = usable.x; x + w <= usable.x + usable.w; x += step) {
      if (isFree({ x, y, w, h }, taken)) return { x, y };
    }
  }

  const page = editor.getCurrentPageBounds();
  return page ? { x: page.maxX + GAP * 2, y: Math.max(page.y, usable.y) } : { x: usable.x, y: usable.y };
}

/** Pan/zoom so that the rect is visible, without zooming in. */
export function ensureVisible(editor: Editor, r: Rect) {
  const vp = editor.getViewportPageBounds();
  const z = editor.getZoomLevel();
  const left = reservedLeft() / z;
  const fits =
    r.x >= vp.x + left && r.y >= vp.y && r.x + r.w <= vp.maxX - RESERVED_RIGHT / z && r.y + r.h <= vp.maxY - RESERVED_BOTTOM / z;
  if (fits) return;
  const pad = 80;
  editor.zoomToBounds(
    { x: r.x - pad - left, y: r.y - pad, w: r.w + pad * 2 + left + RESERVED_RIGHT / z, h: r.h + pad * 2 + RESERVED_BOTTOM / z },
    { animation: { duration: 450 }, targetZoom: Math.min(z, 1) },
  );
}

/**
 * Animate the camera so the rect is centered in the uncovered part of the
 * screen. `zoom` is a requested zoom level; it is capped so the rect fits.
 */
export function focusCamera(editor: Editor, r: Rect, zoom?: number) {
  const screen = editor.getViewportScreenBounds();
  const left = reservedLeft() + 40;
  const top = 70;
  const availW = Math.max(200, screen.w - left - RESERVED_RIGHT - 40);
  const availH = Math.max(160, screen.h - top - RESERVED_BOTTOM - 40);
  const fit = Math.min(availW / Math.max(r.w, 1), availH / Math.max(r.h, 1));
  const z = Math.max(0.2, Math.min(zoom ?? Math.min(fit, 1.4), fit, 3));
  const cx = left + availW / 2;
  const cy = top + availH / 2;
  editor.setCamera(
    { x: cx / z - (r.x + r.w / 2), y: cy / z - (r.y + r.h / 2), z },
    { animation: { duration: 650 } },
  );
}

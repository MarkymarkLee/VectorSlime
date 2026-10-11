"use client";

import { create } from "zustand";
import type { Editor, TLShape, TLShapeId } from "tldraw";

/** Something the tutor can focus on: a shape, or a rectangle of the page. */
export interface FocusTarget {
  shapeId?: TLShapeId;
  region?: { x: number; y: number; w: number; h: number };
}

interface FocusState {
  /** Dim everything except this target. */
  spotlight: FocusTarget | null;
  /** Animated pointer aimed at this target. */
  pointer: (FocusTarget & { label?: string }) | null;
  set: (patch: Partial<Pick<FocusState, "spotlight" | "pointer">>) => void;
}

export const useFocus = create<FocusState>()((set) => ({
  spotlight: null,
  pointer: null,
  set: (patch) => set(patch),
}));

let pointerTimer: ReturnType<typeof setTimeout> | undefined;

export function setPointer(target: FocusState["pointer"]) {
  clearTimeout(pointerTimer);
  useFocus.getState().set({ pointer: target });
  if (target) pointerTimer = setTimeout(() => useFocus.getState().set({ pointer: null }), 7000);
}

/** Remove spotlight, pointer and equation highlights. */
export function clearFocus(editor: Editor | null) {
  clearTimeout(pointerTimer);
  useFocus.getState().set({ spotlight: null, pointer: null });
  if (!editor) return;
  const highlighted = editor.getCurrentPageShapes().filter((s) => s.meta?.highlight);
  if (highlighted.length) {
    editor.run(
      () => {
        editor.updateShapes(highlighted.map((s) => ({ id: s.id, type: s.type, meta: { ...s.meta, highlight: null } })));
      },
      { history: "ignore" },
    );
  }
}

/**
 * Resolve a reference from the model: a real id ("shape:abc") or a name the
 * tutor gave a shape it created (id="eq1"). The most recent match wins.
 */
export function resolveShape(editor: Editor, ref: string | undefined): TLShape | undefined {
  if (!ref) return undefined;
  if (ref.startsWith("shape:")) {
    const s = editor.getShape(ref as TLShapeId);
    if (s) return s;
  }
  const name = ref.replace(/^#/, "");
  const shapes = editor.getCurrentPageShapesSorted();
  for (let i = shapes.length - 1; i >= 0; i--) if (shapes[i].meta?.alias === name) return shapes[i];
  return undefined;
}

/** "x,y,w,h" (commas and/or spaces). */
export function parseRegion(v: string | undefined) {
  if (!v) return undefined;
  const n = v.split(/[\s,]+/).map(Number);
  if (n.length !== 4 || n.some((x) => !Number.isFinite(x)) || n[2] <= 0 || n[3] <= 0) return undefined;
  return { x: n[0], y: n[1], w: n[2], h: n[3] };
}

export function targetFromAttrs(editor: Editor, attrs: Record<string, string>): FocusTarget | undefined {
  const region = parseRegion(attrs.region);
  const shape = resolveShape(editor, attrs.target || attrs.near);
  if (region && shape) {
    // A region together with a target is relative to that shape: pixels from
    // its top-left, or fractions of its size when all values are <= 1.
    const b = editor.getShapePageBounds(shape.id);
    if (b) {
      const frac = [region.x, region.y, region.w, region.h].every((v) => v <= 1);
      const sx = frac ? b.w : 1;
      const sy = frac ? b.h : 1;
      return { region: { x: b.x + region.x * sx, y: b.y + region.y * sy, w: region.w * sx, h: region.h * sy } };
    }
  }
  if (region) return { region };
  return shape ? { shapeId: shape.id } : undefined;
}

export function targetBounds(editor: Editor, t: FocusTarget) {
  if (t.region) return t.region;
  if (t.shapeId) {
    const b = editor.getShapePageBounds(t.shapeId);
    if (b) return { x: b.x, y: b.y, w: b.w, h: b.h };
  }
  return undefined;
}

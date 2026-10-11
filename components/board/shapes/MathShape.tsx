"use client";

import katex from "katex";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BaseBoxShapeUtil, HTMLContainer, T, useValue, type RecordProps, type TLShape } from "tldraw";

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    math: { w: number; h: number; latex: string; color: string };
  }
}

export type MathShape = TLShape<"math">;

const PAD = 12;

export class MathShapeUtil extends BaseBoxShapeUtil<MathShape> {
  static override type = "math" as const;
  static override props: RecordProps<MathShape> = {
    w: T.number,
    h: T.number,
    latex: T.string,
    color: T.string,
  };

  override getDefaultProps(): MathShape["props"] {
    return { w: 200, h: 60, latex: "x^2", color: "#14432a" };
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return false;
  }

  override component(shape: MathShape) {
    return <MathView shape={shape} util={this} />;
  }

  override getIndicatorPath(shape: MathShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 8);
    return path;
  }
}

function MathView({ shape, util }: { shape: MathShape; util: MathShapeUtil }) {
  const editor = util.editor;
  const isEditing = useValue("math editing", () => editor.getEditingShapeId() === shape.id, [editor, shape.id]);
  const ref = useRef<HTMLDivElement>(null);
  const highlight = typeof shape.meta?.highlight === "string" ? shape.meta.highlight : "";
  const html = useMemo(
    () =>
      katex.renderToString(withHighlight(shape.props.latex || "\\square", highlight), {
        displayMode: true,
        throwOnError: false,
        trust: (ctx) => ctx.command === "\\htmlClass",
        strict: "ignore",
      }),
    [shape.props.latex, highlight],
  );

  // Fit the shape to the rendered equation.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = Math.ceil(el.scrollWidth) + PAD * 2;
    const h = Math.ceil(el.scrollHeight) + PAD * 2 + (isEditing ? 64 : 0);
    if (Math.abs(w - shape.props.w) > 2 || Math.abs(h - shape.props.h) > 2) {
      editor.updateShape({ id: shape.id, type: "math", props: { w: Math.max(w, isEditing ? 280 : 40), h } });
    }
  }, [html, isEditing, editor, shape.id, shape.props.w, shape.props.h]);

  return (
    <HTMLContainer
      style={{
        padding: PAD,
        color: shape.props.color,
        fontSize: 26,
        pointerEvents: isEditing ? "all" : "none",
        background: isEditing ? "rgba(255,255,255,0.95)" : "transparent",
        borderRadius: 8,
      }}
    >
      <div ref={ref} style={{ display: "inline-block", whiteSpace: "nowrap" }} dangerouslySetInnerHTML={{ __html: html }} />
      {isEditing && (
        <textarea
          autoFocus
          defaultValue={shape.props.latex}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
              e.preventDefault();
              editor.setEditingShape(null);
            }
          }}
          onChange={(e) =>
            editor.updateShape({ id: shape.id, type: "math", props: { latex: e.currentTarget.value } })
          }
          style={{
            display: "block",
            width: "100%",
            height: 52,
            marginTop: 8,
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
            border: "1px solid #84e9a0",
            borderRadius: 6,
            padding: 6,
            resize: "none",
          }}
        />
      )}
    </HTMLContainer>
  );
}

/**
 * Wrap the first occurrence of `part` in a highlight class. Matching ignores
 * whitespace; parts with unbalanced braces are ignored.
 */
export function withHighlight(latex: string, part: string) {
  const range = findPart(latex, part);
  if (!range) return latex;
  return `${latex.slice(0, range[0])}\\htmlClass{mt-hl}{${latex.slice(range[0], range[1])}}${latex.slice(range[1])}`;
}

export function findPart(latex: string, part: string): [number, number] | null {
  const target = part.replace(/\s+/g, "");
  if (!target || !balanced(target)) return null;
  // Map each non-space character back to its index in the original string.
  const idx: number[] = [];
  let compact = "";
  for (let i = 0; i < latex.length; i++) {
    if (/\s/.test(latex[i])) continue;
    idx.push(i);
    compact += latex[i];
  }
  const at = compact.indexOf(target);
  if (at === -1) return null;
  return [idx[at], idx[at + target.length - 1] + 1];
}

function balanced(s: string) {
  let depth = 0;
  for (const c of s) {
    if (c === "{") depth++;
    else if (c === "}" && --depth < 0) return false;
  }
  return depth === 0;
}

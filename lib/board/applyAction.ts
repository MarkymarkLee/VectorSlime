import {
  AssetRecordType,
  DEFAULT_EMBED_DEFINITIONS,
  createShapeId,
  getEmbedInfo,
  toRichText,
  type Editor,
  type TLDefaultColorStyle,
  type TLShapeId,
  type VecLike,
} from "tldraw";
import type { BoardAction } from "@/lib/agent/actionParser";
import { WIDGET_HEADER } from "@/components/board/shapes/WidgetShape";
import { clearFocus, resolveShape, setPointer, targetBounds, targetFromAttrs, useFocus } from "@/lib/board/focus";
import { ensureVisible, findSpot, focusCamera } from "@/lib/board/placement";
import { startNextLesson } from "@/lib/courses/run";
import { usePlan, type StepStatus } from "@/lib/plan/store";
import { afterTurn } from "@/lib/session/afterTurn";

const COLORS: TLDefaultColorStyle[] = ["black", "blue", "green", "grey", "orange", "red", "violet", "yellow", "light-blue", "light-green", "light-red", "light-violet", "white"];
const TUTOR = { author: "tutor" };

/** Tools that only direct attention; they never change the board's content. */
export const FOCUS_TOOLS = new Set(["focus", "spotlight", "point", "pointer", "emphasize", "emphasise", "clear_focus", "unfocus"]);

const num = (v: string | undefined, def: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : def;
};

/** Per-turn state so consecutive tutor shapes stack neatly. */
export interface TurnPlacement {
  last?: { x: number; y: number; w: number; h: number };
}

/**
 * Execute one board action. Returns a short note for the conversation
 * history (so the model knows the ids it created), or null.
 */
export function applyAction(editor: Editor, action: BoardAction, turn: TurnPlacement): string | null {
  const { tool, attrs, body } = action;
  // Targets may be real ids or names the tutor gave its own shapes (id="eq1").
  const near = resolveShape(editor, attrs.near || attrs.target)?.id;
  const nearId = resolveShape(editor, attrs.near)?.id;
  const meta = attrs.id ? { ...TUTOR, alias: attrs.id } : TUTOR;
  const ref = (id: TLShapeId) => (attrs.id ? `id=${id} name=${attrs.id}` : `id=${id}`);
  const place = (w: number, h: number) => {
    const p = findSpot(editor, w, h, { nearId, after: nearId ? undefined : turn.last });
    turn.last = { ...p, w, h };
    return p;
  };
  const reveal = (id: TLShapeId) => {
    const b = editor.getShapePageBounds(id);
    if (b) ensureVisible(editor, b);
  };

  switch (tool) {
    case "math":
    case "latex":
    case "equation": {
      if (!body) return null;
      const w = Math.min(700, 40 + body.length * 11);
      const h = 80;
      const id = createShapeId();
      editor.createShape({ id, type: "math", ...place(w, h), props: { latex: body, w, h }, meta });
      reveal(id);
      return `wrote equation ${ref(id)}: ${body}`;
    }

    case "text":
    case "note": {
      if (!body) return null;
      const color = COLORS.includes(attrs.color as TLDefaultColorStyle) ? (attrs.color as TLDefaultColorStyle) : "green";
      const w = Math.min(500, 30 + body.length * 12);
      const id = createShapeId();
      editor.createShape({
        id,
        type: "text",
        ...place(w, 50),
        props: { richText: toRichText(body), font: "draw", color, size: "m", autoSize: true },
        meta,
      });
      reveal(id);
      return `wrote note ${ref(id)}: ${body}`;
    }

    case "widget":
    case "html": {
      if (!body) return null;
      const w = num(attrs.w ?? attrs.width, 520, 200, 900);
      const h = num(attrs.h ?? attrs.height, 380, 120, 700) + WIDGET_HEADER;
      const title = attrs.title || "Interactive";
      const id = createShapeId();
      editor.createShape({ id, type: "widget", ...place(w, h), props: { w, h, title, html: body, url: "" }, meta });
      reveal(id);
      // Remember what the widget shows (e.g. quiz options) for later turns.
      const shows = visibleText(body);
      return `created interactive widget ${ref(id)} "${title}"${shows ? ` showing: ${shows}` : ""}`;
    }

    case "svg":
    case "image":
    case "diagram": {
      const svg = body.match(/<svg[\s\S]*<\/svg>/i)?.[0];
      if (!svg) return null;
      const withNs = svg.includes("xmlns=") ? svg : svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      const w = num(attrs.w ?? attrs.width, 360, 80, 900);
      const h = num(attrs.h ?? attrs.height, 280, 80, 700);
      const assetId = AssetRecordType.createId();
      editor.createAssets([
        {
          id: assetId,
          typeName: "asset",
          type: "image",
          meta: {},
          props: {
            name: `${attrs.title || "diagram"}.svg`,
            src: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(withNs)))}`,
            w,
            h,
            mimeType: "image/svg+xml",
            isAnimated: false,
          },
        },
      ]);
      const id = createShapeId();
      editor.createShape({ id, type: "image", ...place(w, h), props: { assetId, w, h }, meta });
      reveal(id);
      return `drew diagram ${ref(id)} "${attrs.title || "diagram"}"`;
    }

    case "arrow": {
      const b = near ? editor.getShapePageBounds(near) : undefined;
      if (!b) return null;
      const end = { x: b.minX - 8, y: b.midY };
      const start = { x: end.x - 150, y: end.y - 90 };
      const id = createShapeId();
      editor.createShape({
        id,
        type: "arrow",
        x: start.x,
        y: start.y,
        props: {
          start: { x: 0, y: 0 },
          end: { x: end.x - start.x, y: end.y - start.y },
          color: "red",
          bend: 20,
          richText: toRichText(attrs.label ?? ""),
        },
        meta: TUTOR,
      });
      reveal(id);
      return `pointed an arrow at ${near}`;
    }

    case "highlight":
    case "circle": {
      const b = near ? editor.getShapePageBounds(near) : undefined;
      if (!b) return null;
      const id = createShapeId();
      editor.createShape({
        id,
        type: "geo",
        x: b.x - 12,
        y: b.y - 12,
        props: { geo: tool === "circle" ? "ellipse" : "rectangle", w: b.w + 24, h: b.h + 24, color: "red", dash: "draw", fill: "none" },
        meta: TUTOR,
      });
      return `highlighted ${near} (highlight id=${id})`;
    }

    case "webpage":
    case "embed":
    case "url": {
      const url = attrs.url || body;
      if (!/^https?:\/\//.test(url)) return null;
      const id = addWebpage(editor, url, place(760, 520 + WIDGET_HEADER), true);
      if (id) reveal(id);
      return `embedded webpage ${url}${id ? ` id=${id}` : ""}`;
    }

    case "focus": {
      const target = targetFromAttrs(editor, attrs);
      const b = target && targetBounds(editor, target);
      if (!b) return null;
      const zoom = Number(attrs.zoom);
      focusCamera(editor, b, Number.isFinite(zoom) && zoom > 0 ? zoom : undefined);
      return null;
    }

    case "spotlight": {
      const target = targetFromAttrs(editor, attrs);
      const b = target && targetBounds(editor, target);
      if (!target || !b) return null;
      useFocus.getState().set({ spotlight: target });
      ensureVisible(editor, b);
      return null;
    }

    case "point":
    case "pointer": {
      const target = targetFromAttrs(editor, attrs);
      const b = target && targetBounds(editor, target);
      if (!target || !b) return null;
      setPointer({ ...target, label: attrs.label || body || undefined });
      ensureVisible(editor, b);
      return null;
    }

    case "emphasize":
    case "emphasise": {
      const shape = resolveShape(editor, attrs.target);
      const part = attrs.part ?? body;
      if (!shape || shape.type !== "math" || !part) return null;
      editor.run(() => editor.updateShape({ id: shape.id, type: "math", meta: { ...shape.meta, highlight: part } }), {
        history: "ignore",
      });
      const b = editor.getShapePageBounds(shape.id);
      if (b) ensureVisible(editor, b);
      return null;
    }

    case "progress":
    case "step": {
      const step = attrs.step || attrs.target || attrs.id;
      const status = (["todo", "active", "done"].includes(attrs.status) ? attrs.status : "done") as StepStatus;
      const plan = usePlan.getState();
      // Finishing a step moves the walkthrough on to the next one.
      const ok = step && (status === "done" ? plan.completeStep(step) : plan.setStepStatus(step, status));
      return ok ? `marked plan step ${step} ${status}` : null;
    }

    case "next_lesson": {
      // Open it once the tutor has finished this turn.
      if (usePlan.getState().plan?.source !== "course") return null;
      afterTurn(startNextLesson);
      return "opening the next lesson";
    }

    case "clear_focus":
    case "unfocus":
      clearFocus(editor);
      return null;

    case "delete":
    case "remove": {
      const shape = near ? editor.getShape(near) : undefined;
      if (!shape || shape.meta?.author !== "tutor") return null;
      editor.deleteShape(shape.id);
      return `deleted ${shape.id}`;
    }

    default:
      console.warn("Unknown board action", action);
      return null;
  }
}

/**
 * Add a webpage to the board. Known embeddable sites (YouTube, Desmos,
 * GeoGebra, …) use tldraw's embed shape; anything else becomes a widget
 * iframe (some sites forbid framing and will show blank).
 */
export function addWebpage(editor: Editor, url: string, point: VecLike, byTutor = false): TLShapeId | null {
  const embed = getEmbedInfo(DEFAULT_EMBED_DEFINITIONS, url);
  if (embed) {
    const id = createShapeId();
    editor.createShape({
      id,
      type: "embed",
      x: point.x,
      y: point.y,
      props: { url, w: embed.definition.width, h: embed.definition.height },
      meta: byTutor ? TUTOR : {},
    });
    return id;
  }
  const id = createShapeId();
  editor.createShape({
    id,
    type: "widget",
    x: point.x,
    y: point.y,
    props: { w: 760, h: 520 + WIDGET_HEADER, title: url.replace(/^https?:\/\//, ""), html: "", url },
    meta: byTutor ? TUTOR : {},
  });
  return id;
}

/** Rough visible text of widget HTML: no scripts, styles or tags. */
function visibleText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

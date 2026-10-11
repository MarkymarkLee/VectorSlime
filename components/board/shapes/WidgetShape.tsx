"use client";

import { useMemo } from "react";
import { BaseBoxShapeUtil, HTMLContainer, T, useValue, type RecordProps, type TLShape } from "tldraw";

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    widget: { w: number; h: number; title: string; html: string; url: string };
  }
}

export type WidgetShape = TLShape<"widget">;

export const WIDGET_HEADER = 32;

/** Message posted by widgets via `tutor.send(...)`. */
export interface WidgetMessage {
  __mathtwitch: true;
  shapeId: string;
  title: string;
  name: string;
  data: unknown;
}

function buildSrcDoc(html: string, shapeId: string, title: string) {
  const bridge = `<script>
(function(){
  var meta = { __mathtwitch: true, shapeId: ${JSON.stringify(shapeId)}, title: ${JSON.stringify(title)} };
  function post(name, data){ try { parent.postMessage(Object.assign({}, meta, { name: String(name), data: data === undefined ? null : JSON.parse(JSON.stringify(data)) }), "*"); } catch (e) {} }
  // send: report an interaction (seen on the next turn); submit: hand the turn back to the tutor now.
  window.tutor = { send: post, submit: function(data){ post("submit", data); } };
  window.addEventListener("error", function(e){ post("widget_error", { message: e.message, line: e.lineno }); });
})();
</script>
<style>
  html,body{margin:0;padding:0;background:#fff;color:#1d1b26;font-family:ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif;}
  *{box-sizing:border-box;}
</style>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + bridge);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${bridge}</head>`);
  return `<!doctype html><html><head><meta charset="utf-8">${bridge}</head><body>${html}</body></html>`;
}

export class WidgetShapeUtil extends BaseBoxShapeUtil<WidgetShape> {
  static override type = "widget" as const;
  static override props: RecordProps<WidgetShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    html: T.string,
    url: T.string,
  };

  override getDefaultProps(): WidgetShape["props"] {
    return { w: 520, h: 380 + WIDGET_HEADER, title: "Widget", html: "", url: "" };
  }

  override canEdit() {
    return true;
  }

  override canScroll() {
    return true;
  }

  override component(shape: WidgetShape) {
    return <WidgetView shape={shape} util={this} />;
  }

  override getIndicatorPath(shape: WidgetShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 14);
    return path;
  }
}

function WidgetView({ shape, util }: { shape: WidgetShape; util: WidgetShapeUtil }) {
  const editor = util.editor;
  const { w, h, title, html, url } = shape.props;
  // The iframe receives pointer events only while the select tool is idle (or
  // the widget is being edited), so dragging/drawing over it still works.
  const interactive = useValue(
    "widget interactive",
    () =>
      editor.isInAny("select.idle", "select.editing_shape") &&
      (editor.getHoveredShapeId() === shape.id || editor.getEditingShapeId() === shape.id),
    [editor, shape.id],
  );
  const srcDoc = useMemo(() => (url ? undefined : buildSrcDoc(html, shape.id, title)), [html, url, shape.id, title]);
  const isTutor = shape.meta?.author === "tutor";

  return (
    <HTMLContainer
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 8px 30px rgba(30, 20, 60, 0.18), 0 0 0 1px rgba(30, 20, 60, 0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: WIDGET_HEADER,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          fontSize: 13,
          fontWeight: 600,
          color: "#14432a",
          background: isTutor ? "linear-gradient(90deg,#d7f9e1,#effdf3)" : "#f3f4f6",
          borderBottom: "1px solid rgba(30,20,60,0.08)",
          fontFamily: "system-ui, sans-serif",
          cursor: "grab",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: isTutor ? "#22a456" : "#9ca3af" }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {url && (
          <span style={{ marginLeft: "auto", fontWeight: 400, opacity: 0.6, fontSize: 11 }}>
            {safeHost(url)}
          </span>
        )}
      </div>
      <iframe
        title={title}
        src={url || undefined}
        srcDoc={srcDoc}
        sandbox={
          url
            ? "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            : "allow-scripts allow-forms allow-modals"
        }
        allow="fullscreen; clipboard-write; autoplay"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          background: "#fff",
          pointerEvents: interactive ? "all" : "none",
        }}
      />
    </HTMLContainer>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

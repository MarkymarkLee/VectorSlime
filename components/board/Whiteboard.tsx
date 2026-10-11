"use client";

import { Tldraw, type TLComponents } from "tldraw";
import "tldraw/tldraw.css";
import "katex/dist/katex.min.css";
import FocusOverlay from "@/components/board/FocusOverlay";
import { MathShapeUtil } from "@/components/board/shapes/MathShape";
import { WidgetShapeUtil } from "@/components/board/shapes/WidgetShape";
import { clearFocus } from "@/lib/board/focus";
import { setEditor } from "@/lib/session/tutor";

const shapeUtils = [WidgetShapeUtil, MathShapeUtil];

const components: TLComponents = {
  HelpMenu: null,
  InFrontOfTheCanvas: FocusOverlay,
};

export default function Whiteboard() {
  return (
    <div className="fixed inset-0">
      <Tldraw
        persistenceKey="mathtwitch-board"
        shapeUtils={shapeUtils}
        components={components}
        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
        onMount={(editor) => {
          setEditor(editor);
          editor.user.updateUserPreferences({ isSnapMode: false });
          // Clicking the board dismisses the tutor's spotlight and pointer.
          const onEvent = (info: { name: string }) => {
            if (info.name === "pointer_down") clearFocus(null);
          };
          editor.on("event", onEvent);
          return () => {
            editor.off("event", onEvent);
            setEditor(null);
          };
        }}
      />
    </div>
  );
}

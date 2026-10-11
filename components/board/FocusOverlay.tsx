"use client";

import { useEffect, useRef, useState } from "react";
import { HandPointing } from "@phosphor-icons/react";
import { useEditor, useValue } from "tldraw";
import { targetBounds, useFocus, type FocusTarget } from "@/lib/board/focus";

const PAD = 14;

/**
 * Screen-space layer in front of the canvas: the tutor's spotlight (dims
 * everything else) and pointer. Follows the camera as the student pans.
 */
export default function FocusOverlay() {
  const { spotlight, pointer } = useFocus();
  return (
    <>
      {spotlight && <Spotlight target={spotlight} />}
      {pointer && <Pointer target={pointer} label={pointer.label} />}
    </>
  );
}

function useScreenRect(target: FocusTarget) {
  const editor = useEditor();
  return useValue(
    "focus rect",
    () => {
      const b = targetBounds(editor, target);
      if (!b) return null;
      const z = editor.getZoomLevel();
      const p = editor.pageToViewport({ x: b.x, y: b.y });
      return { x: p.x, y: p.y, w: b.w * z, h: b.h * z };
    },
    [editor, target],
  );
}

/** Animate only when the target changes, not while the camera moves. */
function useGlide(target: FocusTarget) {
  const [gliding, setGliding] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setGliding(true);
    const t = setTimeout(() => setGliding(false), 650);
    return () => clearTimeout(t);
  }, [target]);
  return gliding;
}

function Spotlight({ target }: { target: FocusTarget }) {
  const r = useScreenRect(target);
  const gliding = useGlide(target);
  if (!r) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-safe:animate-[focus-in_300ms_ease-out]">
      <div
        className={`absolute left-0 top-0 rounded-2xl outline-2 outline-slime-400 ${gliding ? "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]" : ""}`}
        style={{
          transform: `translate(${r.x - PAD}px, ${r.y - PAD}px)`,
          width: r.w + PAD * 2,
          height: r.h + PAD * 2,
          boxShadow: "0 0 0 200vmax rgba(8, 20, 14, 0.5)",
        }}
      />
    </div>
  );
}

function Pointer({ target, label }: { target: FocusTarget; label?: string }) {
  const r = useScreenRect(target);
  const gliding = useGlide(target);
  if (!r) return null;
  // Point at the middle of the target's left edge.
  const x = r.x - 44;
  const y = r.y + r.h / 2 - 16;
  return (
    <div
      className={`pointer-events-none absolute left-0 top-0 flex items-center gap-2 motion-safe:animate-[focus-in_250ms_ease-out] ${
        gliding ? "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]" : ""
      }`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      {label && (
        <span className="absolute right-full mr-1 whitespace-nowrap rounded-full bg-stage-950 px-3 py-1 text-sm font-medium text-white shadow-lg">
          {label}
        </span>
      )}
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0 rounded-full bg-slime-400/40 motion-safe:animate-ping" />
        <HandPointing size={32} weight="fill" className="relative rotate-90 text-slime-600 drop-shadow-[0_2px_4px_rgba(8,30,18,0.35)]" />
      </span>
    </div>
  );
}

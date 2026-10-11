"use client";

import { useEffect, useMemo, useState } from "react";
import { TokenView } from "@/components/common/RichText";
import { tokenizeRich } from "@/lib/text/richText";

/** Live caption bubble above the tutor; reveals the current sentence word by word. */
export default function Captions({ text, name }: { text: string; name: string }) {
  const [shown, setShown] = useState(0);
  const tokens = useMemo(() => (text ? tokenizeRich(text) : []), [text]);

  useEffect(() => {
    setShown(0);
    if (!tokens.length) return;
    const id = setInterval(() => setShown((n) => (n >= tokens.length ? n : n + 1)), 190);
    return () => clearInterval(id);
  }, [tokens]);

  return (
    <div
      className={`pointer-events-none relative mb-3 w-full transition-all duration-300 ${
        text ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      aria-live="polite"
    >
      <div className="rounded-2xl bg-white/95 px-4 py-3 text-[15px] leading-snug text-zinc-900 shadow-[0_10px_30px_rgba(8,30,18,0.22)] ring-1 ring-black/5 backdrop-blur">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slime-800">{name}</div>
        <p>
          {tokens.map((t, i) => (
            <span key={i} className={`transition-opacity duration-150 ${i < shown ? "opacity-100" : "opacity-0"}`}>
              <TokenView token={t} />{" "}
            </span>
          ))}
        </p>
      </div>
      <div className="absolute -bottom-1.5 right-16 h-3 w-3 rotate-45 bg-white/95" />
    </div>
  );
}

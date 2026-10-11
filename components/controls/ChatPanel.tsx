"use client";

import { useEffect, useRef } from "react";
import { PencilSimpleLine } from "@phosphor-icons/react";
import RichText from "@/components/common/RichText";
import { useSession } from "@/lib/session/store";

/** Twitch-style transcript of the lesson. */
export default function ChatPanel() {
  const { messages, chatOpen, settings, set } = useSession();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, chatOpen]);

  if (!chatOpen) return null;

  return (
    <div className="pointer-events-auto flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-2xl bg-stage-950/95 text-sm text-zinc-200 shadow-[0_18px_50px_rgba(5,20,12,0.45)] ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stream chat</span>
        <div className="flex gap-3 text-xs">
          <button className="text-zinc-500 hover:text-white" onClick={() => set({ messages: [] })}>
            Clear
          </button>
          <button className="text-zinc-500 hover:text-white" onClick={() => set({ chatOpen: false })}>
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <p className="text-zinc-500">The conversation will show up here.</p>}
        {messages.map((m) => (
          <div key={m.id} className="leading-snug">
            {m.role === "system" ? (
              <span className="text-red-300">{m.text}</span>
            ) : (
              <>
                <span className={`font-semibold ${m.role === "user" ? "text-zinc-100" : "text-slime-400"}`}>
                  {m.role === "user" ? "You" : settings.tutorName}
                </span>
                <span className="text-zinc-500">: </span>
                <span>{m.role === "assistant" && m.text ? <RichText text={m.text} /> : m.text || "…"}</span>
                {m.actions?.map((a, i) => (
                  <div key={i} className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-zinc-500" title={a}>
                    <PencilSimpleLine size={11} className="flex-none" />
                    <span className="truncate">{a.replace(/ id=shape:\S+/, "")}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}

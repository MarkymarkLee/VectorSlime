"use client";

import { X } from "@phosphor-icons/react";
import { useSession } from "@/lib/session/store";

export default function ErrorToast() {
  const { error, set } = useSession();
  if (!error) return null;
  return (
    <div className="pointer-events-auto fixed left-1/2 top-16 z-[700] flex max-w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-xl bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-xl ring-1 ring-red-500/30">
      <span className="min-w-0 break-words">{error}</span>
      <button className="flex-none text-red-300 hover:text-white" aria-label="Dismiss" onClick={() => set({ error: null })}>
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}

"use client";

import ChatPanel from "@/components/controls/ChatPanel";
import PlanDashboard from "@/components/plan/PlanDashboard";

/** Left column under tldraw's menu: today's plan on top, chat below. */
export default function LeftRail() {
  return (
    <div className="pointer-events-none fixed bottom-16 left-3 top-14 z-[400] flex w-[320px] max-w-[calc(100vw-24px)] flex-col gap-3">
      <PlanDashboard />
      <ChatPanel />
    </div>
  );
}

"use client";

import { stashCoursePlan } from "@/lib/courses/run";
import { placeHomeworkPages } from "@/lib/plan/homeworkBoard";
import { needsVision, readHomework } from "@/lib/plan/readHomework";
import { usePlan, type Plan } from "@/lib/plan/store";
import { useSession } from "@/lib/session/store";
import { askTutor, getEditor } from "@/lib/session/tutor";

async function requestPlan(body: object): Promise<Plan> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { plan?: Plan; error?: string };
  if (!res.ok || !json.plan) throw new Error(json.error || `Planning failed (HTTP ${res.status})`);
  return json.plan;
}

/** Read a homework PDF/photo, put it on the board, and build today's plan. */
export async function uploadHomework(file: File) {
  const plan = usePlan.getState();
  const { settings, live } = useSession.getState();
  plan.set({ phase: "reading", phaseDetail: "Opening the file", error: null, panelOpen: true });

  try {
    const hw = await readHomework(file, (msg) => usePlan.getState().set({ phaseDetail: msg }));
    const scanned = needsVision(hw);
    if (scanned && !settings.llm.vision) {
      throw new Error(
        "This file has no readable text (it looks scanned). Turn on \"Let the tutor see the board\" with a vision model in Settings, then upload again.",
      );
    }

    const editor = getEditor();
    if (editor) placeHomeworkPages(editor, hw);

    usePlan.getState().set({ phase: "analyzing", phaseDetail: "Finding the concepts you need" });
    const base = { llm: settings.llm, fileName: hw.fileName, text: hw.text };
    const images = settings.llm.vision ? hw.pages.slice(0, 4).map((p) => p.base64) : [];
    let result: Plan;
    try {
      result = await requestPlan({ ...base, images });
    } catch (err) {
      // Text-only models can reject images; the text layer is often enough.
      if (!images.length || scanned) throw err;
      result = await requestPlan({ ...base, images: [] });
    }

    const steps = result.steps.map((s, i) => ({ ...s, status: i === 0 ? ("active" as const) : s.status }));
    stashCoursePlan();
    usePlan.getState().set({ plan: { ...result, steps, source: "homework" }, phase: "idle", phaseDetail: "" });

    if (live) {
      void askTutor(
        `(The student just uploaded their homework "${hw.fileName}" and you made today's plan, shown in [Today's homework plan]. In one sentence, say what today covers. Then ask one question to find out what they already know about the first step, "${steps[0]?.title}". Don't teach yet.)`,
        { hidden: true },
      );
    }
  } catch (err) {
    usePlan.getState().set({ phase: "error", phaseDetail: "", error: (err as Error).message });
  }
}

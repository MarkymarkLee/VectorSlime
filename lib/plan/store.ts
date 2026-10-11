"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StepStatus = "todo" | "active" | "done";

export interface PlanProblem {
  id: string;
  /** As numbered on the sheet, e.g. "3b". */
  label: string;
  text: string;
  page?: number;
  /** Answer key (courses only); for the tutor, never shown to the student. */
  answer?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  /** One student-facing sentence: what this step covers and why it matters. */
  detail: string;
  kind: "concept" | "problem" | "review";
  problems: string[];
  minutes: number;
  status: StepStatus;
}

export interface Plan {
  title: string;
  summary: string;
  fileName: string;
  problems: PlanProblem[];
  steps: PlanStep[];
  createdAt: number;
  source?: "homework" | "course";
  courseId?: string;
  lessonIndex?: number;
  /** Teaching notes for the tutor (courses). */
  notes?: string;
  goal?: string;
}

export interface CourseProgress {
  id: string;
  lessonIndex: number;
  /** Finished lessons, as "courseId:lessonIndex". */
  completed: string[];
  /** A lesson in progress, kept while the student does something else. */
  saved?: Plan;
}

export type PlanPhase = "idle" | "reading" | "analyzing" | "error";

interface PlanState {
  plan: Plan | null;
  phase: PlanPhase;
  phaseDetail: string;
  error: string | null;
  panelOpen: boolean;
  /** The course being taken right now. */
  course: CourseProgress | null;
  /** Progress in other courses, kept while the student switches between them. */
  archive: Record<string, CourseProgress>;
  set: (patch: Partial<Pick<PlanState, "plan" | "phase" | "phaseDetail" | "error" | "panelOpen" | "course" | "archive">>) => void;
  /** Mark a step; making one active demotes any other active step to todo. */
  setStepStatus: (id: string, status: StepStatus) => boolean;
  /** Mark a step done and make the next unfinished step active. */
  completeStep: (id: string) => boolean;
}

export const usePlan = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      phase: "idle",
      phaseDetail: "",
      error: null,
      panelOpen: true,
      course: null,
      archive: {},
      set: (patch) => set(patch),
      setStepStatus: (id, status) => {
        const plan = get().plan;
        if (!plan || !plan.steps.some((s) => s.id === id)) return false;
        const steps = plan.steps.map((s) => {
          if (s.id === id) return { ...s, status };
          if (status === "active" && s.status === "active") return { ...s, status: "todo" as const };
          return s;
        });
        set({ plan: { ...plan, steps } });
        return true;
      },
      completeStep: (id) => {
        if (!get().setStepStatus(id, "done")) return false;
        const plan = get().plan!;
        if (!plan.steps.some((s) => s.status === "active")) {
          const next = plan.steps.find((s) => s.status === "todo");
          if (next) get().setStepStatus(next.id, "active");
        }
        // Finishing every step of a course lesson completes the lesson.
        const course = get().course;
        if (plan.source === "course" && course && plan.lessonIndex !== undefined && isPlanDone(get().plan)) {
          const lessonId = `${plan.courseId}:${plan.lessonIndex}`;
          if (!course.completed.includes(lessonId)) set({ course: { ...course, completed: [...course.completed, lessonId] } });
        }
        return true;
      },
    }),
    {
      name: "mathtwitch-plan",
      partialize: (s) => ({ plan: s.plan, panelOpen: s.panelOpen, course: s.course, archive: s.archive }),
    },
  ),
);

export function activeStep(plan: Plan | null) {
  return plan?.steps.find((s) => s.status === "active") ?? null;
}

export function nextStep(plan: Plan | null) {
  return plan?.steps.find((s) => s.status !== "done") ?? null;
}

export function isPlanDone(plan: Plan | null) {
  return !!plan && plan.steps.length > 0 && plan.steps.every((s) => s.status === "done");
}

/** Progress for any course, whether it's the current one or archived. */
export function courseProgress(state: { course: CourseProgress | null; archive: Record<string, CourseProgress> }, id: string) {
  return state.course?.id === id ? state.course : (state.archive[id] ?? null);
}

"use client";

import { createShapeId, toRichText } from "tldraw";
import { getCourse } from "@/lib/courses";
import type { Course } from "@/lib/courses/types";
import { focusCamera } from "@/lib/board/placement";
import { usePlan, type Plan } from "@/lib/plan/store";
import { useSession } from "@/lib/session/store";
import { askTutor, getEditor } from "@/lib/session/tutor";

function lessonPlan(course: Course, index: number): Plan {
  const lesson = course.lessons[index];
  return {
    title: lesson.title,
    summary: lesson.goal,
    goal: lesson.goal,
    fileName: `${course.title}, lesson ${index + 1}`,
    problems: lesson.problems.map((p) => ({ ...p })),
    steps: lesson.steps.map((s, i) => ({ ...s, status: i === 0 ? "active" : "todo" })),
    createdAt: Date.now(),
    source: "course",
    courseId: course.id,
    lessonIndex: index,
    notes: lesson.notes,
  };
}

/** Put the lesson title on a fresh part of the board and move there. */
function placeLessonHeader(title: string) {
  const editor = getEditor();
  if (!editor) return;
  const content = editor.getCurrentPageBounds();
  const vp = editor.getViewportPageBounds();
  const x = content ? content.maxX + 320 : vp.x + 80;
  const y = content ? content.y : vp.y + 80;
  editor.createShape({
    id: createShapeId(),
    type: "text",
    x,
    y,
    props: { richText: toRichText(title), font: "sans", size: "xl", color: "green", autoSize: true },
    meta: { author: "tutor", alias: "lesson-title" },
  });
  focusCamera(editor, { x: x - 40, y: y - 40, w: 1100, h: 700 }, 1);
}

/** Keep an unfinished lesson so the student can come back to it. */
export function stashCoursePlan() {
  const { plan, course, set } = usePlan.getState();
  if (plan?.source === "course" && course) set({ course: { ...course, saved: plan } });
}

export function startLesson(index: number, opts: { announce?: boolean; fresh?: boolean; greet?: boolean } = {}) {
  const state = usePlan.getState();
  const course = getCourse(state.course?.id ?? state.plan?.courseId);
  if (!course || index < 0 || index >= course.lessons.length) return;
  const progress = state.course ?? { id: course.id, lessonIndex: index, completed: [] };
  const same = state.plan?.source === "course" && state.plan.courseId === course.id && state.plan.lessonIndex === index;
  // Already on this lesson: nothing to do unless we're on a fresh board.
  if (same && !opts.fresh) return;
  if (!same) stashCoursePlan();

  const saved = usePlan.getState().course?.saved;
  const plan = same ? state.plan! : saved && saved.courseId === course.id && saved.lessonIndex === index ? saved : lessonPlan(course, index);
  usePlan.getState().set({
    plan,
    phase: "idle",
    error: null,
    panelOpen: true,
    course: { ...progress, lessonIndex: index, saved: undefined },
  });
  placeLessonHeader(`Lesson ${index + 1}: ${course.lessons[index].title}`);

  if (opts.announce && useSession.getState().live) {
    const step = plan.steps.find((s) => s.status === "active") ?? plan.steps[0];
    const resuming = step.status === "active" && plan.steps.some((s) => s.status === "done");
    void askTutor(
      `(${opts.greet ? "The student just joined the stream. Greet them in a few words. " : ""}Lesson ${index + 1} of the ${course.title} course, "${plan.title}", ${
        resuming ? `is open again, continuing at step "${step.title}"` : "just opened"
      }. In one short sentence say what ${resuming ? "you'll pick up" : "this lesson is about"}. Then ask one question to find out what the student already knows about "${step.title}". Don't teach yet.)`,
      { hidden: true },
    );
  }
}

export function startCourse(id: string, opts: { fresh?: boolean; greet?: boolean } = {}) {
  const course = getCourse(id);
  if (!course) return;
  const { course: existing, archive, set } = usePlan.getState();
  if (!existing || existing.id !== id) {
    // Switching courses: park the current one's progress, restore this one's.
    stashCoursePlan();
    const current = usePlan.getState().course;
    const nextArchive = { ...archive };
    if (current) nextArchive[current.id] = current;
    const restored = nextArchive[id] ?? { id, lessonIndex: 0, completed: [] };
    delete nextArchive[id];
    set({ course: restored, archive: nextArchive });
  }
  startLesson(usePlan.getState().course!.lessonIndex, { announce: true, ...opts });
}

/** Wipe progress for a course so it starts again from lesson 1. */
export function resetCourse(id: string) {
  const { course, archive, plan, set } = usePlan.getState();
  const nextArchive = { ...archive };
  delete nextArchive[id];
  set({
    archive: nextArchive,
    course: course?.id === id ? null : course,
    plan: plan?.courseId === id ? null : plan,
  });
}

export function startNextLesson() {
  const { plan, course } = usePlan.getState();
  const current = plan?.source === "course" ? plan.lessonIndex : course?.lessonIndex;
  if (current === undefined) return;
  startLesson(current + 1, { announce: true });
}

/** Leave the course view; progress (and an unfinished lesson) is kept. */
export function exitCourse() {
  stashCoursePlan();
  usePlan.getState().set({ plan: null });
}

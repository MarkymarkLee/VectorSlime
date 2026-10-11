import type { PlanStep } from "@/lib/plan/store";

export interface CourseProblem {
  id: string;
  label: string;
  text: string;
  /** Answer key for the tutor; never shown to the student. */
  answer: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  goal: string;
  steps: Omit<PlanStep, "status">[];
  problems: CourseProblem[];
  /** Teaching notes for the tutor: framing, widget ideas, common mix-ups. */
  notes: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

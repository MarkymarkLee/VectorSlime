import { linearAlgebra } from "@/lib/courses/linearAlgebra";
import type { Course } from "@/lib/courses/types";

export const COURSES: Course[] = [linearAlgebra];

export function getCourse(id: string | undefined) {
  return COURSES.find((c) => c.id === id);
}

import { z } from "zod";
import type { Plan } from "@/lib/plan/store";

export const PLAN_SYSTEM = `You plan a one-day study session for a student's math homework.
Read the homework (text extracted from the PDF and/or page images) and reply with ONLY a JSON object, no prose, no code fences:

{
  "title": "short name for this homework, max 6 words",
  "summary": "one sentence for the student: what today covers",
  "problems": [
    { "id": "p1", "label": "1a", "page": 1, "text": "the question, math in $...$, max 200 chars" }
  ],
  "steps": [
    { "id": "s1", "kind": "concept", "title": "max 6 words", "detail": "one sentence: what they learn and why this homework needs it", "problems": ["p1", "p2"], "minutes": 10 }
  ]
}

Rules:
- problems: every question on the sheet, in order, labelled as on the sheet.
- steps: today's walkthrough, ordered so prerequisites come first:
  1. 2-5 "concept" steps: the skills the homework needs, simplest first, each 5-15 minutes. List which problems use each concept.
  2. "problem" steps that work through the homework, grouping similar problems, each 10-25 minutes.
  3. one short "review" step at the end.
  4-10 steps in total.
- Write money as words ("25 dollars"), never with a $ sign; $ is only for math.
- Write for the student ("you"), plainly. Don't solve the problems.`;

const Problem = z.object({
  id: z.coerce.string(),
  label: z.coerce.string().default(""),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  text: z.coerce.string().default(""),
});

const Step = z.object({
  id: z.coerce.string(),
  kind: z.enum(["concept", "problem", "review"]).catch("concept"),
  title: z.coerce.string(),
  detail: z.coerce.string().default(""),
  problems: z.array(z.coerce.string()).catch([]),
  minutes: z.coerce.number().positive().max(120).catch(10),
});

const PlanJson = z.object({
  title: z.coerce.string().default("Today's homework"),
  summary: z.coerce.string().default(""),
  problems: z.array(Problem).catch([]),
  steps: z.array(Step).min(1),
});

/** Pull the first JSON object out of a model reply and validate it. */
export function parsePlan(reply: string, fileName: string): Plan {
  const cleaned = reply.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The model didn't return a plan.");
  const json = PlanJson.parse(JSON.parse(cleaned.slice(start, end + 1)));

  // Make ids unique and stable even if the model repeats them.
  const seen = new Set<string>();
  const uniq = (id: string, prefix: string, i: number) => {
    let v = id.trim() || `${prefix}${i + 1}`;
    if (seen.has(v)) v = `${prefix}${i + 1}`;
    seen.add(v);
    return v;
  };
  const problems = json.problems.map((p, i) => ({ ...p, id: uniq(p.id, "p", i), label: p.label || String(i + 1), text: p.text.slice(0, 300) }));
  const problemIds = new Set(problems.map((p) => p.id));
  const steps = json.steps.slice(0, 12).map((s, i) => ({
    ...s,
    id: uniq(s.id, "s", i),
    title: s.title.slice(0, 60),
    detail: s.detail.slice(0, 240),
    problems: s.problems.filter((p) => problemIds.has(p)),
    minutes: Math.round(s.minutes),
    status: "todo" as const,
  }));

  return { title: json.title.slice(0, 60), summary: json.summary.slice(0, 240), fileName, problems, steps, createdAt: Date.now() };
}

"use client";

import { useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CaretDown,
  CaretUp,
  CheckCircle,
  Circle,
  CircleHalf,
  FilePdf,
  GraduationCap,
  ListBullets,
  ListChecks,
  SignOut,
  Trophy,
  UploadSimple,
} from "@phosphor-icons/react";
import RichText from "@/components/common/RichText";
import { COURSES, getCourse } from "@/lib/courses";
import { exitCourse, startCourse, startLesson, startNextLesson } from "@/lib/courses/run";
import { courseProgress, isPlanDone, usePlan, type Plan, type PlanStep } from "@/lib/plan/store";
import { uploadHomework } from "@/lib/plan/upload";
import { useSession } from "@/lib/session/store";
import { askTutor } from "@/lib/session/tutor";

const ACCEPT = "application/pdf,image/*";

/** Top-left walkthrough for the day: upload homework, see the plan, track progress. */
export default function PlanDashboard() {
  const { plan, phase, phaseDetail, error, panelOpen, set } = usePlan();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = phase === "reading" || phase === "analyzing";
  const done = plan?.steps.filter((s) => s.status === "done").length ?? 0;

  const pick = () => fileInput.current?.click();
  const onFile = (file: File | undefined) => {
    if (file && !busy) void uploadHomework(file);
  };

  return (
    <section
      aria-label="Today's plan"
      className={`pointer-events-auto flex min-h-0 shrink flex-col overflow-hidden rounded-2xl bg-stage-950/95 text-sm text-zinc-200 shadow-[0_18px_50px_rgba(5,20,12,0.45)] ring-1 backdrop-blur transition-colors ${
        dragging ? "ring-2 ring-slime-400" : "ring-white/10"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        onFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <header className="flex flex-none items-center gap-2 px-4 py-3">
        <ListChecks size={18} className="flex-none text-slime-300" />
        <h2 className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold text-white">
          {plan ? plan.title : "Today's plan"}
        </h2>
        {plan && (
          <span className="flex-none text-xs tabular-nums text-zinc-400">
            {done}/{plan.steps.length}
          </span>
        )}
        <button
          aria-label={panelOpen ? "Collapse plan" : "Expand plan"}
          title={panelOpen ? "Collapse" : "Expand"}
          onClick={() => set({ panelOpen: !panelOpen })}
          className="grid h-7 w-7 flex-none place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          {panelOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </button>
      </header>

      {panelOpen && (
        <div className="flex min-h-0 flex-col border-t border-white/5">
          {busy ? (
            <Loading detail={phaseDetail} />
          ) : plan ? (
            <PlanView plan={plan} onNew={pick} />
          ) : (
            <EmptyState onPick={pick} dragging={dragging} />
          )}
          {phase === "error" && error && (
            <p role="alert" className="mx-4 mb-3 rounded-lg bg-red-950/70 px-3 py-2 text-[13px] text-red-200 ring-1 ring-red-500/25">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState({ onPick, dragging }: { onPick: () => void; dragging: boolean }) {
  const state = usePlan();
  return (
    <div className="space-y-3 p-3">
      <button
        onClick={onPick}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition ${
          dragging ? "border-slime-400 bg-slime-400/10" : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]"
        }`}
      >
        <FilePdf size={28} className="text-slime-300" />
        <span className="font-semibold text-white">Upload your homework</span>
        <span className="max-w-[16rem] text-[13px] leading-snug text-zinc-400">
          Drop a PDF or a photo here. I&apos;ll find the concepts you need and plan today&apos;s session.
        </span>
      </button>
      <div>
        <h3 className="px-1 pb-1.5 text-xs font-medium text-zinc-500">Or follow a course</h3>
        {COURSES.map((c) => {
          const mine = courseProgress(state, c.id);
          return (
            <button
              key={c.id}
              onClick={() => startCourse(c.id)}
              className="flex w-full items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left ring-1 ring-white/10 transition hover:bg-white/[0.07]"
            >
              <GraduationCap size={22} className="flex-none text-slime-300" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{c.title}</span>
                <span className="block text-[12px] leading-snug text-zinc-400">
                  {mine ? `Resume lesson ${mine.lessonIndex + 1} of ${c.lessons.length}` : c.description}
                </span>
              </span>
              <ArrowRight size={16} className="flex-none text-zinc-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Loading({ detail }: { detail: string }) {
  return (
    <div className="space-y-3 px-4 py-4" aria-busy="true">
      <p className="text-[13px] text-slime-200">{detail || "Working"}…</p>
      {[0.9, 0.7, 0.8, 0.6].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="h-4 w-4 flex-none rounded-full bg-white/10 motion-safe:animate-pulse" />
          <span className="h-3 rounded bg-white/10 motion-safe:animate-pulse" style={{ width: `${w * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function PlanView({ plan, onNew }: { plan: Plan; onNew: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [outline, setOutline] = useState(false);
  const course = plan.source === "course" ? getCourse(plan.courseId) : undefined;
  const lessonNo = (plan.lessonIndex ?? 0) + 1;
  const allDone = isPlanDone(plan);
  const remaining = plan.steps.filter((s) => s.status !== "done").reduce((m, s) => m + s.minutes, 0);
  const done = plan.steps.filter((s) => s.status === "done").length;

  return (
    <>
      <div className="flex-none px-4 pb-3 pt-3">
        {course && (
          <p className="mb-1 text-xs font-medium text-slime-300">
            {course.title}, lesson {lessonNo} of {course.lessons.length}
          </p>
        )}
        {plan.summary && <p className="text-[13px] leading-snug text-zinc-400">{plan.summary}</p>}
        <div className="mt-3 flex gap-1" aria-hidden>
          {plan.steps.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                s.status === "done" ? "bg-slime-400" : s.status === "active" ? "bg-slime-400/45" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {done === plan.steps.length ? "All steps done. Nice work." : `${done} of ${plan.steps.length} done, about ${remaining} min left`}
        </p>
        {course && allDone && <LessonComplete course={course} lessonNo={lessonNo} />}
      </div>

      {course && outline && <CourseOutline courseId={course.id} current={plan.lessonIndex ?? 0} />}

      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {plan.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            plan={plan}
            open={step.status === "active" || openId === step.id}
            onToggle={() => setOpenId(openId === step.id ? null : step.id)}
          />
        ))}
      </ol>

      <footer className="flex flex-none items-center justify-between gap-2 border-t border-white/5 px-4 py-2">
        {course ? (
          <>
            <button
              onClick={() => setOutline(!outline)}
              aria-expanded={outline}
              className={`flex flex-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition hover:bg-white/10 hover:text-white ${outline ? "text-white" : "text-zinc-400"}`}
            >
              <ListBullets size={14} />
              All lessons
            </button>
            <button onClick={exitCourse} className="flex flex-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white">
              <SignOut size={14} />
              Leave course
            </button>
          </>
        ) : (
          <>
            <span className="min-w-0 truncate text-xs text-zinc-500" title={plan.fileName}>
              {plan.fileName}
            </span>
            <button onClick={onNew} className="flex flex-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white">
              <UploadSimple size={14} />
              New homework
            </button>
          </>
        )}
      </footer>
    </>
  );
}

function StepRow({ step, plan, open, onToggle }: { step: PlanStep; plan: Plan; open: boolean; onToggle: () => void }) {
  const { setStepStatus, completeStep } = usePlan();
  const live = useSession((s) => s.live);
  const active = step.status === "active";
  const labels = step.problems.map((id) => plan.problems.find((p) => p.id === id)?.label ?? id);

  const teach = () => {
    setStepStatus(step.id, "active");
    if (live) void askTutor(`Let's work on "${step.title}".`);
  };

  return (
    <li className={`rounded-xl transition-colors ${active ? "bg-slime-400/10 ring-1 ring-slime-400/30" : "hover:bg-white/[0.04]"}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-2.5 px-2 py-2 text-left">
        <StatusIcon status={step.status} />
        <span className="min-w-0 flex-1">
          <span className={`block leading-snug ${step.status === "done" ? "text-zinc-500 line-through decoration-zinc-600" : "text-zinc-100"}`}>
            {step.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-zinc-500">
            {step.kind === "concept" ? "Concept" : step.kind === "problem" ? "Homework" : "Review"}
            {labels.length > 0 && `, problems ${labels.join(", ")}`}
          </span>
        </span>
        <span className="flex-none pt-0.5 text-[11px] tabular-nums text-zinc-500">{step.minutes}m</span>
      </button>
      {open && (
        <div className="px-2 pb-2.5 pl-9">
          {step.detail && (
            <p className="text-[13px] leading-snug text-zinc-300">
              <RichText text={step.detail} />
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {step.status !== "done" ? (
              <>
                <button
                  onClick={teach}
                  disabled={!live}
                  title={live ? undefined : "Go live first"}
                  className="h-8 rounded-full bg-slime-400 px-3.5 text-[13px] font-semibold text-slime-950 transition hover:bg-slime-300 active:scale-[0.98] disabled:opacity-50"
                >
                  {active ? "Teach me this" : "Start this step"}
                </button>
                <button
                  onClick={() => completeStep(step.id)}
                  className="h-8 rounded-full px-3 text-[13px] text-zinc-300 ring-1 ring-white/15 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Mark done
                </button>
              </>
            ) : (
              <button
                onClick={() => setStepStatus(step.id, "todo")}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-zinc-400 ring-1 ring-white/15 transition hover:bg-white/10"
              >
                <ArrowCounterClockwise size={14} />
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function StatusIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "done") return <CheckCircle size={18} weight="fill" className="mt-0.5 flex-none text-slime-400" aria-label="Done" />;
  if (status === "active") return <CircleHalf size={18} weight="fill" className="mt-0.5 flex-none text-slime-300" aria-label="In progress" />;
  return <Circle size={18} className="mt-0.5 flex-none text-zinc-600" aria-label="To do" />;
}

function LessonComplete({ course, lessonNo }: { course: NonNullable<ReturnType<typeof getCourse>>; lessonNo: number }) {
  const next = course.lessons[lessonNo];
  return (
    <div className="mt-3 rounded-xl bg-slime-400/10 p-3 ring-1 ring-slime-400/30">
      <p className="flex items-center gap-2 font-semibold text-white">
        <Trophy size={16} weight="fill" className="text-slime-300" />
        {next ? `Lesson ${lessonNo} complete` : "Course complete"}
      </p>
      {next ? (
        <button
          onClick={startNextLesson}
          className="mt-2.5 flex h-8 max-w-full items-center gap-1.5 rounded-full bg-slime-400 px-3.5 text-[13px] font-semibold text-slime-950 transition hover:bg-slime-300 active:scale-[0.98]"
        >
          <span className="truncate">Next: {next.title}</span>
          <ArrowRight size={14} weight="bold" className="flex-none" />
        </button>
      ) : (
        <p className="mt-1 text-[13px] text-zinc-300">You finished all {course.lessons.length} lessons of {course.title}.</p>
      )}
    </div>
  );
}

function CourseOutline({ courseId, current }: { courseId: string; current: number }) {
  const course = getCourse(courseId)!;
  const completed = usePlan((s) => s.course?.completed ?? []);
  return (
    <ol className="mx-2 mb-2 max-h-56 flex-none space-y-0.5 overflow-y-auto rounded-xl bg-black/20 p-1.5" aria-label="Course lessons">
      {course.lessons.map((l, i) => {
        const done = completed.includes(`${courseId}:${i}`);
        const isCurrent = i === current;
        return (
          <li key={l.id}>
            <button
              onClick={() => startLesson(i, { announce: true })}
              disabled={isCurrent}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition ${
                isCurrent ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              {done ? (
                <CheckCircle size={15} weight="fill" className="flex-none text-slime-400" />
              ) : isCurrent ? (
                <CircleHalf size={15} weight="fill" className="flex-none text-slime-300" />
              ) : (
                <Circle size={15} className="flex-none text-zinc-600" />
              )}
              <span className="w-5 flex-none tabular-nums text-zinc-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{l.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

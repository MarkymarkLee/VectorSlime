"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, ArrowRight, ChatCircleDots, FilePdf, GearSix, GraduationCap } from "@phosphor-icons/react";
import Slime from "@/components/tutor/Slime";
import { COURSES } from "@/lib/courses";
import type { Course } from "@/lib/courses/types";
import { resetCourse } from "@/lib/courses/run";
import { courseProgress, usePlan } from "@/lib/plan/store";
import { startSession, type SessionKind } from "@/lib/session/sessions";
import { useSession } from "@/lib/session/store";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Home screen: every course with its progress, homework help and an open
 * session. Each "Go live" starts a session on a fresh board.
 */
export default function Dashboard() {
  const { settings, live, set } = useSession();
  const [hop, setHop] = useState(0);
  const reduce = useReducedMotion();
  const needsModel = !settings.llm.model && !["anthropic", "openai"].includes(settings.llm.provider);

  const go = (session: SessionKind) => {
    if (needsModel) {
      set({ settingsOpen: true });
      return;
    }
    setHop((h) => h + 1);
    // Let the slime hop before the dashboard fades out.
    setTimeout(() => void startSession(session), reduce ? 0 : 320);
  };

  const rise = (i: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.07, ease } };

  return (
    <AnimatePresence>
      {!live && (
        <motion.div
          key="dashboard"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease }}
          className="fixed inset-0 z-[500] overflow-y-auto bg-[#f7f8f7] text-zinc-900 dark:bg-stage-950 dark:text-zinc-100"
        >
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(20,40,30,0.09)_1px,transparent_1.2px)] [background-size:22px_22px] dark:bg-[radial-gradient(circle,rgba(220,255,230,0.06)_1px,transparent_1.2px)]"
          />

          <div className="relative mx-auto max-w-[1180px] px-5 pb-16 md:px-10">
            <header className="flex h-16 items-center justify-between">
              <span className="font-display text-lg font-bold tracking-tight">Mathtwitch</span>
              <button
                onClick={() => set({ settingsOpen: true })}
                title="Model and voice settings"
                className={`flex h-10 max-w-[16rem] items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 transition active:scale-[0.98] ${
                  needsModel
                    ? "bg-slime-400 text-slime-950 ring-transparent hover:bg-slime-300"
                    : "text-zinc-700 ring-zinc-900/10 hover:bg-zinc-900/[0.04] dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/5"
                }`}
              >
                <GearSix size={17} className="flex-none" />
                <span className="truncate">{needsModel ? "Pick a model" : settings.llm.model || settings.llm.provider}</span>
              </button>
            </header>

            {/* hero: greeting + the tutor */}
            <section className="grid grid-cols-1 items-center gap-6 pt-4 md:grid-cols-[1.25fr_1fr] md:gap-10 md:pt-8">
              <div className="order-2 md:order-1">
                <motion.h1
                  {...rise(0)}
                  className="font-display text-[2.4rem] font-bold leading-[1.04] tracking-[-0.035em] md:text-[3.4rem]"
                >
                  What are we learning <span className="text-slime-700 dark:text-slime-300">today?</span>
                </motion.h1>
                <motion.p {...rise(1)} className="mt-4 max-w-[34rem] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Pick a course, bring your homework, or just start talking. Every session starts on a fresh board.
                </motion.p>
              </div>
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease }}
                className="order-1 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-34px_rgba(20,60,38,0.35)] ring-1 ring-zinc-900/5 md:order-2 dark:bg-stage-900 dark:ring-white/10"
              >
                <div className="relative">
                  <div className="absolute inset-x-0 bottom-0 h-[13%] bg-gradient-to-b from-slime-50 to-slime-100 dark:from-stage-800 dark:to-stage-900" />
                  <Slime width={520} height={300} radius={78} floorInset={38} dropIn hopSignal={hop} className="relative block h-[220px] w-full md:h-[250px]" />
                </div>
              </motion.div>
            </section>

            {/* courses */}
            <motion.section {...rise(2)} className="mt-12" aria-labelledby="courses-heading">
              <h2 id="courses-heading" className="font-display text-xl font-semibold tracking-tight">
                Courses
              </h2>
              <div className={`mt-4 grid grid-cols-1 gap-4 ${COURSES.length > 1 ? "md:grid-cols-2" : ""}`}>
                {COURSES.map((c) => (
                  <CourseCard key={c.id} course={c} onGo={() => go({ kind: "course", courseId: c.id })} />
                ))}
              </div>
            </motion.section>

            {/* other ways in */}
            <motion.section {...rise(3)} className="mt-10" aria-labelledby="other-heading">
              <h2 id="other-heading" className="font-display text-xl font-semibold tracking-tight">
                Other sessions
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <HomeworkCard onFile={(file) => go({ kind: "homework", file })} />
                <Tile
                  icon={<ChatCircleDots size={24} className="text-slime-700 dark:text-slime-300" />}
                  title="Open session"
                  body="No plan. Ask anything, draw a problem, and work through it together."
                  action={<GoLiveButton onClick={() => go({ kind: "free" })} quiet />}
                />
              </div>
            </motion.section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CourseCard({ course, onGo }: { course: Course; onGo: () => void }) {
  const progress = usePlan((s) => courseProgress(s, course.id));
  const total = course.lessons.length;
  const done = progress?.completed.filter((k) => k.startsWith(`${course.id}:`)).length ?? 0;
  const index = progress?.lessonIndex ?? 0;
  const lesson = course.lessons[Math.min(index, total - 1)];
  const finished = done >= total;
  const started = !!progress;

  return (
    <article className="flex flex-col rounded-[22px] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(20,60,38,0.4)] ring-1 ring-zinc-900/5 dark:bg-stage-900 dark:ring-white/10">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-slime-100 dark:bg-slime-400/15">
          <GraduationCap size={24} className="text-slime-700 dark:text-slime-300" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{course.title}</h3>
          <p className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400">{course.description}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-1" aria-label={`${done} of ${total} lessons done`}>
        {course.lessons.map((l, i) => {
          const isDone = progress?.completed.includes(`${course.id}:${i}`);
          return (
            <span
              key={l.id}
              title={`${i + 1}. ${l.title}`}
              className={`h-1.5 flex-1 rounded-full ${
                isDone ? "bg-slime-500" : i === index && started ? "bg-slime-500/40" : "bg-zinc-900/10 dark:bg-white/10"
              }`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {finished ? (
          `All ${total} lessons done`
        ) : (
          <>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {started ? "Next up" : "Starts with"}: lesson {index + 1}
            </span>
            , {lesson.title}
          </>
        )}
      </p>

      <div className="mt-5 flex items-center gap-2">
        <GoLiveButton onClick={onGo} label={started ? "Continue" : "Start course"} />
        {started && (
          <button
            onClick={() => {
              if (window.confirm(`Start ${course.title} over from lesson 1? Your progress will be cleared.`)) resetCourse(course.id);
            }}
            className="flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-zinc-600 transition hover:bg-zinc-900/[0.04] dark:text-zinc-400 dark:hover:bg-white/5"
          >
            <ArrowCounterClockwise size={15} />
            Start over
          </button>
        )}
      </div>
    </article>
  );
}

function HomeworkCard({ onFile }: { onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={`rounded-[22px] transition ${dragging ? "ring-2 ring-slime-500" : ""}`}
    >
      <input
        ref={input}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <Tile
        icon={<FilePdf size={24} className="text-slime-700 dark:text-slime-300" />}
        title="Homework help"
        body="Drop a PDF or a photo here. Your tutor reads it, finds the concepts you need and plans the session."
        action={<GoLiveButton onClick={() => input.current?.click()} label="Choose homework" quiet />}
      />
    </div>
  );
}

function Tile({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <article className="flex h-full flex-col rounded-[22px] bg-white/70 p-5 ring-1 ring-zinc-900/5 dark:bg-stage-900/70 dark:ring-white/10">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-slime-100 dark:bg-slime-400/15">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400">{body}</p>
        </div>
      </div>
      <div className="mt-auto pt-5">{action}</div>
    </article>
  );
}

function GoLiveButton({ onClick, label = "Go live", quiet }: { onClick: () => void; label?: string; quiet?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group flex h-11 items-center gap-2 whitespace-nowrap rounded-full pl-5 pr-4 text-sm font-semibold transition active:scale-[0.98] ${
        quiet
          ? "text-zinc-800 ring-1 ring-zinc-900/15 hover:bg-zinc-900/[0.04] dark:text-zinc-100 dark:ring-white/20 dark:hover:bg-white/5"
          : "bg-slime-400 text-slime-950 shadow-[0_8px_24px_-10px_rgba(34,164,86,0.6)] hover:bg-slime-300"
      }`}
    >
      {label}
      <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

"use client";

import { useState } from "react";
import {
  ChatCircleDots,
  Eye,
  GearSix,
  Globe,
  Microphone,
  MicrophoneSlash,
  SignOut,
  Stop,
} from "@phosphor-icons/react";
import Captions from "@/components/tutor/Captions";
import Slime from "@/components/tutor/Slime";
import { useSession, type ModelStatus } from "@/lib/session/store";
import { endSession } from "@/lib/session/sessions";
import { askTutor, interrupt, pushToTalk, setMicOn } from "@/lib/session/tutor";
import { promptAddWebpage } from "@/components/controls/addWebpage";

const STATUS_LABEL: Record<string, string> = {
  idle: "",
  listening: "Listening…",
  transcribing: "Hearing you…",
  thinking: "Thinking…",
  speaking: "",
};

export default function TutorCam() {
  const s = useSession();
  const [text, setText] = useState("");
  const ptt = s.settings.voice.mode === "push-to-talk";
  const label = s.userSpeaking
    ? "Listening…"
    : s.awaitingStudent && s.status === "idle"
      ? "Your turn"
      : STATUS_LABEL[s.status];

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    void askTutor(t);
  };

  return (
    <div className="pointer-events-none fixed bottom-10 right-4 z-[400] flex max-h-[calc(100dvh-56px)] w-[340px] max-w-[calc(100vw-32px)] flex-col items-end">
      <Captions text={s.caption} name={s.settings.tutorName} />

      <div className="pointer-events-auto w-full overflow-hidden rounded-2xl bg-stage-950/95 shadow-[0_18px_50px_rgba(5,20,12,0.45)] ring-1 ring-white/10 backdrop-blur">
        {/* stream cam */}
        <div className="relative aspect-[4/3] w-full bg-[radial-gradient(120%_90%_at_50%_30%,#1f3a2b_0%,#0e1a14_70%)]">
          <div className="absolute inset-x-0 bottom-0 h-[13%] bg-gradient-to-b from-[#16291f] to-[#0b140f]" />
          <Slime
            width={400}
            height={300}
            radius={64}
            floorInset={34}
            status={s.status}
            listening={s.userSpeaking}
            className="absolute inset-0 h-full w-full"
          />
          <div
            className={`pointer-events-none absolute inset-0 transition-shadow duration-300 ${
              s.userSpeaking
                ? "shadow-[inset_0_0_0_3px_rgba(255,255,255,0.75)]"
                : s.status === "speaking"
                  ? "shadow-[inset_0_0_0_3px_var(--color-slime-400)]"
                  : ""
            }`}
          />
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" /> LIVE
            </span>
            {label && <span className="rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-slime-100">{label}</span>}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-3 rounded-md bg-black/45 px-2 py-0.5 font-display text-xs font-semibold text-white">
            {s.settings.tutorName}
          </div>
          <ModelBadges stt={s.stt} tts={s.tts} />
        </div>

        {/* controls */}
        <div className="flex items-center gap-2 p-2.5">
          <button
            title={ptt ? "Hold to talk" : s.micOn ? "Mute microphone" : "Turn on microphone"}
            aria-label={ptt ? "Hold to talk" : s.micOn ? "Mute microphone" : "Turn on microphone"}
            onClick={() => !ptt && void setMicOn(!s.micOn)}
            onPointerDown={() => {
              if (!ptt) return;
              if (!s.micOn) void setMicOn(true);
              else pushToTalk(true);
            }}
            onPointerUp={() => ptt && pushToTalk(false)}
            onPointerLeave={() => ptt && s.userSpeaking && pushToTalk(false)}
            className={`relative grid h-10 w-10 flex-none place-items-center rounded-full transition active:scale-[0.96] ${
              s.micOn ? "bg-slime-400 text-slime-950 hover:bg-slime-300" : "bg-white/10 text-zinc-300 hover:bg-white/20"
            }`}
          >
            {s.micOn && (
              <span
                className="absolute inset-0 rounded-full ring-2 ring-white/80 transition-transform duration-75"
                style={{ transform: `scale(${1 + s.micLevel * 0.35})`, opacity: s.micLevel > 0.05 ? 1 : 0 }}
              />
            )}
            {s.micOn ? <Microphone size={20} weight="bold" className="relative" /> : <MicrophoneSlash size={20} weight="bold" className="relative" />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") submit();
            }}
            aria-label="Message the tutor"
            placeholder={ptt ? "Hold mic or type…" : "Ask or type a message…"}
            className="h-10 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-sm text-white outline-none ring-slime-400 placeholder:text-zinc-400 focus:ring-2"
          />
          {(s.status === "speaking" || s.status === "thinking") && (
            <IconButton title="Stop tutor" onClick={interrupt}>
              <Stop size={18} weight="fill" />
            </IconButton>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-2.5 py-1.5">
          <div className="flex gap-1">
            <IconButton title="Add a webpage to the board" onClick={promptAddWebpage}>
              <Globe size={18} />
            </IconButton>
            <IconButton title="Ask the tutor to check your work" onClick={() => void askTutor("Can you look at my work on the board?")}>
              <Eye size={18} />
            </IconButton>
          </div>
          <div className="flex gap-1">
            <IconButton title="End session" onClick={endSession}>
              <SignOut size={18} />
            </IconButton>
            <IconButton title="Chat transcript" onClick={() => s.set({ chatOpen: !s.chatOpen })} active={s.chatOpen}>
              <ChatCircleDots size={18} />
            </IconButton>
            <IconButton title="Settings" onClick={() => s.set({ settingsOpen: true })}>
              <GearSix size={18} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelBadges({ stt, tts }: { stt: ModelStatus; tts: ModelStatus }) {
  const items = [
    ["Voice", tts],
    ["Ears", stt],
  ] as const;
  const loading = items.filter(([, m]) => m.state === "loading" || m.state === "error");
  if (!loading.length) return null;
  return (
    <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1">
      {loading.map(([name, m]) => (
        <span
          key={name}
          title={m.detail}
          className={`rounded-md px-2 py-0.5 text-[10px] ${m.state === "error" ? "bg-red-600/80 text-white" : "bg-black/55 text-slime-100"}`}
        >
          {m.state === "error" ? `${name} failed` : `Loading ${name.toLowerCase()} ${Math.round(m.progress ?? 0)}%`}
        </span>
      ))}
    </div>
  );
}

function IconButton({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition active:scale-[0.94] ${
        active ? "bg-slime-400/20 text-slime-200" : "text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

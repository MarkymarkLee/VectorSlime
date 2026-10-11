"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

export type TutorStatus = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  /** For assistant messages: compact notes about board actions taken. */
  actions?: string[];
}

export interface ModelStatus {
  state: "idle" | "loading" | "ready" | "error";
  progress?: number;
  detail?: string;
}

interface SessionState {
  settings: Settings;
  status: TutorStatus;
  caption: string;
  messages: ChatMessage[];
  /** True once the student clicked Go live (audio unlocked). */
  live: boolean;
  /** The tutor asked something and is waiting for the student. */
  awaitingStudent: boolean;
  micOn: boolean;
  micLevel: number;
  userSpeaking: boolean;
  settingsOpen: boolean;
  chatOpen: boolean;
  stt: ModelStatus;
  tts: ModelStatus;
  error: string | null;
  setSettings: (fn: (s: Settings) => Settings) => void;
  set: (patch: Partial<SessionState>) => void;
  addMessage: (m: Omit<ChatMessage, "id">) => string;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      status: "idle",
      caption: "",
      messages: [],
      live: false,
      awaitingStudent: false,
      micOn: false,
      micLevel: 0,
      userSpeaking: false,
      settingsOpen: false,
      chatOpen: false,
      stt: { state: "idle" },
      tts: { state: "idle" },
      error: null,
      setSettings: (fn) => set((s) => ({ settings: fn(s.settings) })),
      set: (patch) => set(patch),
      addMessage: (m) => {
        const id = uid();
        set((s) => ({ messages: [...s.messages, { ...m, id }].slice(-200) }));
        return id;
      },
      updateMessage: (id, patch) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
    }),
    {
      name: "mathtwitch-session",
      version: 2,
      // v1: switch the brain to the Subscription Gateway with Claude Haiku.
      // v2: switch the ears to Parakeet on oMLX.
      migrate: (persisted, version) => {
        const p = persisted as Partial<SessionState> | undefined;
        if (version < 1 && p?.settings) {
          p.settings = { ...p.settings, llm: { ...p.settings.llm, ...DEFAULT_SETTINGS.llm } };
        }
        if (version < 2 && p?.settings) {
          p.settings = { ...p.settings, stt: { ...DEFAULT_SETTINGS.stt } };
        }
        return p as SessionState;
      },
      partialize: (s) => ({ settings: s.settings, messages: s.messages, chatOpen: s.chatOpen }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SessionState> | undefined;
        return {
          ...current,
          ...p,
          settings: deepMerge(DEFAULT_SETTINGS, p?.settings),
        };
      },
    },
  ),
);

function deepMerge(base: Settings, over?: Partial<Settings>): Settings {
  if (!over) return base;
  return {
    ...base,
    ...over,
    llm: { ...base.llm, ...over.llm },
    stt: { ...base.stt, ...over.stt },
    tts: { ...base.tts, ...over.tts },
    voice: { ...base.voice, ...over.voice },
  };
}

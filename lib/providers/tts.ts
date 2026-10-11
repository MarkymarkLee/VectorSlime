"use client";

import { audioPlayer } from "@/lib/audio/player";
import type { TTSSettings } from "@/lib/settings";
import { useSession, type ModelStatus } from "@/lib/session/store";

/**
 * A synthesized utterance. `play` resolves when playback ends (or is stopped).
 */
export interface Utterance {
  play: () => Promise<void>;
}

// ---------- Kokoro (local, in-browser) ----------

let kokoroWorker: Worker | null = null;
const pending = new Map<number, { resolve: (b: AudioBuffer) => void; reject: (e: Error) => void }>();
let nextId = 1;

function getKokoro() {
  if (kokoroWorker) return kokoroWorker;
  kokoroWorker = new Worker("/workers/tts.worker.js", { type: "module" });
  kokoroWorker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    const setStatus = (tts: ModelStatus) => useSession.getState().set({ tts });
    if (msg.type === "progress") reportProgress("tts", msg.progress);
    else if (msg.type === "ready") setStatus({ state: "ready", detail: `Kokoro on ${msg.device}` });
    else if (msg.type === "error") setStatus({ state: "error", detail: msg.error });
    else if (msg.type === "audio") {
      pending.get(msg.id)?.resolve(audioPlayer.fromPCM(msg.audio, msg.sampleRate));
      pending.delete(msg.id);
    } else if (msg.type === "audio-error") {
      pending.get(msg.id)?.reject(new Error(msg.error));
      pending.delete(msg.id);
    }
  };
  return kokoroWorker;
}

export function preloadTTS(cfg: TTSSettings) {
  if (cfg.provider !== "kokoro") return;
  const { tts } = useSession.getState();
  if (tts.state === "ready" || tts.state === "loading") return;
  useSession.getState().set({ tts: { state: "loading", progress: 0 } });
  getKokoro().postMessage({ type: "load" });
}

function kokoroSynth(text: string, cfg: TTSSettings): Promise<AudioBuffer> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getKokoro().postMessage({ type: "speak", id, text, voice: cfg.voice, speed: cfg.speed });
  });
}

// ---------- Shared progress reporting for local model downloads ----------

const fileProgress: Record<string, Record<string, number>> = { tts: {}, stt: {} };

export function reportProgress(kind: "tts" | "stt", p: { status: string; file?: string; progress?: number }) {
  if (p.status === "progress" && p.file) {
    fileProgress[kind][p.file] = p.progress ?? 0;
    const vals = Object.values(fileProgress[kind]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    useSession.getState().set({ [kind]: { state: "loading", progress: avg, detail: "Downloading model" } } as never);
  }
}

// ---------- Synthesis entry point ----------

export async function synthesize(text: string, cfg: TTSSettings, signal: AbortSignal): Promise<Utterance> {
  if (cfg.provider === "web-speech") {
    return {
      play: () =>
        new Promise<void>((resolve) => {
          if (signal.aborted) return resolve();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = cfg.speed;
          const voice = speechSynthesis.getVoices().find((v) => v.name === cfg.voice);
          if (voice) u.voice = voice;
          const done = () => {
            audioPlayer.externalSpeaking = false;
            resolve();
          };
          u.onend = done;
          u.onerror = done;
          signal.addEventListener("abort", () => {
            speechSynthesis.cancel();
            done();
          });
          audioPlayer.externalSpeaking = true;
          speechSynthesis.speak(u);
        }),
    };
  }

  let buffer: AudioBuffer;
  if (cfg.provider === "openai-compatible") {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...cfg }),
      signal,
    });
    if (!res.ok) throw new Error(`TTS failed: ${await res.text()}`);
    buffer = await audioPlayer.decode(await res.arrayBuffer());
  } else {
    buffer = await kokoroSynth(text, cfg);
  }
  return {
    play: () => {
      if (signal.aborted) return Promise.resolve();
      const p = audioPlayer.play(buffer);
      signal.addEventListener("abort", () => audioPlayer.stop());
      return p;
    },
  };
}

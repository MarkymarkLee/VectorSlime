"use client";

import { encodeWav } from "@/lib/audio/mic";
import type { STTSettings } from "@/lib/settings";
import { useSession } from "@/lib/session/store";
import { reportProgress } from "@/lib/providers/tts";

let worker: Worker | null = null;
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();
let nextId = 1;

function getWorker() {
  if (worker) return worker;
  worker = new Worker("/workers/stt.worker.js", { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    const set = useSession.getState().set;
    if (msg.type === "progress") reportProgress("stt", msg.progress);
    else if (msg.type === "ready") set({ stt: { state: "ready", detail: `Whisper on ${msg.device}` } });
    else if (msg.type === "error") set({ stt: { state: "error", detail: msg.error } });
    else if (msg.type === "text") {
      pending.get(msg.id)?.resolve(msg.text);
      pending.delete(msg.id);
    } else if (msg.type === "text-error") {
      pending.get(msg.id)?.reject(new Error(msg.error));
      pending.delete(msg.id);
    }
  };
  return worker;
}

export function preloadSTT(cfg: STTSettings) {
  const { stt, set } = useSession.getState();
  if (stt.state === "ready" || stt.state === "loading") return;
  if (cfg.provider === "omlx") {
    // oMLX loads models on first use; a short silent clip warms it so the first real turn is fast.
    set({ stt: { state: "loading", progress: 0 } });
    transcribeRemote(new Float32Array(8000), cfg)
      .then(() => set({ stt: { state: "ready", detail: `${cfg.model} on oMLX` } }))
      .catch((e: Error) => set({ stt: { state: "error", detail: e.message } }));
    return;
  }
  if (cfg.provider !== "whisper-local") return;
  set({ stt: { state: "loading", progress: 0 } });
  getWorker().postMessage({ type: "load", model: cfg.model });
}

async function transcribeRemote(audio: Float32Array, cfg: STTSettings): Promise<string> {
  const form = new FormData();
  form.set("file", encodeWav(audio), "audio.wav");
  form.set("provider", cfg.provider);
  form.set("baseURL", cfg.baseURL);
  form.set("apiKey", cfg.apiKey);
  form.set("model", cfg.model);
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`STT failed: ${await res.text()}`);
  return ((await res.json()) as { text: string }).text.trim();
}

/** Transcribe 16 kHz mono PCM. */
export async function transcribe(audio: Float32Array, cfg: STTSettings): Promise<string> {
  if (cfg.provider !== "whisper-local") return transcribeRemote(audio, cfg);
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ type: "transcribe", id, model: cfg.model, audio }, [audio.buffer]);
  });
}

/** Whisper hallucinates these on silence/noise. */
export function isNoiseTranscript(text: string) {
  const t = text.toLowerCase().replace(/[^a-z ]/g, "").trim();
  return !t || ["you", "thank you", "thanks for watching", "bye", "uh", "um", "hmm"].includes(t) || /^\[.*\]$/.test(text.trim());
}

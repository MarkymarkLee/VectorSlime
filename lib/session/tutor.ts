"use client";

import type { Editor } from "tldraw";
import { ActionStreamParser, cleanForSpeech } from "@/lib/agent/actionParser";
import { formatTurnContext } from "@/lib/agent/prompt";
import { STREAM_ERROR_MARKER } from "@/lib/agent/protocol";
import { MicInput } from "@/lib/audio/mic";
import { audioPlayer } from "@/lib/audio/player";
import { FOCUS_TOOLS, applyAction, type TurnPlacement } from "@/lib/board/applyAction";
import { clearFocus } from "@/lib/board/focus";
import { getCourse } from "@/lib/courses";
import { usePlan } from "@/lib/plan/store";
import { snapshotBoard, summarizeBoard } from "@/lib/board/snapshot";
import { isNoiseTranscript, preloadSTT, transcribe } from "@/lib/providers/stt";
import { preloadTTS, synthesize } from "@/lib/providers/tts";
import type { WidgetMessage } from "@/components/board/shapes/WidgetShape";
import { flushAfterTurn } from "@/lib/session/afterTurn";
import { useSession } from "@/lib/session/store";

const HISTORY_TURNS = 24;
/** Hard cap on sentences per tutor turn, so turns stay conversational. */
const MAX_SENTENCES = 4;

let editor: Editor | null = null;
let currentTurn: AbortController | null = null;
const widgetEvents: string[] = [];

export function setEditor(e: Editor | null) {
  editor = e;
}

export function getEditor() {
  return editor;
}

const store = () => useSession.getState();

// ---------------------------------------------------------------- widgets

if (typeof window !== "undefined") {
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data as WidgetMessage | undefined;
    if (!msg || msg.__mathtwitch !== true) return;
    if (msg.name === "submit") {
      // A Check/Submit button in a widget is the student's answer: respond now.
      if (store().live) void askTutor(`Answered in "${msg.title}": ${describeAnswer(msg.data)}`);
      return;
    }
    const line = `${msg.title} (${msg.shapeId}) → ${msg.name}: ${JSON.stringify(msg.data)}`;
    const prev = widgetEvents[widgetEvents.length - 1];
    if (prev && prev.startsWith(`${msg.title} (${msg.shapeId}) → ${msg.name}:`)) widgetEvents.pop();
    widgetEvents.push(line);
    if (widgetEvents.length > 12) widgetEvents.shift();
  });
}

function courseInfo(id: string | undefined) {
  const course = getCourse(id);
  return course ? { title: course.title, lessons: course.lessons.length } : undefined;
}

function describeAnswer(data: unknown) {
  if (data && typeof data === "object" && "answer" in data) {
    const { answer, correct } = data as { answer: unknown; correct?: unknown };
    const verdict = correct === true ? " (the widget marked this correct)" : correct === false ? " (the widget marked this incorrect)" : "";
    return `${String(answer)}${verdict}`;
  }
  return JSON.stringify(data);
}

// ------------------------------------------------------------ sentences

/**
 * Decides when the tutor has handed the turn to the student: after a real
 * question (not a one-word opener like "Ready?") or after MAX_SENTENCES.
 * Speech after that point is dropped, so the student gets room to answer.
 */
class TurnGate {
  sentences = 0;
  handedOff = false;
  question = "";

  accept(sentence: string) {
    if (this.handedOff) return false;
    // A board tag mid-sentence flushes a fragment ("Our goal is to get");
    // only complete sentences count toward the limit.
    if (!/[.!?]["'”’)\]]*$/.test(sentence.trim())) return true;
    this.sentences++;
    const isQuestion = /\?["'”’)\]]*$/.test(sentence.trim());
    if (isQuestion && (this.sentences >= 2 || sentence.split(/\s+/).length >= 5)) {
      this.handedOff = true;
      this.question = sentence;
    } else if (this.sentences >= MAX_SENTENCES) {
      this.handedOff = true;
    }
    return true;
  }
}

/** Splits streamed text into speakable sentences. */
class SentenceChunker {
  private buf = "";
  constructor(private emit: (s: string) => void) {}

  push(text: string) {
    this.buf += text;
    for (;;) {
      const m = this.buf.match(/^([\s\S]*?[.!?;:])(\s+)|^([\s\S]*?)\n+/);
      if (m) {
        const sentence = (m[1] ?? m[3]).trim();
        this.buf = this.buf.slice(m[0].length);
        if (sentence) this.emit(sentence);
        continue;
      }
      if (this.buf.length > 220) {
        const cut = Math.max(this.buf.lastIndexOf(", ", 200), this.buf.lastIndexOf(" ", 200));
        this.emit(this.buf.slice(0, cut).trim());
        this.buf = this.buf.slice(cut + 1);
        continue;
      }
      return;
    }
  }

  flush() {
    const s = this.buf.trim();
    this.buf = "";
    if (s) this.emit(s);
  }
}

/**
 * Synthesizes sentences ahead of time and plays them in order. Board actions
 * are queued in the same chain, so each one runs at its place in the speech
 * (after the sentence before it finishes, before the next one starts).
 */
class SpeechPipeline {
  private chain: Promise<void> = Promise.resolve();
  private pending = new Set<{ run: () => void; essential: boolean }>();

  constructor(private signal: AbortSignal) {
    // On interruption, still apply queued content (equations, widgets) so
    // nothing the tutor wrote is lost; drop queued focus moves.
    signal.addEventListener("abort", () => {
      for (const a of this.pending) if (a.essential) a.run();
      this.pending.clear();
    });
  }

  addAction(run: () => void, essential: boolean) {
    const entry = { run, essential };
    this.pending.add(entry);
    this.chain = this.chain.then(() => {
      if (!this.pending.delete(entry) || this.signal.aborted) return;
      run();
    });
  }

  add(sentence: string) {
    const spoken = cleanForSpeech(sentence).trim();
    if (!/[a-zA-Z0-9]/.test(spoken)) return;
    const cfg = store().settings.tts;
    const utterance = synthesize(spoken, cfg, this.signal);
    utterance.catch(() => {}); // surfaced below
    this.chain = this.chain.then(async () => {
      if (this.signal.aborted) return;
      try {
        const u = await utterance;
        if (this.signal.aborted) return;
        store().set({ status: "speaking", caption: sentence });
        await u.play();
      } catch (err) {
        console.error(err);
        store().set({ error: `Voice error: ${(err as Error).message}`, caption: sentence });
      }
    });
  }

  done() {
    return this.chain;
  }
}

// ----------------------------------------------------------------- turns

export function interrupt() {
  currentTurn?.abort();
  currentTurn = null;
  audioPlayer.stop();
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  audioPlayer.externalSpeaking = false;
  const s = store();
  if (s.status === "speaking" || s.status === "thinking") s.set({ status: "idle", caption: "" });
}

export async function askTutor(text: string, opts: { hidden?: boolean } = {}) {
  if (!editor) return;
  interrupt();
  const ctrl = new AbortController();
  currentTurn = ctrl;
  const s = store();
  const { settings } = s;

  const history = s.messages
    .filter((m) => m.role !== "system")
    .slice(-HISTORY_TURNS)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.actions?.length ? `${m.text}\n[board actions you took: ${m.actions.join("; ")}]` : m.text,
    }))
    .filter((m) => m.content.trim());

  if (!opts.hidden) s.addMessage({ role: "user", text });
  s.set({ status: "thinking", caption: "", error: null, awaitingStudent: false });
  clearFocus(editor);

  const board = summarizeBoard(editor);
  const image = settings.llm.vision ? await snapshotBoard(editor, board.ids) : undefined;
  const context = formatTurnContext({
    shapes: board.shapes,
    widgetEvents: widgetEvents.splice(0),
    hasImage: !!image,
    plan: usePlan.getState().plan,
    course: courseInfo(usePlan.getState().plan?.courseId),
  });
  const user = `${context}\n\n[Student says]\n${text}`;

  const speech = new SpeechPipeline(ctrl.signal);
  const gate = new TurnGate();
  let spoken = "";
  const chunker = new SentenceChunker((sentence) => {
    if (!gate.accept(sentence)) return;
    speech.add(sentence);
    spoken += `${sentence} `;
    store().updateMessage(msgId, { text: spoken.trim() });
  });
  const placement: TurnPlacement = {};
  const actions: string[] = [];
  let actionCount = 0;
  const msgId = store().addMessage({ role: "assistant", text: "" });

  const parser = new ActionStreamParser({
    onSpeech: (t) => chunker.push(t),
    onAction: (action) => {
      actionCount++;
      // Once the student has the turn, don't keep steering their attention.
      if (gate.handedOff && FOCUS_TOOLS.has(action.tool)) return;
      // Text before the tag is spoken first; the action runs at that point.
      chunker.flush();
      speech.addAction(() => {
        if (!editor) return;
        try {
          let note: string | null = null;
          editor.run(() => {
            note = applyAction(editor!, action, placement);
          });
          if (note) actions.push(note);
          store().updateMessage(msgId, { actions: [...actions] });
        } catch (err) {
          console.error("Board action failed", action, err);
        }
      }, !FOCUS_TOOLS.has(action.tool));
    },
  });

  try {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ llm: settings.llm, tutorName: settings.tutorName, history, user, image }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let streamError: string | null = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (streamError !== null) {
        streamError += value;
        continue;
      }
      const at = value.indexOf(STREAM_ERROR_MARKER);
      if (at === -1) {
        parser.push(value);
      } else {
        parser.push(value.slice(0, at));
        streamError = value.slice(at + STREAM_ERROR_MARKER.length);
      }
    }
    if (streamError !== null) throw new Error(streamError);
    parser.end();
    chunker.flush();
    if (!spoken.trim() && !actionCount) throw new Error("The model returned an empty response.");
    await speech.done();
  } catch (err) {
    if (ctrl.signal.aborted) {
      if (!spoken.trim() && !actionCount) store().removeMessage(msgId);
      return;
    }
    const message = (err as Error).message;
    store().set({ error: `Tutor error: ${message}` });
    store().updateMessage(msgId, { role: "system", text: `⚠️ ${message}` });
  } finally {
    if (currentTurn === ctrl) {
      currentTurn = null;
      const lastSentence = spoken.trim().split(/(?<=[.!?])\s+/).pop() ?? "";
      const question = gate.question || (/\?["'”’)\]]*$/.test(lastSentence) ? lastSentence : "");
      if (!ctrl.signal.aborted) setTimeout(flushAfterTurn, 400);
      if (question && !ctrl.signal.aborted) {
        // Keep the question on screen until the student answers.
        store().set({ status: "idle", awaitingStudent: true, caption: question });
      } else {
        store().set({ status: "idle" });
        setTimeout(() => {
          if (store().status === "idle" && !store().awaitingStudent) store().set({ caption: "" });
        }, 2500);
      }
    }
  }
}

// ------------------------------------------------------------------- mic

let mic: MicInput | null = null;

function getMic() {
  if (mic) return mic;
  mic = new MicInput({
    onLevel: (level) => store().set({ micLevel: level }),
    onSpeechStart: () => {
      store().set({ userSpeaking: true, awaitingStudent: false });
      const { status, settings } = store();
      if (settings.voice.bargeIn && (status === "speaking" || status === "thinking")) interrupt();
    },
    onUtterance: async (audio) => {
      store().set({ userSpeaking: false, status: "transcribing" });
      try {
        const text = await transcribe(audio, store().settings.stt);
        if (isNoiseTranscript(text)) {
          store().set({ status: "idle" });
          return;
        }
        await askTutor(text);
      } catch (err) {
        store().set({ status: "idle", error: `Speech recognition error: ${(err as Error).message}` });
      }
    },
  });
  return mic;
}

// Ignore our own voice coming out of the speakers while the tutor talks.
useSession.subscribe((s, prev) => {
  if (!mic || s.status === prev.status) return;
  const speaking = s.status === "speaking";
  mic.sensitivityBoost = speaking ? 2.8 : 1;
  mic.vadEnabled = s.settings.voice.mode === "hands-free" && (!speaking || s.settings.voice.bargeIn);
});

export async function setMicOn(on: boolean) {
  const s = store();
  if (!on) {
    mic?.stop();
    s.set({ micOn: false, userSpeaking: false, micLevel: 0 });
    return;
  }
  preloadSTT(s.settings.stt);
  try {
    const m = getMic();
    await m.start();
    m.vadEnabled = s.settings.voice.mode === "hands-free";
    s.set({ micOn: true });
  } catch (err) {
    s.set({ error: `Microphone unavailable: ${(err as Error).message}` });
  }
}

export function pushToTalk(down: boolean) {
  if (!mic?.running) return;
  if (down) mic.beginManual();
  else {
    store().set({ userSpeaking: false });
    mic.endManual();
  }
}

/** Unlock audio, load voice models and open the mic. Greeting is up to the caller. */
export async function goLive() {
  await audioPlayer.resume();
  store().set({ live: true });
  const { settings } = store();
  preloadTTS(settings.tts);
  preloadSTT(settings.stt);
  await setMicOn(true);
}

/** Stop talking and listening; the dashboard shows again. */
export function endLive() {
  interrupt();
  void setMicOn(false);
  widgetEvents.splice(0);
  store().set({ live: false, status: "idle", caption: "", awaitingStudent: false });
}

/** Forget widget interactions from a previous session. */
export function resetTutorState() {
  widgetEvents.splice(0);
}

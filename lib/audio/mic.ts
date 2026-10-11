/**
 * Microphone capture at 16 kHz with a lightweight energy-based VAD.
 * - hands-free: utterances are detected automatically.
 * - push-to-talk: call beginManual()/endManual().
 */

const SAMPLE_RATE = 16000;
const FRAME = 320; // 20 ms
const PREROLL_FRAMES = 15; // 300 ms
const HANG_FRAMES = 40; // 800 ms of silence ends an utterance
const START_FRAMES = 4; // 80 ms of voice starts one
const MIN_UTTERANCE = SAMPLE_RATE * 0.35;

const WORKLET = `
class Tap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("mic-tap", Tap);
`;

export interface MicCallbacks {
  onSpeechStart?: () => void;
  onUtterance: (audio: Float32Array) => void;
  onLevel?: (level: number) => void;
}

export class MicInput {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private pending = new Float32Array(0);
  private preroll: Float32Array[] = [];
  private speech: Float32Array[] = [];
  private inSpeech = false;
  private voiced = 0;
  private silent = 0;
  private noiseFloor = 0.004;
  private manual = false;
  /** Raise the threshold while the tutor talks, to ignore speaker echo. */
  sensitivityBoost = 1;
  vadEnabled = true;

  constructor(private cb: MicCallbacks) {}

  get running() {
    return !!this.ctx;
  }

  async start() {
    if (this.ctx) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await this.ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "mic-tap");
    this.node.port.onmessage = (e: MessageEvent<Float32Array>) => this.ingest(e.data);
    src.connect(this.node);
  }

  stop() {
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.reset();
  }

  beginManual() {
    this.manual = true;
    this.speech = [...this.preroll];
    this.inSpeech = true;
    this.cb.onSpeechStart?.();
  }

  endManual() {
    if (!this.manual) return;
    this.manual = false;
    this.finish();
  }

  private reset() {
    this.inSpeech = false;
    this.speech = [];
    this.voiced = 0;
    this.silent = 0;
  }

  private ingest(chunk: Float32Array) {
    const merged = new Float32Array(this.pending.length + chunk.length);
    merged.set(this.pending);
    merged.set(chunk, this.pending.length);
    let offset = 0;
    while (offset + FRAME <= merged.length) {
      this.frame(merged.slice(offset, offset + FRAME));
      offset += FRAME;
    }
    this.pending = merged.slice(offset);
  }

  private frame(f: Float32Array) {
    let sum = 0;
    for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
    const rms = Math.sqrt(sum / f.length);
    this.cb.onLevel?.(Math.min(1, rms * 12));

    if (this.manual) {
      this.speech.push(f);
      return;
    }

    if (!this.inSpeech) {
      this.preroll.push(f);
      if (this.preroll.length > PREROLL_FRAMES) this.preroll.shift();
    }
    if (!this.vadEnabled) return;

    const threshold = Math.max(this.noiseFloor * 3.2, 0.012) * this.sensitivityBoost;
    const isVoice = rms > threshold;
    if (!isVoice && !this.inSpeech) this.noiseFloor = this.noiseFloor * 0.97 + rms * 0.03;

    if (!this.inSpeech) {
      this.voiced = isVoice ? this.voiced + 1 : 0;
      if (this.voiced >= START_FRAMES) {
        this.inSpeech = true;
        this.silent = 0;
        this.speech = [...this.preroll];
        this.preroll = [];
        this.cb.onSpeechStart?.();
      }
    } else {
      this.speech.push(f);
      this.silent = isVoice ? 0 : this.silent + 1;
      if (this.silent >= HANG_FRAMES) this.finish();
    }
  }

  private finish() {
    const total = this.speech.reduce((n, f) => n + f.length, 0);
    const audio = new Float32Array(total);
    let o = 0;
    for (const f of this.speech) {
      audio.set(f, o);
      o += f.length;
    }
    this.reset();
    if (total >= MIN_UTTERANCE) this.cb.onUtterance(audio);
  }
}

export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

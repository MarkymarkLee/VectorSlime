/**
 * Single output path for all tutor audio, so the avatar's lip sync can read
 * the level regardless of which TTS produced it.
 */
class AudioPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private current: AudioBufferSourceNode | null = null;
  private data = new Float32Array(1024);
  /** Set by TTS providers that play audio themselves (Web Speech). */
  externalSpeaking = false;

  get context() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async resume() {
    if (this.context.state === "suspended") await this.context.resume();
  }

  play(buffer: AudioBuffer): Promise<void> {
    const ctx = this.context;
    this.stop();
    return new Promise((resolve) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.analyser!);
      src.onended = () => {
        if (this.current === src) this.current = null;
        resolve();
      };
      this.current = src;
      src.start();
    });
  }

  stop() {
    if (this.current) {
      const src = this.current;
      this.current = null;
      try {
        src.stop();
      } catch {
        // already stopped
      }
    }
  }

  async decode(data: ArrayBuffer) {
    return this.context.decodeAudioData(data);
  }

  fromPCM(samples: Float32Array, sampleRate: number) {
    const buf = this.context.createBuffer(1, samples.length, sampleRate);
    buf.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    return buf;
  }

  /** 0..1 loudness of whatever the tutor is saying right now. */
  getLevel(): number {
    if (this.externalSpeaking) {
      const t = performance.now() / 1000;
      return 0.35 + 0.3 * Math.abs(Math.sin(t * 11) * Math.sin(t * 4.3));
    }
    if (!this.analyser || !this.current) return 0;
    this.analyser.getFloatTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i] * this.data[i];
    return Math.min(1, Math.sqrt(sum / this.data.length) * 6);
  }
}

export const audioPlayer = new AudioPlayer();

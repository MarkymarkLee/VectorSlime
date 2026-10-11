// Local text-to-speech with Kokoro-82M (ONNX) running in the browser.
// Loaded from a CDN so the ONNX runtime isn't bundled by Next.js.
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";

let ttsPromise = null;

async function load() {
  if (!ttsPromise) {
    const webgpu = !!self.navigator?.gpu && !!(await self.navigator.gpu.requestAdapter().catch(() => null));
    ttsPromise = KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: webgpu ? "fp32" : "q8",
      device: webgpu ? "webgpu" : "wasm",
      progress_callback: (p) => self.postMessage({ type: "progress", progress: p }),
    });
    ttsPromise.then(
      () => self.postMessage({ type: "ready", device: webgpu ? "webgpu" : "wasm" }),
      (err) => {
        ttsPromise = null;
        self.postMessage({ type: "error", error: String(err) });
      },
    );
  }
  return ttsPromise;
}

self.onmessage = async (e) => {
  const { type, id, text, voice, speed } = e.data;
  if (type === "load") {
    load().catch(() => {});
    return;
  }
  if (type === "speak") {
    try {
      const tts = await load();
      const audio = await tts.generate(text, { voice, speed });
      self.postMessage({ type: "audio", id, audio: audio.audio, sampleRate: audio.sampling_rate }, [audio.audio.buffer]);
    } catch (err) {
      self.postMessage({ type: "audio-error", id, error: String(err) });
    }
  }
};

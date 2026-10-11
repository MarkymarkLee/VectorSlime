// Local speech-to-text with Whisper (transformers.js) running in the browser.
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";

let asrPromise = null;
let loadedModel = null;

async function load(model) {
  if (!asrPromise || loadedModel !== model) {
    loadedModel = model;
    const webgpu = !!self.navigator?.gpu && !!(await self.navigator.gpu.requestAdapter().catch(() => null));
    asrPromise = pipeline("automatic-speech-recognition", model, {
      device: webgpu ? "webgpu" : "wasm",
      dtype: webgpu ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8",
      progress_callback: (p) => self.postMessage({ type: "progress", progress: p }),
    });
    asrPromise.then(
      () => self.postMessage({ type: "ready", device: webgpu ? "webgpu" : "wasm" }),
      (err) => {
        asrPromise = null;
        self.postMessage({ type: "error", error: String(err) });
      },
    );
  }
  return asrPromise;
}

self.onmessage = async (e) => {
  const { type, id, model, audio } = e.data;
  if (type === "load") {
    load(model).catch(() => {});
    return;
  }
  if (type === "transcribe") {
    try {
      const asr = await load(model);
      const out = await asr(audio, { chunk_length_s: 30 });
      self.postMessage({ type: "text", id, text: (out.text || "").trim() });
    } catch (err) {
      self.postMessage({ type: "text-error", id, error: String(err) });
    }
  }
};

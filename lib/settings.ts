export type LLMProvider = "gateway" | "omlx" | "ollama" | "lmstudio" | "openai-compatible" | "openai" | "anthropic";
export type STTProvider = "omlx" | "whisper-local" | "openai-compatible";
export type TTSProvider = "kokoro" | "web-speech" | "openai-compatible";

export interface LLMSettings {
  provider: LLMProvider;
  baseURL: string;
  apiKey: string;
  model: string;
  /** Send a PNG snapshot of the board (requires a vision-language model). */
  vision: boolean;
  /** Let reasoning models think before answering (much slower to start talking). */
  thinking: boolean;
}

export interface STTSettings {
  provider: STTProvider;
  /** Model id: Hugging Face Whisper id in the browser, or the server's model name. */
  model: string;
  baseURL: string;
  apiKey: string;
}

export interface TTSSettings {
  provider: TTSProvider;
  voice: string;
  model: string;
  baseURL: string;
  apiKey: string;
  speed: number;
}

export interface VoiceSettings {
  mode: "hands-free" | "push-to-talk";
  /** Stop the tutor when the student starts talking. */
  bargeIn: boolean;
}

export interface Settings {
  tutorName: string;
  llm: LLMSettings;
  stt: STTSettings;
  tts: TTSSettings;
  voice: VoiceSettings;
}

export const LLM_DEFAULT_BASE_URLS: Record<LLMProvider, string> = {
  gateway: "http://127.0.0.1:8787/v1",
  omlx: "http://127.0.0.1:11434/v1",
  ollama: "http://127.0.0.1:11434/v1",
  lmstudio: "http://127.0.0.1:1234/v1",
  "openai-compatible": "http://127.0.0.1:8080/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
};

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  gateway: "Subscription Gateway (claude / gemini CLIs)",
  omlx: "oMLX (local, Apple Silicon)",
  ollama: "Ollama (local)",
  lmstudio: "LM Studio (local)",
  "openai-compatible": "Other OpenAI-compatible server",
  openai: "OpenAI API",
  anthropic: "Anthropic Claude API",
};

/** Model and base URL to switch to when the STT engine changes. */
export const STT_DEFAULTS: Record<STTProvider, Pick<STTSettings, "model" | "baseURL">> = {
  omlx: { model: "parakeet-tdt-0.6b-v3", baseURL: "http://127.0.0.1:11434/v1" },
  "whisper-local": { model: "Xenova/whisper-base.en", baseURL: "" },
  "openai-compatible": { model: "whisper-1", baseURL: "https://api.openai.com/v1" },
};

export const KOKORO_VOICES = [
  "af_heart",
  "af_bella",
  "af_nicole",
  "af_sarah",
  "am_michael",
  "am_puck",
  "am_fenrir",
  "bf_emma",
  "bm_george",
  "bm_fable",
];

export const DEFAULT_SETTINGS: Settings = {
  tutorName: "Professor Pi",
  llm: {
    provider: "gateway",
    baseURL: LLM_DEFAULT_BASE_URLS.gateway,
    apiKey: "",
    model: "claude-haiku",
    vision: true,
    thinking: false,
  },
  stt: {
    provider: "omlx",
    ...STT_DEFAULTS.omlx,
    apiKey: "",
  },
  tts: {
    provider: "kokoro",
    voice: "am_michael",
    model: "tts-1",
    baseURL: "https://api.openai.com/v1",
    apiKey: "",
    speed: 1.05,
  },
  voice: {
    mode: "hands-free",
    bargeIn: true,
  },
};

"use client";

import { useEffect, useState } from "react";
import {
  KOKORO_VOICES,
  LLM_DEFAULT_BASE_URLS,
  LLM_PROVIDER_LABELS,
  STT_DEFAULTS,
  type LLMProvider,
  type Settings,
} from "@/lib/settings";
import { useSession } from "@/lib/session/store";

export default function SettingsModal() {
  const { settingsOpen, settings, setSettings, set } = useSession();
  const [models, setModels] = useState<string[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<string[]>([]);

  const { llm, stt, tts, voice } = settings;
  const update = (fn: (s: Settings) => Settings) => setSettings(fn);

  const refreshModels = async () => {
    setLoadingModels(true);
    setModelError(null);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: llm.provider, baseURL: llm.baseURL, apiKey: llm.apiKey }),
      });
      const json = (await res.json()) as { models: string[]; error?: string };
      setModels(json.models);
      if (json.error) {
        setModelError(
          /401|API key/i.test(json.error)
            ? "The server needs an API key. Paste it in the field above."
            : /fetch failed|ECONNREFUSED/.test(json.error)
              ? `Couldn't reach ${llm.baseURL}. Is the server running?`
              : json.error,
        );
      }
      if (!llm.model && json.models[0]) update((s) => ({ ...s, llm: { ...s.llm, model: json.models[0] } }));
    } catch (err) {
      setModelError(String(err));
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (settingsOpen) void refreshModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, llm.provider, llm.baseURL, llm.apiKey]);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const load = () => setBrowserVoices(speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")).map((v) => v.name));
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  if (!settingsOpen) return null;

  const isLocal = ["gateway", "omlx", "ollama", "lmstudio", "openai-compatible"].includes(llm.provider);

  return (
    <div
      className="fixed inset-0 z-[600] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onPointerDown={(e) => e.target === e.currentTarget && set({ settingsOpen: false })}
    >
      <div
        className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-[var(--color-stage-900)] p-6 text-sm text-zinc-200 shadow-2xl ring-1 ring-white/10"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button className="text-zinc-400 hover:text-white" onClick={() => set({ settingsOpen: false })}>
            Done
          </button>
        </div>

        <Section title="Tutor">
          <Field label="Name">
            <input className={input} value={settings.tutorName} onChange={(e) => update((s) => ({ ...s, tutorName: e.target.value }))} />
          </Field>
        </Section>

        <Section title="Brain (language model)">
          <Field label="Provider">
            <select
              className={input}
              value={llm.provider}
              onChange={(e) => {
                const provider = e.target.value as LLMProvider;
                setModels([]);
                update((s) => ({ ...s, llm: { ...s.llm, provider, baseURL: LLM_DEFAULT_BASE_URLS[provider], model: "" } }));
              }}
            >
              {Object.entries(LLM_PROVIDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Base URL">
            <input className={input} value={llm.baseURL} onChange={(e) => update((s) => ({ ...s, llm: { ...s.llm, baseURL: e.target.value } }))} />
          </Field>
          <Field label={isLocal ? "API key (optional)" : "API key"}>
            <input
              type="password"
              className={input}
              value={llm.apiKey}
              placeholder={isLocal ? "Only if your server requires one" : "Stored in this browser only"}
              onChange={(e) => update((s) => ({ ...s, llm: { ...s.llm, apiKey: e.target.value } }))}
            />
          </Field>
          <Field label="Model">
            <div className="flex gap-2">
              <input
                className={input}
                list="model-list"
                value={llm.model}
                placeholder={models[0] ?? "model id"}
                onChange={(e) => update((s) => ({ ...s, llm: { ...s.llm, model: e.target.value } }))}
              />
              <datalist id="model-list">
                {models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <button className={button} onClick={() => void refreshModels()} disabled={loadingModels}>
                {loadingModels ? "…" : "Refresh"}
              </button>
            </div>
            {modelError && <p className="mt-1 text-xs text-amber-300">{modelError}</p>}
            {!modelError && models.length > 0 && <p className="mt-1 text-xs text-zinc-500">{models.length} models available</p>}
          </Field>
          <Check
            label="Let the tutor see the board (needs a vision model, e.g. Qwen2.5-VL / Gemma 3)"
            checked={llm.vision}
            onChange={(v) => update((s) => ({ ...s, llm: { ...s.llm, vision: v } }))}
          />
          {isLocal && (
            <Check
              label="Let the model think before answering (smarter on hard problems, but can take a minute to start talking)"
              checked={llm.thinking}
              onChange={(v) => update((s) => ({ ...s, llm: { ...s.llm, thinking: v } }))}
            />
          )}
        </Section>

        <Section title="Ears (speech recognition)">
          <Field label="Engine">
            <select
              className={input}
              value={stt.provider}
              onChange={(e) =>
                update((s) => {
                  const provider = e.target.value as Settings["stt"]["provider"];
                  return { ...s, stt: { ...s.stt, provider, ...STT_DEFAULTS[provider] } };
                })
              }
            >
              <option value="omlx">oMLX server (local, Parakeet / Whisper)</option>
              <option value="whisper-local">Whisper in browser (local)</option>
              <option value="openai-compatible">OpenAI-compatible server (OpenAI, mlx-audio, whisper.cpp)</option>
            </select>
          </Field>
          <Field label="Model">
            {stt.provider === "whisper-local" ? (
              <select className={input} value={stt.model} onChange={(e) => update((s) => ({ ...s, stt: { ...s.stt, model: e.target.value } }))}>
                <option value="Xenova/whisper-tiny.en">whisper-tiny.en (fastest)</option>
                <option value="Xenova/whisper-base.en">whisper-base.en (balanced)</option>
                <option value="Xenova/whisper-small.en">whisper-small.en (most accurate)</option>
              </select>
            ) : (
              <input className={input} value={stt.model} onChange={(e) => update((s) => ({ ...s, stt: { ...s.stt, model: e.target.value } }))} />
            )}
          </Field>
          {stt.provider !== "whisper-local" && (
            <>
              <Field label="Base URL">
                <input className={input} value={stt.baseURL} onChange={(e) => update((s) => ({ ...s, stt: { ...s.stt, baseURL: e.target.value } }))} />
              </Field>
              <Field label="API key">
                <input
                  type="password"
                  className={input}
                  placeholder={stt.provider === "omlx" ? "Defaults to OMLX_API_KEY in .env" : "Stored in this browser only"}
                  value={stt.apiKey}
                  onChange={(e) => update((s) => ({ ...s, stt: { ...s.stt, apiKey: e.target.value } }))} />
              </Field>
            </>
          )}
          <Field label="Mode">
            <select
              className={input}
              value={voice.mode}
              onChange={(e) => update((s) => ({ ...s, voice: { ...s.voice, mode: e.target.value as Settings["voice"]["mode"] } }))}
            >
              <option value="hands-free">Hands-free (detects when you talk)</option>
              <option value="push-to-talk">Push-to-talk (hold the mic button)</option>
            </select>
          </Field>
          <Check
            label="Interrupt the tutor when I start talking (use headphones for best results)"
            checked={voice.bargeIn}
            onChange={(v) => update((s) => ({ ...s, voice: { ...s.voice, bargeIn: v } }))}
          />
        </Section>

        <Section title="Voice (speech synthesis)">
          <Field label="Engine">
            <select
              className={input}
              value={tts.provider}
              onChange={(e) => {
                const provider = e.target.value as Settings["tts"]["provider"];
                const voiceName = provider === "kokoro" ? "am_michael" : provider === "openai-compatible" ? "alloy" : "";
                update((s) => ({ ...s, tts: { ...s.tts, provider, voice: voiceName } }));
              }}
            >
              <option value="kokoro">Kokoro in browser (local, natural)</option>
              <option value="web-speech">System voice (macOS, instant)</option>
              <option value="openai-compatible">OpenAI-compatible server (OpenAI, mlx-audio, Kokoro-FastAPI)</option>
            </select>
          </Field>
          <Field label="Voice">
            {tts.provider === "kokoro" ? (
              <select className={input} value={tts.voice} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, voice: e.target.value } }))}>
                {KOKORO_VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : tts.provider === "web-speech" ? (
              <select className={input} value={tts.voice} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, voice: e.target.value } }))}>
                <option value="">Default</option>
                {browserVoices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input className={input} value={tts.voice} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, voice: e.target.value } }))} />
            )}
          </Field>
          <Field label={`Speed (${tts.speed.toFixed(2)}×)`}>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.05}
              value={tts.speed}
              className="w-full accent-slime-500"
              onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, speed: Number(e.target.value) } }))}
            />
          </Field>
          {tts.provider === "openai-compatible" && (
            <>
              <Field label="Model">
                <input className={input} value={tts.model} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, model: e.target.value } }))} />
              </Field>
              <Field label="Base URL">
                <input className={input} value={tts.baseURL} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, baseURL: e.target.value } }))} />
              </Field>
              <Field label="API key">
                <input type="password" className={input} value={tts.apiKey} onChange={(e) => update((s) => ({ ...s, tts: { ...s.tts, apiKey: e.target.value } }))} />
              </Field>
            </>
          )}
          <p className="text-xs text-zinc-500">Changes to local voice/ears models apply after reloading the page.</p>
        </Section>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-slime-500 [&>option]:bg-[var(--color-stage-900)]";
const button = "flex-none rounded-lg bg-white/10 px-3 text-xs text-white hover:bg-white/20 disabled:opacity-50";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slime-300">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
      <input type="checkbox" className="mt-0.5 accent-slime-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { LLM_DEFAULT_BASE_URLS, type LLMSettings } from "@/lib/settings";

/** Server-side only: resolve the configured provider into an AI SDK model. */
export function getModel(cfg: LLMSettings): LanguageModel {
  const baseURL = resolveBaseURL(cfg.provider, cfg.baseURL);
  switch (cfg.provider) {
    case "anthropic":
      return createAnthropic({
        apiKey: cfg.apiKey || process.env.ANTHROPIC_API_KEY,
        baseURL,
      })(cfg.model || "claude-sonnet-5-5");
    case "openai":
      // `apiKey` may be a regular API key or, later, an OAuth access token
      // from "Sign in with ChatGPT" — both are sent as a Bearer token.
      return createOpenAI({
        apiKey: cfg.apiKey || process.env.OPENAI_API_KEY,
        baseURL,
      }).responses(cfg.model || "gpt-5-mini");
    default:
      return createOpenAICompatible({
        name: cfg.provider,
        baseURL,
        apiKey: cfg.apiKey || envApiKey(cfg.provider) || undefined,
      }).chatModel(cfg.model);
  }
}

/**
 * Node resolves "localhost" to IPv6 (::1) first, but local servers like oMLX
 * often listen on IPv4 only — so always use 127.0.0.1.
 */
function resolveBaseURL(provider: LLMSettings["provider"], baseURL: string) {
  const url = baseURL || envBaseURL(provider) || LLM_DEFAULT_BASE_URLS[provider];
  return url.replace(/^(https?:\/\/)localhost(?=[:/]|$)/, "$1127.0.0.1");
}

function envBaseURL(provider: LLMSettings["provider"]) {
  if (provider === "gateway") return process.env.GATEWAY_BASE_URL;
  if (provider === "omlx") return process.env.OMLX_BASE_URL;
  if (provider === "ollama") return process.env.OLLAMA_BASE_URL;
  return undefined;
}

function envApiKey(provider: LLMSettings["provider"]) {
  if (provider === "omlx") return process.env.OMLX_API_KEY;
  return undefined;
}

export const ANTHROPIC_MODELS = ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"];

/** Ask an OpenAI-compatible server (oMLX, Ollama, LM Studio, OpenAI) which models it serves. */
export async function listModels(cfg: Pick<LLMSettings, "provider" | "baseURL" | "apiKey">) {
  if (cfg.provider === "anthropic") return ANTHROPIC_MODELS;
  const baseURL = resolveBaseURL(cfg.provider, cfg.baseURL).replace(/\/$/, "");
  const key = cfg.apiKey || (cfg.provider === "openai" ? process.env.OPENAI_API_KEY : envApiKey(cfg.provider));
  const res = await fetch(`${baseURL}/models`, {
    headers: key ? { Authorization: `Bearer ${key}` } : {},
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id).sort();
}

/**
 * Request-body extras. Reasoning models (Qwen 3.x, etc.) otherwise spend tens
 * of seconds on hidden reasoning before the first spoken word.
 */
export function providerOptionsFor(cfg: LLMSettings) {
  if (cfg.provider === "anthropic" || cfg.provider === "openai" || cfg.provider === "gateway" || cfg.thinking) return undefined;
  return { [cfg.provider]: { chat_template_kwargs: { enable_thinking: false } } };
}

/** Short, user-facing description of an LLM call failure. */
export function describeError(err: unknown): string {
  const e = err as { message?: string; statusCode?: number; lastError?: unknown; cause?: { code?: string } };
  if (e?.lastError) return describeError(e.lastError);
  if (e?.cause?.code === "ECONNREFUSED" || /fetch failed|ECONNREFUSED|Cannot connect/.test(e?.message ?? "")) {
    return "Can't reach the model server. Is the gateway (or your chosen provider) running?";
  }
  if (e?.statusCode === 401) return "The model server rejected the API key. Add it in Settings.";
  const msg = (e?.message ?? String(err)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return e?.statusCode ? `${e.statusCode}: ${msg.slice(0, 300)}` : msg.slice(0, 300);
}

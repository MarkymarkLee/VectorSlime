/**
 * Proxy for OpenAI-compatible speech-to-text (/v1/audio/transcriptions):
 * oMLX (Parakeet, Whisper, Qwen3-ASR), OpenAI, mlx-audio, whisper.cpp server, etc.
 * Body: multipart form with `file` (wav), `provider`, `baseURL`, `apiKey`, `model`.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const omlx = form.get("provider") === "omlx";
  const baseURL = String(
    form.get("baseURL") || (omlx ? process.env.OMLX_BASE_URL || "http://127.0.0.1:11434/v1" : "https://api.openai.com/v1"),
  )
    .replace(/\/$/, "")
    // Node resolves localhost to IPv6 first; oMLX listens on IPv4 only.
    .replace(/^(https?:\/\/)localhost(?=[:/]|$)/, "$1127.0.0.1");
  const apiKey = String(form.get("apiKey") || (omlx ? process.env.OMLX_API_KEY : process.env.OPENAI_API_KEY) || "");
  const upstream = new FormData();
  upstream.set("file", form.get("file") as Blob, "audio.wav");
  upstream.set("model", String(form.get("model") || (omlx ? "parakeet-tdt-0.6b-v3" : "whisper-1")));
  upstream.set("response_format", "json");

  const res = await fetch(`${baseURL}/audio/transcriptions`, {
    method: "POST",
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    body: upstream,
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const json = (await res.json()) as { text?: string };
  return Response.json({ text: json.text ?? "" });
}

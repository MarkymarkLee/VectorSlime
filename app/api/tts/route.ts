/**
 * Proxy for OpenAI-compatible text-to-speech (/v1/audio/speech):
 * OpenAI, mlx-audio (Kokoro on MLX), Kokoro-FastAPI, etc.
 */
interface TTSRequest {
  text: string;
  baseURL: string;
  apiKey: string;
  model: string;
  voice: string;
  speed: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as TTSRequest;
  const baseURL = (body.baseURL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = body.apiKey || process.env.OPENAI_API_KEY || "";
  const res = await fetch(`${baseURL}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: body.model,
      voice: body.voice,
      input: body.text,
      speed: body.speed,
      response_format: "mp3",
    }),
    signal: req.signal,
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg" } });
}

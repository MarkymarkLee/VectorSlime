import { listModels } from "@/lib/providers/llm";
import type { LLMSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const cfg = (await req.json()) as Pick<LLMSettings, "provider" | "baseURL" | "apiKey">;
  try {
    return Response.json({ models: await listModels(cfg) });
  } catch (err) {
    return Response.json({ models: [], error: String(err) }, { status: 502 });
  }
}

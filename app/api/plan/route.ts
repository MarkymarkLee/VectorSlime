import { generateText, type ModelMessage } from "ai";
import { PLAN_SYSTEM, parsePlan } from "@/lib/plan/planPrompt";
import { describeError, getModel, providerOptionsFor } from "@/lib/providers/llm";
import type { LLMSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 300;

interface PlanRequest {
  llm: LLMSettings;
  fileName: string;
  /** Text layer of the PDF (may be empty for scans/photos). */
  text: string;
  /** Base64 JPEG page images (only sent for vision models). */
  images: string[];
}

/** Read a homework sheet and return a study plan for the day. */
export async function POST(req: Request) {
  const body = (await req.json()) as PlanRequest;
  const text = body.text.slice(0, 24000);
  const content: Exclude<ModelMessage["content"], string> = [
    {
      type: "text",
      text: text.trim()
        ? `Homework file: ${body.fileName}\n\nExtracted text:\n${text}`
        : `Homework file: ${body.fileName}\n\nThe file has no text layer; read the attached page images.`,
    },
    ...body.images.map((image) => ({ type: "image" as const, image, mediaType: "image/jpeg" })),
  ];
  const messages: ModelMessage[] = [{ role: "user", content } as ModelMessage];

  try {
    const model = getModel(body.llm);
    const call = (msgs: ModelMessage[]) =>
      generateText({
        model,
        system: PLAN_SYSTEM,
        messages: msgs,
        providerOptions: providerOptionsFor(body.llm),
        maxRetries: 1,
        abortSignal: req.signal,
      });

    const first = await call(messages);
    try {
      return Response.json({ plan: parsePlan(first.text, body.fileName) });
    } catch (err) {
      // One repair attempt: show the model its output and the problem.
      const retry = await call([
        ...messages,
        { role: "assistant", content: first.text },
        { role: "user", content: `That was not valid plan JSON (${(err as Error).message.slice(0, 200)}). Reply with only the JSON object.` },
      ]);
      return Response.json({ plan: parsePlan(retry.text, body.fileName) });
    }
  } catch (err) {
    return Response.json({ error: describeError(err) }, { status: 502 });
  }
}

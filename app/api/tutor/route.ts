import { streamText, type ModelMessage } from "ai";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { STREAM_ERROR_MARKER } from "@/lib/agent/protocol";
import { describeError, getModel, providerOptionsFor } from "@/lib/providers/llm";
import type { LLMSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 120;

interface TutorRequest {
  llm: LLMSettings;
  tutorName: string;
  history: { role: "user" | "assistant"; content: string }[];
  /** The new student turn (speech/typed text plus board context). */
  user: string;
  /** Base64 PNG (no data: prefix) of the visible board. */
  image?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as TutorRequest;

  if (!body.llm.model && body.llm.provider !== "anthropic" && body.llm.provider !== "openai") {
    return new Response("No model selected. Open Settings and pick a model.", { status: 400 });
  }

  const messages: ModelMessage[] = [
    ...body.history.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
    {
      role: "user",
      content: body.image
        ? [
            { type: "text", text: body.user },
            { type: "image", image: body.image, mediaType: "image/png" },
          ]
        : body.user,
    },
  ];

  let result;
  try {
    result = streamText({
      model: getModel(body.llm),
      system: buildSystemPrompt(body.tutorName),
      messages,
      providerOptions: providerOptionsFor(body.llm),
      maxRetries: 1,
      abortSignal: req.signal,
    });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }

  // Plain text stream; upstream errors are forwarded in-band after
  // STREAM_ERROR_MARKER so the client can show them.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") controller.enqueue(encoder.encode(part.text));
          else if (part.type === "error") throw part.error;
        }
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[tutor] stream error", err);
          controller.enqueue(encoder.encode(STREAM_ERROR_MARKER + describeError(err)));
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

import type { NextRequest } from "next/server";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { type CoreMessage, streamText } from "ai";


const BodyValidationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    }),
  ).nonempty(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = BodyValidationSchema.parse(body).messages as CoreMessage[];

  const stream = streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant.",
    messages,
  });
  return stream.toDataStreamResponse();
}

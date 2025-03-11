import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CoreMessage } from "ai";

import { getStreamText, moderate } from "../../../lib/chat";

const BodyValidationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string().min(1).max(500),
    }),
  ).nonempty(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {success, data} =  BodyValidationSchema.safeParse(body);
  if (!success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const isFlagged = await moderate(data.messages as Array<CoreMessage>);
  if (isFlagged) {
    return NextResponse.json({ error: "Moderation failed" }, { status: 400 });
  }

  const stream =  getStreamText(data.messages as Array<CoreMessage>)
  return stream.toDataStreamResponse();
}

import { NextRequest } from "next/server";
import { webhookCallback } from 'grammy'

import { bot } from "./bot";

export async function POST(req: NextRequest) {
  return webhookCallback(bot, 'std/http', 'return', 20_000)(req);
}

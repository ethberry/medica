import { limit } from "@grammyjs/ratelimiter";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { Bot, Context, MemorySessionStorage, session, SessionFlavor } from "grammy";
import { CoreMessage } from "ai";

import { getStreamText, moderate } from "../../../lib/chat";

type BotType = Context & SessionFlavor<Array<CoreMessage>>;
const store = new MemorySessionStorage<Array<CoreMessage>>();

export const bot = new Bot<BotType>(process.env.BOT_TOKEN!);

bot.use(session({
  initial: () => ([] as Array<CoreMessage>),
  storage: store,
}));

bot.api.config.use(apiThrottler());

bot.use(
  limit({
    timeFrame: 10000,
    limit: 2,
    onLimitExceeded: (ctx) => {
      ctx?.reply("Please refrain from sending too many requests!");
    },

    keyGenerator: (ctx) => {
      return ctx.from?.id.toString();
    },
  }),
);

bot.on("message:photo", async (ctx) => {
  await ctx.reply("Images are not supported");
});

bot.on("message", async (ctx) => {
  if (ctx.message.from.is_bot) {
    return;
  }

  if (ctx.message.chat.type === "private") {
    if (!ctx.message.chat.id) {
      await ctx.reply(`Chat id is null`);
      return;
    }

    if (!ctx.message.message_id) {
      await ctx.reply(`Message id is null`);
      return;
    }

    if (!ctx.message.text) {
      await ctx.reply("No text provided");
      return;
    }

    const isFlagged = await moderate([{
      content: ctx.message.text,
      role: "user",
    }]);

    if (isFlagged) {
      await ctx.reply("Please refrain on using any offensive language.");
      return;
    }

    ctx.session.push({
      content: ctx.message.text,
      role: "user",
    });

    const stream = await getStreamText(ctx.session);

    let resultText = "";
    for await (const part of stream.textStream) {
      resultText += part;
    }

    ctx.session.push({
      content: resultText,
      role: "assistant",
    });

    await ctx.reply(resultText);
  } else {
    await ctx.reply("Not implemented");
  }
});



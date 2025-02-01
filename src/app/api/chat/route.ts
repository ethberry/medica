import type { NextRequest } from "next/server";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { type CoreMessage, streamText, tool } from "ai";


const BodyValidationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ).nonempty(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = BodyValidationSchema.parse(body).messages as CoreMessage[];

  const stream = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    system: `
      Ты полезный ассистент в приватной клинике 
      Твоя задача помочь пользователю записать на прием к доктору
      В клинике работают следующие врачи 
      
      | type            | name             |
      |-----------------|------------------|
      | DENTIST         | мария ивановна   |
      | ENT             | олег васильевич  |
      | OPHTHALMOLOGIST | надежда петровна |
      | SURGEON         | игорь николаевич |
      
      Все врачи работают с 9 до 18 по будням
      Текущая дата ${new Date().toISOString()}
      
      Важно что бы ты ничего не придумывал и опирался только на данные в таблице
      Если нужного врача нет, нужно извинится и сообщить пользователю что таких услуг мы не оказываем
      `,
    tools: {
      appointment: tool({
        description: `
            Функция создаёт запись к доктору. 
            Первый параметр тип это тип доктора из таблицы с описанием врачей
            Второй параметр это дата в формате ISO8601, пример ${new Date(0).toISOString()}
            Если возвращает true — запись успешна, если false — нужно попросить пользователя выбрать другое время.
            После вызова функции пользователя нужно уведомить о результате
          `,
        parameters: z.object({
          type: z.string(),
          time: z.string(),
        }),
        execute: async ({ type, time }) => {
          console.log({ type, time });
          return Promise.resolve(time === "2025-02-01T12:00:00.000Z");
        },
      }),
    },
  });
  return stream.toDataStreamResponse();
}

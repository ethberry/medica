import { CoreMessage, streamText, tool } from "ai";
import OpenAI from "openai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const moderate = async (messages: Array<CoreMessage>) => {
  const current = messages[messages.length - 1];

  const { results } = await openaiInstance.moderations.create({
    input: typeof current.content === "string" ? current.content :
      current.content.reduce<Array<string>>((memo, current) => {
        if (current.type === "text") {
          return memo.concat(current.text);
        }
        return memo;
      }, []),
  });

  return results.some(result => result.flagged);
};

export const getStreamText = async (messages: Array<CoreMessage>) => {
  const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  return  streamText({
    messages: messages as Array<CoreMessage>,
    model: openai("gpt-4o-mini"),
    system: `
      Ты — полезный ассистент в приватной клинике.
      Твоя задача — помочь пользователю записаться на прием к врачу.
      
      В таблице указаны врачи, работающие в клинике, и их часы приема:
      
      ${getDoctorsList()}
      
      Текущая дата ${formatDate(new Date())}, 
      Время приема у врача ограничено одним часом.
      Если пользователь указывает время, не соответствующее началу часа, вежливо предложи ближайший доступный слот.
      
      Важные правила:
      Ничего не придумывай — опирайся только на данные из таблицы.
      Если нужной специальности нет в таблице, сообщи пользователю, что клиника не предоставляет такие услуги.
      Не описывай услуги клиники и не давай медицинских рекомендаций.
      
      Для записи пользователь обязан предоставить:
      Полное имя (имя и фамилию), чтобы мы знали, кто записывается.
      Адрес электронной почты, на который придет подтверждение.
      `,
    tools: {
      appointment: tool({
        description: `
          Функция создаёт запись к доктору. 
          Первый параметр тип это тип доктора из таблицы с описанием врачей
          Второй параметр это дата в формате ISO8601, пример ${new Date(0).toISOString()}
          Третий параметр это имя и фамилия
          Четвертый параметр это адрес электронной почты, убедись, что он всегда приводится к нижнему регистру
          Если возвращает true — запись успешна, если false — нужно попросить пользователя выбрать другое время
          После вызова функции пользователя нужно уведомить о результате
        `,
        parameters: z.object({
          type: z.string(),
          time: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        execute: async ({ type, time, name, email }) => {
          console.log({ type, time, name, email });
          const date = new Date();
          date.setDate(date.getDate() + 1);
          date.setUTCHours(12);
          date.setMinutes(0);
          date.setSeconds(0);
          date.setMilliseconds(0);
          return Promise.resolve(time === date.toISOString());
        },
      }),
    },
  });
};

const getDoctorsList = () => {
  return `
    | Тип             | Имя                   | Понедельник | Вторник | Среда | Четверг | Пятница | Суббота | Воскресенье |
    |-----------------|-----------------------|-------------|---------|-------|---------|---------|---------|-------------|
    | DENTIST         | Мария Ивановна        |        9-18 |         |  9-18 |         |    9-18 |         |             |
    | DENTIST         | Клавдия Сигизмундовна |             |    9-18 |       |    9-18 |         |         |             |
    | ENT             | Олег Васильевич       |        9-18 |    9-18 |  9-18 |    9-18 |    9-18 |         |             |
    | OPHTHALMOLOGIST | Надежда Петровна      |        9-18 |    9-18 |  9-18 |    9-18 |    9-18 |         |             |
    | SURGEON         | Игорь Николаевич      |        9-12 |    9-12 |  9-12 |    9-12 |    9-12 |         |             |
    `;
};

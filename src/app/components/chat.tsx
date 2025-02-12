"use client";

import { useChat } from "ai/react";
import { ToolInvocation } from "ai";

export default function Chat() {
  const {
    error,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    messages,
    reload,
    stop,
  } = useChat({
    api: '/api/chat',
  });

  if (error) {
    console.error(error);
  }

  const formatToolInvocation = (toolInvocation: ToolInvocation) => {
    switch (toolInvocation.toolName) {
      case "appointment":
        if (toolInvocation.state === "result") {
          if (toolInvocation.result) {
            return "Вы записаны";
          }
          return "Не получилось записать";
        }
      default:
        return "not implemented";
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => {
        console.log(message)
        if (message.toolInvocations?.length) {
          return message.toolInvocations.map((toolInvocation, i) =>
            <div key={i}>[{formatToolInvocation(toolInvocation)}]</div>,
          );
        }
        return (
          <div key={message.id} className="whitespace-pre-wrap">
            {message.role === "user" ? "User: " : "Assistant: "}
            {message.content}
          </div>
        );
      })}

      {isLoading && (
        <div className="mt-4 text-gray-500">
          <div>Loading...</div>
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 border border-blue-500 rounded-md"
            onClick={stop}
          >
            Stop
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <div className="text-red-500">An error occurred.</div>
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 border border-blue-500 rounded-md"
            onClick={() => reload()}
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded-sm shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          disabled={isLoading || error != null}
        />
      </form>
    </div>
  );
}

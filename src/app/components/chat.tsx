"use client";

import { useChat } from "@ai-sdk/react";
import { ToolInvocationUIPart } from "@ai-sdk/ui-utils";

export default function Chat() {
  const {
    error,
    input,
    status,
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

  const formatToolInvocation = (part: ToolInvocationUIPart) => {
    switch (part.toolInvocation.toolName) {
      case "appointment":
        if (part.toolInvocation.state === "result") {
          if (part.toolInvocation.result) {
            return "Вы записаны";
          }
          return "Не получилось записать";
        }
        break
      default:
        return "Not implemented";
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => {
        const parts = message.parts.filter(part => part.type === "tool-invocation")
        if (parts.length) {
          return parts.map((part, i) =>
            <div key={i}>[{formatToolInvocation(part)}]</div>,
          );
        }
        return (
          <div key={message.id} className="whitespace-pre-wrap">
            {message.role === "user" ? "User: " : "Assistant: "}
            {message.content}
          </div>
        );
      })}

      {(status === "submitted" || status === "streaming") && (
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
          disabled={status === "submitted" || status === "streaming" || error != null}
        />
      </form>
    </div>
  );
}

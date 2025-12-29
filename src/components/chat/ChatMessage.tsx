"use client";

import { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
  onApplyContent?: (content: string) => void;
}

export default function ChatMessage({ message, onApplyContent }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Extract text content from message parts
  const getTextContent = (): string => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { type: "text"; text: string }).text)
      .join("");
  };

  // Parse suggested content from assistant messages
  const parseSuggestedContent = (text: string) => {
    const regex = /<suggested_content>([\s\S]*?)<\/suggested_content>/g;
    const parts: { type: "text" | "suggestion"; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the suggestion
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      // Add the suggestion
      parts.push({ type: "suggestion", content: match[1].trim() });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: "text" as const, content: text }];
  };

  const textContent = getTextContent();
  const parts = isUser ? [{ type: "text" as const, content: textContent }] : parseSuggestedContent(textContent);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
        }`}
      >
        {parts.map((part, index) => (
          <div key={index}>
            {part.type === "text" ? (
              <p className="whitespace-pre-wrap">{part.content}</p>
            ) : (
              <div className="my-2 rounded border border-green-300 bg-green-50 p-2 dark:border-green-700 dark:bg-green-900/30">
                <p className="mb-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {part.content}
                </p>
                {onApplyContent && (
                  <button
                    onClick={() => onApplyContent(part.content)}
                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Apply This
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

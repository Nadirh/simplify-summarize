"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, FormEvent, useMemo, ReactNode } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface ContentChatProps {
  contentId: string;
  contentType: "simplify" | "summarize";
  currentContent: string;
  originalContent: string;
  onApplyContent: (content: string) => void;
  children: ReactNode; // The textarea and unsaved changes message
}

export default function ContentChat({
  contentId,
  contentType,
  currentContent,
  originalContent,
  onApplyContent,
  children,
}: ContentChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isContentCollapsed, setIsContentCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Create transport with body data
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          contentType,
          currentContent,
          originalContent,
        },
      }),
    [contentType, currentContent, originalContent]
  );

  const { messages, sendMessage, status } = useChat({
    id: contentId, // Unique ID per content section for session persistence
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll within chat container when new messages arrive (without scrolling the page)
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage({ text: message });
  };

  // Chat panel component
  const chatPanel = (
    <div className="flex h-full flex-col rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          {/* Toggle content visibility button */}
          <button
            onClick={() => setIsContentCollapsed(!isContentCollapsed)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title={isContentCollapsed ? "Show content" : "Hide content"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isContentCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            AI Chat
          </span>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setIsContentCollapsed(false);
          }}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          title="Close chat"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Input - at top */}
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-700">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Ask AI to modify the content.<br />
            Try: &quot;Make it shorter&quot;
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onApplyContent={message.role === "assistant" ? onApplyContent : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

    </div>
  );

  return (
    <div>
      {/* Side-by-side layout when chat is open */}
      {isOpen ? (
        <div className="flex gap-4">
          {/* Left: Content textarea - collapsible */}
          <div className={`transition-all duration-300 ${isContentCollapsed ? "w-0 overflow-hidden opacity-0" : "w-1/2 min-w-0"}`}>
            {children}
          </div>
          {/* Right: Chat panel - expands when content is collapsed */}
          <div className={`transition-all duration-300 ${isContentCollapsed ? "flex-1" : "w-1/2"}`}>
            {chatPanel}
          </div>
        </div>
      ) : (
        <>
          {/* Stacked layout when chat is closed */}
          {children}
          <button
            onClick={() => setIsOpen(true)}
            className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat with AI to refine this content
          </button>
        </>
      )}
    </div>
  );
}

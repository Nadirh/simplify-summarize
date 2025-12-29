# Conversational AI Chat Feature - Implementation Plan

## Overview
Add a chat interface to each content section (Simplify/Summarize) in the QA Dashboard, allowing corporate users to iterate on AI-generated content through conversation.

## Requirements (from user feedback)
- Chat interface per content section (not per page)
- Session-only persistence (no database storage)
- AI can directly apply content changes to textarea
- User can still manually edit the textarea anytime

## Architecture

### New Files
- [ ] `src/components/chat/ContentChat.tsx` - Main chat container with useChat hook
- [ ] `src/components/chat/ChatMessage.tsx` - Individual message component with content suggestion handling
- [ ] `src/components/chat/ChatInput.tsx` - Input field with send button
- [ ] `src/app/api/chat/route.ts` - Streaming chat endpoint using Vercel AI SDK

### Modified Files
- [ ] `src/app/dashboard/DashboardClient.tsx` - Integrate chat toggle and pass editedContent handlers

## Technical Approach

### Chat API (`/api/chat/route.ts`)
```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

// System prompt includes:
// - Current content (simplified/summarized)
// - Original page content for reference
// - Instructions to wrap suggested changes in <suggested_content> tags

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  messages,
  temperature: 0.3,
});
return result.toDataStreamResponse();
```

### ContentChat Component
```typescript
// Uses useChat from "ai/react" for:
// - Automatic message state management
// - Streaming response handling
// - Conversation memory within session

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/chat",
  body: {
    contentType: type,           // "simplify" or "summarize"
    currentContent: content,      // Current textarea value
    originalContent: pageContent, // Original page content
  },
});
```

### Content Suggestion Flow
1. User asks AI to modify content (e.g., "Make it shorter")
2. AI responds with explanation + `<suggested_content>New content here</suggested_content>`
3. ChatMessage component parses tags and shows "Apply" button
4. Clicking "Apply" calls `onApplyContent(extractedContent)`
5. DashboardClient updates `editedContent[contentId]` state
6. Textarea reflects change immediately
7. User can manually edit further or continue chatting

## UI Design

### Chat Toggle
- Small "Chat with AI" button below each content textarea
- Expands to show chat interface inline

### Chat Interface
- Compact message list (max-height with scroll)
- Input field with send button
- Suggested content blocks have distinct styling + Apply button

## Implementation Order
1. Create API endpoint with streaming
2. Build ChatMessage component with suggestion parsing
3. Build ChatInput component
4. Build ContentChat container with useChat
5. Integrate into DashboardClient
6. Test full flow

## Dependencies
Already installed:
- `ai` v6.0.3 (Vercel AI SDK)
- `@ai-sdk/anthropic` v3.0.1

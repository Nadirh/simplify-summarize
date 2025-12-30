import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, UIMessage } from "ai";

export async function POST(request: Request) {
  // Verify authentication
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: uiMessages, contentType, currentContent, originalContent } = await request.json();

  // Convert UIMessage format to model messages format
  const messages = await convertToModelMessages(uiMessages as UIMessage[]);

  const systemPrompt = `You are an AI assistant helping refine ${contentType === "simplify" ? "simplified" : "summarized"} content.

ORIGINAL PAGE CONTENT:
${originalContent}

CURRENT ${contentType.toUpperCase()} VERSION:
${currentContent}

CRITICAL INSTRUCTIONS:
- When the user asks for changes, respond ONLY with the revised content wrapped in <suggested_content> tags
- Do NOT include any preamble, explanation, or commentary before the suggested content
- Do NOT include any postamble or explanation after the suggested content
- ONLY output the tags and the content inside them, nothing else

Example of correct response format:
<suggested_content>
Your revised content here.
</suggested_content>

${contentType === "simplify" ? "For simplified content: Use clear, accessible language suitable for all reading levels." : "For summarized content: Be concise while capturing the key points."}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    temperature: 0.3,
  });

  return result.toUIMessageStreamResponse();
}

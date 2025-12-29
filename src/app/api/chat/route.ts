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

  const systemPrompt = `You are an AI assistant helping a corporate user refine ${contentType === "simplify" ? "simplified" : "summarized"} content for their website.

CONTEXT:
- The user is reviewing AI-generated ${contentType === "simplify" ? "simplified" : "summarized"} content
- They can ask you to modify, improve, or adjust the content
- Your goal is to help them create the best possible ${contentType === "simplify" ? "simplified" : "summarized"} version

ORIGINAL PAGE CONTENT:
${originalContent}

CURRENT ${contentType.toUpperCase()} VERSION:
${currentContent}

INSTRUCTIONS:
1. When the user asks for changes, provide a brief explanation of what you're changing and why
2. When suggesting new content, wrap it in <suggested_content> tags like this:
   <suggested_content>
   Your suggested content here
   </suggested_content>
3. The user can apply your suggestion with one click, or continue iterating
4. Keep responses concise and focused on the content improvement
5. ${contentType === "simplify" ? "For simplified content: Use clear, accessible language suitable for all reading levels" : "For summarized content: Be concise while capturing the key points"}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    temperature: 0.3,
  });

  return result.toUIMessageStreamResponse();
}

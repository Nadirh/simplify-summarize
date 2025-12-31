import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { supabaseAdmin } from "../db/supabase";

export type ProcessType = "simplify" | "summarize";

interface ProcessResult {
  success: boolean;
  content?: string;
  error?: string;
}

const SIMPLIFY_PROMPT = `You are an expert at making complex content accessible to everyone.
Your task is to simplify the following webpage content so that it can be easily understood by:
- People with cognitive disabilities
- Non-native speakers
- People who are unfamiliar with the subject matter

Guidelines:
- Use simple, everyday words (avoid jargon and technical terms)
- Use short sentences (aim for 15 words or fewer per sentence)
- Use active voice instead of passive voice
- Break complex ideas into smaller, digestible pieces
- Provide brief examples where they help explain a concept more clearly
- Maintain the essential meaning and key information
- Keep the same general structure and flow

Format requirements:
- Output as HTML with proper paragraph tags (<p>...</p>)
- Use <strong> for important terms or headings within text
- Use <br> for line breaks within a paragraph if needed
- Group related sentences into paragraphs
- Do NOT use headings (h1, h2, etc.), lists, or other HTML elements

Return ONLY the HTML-formatted simplified content, no explanations or preamble.`;

const SUMMARIZE_PROMPT = `You are an expert at summarizing content clearly and concisely.
Your task is to create a summary of the following webpage content.

Guidelines:
- Capture the main points and key information
- Keep the summary to 3-5 paragraphs maximum
- Use clear, straightforward language
- Maintain the logical flow of ideas
- Include any important details, numbers, or facts
- Do not add any information that wasn't in the original

Format requirements:
- Output as HTML with proper paragraph tags (<p>...</p>)
- Use <strong> for important terms or headings within text
- Use <br> for line breaks within a paragraph if needed
- Group related sentences into paragraphs
- Do NOT use headings (h1, h2, etc.), lists, or other HTML elements

Return ONLY the HTML-formatted summary, no explanations or preamble.`;

/**
 * Process content with Anthropic (simplify or summarize)
 */
async function processWithAI(content: string, type: ProcessType): Promise<ProcessResult> {
  const prompt = type === "simplify" ? SIMPLIFY_PROMPT : SUMMARIZE_PROMPT;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: prompt,
      prompt: `Here is the webpage content to ${type}:\n\n${content}`,
    });

    return { success: true, content: text };
  } catch (error) {
    console.error(`Error processing content (${type}):`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Process a single page - generate both simplified and summarized versions
 */
export async function processPage(pageId: string): Promise<{
  success: boolean;
  simplified?: boolean;
  summarized?: boolean;
  error?: string;
}> {
  console.log(`Processing page: ${pageId}`);

  // Get the page
  const { data: page, error: pageError } = await supabaseAdmin
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    console.error(`Page not found: ${pageId}`, pageError);
    return { success: false, error: "Page not found" };
  }

  if (!page.raw_content) {
    console.error(`Page has no content: ${pageId}`);
    return { success: false, error: "Page has no content" };
  }

  console.log(`Page content length: ${page.raw_content.length} chars`);

  // Update status to processing
  const { error: updateError } = await supabaseAdmin
    .from("pages")
    .update({ status: "processing" })
    .eq("id", pageId);

  if (updateError) {
    console.error(`Failed to update status to processing:`, updateError);
  }

  let simplified = false;
  let summarized = false;

  // Generate simplified version
  console.log(`Calling Anthropic for simplify...`);
  const simplifyResult = await processWithAI(page.raw_content, "simplify");
  console.log(`Simplify result: success=${simplifyResult.success}, error=${simplifyResult.error}`);

  if (simplifyResult.success && simplifyResult.content) {
    const { error } = await supabaseAdmin.from("processed_content").upsert(
      {
        page_id: pageId,
        type: "simplify",
        content: simplifyResult.content,
        approved: false,
      },
      { onConflict: "page_id,type" }
    );
    if (error) console.error(`Failed to save simplified content:`, error);
    simplified = !error;
  }

  // Generate summarized version
  console.log(`Calling Anthropic for summarize...`);
  const summarizeResult = await processWithAI(page.raw_content, "summarize");
  console.log(`Summarize result: success=${summarizeResult.success}, error=${summarizeResult.error}`);

  if (summarizeResult.success && summarizeResult.content) {
    const { error } = await supabaseAdmin.from("processed_content").upsert(
      {
        page_id: pageId,
        type: "summarize",
        content: summarizeResult.content,
        approved: false,
      },
      { onConflict: "page_id,type" }
    );
    if (error) console.error(`Failed to save summarized content:`, error);
    summarized = !error;
  }

  // Update page status
  const finalStatus = simplified && summarized ? "completed" : "failed";
  console.log(`Updating page status to: ${finalStatus}`);
  await supabaseAdmin
    .from("pages")
    .update({ status: finalStatus })
    .eq("id", pageId);

  return { success: simplified || summarized, simplified, summarized };
}

/**
 * Process all pending pages for a customer
 */
export async function processAllPendingPages(customerId: string): Promise<{
  processed: number;
  failed: number;
}> {
  console.log(`Processing all pending pages for customer: ${customerId}`);

  // Get all pending pages
  const { data: pages, error } = await supabaseAdmin
    .from("pages")
    .select("id")
    .eq("customer_id", customerId)
    .eq("status", "pending");

  if (error) {
    console.error(`Error fetching pending pages:`, error);
    return { processed: 0, failed: 0 };
  }

  if (!pages || pages.length === 0) {
    console.log(`No pending pages found`);
    return { processed: 0, failed: 0 };
  }

  console.log(`Found ${pages.length} pending pages to process`);

  let processed = 0;
  let failed = 0;

  for (const page of pages) {
    const result = await processPage(page.id);
    if (result.success) {
      processed++;
    } else {
      failed++;
    }
  }

  console.log(`Processing complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

/**
 * Get processed content for a page
 */
export async function getProcessedContent(
  pageId: string,
  type: ProcessType
): Promise<{ content: string | null; approved: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("processed_content")
    .select("content, approved")
    .eq("page_id", pageId)
    .eq("type", type)
    .single();

  if (error || !data) {
    return { content: null, approved: false };
  }

  return { content: data.content, approved: data.approved };
}

/**
 * Approve or reject processed content
 */
export async function setContentApproval(
  contentId: string,
  approved: boolean
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("processed_content")
    .update({ approved })
    .eq("id", contentId);

  return !error;
}

/**
 * Update processed content (for manual edits)
 */
export async function updateProcessedContent(
  contentId: string,
  content: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("processed_content")
    .update({ content })
    .eq("id", contentId);

  return !error;
}

/**
 * Content health queries
 * Shows operational metrics: pages without content, stale content
 */

import { supabaseAdmin } from "./supabase";

export interface PageWithoutContent {
  url: string;
  title: string | null;
  missingSimplify: boolean;
  missingSummarize: boolean;
}

export interface ContentFreshness {
  url: string;
  title: string | null;
  simplifyAge: number | null;
  summarizeAge: number | null;
  isStale: boolean;
}

const STALE_DAYS = 30; // Content older than 30 days is considered stale

/**
 * Get pages that are missing approved content
 */
export async function getPagesWithoutContent(
  customerId: string
): Promise<PageWithoutContent[]> {
  // Get all pages for this customer
  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("pages")
    .select("id, url, title")
    .eq("customer_id", customerId)
    .eq("status", "completed");

  if (pagesError || !pages) {
    console.error("Pages query error:", pagesError);
    return [];
  }

  if (pages.length === 0) {
    return [];
  }

  // Get all approved content for these pages
  const pageIds = pages.map((p) => p.id);
  const { data: content, error: contentError } = await supabaseAdmin
    .from("processed_content")
    .select("page_id, type")
    .in("page_id", pageIds)
    .eq("approved", true);

  if (contentError) {
    console.error("Content query error:", contentError);
    return [];
  }

  // Build a map of page_id -> { hasSimplify, hasSummarize }
  const contentMap = new Map<string, { simplify: boolean; summarize: boolean }>();
  content?.forEach((c) => {
    if (!contentMap.has(c.page_id)) {
      contentMap.set(c.page_id, { simplify: false, summarize: false });
    }
    const entry = contentMap.get(c.page_id)!;
    if (c.type === "simplify") entry.simplify = true;
    if (c.type === "summarize") entry.summarize = true;
  });

  // Find pages missing content
  const result: PageWithoutContent[] = [];
  pages.forEach((page) => {
    const contentStatus = contentMap.get(page.id) || { simplify: false, summarize: false };
    if (!contentStatus.simplify || !contentStatus.summarize) {
      result.push({
        url: page.url,
        title: page.title,
        missingSimplify: !contentStatus.simplify,
        missingSummarize: !contentStatus.summarize,
      });
    }
  });

  return result;
}

/**
 * Get content freshness information
 */
export async function getContentFreshness(
  customerId: string
): Promise<ContentFreshness[]> {
  // Get all pages with their processed content
  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("pages")
    .select(`
      id,
      url,
      title,
      processed_content (
        type,
        updated_at,
        approved
      )
    `)
    .eq("customer_id", customerId)
    .eq("status", "completed");

  if (pagesError || !pages) {
    console.error("Pages query error:", pagesError);
    return [];
  }

  const now = new Date();
  const result: ContentFreshness[] = [];

  pages.forEach((page) => {
    const content = page.processed_content as Array<{
      type: string;
      updated_at: string;
      approved: boolean;
    }> || [];

    const simplifyContent = content.find((c) => c.type === "simplify" && c.approved);
    const summarizeContent = content.find((c) => c.type === "summarize" && c.approved);

    const simplifyAge = simplifyContent
      ? Math.floor((now.getTime() - new Date(simplifyContent.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const summarizeAge = summarizeContent
      ? Math.floor((now.getTime() - new Date(summarizeContent.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // A page is stale if any approved content is older than STALE_DAYS
    const isStale =
      (simplifyAge !== null && simplifyAge >= STALE_DAYS) ||
      (summarizeAge !== null && summarizeAge >= STALE_DAYS);

    // Only include pages that have at least some content
    if (simplifyAge !== null || summarizeAge !== null) {
      result.push({
        url: page.url,
        title: page.title,
        simplifyAge,
        summarizeAge,
        isStale,
      });
    }
  });

  // Sort by staleness (stale first), then by oldest content
  return result.sort((a, b) => {
    if (a.isStale && !b.isStale) return -1;
    if (!a.isStale && b.isStale) return 1;
    const aMaxAge = Math.max(a.simplifyAge || 0, a.summarizeAge || 0);
    const bMaxAge = Math.max(b.simplifyAge || 0, b.summarizeAge || 0);
    return bMaxAge - aMaxAge;
  });
}

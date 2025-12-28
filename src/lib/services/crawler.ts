import * as cheerio from "cheerio";
import { supabaseAdmin, Page } from "../db/supabase";

export interface CrawlResult {
  url: string;
  title: string | null;
  content: string;
  links: string[];
}

export interface CrawlOptions {
  maxPages?: number;
  delayMs?: number;
}

export const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxPages: 5,
  delayMs: 1000, // Be polite to servers
};

/**
 * Extract the main content from HTML, removing navigation, scripts, etc.
 */
function extractContent(html: string, $: cheerio.CheerioAPI): string {
  // Remove non-content elements
  $("script, style, nav, header, footer, aside, iframe, noscript").remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $(".nav, .navbar, .header, .footer, .sidebar, .menu, .advertisement").remove();

  // Try to find main content area
  let content = "";
  const mainSelectors = ["main", "article", '[role="main"]', ".content", ".main-content", "#content", "#main"];

  for (const selector of mainSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element.text();
      break;
    }
  }

  // Fallback to body if no main content found
  if (!content) {
    content = $("body").text();
  }

  // Clean up whitespace
  return content.replace(/\s+/g, " ").trim();
}

/**
 * Extract all internal links from a page
 */
function extractLinks(html: string, baseUrl: URL, $: cheerio.CheerioAPI): string[] {
  const links: Set<string> = new Set();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(href, baseUrl.origin);

      // Only include same-domain links
      if (absoluteUrl.hostname !== baseUrl.hostname) return;

      // Skip non-http(s) links, anchors, common non-page extensions
      if (!absoluteUrl.protocol.startsWith("http")) return;
      if (absoluteUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|xml|json|zip|mp4|mp3)$/i)) return;

      // Remove hash and normalize
      absoluteUrl.hash = "";
      const normalizedUrl = absoluteUrl.toString().replace(/\/$/, "");

      links.add(normalizedUrl);
    } catch {
      // Invalid URL, skip
    }
  });

  return Array.from(links);
}

/**
 * Fetch a single page and extract its content and links
 */
async function fetchPage(url: string): Promise<CrawlResult | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SimplifySummarize/1.0 (Content Accessibility Bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const baseUrl = new URL(url);

    const title = $("title").text().trim() || $("h1").first().text().trim() || null;
    const content = extractContent(html, $);
    const links = extractLinks(html, baseUrl, $);

    return { url, title, content, links };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Crawl a website starting from the homepage
 */
export async function crawlWebsite(
  customerId: string,
  homepageUrl: string,
  options: CrawlOptions = {}
): Promise<{ pagesFound: number; pagesCrawled: number }> {
  const opts = { ...DEFAULT_CRAWL_OPTIONS, ...options };
  const baseUrl = new URL(homepageUrl);

  // Track visited and queued URLs
  const visited: Set<string> = new Set();
  const queue: string[] = [homepageUrl.replace(/\/$/, "")];

  let pagesCrawled = 0;

  while (queue.length > 0 && pagesCrawled < opts.maxPages!) {
    const url = queue.shift()!;

    // Skip if already visited
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`Crawling (${pagesCrawled + 1}/${opts.maxPages}): ${url}`);

    // Fetch the page
    const result = await fetchPage(url);

    if (result && result.content.length > 100) {
      // Store in database
      const { error } = await supabaseAdmin.from("pages").upsert(
        {
          customer_id: customerId,
          url: result.url,
          title: result.title,
          raw_content: result.content,
          status: "pending",
        },
        { onConflict: "customer_id,url" }
      );

      if (error) {
        console.error(`Error storing page ${url}:`, error);
      } else {
        pagesCrawled++;
      }

      // Add new links to queue
      for (const link of result.links) {
        if (!visited.has(link) && !queue.includes(link)) {
          // Only add links from same domain
          try {
            const linkUrl = new URL(link);
            if (linkUrl.hostname === baseUrl.hostname) {
              queue.push(link);
            }
          } catch {
            // Invalid URL
          }
        }
      }
    }

    // Be polite - wait between requests
    if (queue.length > 0) {
      await delay(opts.delayMs!);
    }
  }

  return {
    pagesFound: visited.size,
    pagesCrawled,
  };
}

/**
 * Add a single URL manually (for pages the crawler missed)
 */
export async function addSinglePage(
  customerId: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  const result = await fetchPage(url);

  if (!result) {
    return { success: false, error: "Failed to fetch page" };
  }

  if (result.content.length < 100) {
    return { success: false, error: "Page has insufficient content" };
  }

  const { error } = await supabaseAdmin.from("pages").upsert(
    {
      customer_id: customerId,
      url: result.url,
      title: result.title,
      raw_content: result.content,
      status: "pending",
    },
    { onConflict: "customer_id,url" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all pages for a customer
 */
export async function getCustomerPages(customerId: string): Promise<Page[]> {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*, processed_content(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pages:", error);
    return [];
  }

  return data || [];
}

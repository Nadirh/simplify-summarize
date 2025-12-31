import DOMPurify from "dompurify";

// Configuration for allowed HTML in rich text content
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "strong", "em", "u", "mark", "span", "br"],
  ALLOWED_ATTR: ["style", "class"],
};

/**
 * Sanitize HTML content for safe rendering
 * Only allows basic formatting tags and style attributes
 */
export function sanitizeHtml(html: string): string {
  // DOMPurify requires a DOM environment
  if (typeof window === "undefined") {
    // Server-side: return as-is (will be sanitized client-side)
    return html;
  }
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

/**
 * Check if content contains HTML tags
 */
export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Convert plain text to HTML paragraphs (for backward compatibility)
 */
export function plainTextToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

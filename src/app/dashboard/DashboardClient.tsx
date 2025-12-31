"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { Customer, Page, ProcessedContent } from "@/lib/db/supabase";
import ContentChat from "@/components/chat/ContentChat";
import RichTextEditor from "@/components/editor/RichTextEditor";

interface PageWithContent extends Page {
  processed_content: ProcessedContent[];
}

interface DashboardClientProps {
  customer: Customer;
  initialPages: PageWithContent[];
}

export default function DashboardClient({ customer, initialPages }: DashboardClientProps) {
  const [pages, setPages] = useState<PageWithContent[]>(initialPages);
  const [selectedPage, setSelectedPage] = useState<PageWithContent | null>(null);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("https://your-domain.vercel.app");
  const [isPagesCollapsed, setIsPagesCollapsed] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const startCrawl = async () => {
    if (!crawlUrl) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: crawlUrl }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showMessage("success", `Crawled ${data.pagesCrawled} pages`);
      setCrawlUrl("");

      // Refresh pages
      const pagesRes = await fetch("/api/pages");
      const pagesData = await pagesRes.json();
      setPages(pagesData.pages || []);
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Crawl failed");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPages = async () => {
    const pagesRes = await fetch("/api/pages");
    const pagesData = await pagesRes.json();
    setPages(pagesData.pages || []);
    return pagesData.pages || [];
  };

  const processAllPages = async () => {
    setIsLoading(true);
    try {
      // Use AbortController with 2 minute timeout (dev server times out at ~100s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        showMessage("success", `Processed ${data.processed} pages`);
        await refreshPages();
        setSelectedPage(null);
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle timeout or JSON parse errors - processing may still be running
        const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
        const isJsonError = fetchError instanceof Error && fetchError.message.includes("JSON");

        if (isTimeout || isJsonError) {
          showMessage("success", "Processing in progress... checking status");

          // Poll for completion (check every 5 seconds, up to 3 minutes)
          let attempts = 0;
          const maxAttempts = 36;

          const pollStatus = async () => {
            attempts++;
            const pages = await refreshPages();
            // Check for pages still being processed (pending or processing status)
            const inProgressCount = pages.filter((p: Page) =>
              p.status === "pending" || p.status === "processing"
            ).length;

            if (inProgressCount === 0) {
              showMessage("success", "All pages processed successfully");
              setSelectedPage(null);
              setIsLoading(false);
            } else if (attempts < maxAttempts) {
              setTimeout(pollStatus, 5000);
            } else {
              showMessage("error", `${inProgressCount} pages still processing. Click again to continue.`);
              setIsLoading(false);
            }
          };

          setTimeout(pollStatus, 5000);
          return; // Don't set isLoading false yet - polling will handle it
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Processing failed");
    } finally {
      setIsLoading(false);
    }
  };

  const approveContent = async (contentId: string, approved: boolean) => {
    try {
      const updatedContent = editedContent[contentId];
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          approved,
          ...(updatedContent !== undefined && { content: updatedContent })
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Update local state
      setPages(pages.map(page => ({
        ...page,
        processed_content: page.processed_content.map(pc =>
          pc.id === contentId ? {
            ...pc,
            approved,
            ...(updatedContent !== undefined && { content: updatedContent })
          } : pc
        ),
      })));

      if (selectedPage) {
        setSelectedPage({
          ...selectedPage,
          processed_content: selectedPage.processed_content.map(pc =>
            pc.id === contentId ? {
              ...pc,
              approved,
              ...(updatedContent !== undefined && { content: updatedContent })
            } : pc
          ),
        });
      }

      // Clear edited content for this item after saving
      if (updatedContent !== undefined) {
        setEditedContent(prev => {
          const next = { ...prev };
          delete next[contentId];
          return next;
        });
      }

      showMessage("success", approved ? "Content approved and saved" : "Content rejected");
    } catch {
      showMessage("error", "Failed to update content");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-zinc-100 text-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              API Key: <code className="rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">{customer.api_key}</code>
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`mx-auto max-w-7xl px-4 pt-4`}>
          <div className={`rounded-lg p-4 ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Crawl Section */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Add Website
          </h2>
          <div className="flex gap-4">
            <input
              type="url"
              placeholder="https://example.com"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={startCrawl}
              disabled={isLoading || !crawlUrl}
              className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {isLoading ? "Crawling..." : "Crawl Website"}
            </button>
          </div>
        </div>

        {/* Pages Section */}
        <div className="flex gap-8">
          {/* Pages List - Collapsible */}
          <div className={`rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 ${isPagesCollapsed ? "w-12 flex-shrink-0" : "w-1/2 flex-shrink-0"}`}>
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              {!isPagesCollapsed && (
                <>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Pages ({pages.length})
                  </h2>
                  {pages.some(p => p.status === "pending") && (
                    <button
                      onClick={processAllPages}
                      disabled={isLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Process All Pending
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setIsPagesCollapsed(!isPagesCollapsed)}
                className={`text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 ${isPagesCollapsed ? "mx-auto" : "ml-2"}`}
                title={isPagesCollapsed ? "Expand pages" : "Collapse pages"}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPagesCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </button>
            </div>
            {!isPagesCollapsed && (
              <div className="max-h-[600px] overflow-y-auto">
                {pages.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    No pages yet. Crawl a website to get started.
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {pages.map((page) => (
                      <li
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        className={`cursor-pointer p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selectedPage?.id === page.id ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-white">
                              {page.title || "Untitled"}
                            </p>
                            <p className="truncate text-sm text-zinc-500">
                              {page.url}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(page.status)}`}>
                            {page.status}
                          </span>
                        </div>
                        {page.processed_content?.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {page.processed_content.map((pc) => (
                              <span
                                key={pc.id}
                                className={`rounded px-2 py-0.5 text-xs ${pc.approved ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}
                              >
                                {pc.type} {pc.approved ? "✓" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Content Review - Expands when Pages is collapsed */}
          <div className="flex-1 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Review Content
              </h2>
            </div>
            <div className="p-4">
              {!selectedPage ? (
                <div className="py-12 text-center text-zinc-500">
                  Select a page to review its content
                </div>
              ) : !selectedPage.processed_content?.length ? (
                <div className="py-12 text-center text-zinc-500">
                  No processed content yet. Click &quot;Process All Pending&quot; to generate.
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedPage.processed_content.map((pc) => (
                    <div key={pc.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                        <span className="font-medium capitalize text-zinc-900 dark:text-white">
                          {pc.type}
                        </span>
                        <div className="flex gap-2">
                          {pc.approved ? (
                            <button
                              onClick={() => approveContent(pc.id, false)}
                              className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                            >
                              Reject
                            </button>
                          ) : (
                            <button
                              onClick={() => approveContent(pc.id, true)}
                              className="rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <ContentChat
                          contentId={pc.id}
                          contentType={pc.type as "simplify" | "summarize"}
                          currentContent={editedContent[pc.id] !== undefined ? editedContent[pc.id] : pc.content}
                          originalContent={selectedPage.raw_content || ""}
                          onApplyContent={(content) => setEditedContent(prev => ({ ...prev, [pc.id]: content }))}
                        >
                          <RichTextEditor
                            content={editedContent[pc.id] !== undefined ? editedContent[pc.id] : pc.content}
                            onChange={(html) => setEditedContent(prev => ({ ...prev, [pc.id]: html }))}
                            className="min-h-[200px]"
                          />
                          {editedContent[pc.id] !== undefined && editedContent[pc.id] !== pc.content && (
                            <p className="mt-2 text-xs text-amber-600">Unsaved changes - click Approve or Reject to save</p>
                          )}
                        </ContentChat>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Widget Instructions */}
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Install Widget
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Add this script tag to your website to enable the Simplify & Summarize widget:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
            <code className="text-zinc-800 dark:text-zinc-200">
{`<script
  src="${origin}/widget.js"
  data-api-key="${customer.api_key}">
</script>`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

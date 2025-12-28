"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { Customer, Page, ProcessedContent } from "@/lib/db/supabase";

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

  const processAllPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showMessage("success", `Processed ${data.processed} pages`);

      // Refresh pages from API
      const pagesRes = await fetch("/api/pages");
      const pagesData = await pagesRes.json();
      setPages(pagesData.pages || []);
      setSelectedPage(null);
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
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pages List */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
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
            </div>
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
          </div>

          {/* Content Review */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
                        <textarea
                          value={editedContent[pc.id] !== undefined ? editedContent[pc.id] : pc.content}
                          onChange={(e) => setEditedContent(prev => ({ ...prev, [pc.id]: e.target.value }))}
                          className="min-h-[200px] w-full resize-y rounded border border-zinc-200 bg-white p-3 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        />
                        {editedContent[pc.id] !== undefined && editedContent[pc.id] !== pc.content && (
                          <p className="mt-2 text-xs text-amber-600">Unsaved changes - click Approve or Reject to save</p>
                        )}
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

"use client";

interface TopPagesTableProps {
  data: Array<{ url: string; clicks: number }>;
}

export default function TopPagesTable({ data }: TopPagesTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No page data available
      </div>
    );
  }

  // Extract path from URL for cleaner display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || "/";
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-2">
      {data.map((page, i) => (
        <div
          key={page.url}
          className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
              {i + 1}
            </span>
            <span
              className="truncate text-sm text-zinc-700 dark:text-zinc-300"
              title={page.url}
            >
              {formatUrl(page.url)}
            </span>
          </div>
          <span className="ml-2 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
            {page.clicks.toLocaleString()} clicks
          </span>
        </div>
      ))}
    </div>
  );
}

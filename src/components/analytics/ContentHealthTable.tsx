"use client";

interface PageWithoutContent {
  url: string;
  title: string | null;
  missingSimplify: boolean;
  missingSummarize: boolean;
}

interface ContentFreshness {
  url: string;
  title: string | null;
  simplifyAge: number | null;
  summarizeAge: number | null;
  isStale: boolean;
}

interface ContentHealthTableProps {
  pagesWithoutContent: PageWithoutContent[];
  contentFreshness: ContentFreshness[];
}

export default function ContentHealthTable({
  pagesWithoutContent,
  contentFreshness,
}: ContentHealthTableProps) {
  const stalePages = contentFreshness.filter((p) => p.isStale);
  const hasMissingContent = pagesWithoutContent.length > 0;
  const hasStaleContent = stalePages.length > 0;

  // Extract path from URL for cleaner display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || "/";
    } catch {
      return url;
    }
  };

  const formatAge = (days: number | null) => {
    if (days === null) return "-";
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  if (!hasMissingContent && !hasStaleContent) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 font-medium text-green-600">All content is healthy!</p>
          <p className="text-sm">No missing or stale content detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Missing Content Section */}
      {hasMissingContent && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
              !
            </span>
            Pages Missing Content ({pagesWithoutContent.length})
          </h4>
          <div className="space-y-2">
            {pagesWithoutContent.slice(0, 5).map((page) => (
              <div
                key={page.url}
                className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 dark:bg-yellow-900/10"
              >
                <div className="overflow-hidden">
                  <p
                    className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    title={page.url}
                  >
                    {formatUrl(page.url)}
                  </p>
                  {page.title && (
                    <p className="truncate text-xs text-zinc-500">{page.title}</p>
                  )}
                </div>
                <div className="ml-2 flex gap-1">
                  {page.missingSimplify && (
                    <span className="whitespace-nowrap rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                      No Simplify
                    </span>
                  )}
                  {page.missingSummarize && (
                    <span className="whitespace-nowrap rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                      No Summarize
                    </span>
                  )}
                </div>
              </div>
            ))}
            {pagesWithoutContent.length > 5 && (
              <p className="text-center text-xs text-zinc-500">
                +{pagesWithoutContent.length - 5} more pages
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stale Content Section */}
      {hasStaleContent && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Stale Content ({stalePages.length})
          </h4>
          <div className="space-y-2">
            {stalePages.slice(0, 5).map((page) => (
              <div
                key={page.url}
                className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/10"
              >
                <div className="overflow-hidden">
                  <p
                    className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    title={page.url}
                  >
                    {formatUrl(page.url)}
                  </p>
                  {page.title && (
                    <p className="truncate text-xs text-zinc-500">{page.title}</p>
                  )}
                </div>
                <div className="ml-2 flex gap-2 text-xs text-zinc-500">
                  {page.simplifyAge !== null && (
                    <span
                      className={
                        page.simplifyAge >= 30
                          ? "font-medium text-orange-600 dark:text-orange-400"
                          : ""
                      }
                    >
                      Simplify: {formatAge(page.simplifyAge)}
                    </span>
                  )}
                  {page.summarizeAge !== null && (
                    <span
                      className={
                        page.summarizeAge >= 30
                          ? "font-medium text-orange-600 dark:text-orange-400"
                          : ""
                      }
                    >
                      Summarize: {formatAge(page.summarizeAge)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {stalePages.length > 5 && (
              <p className="text-center text-xs text-zinc-500">
                +{stalePages.length - 5} more pages
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

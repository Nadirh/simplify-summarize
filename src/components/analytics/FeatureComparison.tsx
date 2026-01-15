"use client";

interface FeatureComparisonProps {
  data: {
    simplify: number;
    summarize: number;
  };
}

export default function FeatureComparison({ data }: FeatureComparisonProps) {
  const total = data.simplify + data.summarize;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  const simplifyPercent = Math.round((data.simplify / total) * 100);
  const summarizePercent = 100 - simplifyPercent;

  return (
    <div className="space-y-4">
      {/* Progress bars */}
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Simplify</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {data.simplify.toLocaleString()} ({simplifyPercent}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${simplifyPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Summarize</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {data.summarize.toLocaleString()} ({summarizePercent}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${summarizePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Total clicks</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

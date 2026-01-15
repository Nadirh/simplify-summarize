"use client";

interface ReturnVisitorStatsProps {
  data: {
    newVisitors: number;
    returnVisitors: number;
    returnRate: number;
  };
}

export default function ReturnVisitorStats({ data }: ReturnVisitorStatsProps) {
  const total = data.newVisitors + data.returnVisitors;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No visitor data available yet
      </div>
    );
  }

  const newPercent = total > 0 ? Math.round((data.newVisitors / total) * 100) : 0;
  const returnPercent = total > 0 ? Math.round((data.returnVisitors / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Visual bar */}
      <div className="h-8 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="flex h-full">
          {data.newVisitors > 0 && (
            <div
              className="flex h-full items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
              style={{ width: `${newPercent}%` }}
            >
              {newPercent > 10 && `${newPercent}%`}
            </div>
          )}
          {data.returnVisitors > 0 && (
            <div
              className="flex h-full items-center justify-center bg-blue-500 text-xs font-medium text-white transition-all"
              style={{ width: `${returnPercent}%` }}
            >
              {returnPercent > 10 && `${returnPercent}%`}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New Visitors</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {data.newVisitors.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Returning</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {data.returnVisitors.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Return rate highlight */}
      <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Return Rate</span>
          <span
            className={`text-lg font-bold ${
              data.returnRate >= 20
                ? "text-green-600 dark:text-green-400"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {data.returnRate}%
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {data.returnRate >= 20
            ? "Good! Users are coming back"
            : "Consider ways to increase engagement"}
        </p>
      </div>
    </div>
  );
}

"use client";

interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number }>;
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No peak hours data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  // Format hour for display (e.g., "12am", "3pm")
  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  return (
    <div className="space-y-4">
      {/* Bar chart */}
      <div className="flex h-32 items-end gap-1">
        {data.map((item) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div
              key={item.hour}
              className="group relative flex-1"
              title={`${formatHour(item.hour)}: ${item.count} clicks`}
            >
              <div
                className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                style={{ height: `${height}%`, minHeight: item.count > 0 ? "4px" : "0" }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour labels - show every 4 hours */}
      <div className="flex justify-between text-xs text-zinc-500">
        {[0, 4, 8, 12, 16, 20].map((hour) => (
          <span key={hour}>{formatHour(hour)}</span>
        ))}
      </div>

      {/* Summary */}
      {maxCount > 0 && (
        <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Peak hour:{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              {formatHour(data.reduce((a, b) => (b.count > a.count ? b : a)).hour)}
            </span>{" "}
            with{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              {maxCount.toLocaleString()}
            </span>{" "}
            clicks
          </p>
        </div>
      )}
    </div>
  );
}

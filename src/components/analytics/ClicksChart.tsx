"use client";

interface TimelineDataPoint {
  period: string;
  simplify_clicks: number;
  summarize_clicks: number;
  total_clicks: number;
  errors: number;
}

interface ClicksChartProps {
  data: TimelineDataPoint[];
}

export default function ClicksChart({ data }: ClicksChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No data available for this period
      </div>
    );
  }

  // Check if all data points have zero clicks
  const totalClicks = data.reduce((sum, d) => sum + d.total_clicks, 0);
  if (totalClicks === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No clicks recorded for this period
      </div>
    );
  }

  const maxClicks = Math.max(...data.map((d) => d.total_clicks), 1);

  const formatDate = (period: string) => {
    const date = new Date(period);
    // Check if hourly or daily based on whether time varies
    if (data.length > 1) {
      const d1 = new Date(data[0].period);
      const d2 = new Date(data[1].period);
      const diffHours = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 1) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="h-64">
      {/* Chart container */}
      <div className="flex h-full items-end gap-1">
        {data.map((point, i) => {
          const height = (point.total_clicks / maxClicks) * 100;
          const simplifyHeight = (point.simplify_clicks / maxClicks) * 100;
          const summarizeHeight = (point.summarize_clicks / maxClicks) * 100;

          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ minWidth: data.length === 1 ? '60px' : undefined, maxWidth: data.length === 1 ? '120px' : undefined }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded bg-zinc-800 px-2 py-1 text-xs text-white group-hover:block">
                <p className="font-medium">{formatDate(point.period)}</p>
                <p>Total: {point.total_clicks}</p>
                <p className="text-blue-300">Simplify: {point.simplify_clicks}</p>
                <p className="text-green-300">Summarize: {point.summarize_clicks}</p>
                {point.errors > 0 && <p className="text-red-300">Errors: {point.errors}</p>}
              </div>

              {/* Stacked bar */}
              <div
                className="flex w-full flex-col justify-end rounded-t"
                style={{ height: `${height}%`, minHeight: point.total_clicks > 0 ? '8px' : '0' }}
              >
                {/* Summarize portion (top) */}
                {point.summarize_clicks > 0 && (
                  <div
                    className="w-full rounded-t bg-green-500"
                    style={{ height: `${(point.summarize_clicks / point.total_clicks) * 100}%` }}
                  />
                )}
                {/* Simplify portion (bottom) */}
                {point.simplify_clicks > 0 && (
                  <div
                    className={`w-full bg-blue-500 ${point.summarize_clicks === 0 ? 'rounded-t' : ''}`}
                    style={{ height: `${(point.simplify_clicks / point.total_clicks) * 100}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1">
        {data.map((point, i) => (
          <div key={i} className="flex-1 text-center text-xs text-zinc-500">
            {i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)
              ? formatDate(point.period)
              : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500" />
          <span className="text-zinc-600 dark:text-zinc-400">Simplify</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500" />
          <span className="text-zinc-600 dark:text-zinc-400">Summarize</span>
        </div>
      </div>
    </div>
  );
}

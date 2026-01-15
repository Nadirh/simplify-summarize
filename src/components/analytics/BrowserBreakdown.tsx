"use client";

interface BrowserBreakdownProps {
  data: Array<{ browser: string; count: number }>;
}

// Browser icons/colors
const browserStyles: Record<string, { color: string; icon: string }> = {
  Chrome: { color: "bg-green-500", icon: "Ch" },
  Safari: { color: "bg-blue-500", icon: "Sa" },
  Firefox: { color: "bg-orange-500", icon: "Ff" },
  Edge: { color: "bg-cyan-500", icon: "Ed" },
  Opera: { color: "bg-red-500", icon: "Op" },
  Unknown: { color: "bg-zinc-500", icon: "?" },
};

export default function BrowserBreakdown({ data }: BrowserBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No browser data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const style = browserStyles[item.browser] || browserStyles.Unknown;
        const percent = Math.round((item.count / total) * 100);

        return (
          <div key={item.browser} className="flex items-center gap-3">
            {/* Rank */}
            <span className="w-5 text-sm text-zinc-400">{i + 1}</span>

            {/* Browser icon */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${style.color}`}
            >
              {style.icon}
            </div>

            {/* Browser info */}
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {item.browser}
                </span>
                <span className="text-zinc-500">
                  {item.count.toLocaleString()} ({percent}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full ${style.color} transition-all duration-500`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

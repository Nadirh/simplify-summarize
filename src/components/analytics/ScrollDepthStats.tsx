"use client";

interface ScrollDepthStatsProps {
  data: {
    avgScrollDepth: number;
    fullyRead: number;
    partialRead: number;
    noScroll: number;
  };
}

export default function ScrollDepthStats({ data }: ScrollDepthStatsProps) {
  const total = data.fullyRead + data.partialRead + data.noScroll;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No scroll data available yet. Users need to scroll and close the panel.
      </div>
    );
  }

  const segments = [
    {
      label: "Fully Read (90%+)",
      value: data.fullyRead,
      color: "bg-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Partial Read (25-89%)",
      value: data.partialRead,
      color: "bg-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "No Scroll (<25%)",
      value: data.noScroll,
      color: "bg-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Average scroll depth gauge */}
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              className="text-zinc-200 dark:text-zinc-700"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Progress circle */}
            <path
              className="text-blue-500"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${data.avgScrollDepth}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {data.avgScrollDepth}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Average Scroll Depth</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {data.avgScrollDepth >= 70
              ? "Great engagement!"
              : data.avgScrollDepth >= 40
                ? "Moderate engagement"
                : "Users may not be reading content"}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div
              key={segment.label}
              className={`rounded-lg p-2 text-center ${segment.bgColor}`}
            >
              <div
                className={`mx-auto mb-1 w-fit ${segment.color.replace("bg-", "text-")}`}
              >
                {segment.icon}
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{percent}%</p>
              <p className="text-xs text-zinc-500">{segment.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

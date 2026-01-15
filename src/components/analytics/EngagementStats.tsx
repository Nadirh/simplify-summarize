"use client";

interface EngagementStatsProps {
  data: {
    avgReadingTime: number;
    bounceRate: number;
    totalSessions: number;
  };
}

export default function EngagementStats({ data }: EngagementStatsProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const stats = [
    {
      label: "Avg. Reading Time",
      value: formatTime(data.avgReadingTime),
      description: "Time users spend viewing content",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Bounce Rate",
      value: `${data.bounceRate}%`,
      description: "Sessions < 3 seconds",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: data.bounceRate > 50 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
      bgColor: data.bounceRate > 50 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Total Sessions",
      value: data.totalSessions.toLocaleString(),
      description: "Panel views with duration",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  if (data.totalSessions === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No engagement data yet. Users need to open and close the widget panel.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}

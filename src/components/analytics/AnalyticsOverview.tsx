"use client";

interface AnalyticsOverviewProps {
  data: {
    totalClicks: number;
    simplifyClicks: number;
    summarizeClicks: number;
    errorCount: number;
    errorRate: number;
    uniquePages: number;
  };
}

export default function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  const stats = [
    {
      label: "Total Clicks",
      value: data.totalClicks.toLocaleString(),
      color: "text-zinc-900 dark:text-white",
    },
    {
      label: "Simplify Clicks",
      value: data.simplifyClicks.toLocaleString(),
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Summarize Clicks",
      value: data.summarizeClicks.toLocaleString(),
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Unique Pages",
      value: data.uniquePages.toLocaleString(),
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Errors",
      value: data.errorCount.toLocaleString(),
      color: data.errorCount > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400",
    },
    {
      label: "Error Rate",
      value: `${data.errorRate}%`,
      color: data.errorRate > 5 ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

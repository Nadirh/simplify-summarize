"use client";

interface BothFeaturesUsageProps {
  data: {
    simplifyOnly: number;
    summarizeOnly: number;
    bothFeatures: number;
  };
}

export default function BothFeaturesUsage({ data }: BothFeaturesUsageProps) {
  const total = data.simplifyOnly + data.summarizeOnly + data.bothFeatures;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No session data available yet
      </div>
    );
  }

  const segments = [
    {
      label: "Simplify Only",
      value: data.simplifyOnly,
      color: "bg-violet-500",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Both Features",
      value: data.bothFeatures,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Summarize Only",
      value: data.summarizeOnly,
      color: "bg-cyan-500",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  const maxValue = Math.max(...segments.map((s) => s.value));

  return (
    <div className="space-y-4">
      {/* Horizontal bar comparison */}
      <div className="space-y-3">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          const barWidth = maxValue > 0 ? (segment.value / maxValue) * 100 : 0;

          return (
            <div key={segment.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {segment.label}
                </span>
                <span className={segment.textColor}>
                  {segment.value.toLocaleString()} ({percent}%)
                </span>
              </div>
              <div className="h-6 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full ${segment.color} transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {data.bothFeatures > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">{data.bothFeatures}</span> sessions used both features -{" "}
            {Math.round((data.bothFeatures / total) * 100)}% cross-feature adoption!
          </p>
        </div>
      )}

      {/* Total sessions */}
      <div className="text-center text-sm text-zinc-500">
        {total.toLocaleString()} total sessions tracked
      </div>
    </div>
  );
}

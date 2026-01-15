"use client";

interface ScreenReaderStatsProps {
  data: {
    detected: number;
    notDetected: number;
    detectionRate: number;
  };
}

export default function ScreenReaderStats({ data }: ScreenReaderStatsProps) {
  const total = data.detected + data.notDetected;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No accessibility data available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stat */}
      <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-800/50">
            <svg
              className="h-6 w-6 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Accessibility Features Detected
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.detectionRate}%
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-zinc-900 dark:text-white">
            <span className="font-medium">{data.detected}</span> sessions
          </p>
          <p className="text-zinc-500">of {total} total</p>
        </div>
      </div>

      {/* Visual bar */}
      <div className="h-4 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        {data.detected > 0 && (
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${(data.detected / total) * 100}%` }}
          />
        )}
      </div>

      {/* Info note */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong>Detection signals:</strong> Prefers reduced motion, forced colors mode, or
          keyboard-only navigation. This is an estimate - not all assistive technology users are
          detectable.
        </p>
      </div>

      {/* Insight */}
      {data.detected > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {data.detectionRate >= 5
            ? "Your widget has meaningful accessibility usage. Consider prioritizing accessibility improvements."
            : "Some users are using accessibility features. Keep your widget accessible!"}
        </p>
      )}
    </div>
  );
}

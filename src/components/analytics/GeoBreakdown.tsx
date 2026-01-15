"use client";

interface GeoBreakdownProps {
  data: Array<{ country: string; name: string; count: number }>;
}

export default function GeoBreakdown({ data }: GeoBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No geographic data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.country} className="flex items-center gap-3">
          {/* Rank */}
          <span className="w-5 text-sm text-zinc-400">{i + 1}</span>

          {/* Country info */}
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{item.name}</span>
              <span className="text-zinc-500">{item.count.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

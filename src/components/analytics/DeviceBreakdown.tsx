"use client";

interface DeviceBreakdownProps {
  data: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

export default function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  const total = data.desktop + data.mobile + data.tablet;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  const devices = [
    {
      name: "Desktop",
      value: data.desktop,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Mobile",
      value: data.mobile,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Tablet",
      value: data.tablet,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal bar */}
      <div className="flex h-4 overflow-hidden rounded-full">
        {devices.map((device) => {
          const percent = (device.value / total) * 100;
          if (percent === 0) return null;
          return (
            <div
              key={device.name}
              className={`${device.color} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {devices.map((device) => {
          const percent = Math.round((device.value / total) * 100);
          return (
            <div key={device.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${device.color}`} />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {device.name}
                </span>
              </div>
              <span className={`text-sm font-medium ${device.textColor}`}>
                {device.value.toLocaleString()} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

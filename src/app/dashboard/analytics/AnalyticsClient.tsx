"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import ClicksChart from "@/components/analytics/ClicksChart";
import TopPagesTable from "@/components/analytics/TopPagesTable";
import GeoBreakdown from "@/components/analytics/GeoBreakdown";
import DeviceBreakdown from "@/components/analytics/DeviceBreakdown";
import FeatureComparison from "@/components/analytics/FeatureComparison";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import EngagementStats from "@/components/analytics/EngagementStats";
import BrowserBreakdown from "@/components/analytics/BrowserBreakdown";
import ContentHealthTable from "@/components/analytics/ContentHealthTable";
import PeakHoursChart from "@/components/analytics/PeakHoursChart";
import ReturnVisitorStats from "@/components/analytics/ReturnVisitorStats";
import BothFeaturesUsage from "@/components/analytics/BothFeaturesUsage";
import ScrollDepthStats from "@/components/analytics/ScrollDepthStats";
import ScreenReaderStats from "@/components/analytics/ScreenReaderStats";

interface AnalyticsClientProps {
  customerId: string;
}

type DateRange = "7d" | "30d" | "90d";

interface AnalyticsData {
  overview: {
    totalClicks: number;
    simplifyClicks: number;
    summarizeClicks: number;
    errorCount: number;
    errorRate: number;
    uniquePages: number;
  };
  timeline: Array<{
    period: string;
    simplify_clicks: number;
    summarize_clicks: number;
    total_clicks: number;
    errors: number;
  }>;
  featureBreakdown: { simplify: number; summarize: number };
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  geoBreakdown: Array<{ country: string; name: string; count: number }>;
  topPages: Array<{ url: string; clicks: number }>;
  engagement: {
    avgReadingTime: number;
    bounceRate: number;
    totalSessions: number;
  };
  browserBreakdown: Array<{ browser: string; count: number }>;
  contentHealth: {
    pagesWithoutContent: Array<{
      url: string;
      title: string | null;
      missingSimplify: boolean;
      missingSummarize: boolean;
    }>;
    contentFreshness: Array<{
      url: string;
      title: string | null;
      simplifyAge: number | null;
      summarizeAge: number | null;
      isStale: boolean;
    }>;
  };
  peakHours: Array<{ hour: number; count: number }>;
  returnVisitorStats: {
    newVisitors: number;
    returnVisitors: number;
    returnRate: number;
  };
  bothFeaturesUsage: {
    simplifyOnly: number;
    summarizeOnly: number;
    bothFeatures: number;
  };
  scrollDepthStats: {
    avgScrollDepth: number;
    fullyRead: number;
    partialRead: number;
    noScroll: number;
  };
  screenReaderUsage: {
    detected: number;
    notDetected: number;
    detectionRate: number;
  };
  dateRange: { start: string; end: string };
}

export default function AnalyticsClient({ customerId }: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suppress unused variable warning - customerId passed for future use
  void customerId;

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`/api/analytics?${params}`);

      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← Dashboard
            </a>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Analytics
            </h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Date Range Picker */}
        <div className="mb-6">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : analyticsData ? (
          <>
            {/* Overview Cards */}
            <AnalyticsOverview data={analyticsData.overview} />

            {/* Engagement Stats - Iteration 2 */}
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Engagement Metrics
              </h3>
              <EngagementStats data={analyticsData.engagement} />
            </div>

            {/* Main Charts Grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Usage Over Time */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Usage Over Time
                </h3>
                <ClicksChart data={analyticsData.timeline} />
              </div>

              {/* Feature Comparison */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Feature Usage
                </h3>
                <FeatureComparison data={analyticsData.featureBreakdown} />
              </div>

              {/* Device Breakdown */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Devices
                </h3>
                <DeviceBreakdown data={analyticsData.deviceBreakdown} />
              </div>

              {/* Browser Breakdown - Iteration 2 */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Browsers
                </h3>
                <BrowserBreakdown data={analyticsData.browserBreakdown} />
              </div>

              {/* Geographic Distribution */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Geographic Distribution
                </h3>
                <GeoBreakdown data={analyticsData.geoBreakdown} />
              </div>

              {/* Top Pages */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Top Pages
                </h3>
                <TopPagesTable data={analyticsData.topPages} />
              </div>

              {/* Content Health - Iteration 2 */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Content Health
                </h3>
                <ContentHealthTable
                  pagesWithoutContent={analyticsData.contentHealth.pagesWithoutContent}
                  contentFreshness={analyticsData.contentHealth.contentFreshness}
                />
              </div>
            </div>

            {/* Iteration 3: Advanced Analytics */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Peak Hours */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Peak Hours (UTC)
                </h3>
                <PeakHoursChart data={analyticsData.peakHours} />
              </div>

              {/* Scroll Depth */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Scroll Depth
                </h3>
                <ScrollDepthStats data={analyticsData.scrollDepthStats} />
              </div>

              {/* Return Visitors */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Visitor Retention
                </h3>
                <ReturnVisitorStats data={analyticsData.returnVisitorStats} />
              </div>

              {/* Both Features Usage */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Feature Adoption (per Session)
                </h3>
                <BothFeaturesUsage data={analyticsData.bothFeaturesUsage} />
              </div>

              {/* Screen Reader / Accessibility */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Accessibility Usage
                </h3>
                <ScreenReaderStats data={analyticsData.screenReaderUsage} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500">No analytics data available yet.</p>
            <p className="mt-2 text-sm text-zinc-400">
              Analytics will appear once visitors start using your widget.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

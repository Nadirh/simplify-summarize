/**
 * Analytics aggregation service
 * Provides queries for dashboard analytics metrics
 */

import { supabaseAdmin } from "./supabase";

export interface AnalyticsOverview {
  totalClicks: number;
  simplifyClicks: number;
  summarizeClicks: number;
  errorCount: number;
  errorRate: number;
  uniquePages: number;
}

export interface TimelineDataPoint {
  period: string;
  simplify_clicks: number;
  summarize_clicks: number;
  total_clicks: number;
  errors: number;
}

export interface FeatureBreakdown {
  simplify: number;
  summarize: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface GeoDataPoint {
  country: string;
  name: string;
  count: number;
}

export interface TopPage {
  url: string;
  clicks: number;
}

export interface EngagementStats {
  avgReadingTime: number;
  bounceRate: number;
  totalSessions: number;
}

export interface BrowserData {
  browser: string;
  count: number;
}

/**
 * Get overview statistics
 */
export async function getOverviewStats(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsOverview> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("event_type, content_type, page_url")
    .eq("customer_id", customerId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Overview stats error:", error);
    return {
      totalClicks: 0,
      simplifyClicks: 0,
      summarizeClicks: 0,
      errorCount: 0,
      errorRate: 0,
      uniquePages: 0,
    };
  }

  const clicks = data?.filter((e) => e.event_type === "click") || [];
  const errors = data?.filter((e) => e.event_type === "error") || [];
  const simplifyClicks = clicks.filter((e) => e.content_type === "simplify").length;
  const summarizeClicks = clicks.filter((e) => e.content_type === "summarize").length;
  const uniquePages = new Set(clicks.map((e) => e.page_url)).size;
  const totalEvents = (data?.length || 0);
  const errorRate = totalEvents > 0 ? Math.round((errors.length / totalEvents) * 100 * 100) / 100 : 0;

  return {
    totalClicks: clicks.length,
    simplifyClicks,
    summarizeClicks,
    errorCount: errors.length,
    errorRate,
    uniquePages,
  };
}

/**
 * Get timeline data for charts
 */
export async function getTimelineData(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<TimelineDataPoint[]> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("event_type, content_type, created_at")
    .eq("customer_id", customerId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Timeline data error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Check how many unique days have data
  const uniqueDays = new Set(
    data.map((e) => new Date(e.created_at).toISOString().slice(0, 10))
  );

  // Use hourly granularity if data spans 2 or fewer days, OR if all data is on a single day
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const useHourlyGranularity = daysDiff <= 2 || uniqueDays.size === 1;

  // Aggregate by period
  const periodMap = new Map<string, TimelineDataPoint>();

  data.forEach((event) => {
    const date = new Date(event.created_at);
    let periodKey: string;

    if (useHourlyGranularity) {
      periodKey = `${date.toISOString().slice(0, 13)}:00:00.000Z`;
    } else {
      periodKey = `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
    }

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        simplify_clicks: 0,
        summarize_clicks: 0,
        total_clicks: 0,
        errors: 0,
      });
    }

    const point = periodMap.get(periodKey)!;
    if (event.event_type === "click") {
      point.total_clicks++;
      if (event.content_type === "simplify") point.simplify_clicks++;
      if (event.content_type === "summarize") point.summarize_clicks++;
    } else if (event.event_type === "error") {
      point.errors++;
    }
  });

  return Array.from(periodMap.values()).sort(
    (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
  );
}

/**
 * Get feature breakdown (simplify vs summarize)
 */
export async function getFeatureBreakdown(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<FeatureBreakdown> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("content_type")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Feature breakdown error:", error);
    return { simplify: 0, summarize: 0 };
  }

  const counts = { simplify: 0, summarize: 0 };
  data?.forEach((event) => {
    if (event.content_type === "simplify") counts.simplify++;
    else if (event.content_type === "summarize") counts.summarize++;
  });

  return counts;
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<DeviceBreakdown> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("device_type")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Device breakdown error:", error);
    return { desktop: 0, mobile: 0, tablet: 0 };
  }

  const counts = { desktop: 0, mobile: 0, tablet: 0 };
  data?.forEach((event) => {
    const deviceType = event.device_type as keyof typeof counts;
    if (deviceType in counts) counts[deviceType]++;
  });

  return counts;
}

/**
 * Get geographic breakdown (top 10 countries)
 */
export async function getGeoBreakdown(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<GeoDataPoint[]> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("country")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("country", "is", null);

  if (error) {
    console.error("Geo breakdown error:", error);
    return [];
  }

  // Aggregate by country
  const countryMap = new Map<string, { country: string; name: string; count: number }>();
  data?.forEach((event) => {
    const key = event.country || "Unknown";
    const existing = countryMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(key, {
        country: key,
        name: getCountryName(key),
        count: 1,
      });
    }
  });

  // Sort and return top 10
  return Array.from(countryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get top pages by clicks
 */
export async function getTopPages(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<TopPage[]> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("page_url")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Top pages error:", error);
    return [];
  }

  // Aggregate by page URL
  const pageMap = new Map<string, { url: string; clicks: number }>();
  data?.forEach((event) => {
    const key = event.page_url;
    const existing = pageMap.get(key);
    if (existing) {
      existing.clicks++;
    } else {
      pageMap.set(key, { url: event.page_url, clicks: 1 });
    }
  });

  // Sort and return top 10
  return Array.from(pageMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
}

/**
 * Country code to name lookup
 */
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    ES: "Spain",
    IT: "Italy",
    NL: "Netherlands",
    BR: "Brazil",
    MX: "Mexico",
    IN: "India",
    JP: "Japan",
    KR: "South Korea",
    CN: "China",
    SG: "Singapore",
    HK: "Hong Kong",
    AE: "UAE",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    CH: "Switzerland",
    AT: "Austria",
    BE: "Belgium",
    PL: "Poland",
    PT: "Portugal",
    IE: "Ireland",
    NZ: "New Zealand",
    ZA: "South Africa",
  };
  return countries[code] || code;
}

/**
 * Get engagement statistics (reading time, bounce rate)
 */
export async function getEngagementStats(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<EngagementStats> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("duration_seconds")
    .eq("customer_id", customerId)
    .eq("event_type", "panel_close")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("duration_seconds", "is", null);

  if (error) {
    console.error("Engagement stats error:", error);
    return { avgReadingTime: 0, bounceRate: 0, totalSessions: 0 };
  }

  const sessions = data || [];
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return { avgReadingTime: 0, bounceRate: 0, totalSessions: 0 };
  }

  // Calculate average reading time
  const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const avgReadingTime = Math.round((totalTime / totalSessions) * 10) / 10;

  // Calculate bounce rate (sessions < 3 seconds)
  const bounces = sessions.filter((s) => (s.duration_seconds || 0) < 3).length;
  const bounceRate = Math.round((bounces / totalSessions) * 100 * 10) / 10;

  return { avgReadingTime, bounceRate, totalSessions };
}

/**
 * Get browser breakdown
 */
export async function getBrowserBreakdown(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<BrowserData[]> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("browser")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("browser", "is", null);

  if (error) {
    console.error("Browser breakdown error:", error);
    return [];
  }

  // Aggregate by browser
  const browserMap = new Map<string, number>();
  data?.forEach((event) => {
    const browser = event.browser || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
  });

  // Sort by count and return top 10
  return Array.from(browserMap.entries())
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ============================================
// Iteration 3: Advanced Analytics
// ============================================

export interface PeakHourData {
  hour: number;
  count: number;
}

export interface ReturnVisitorStats {
  newVisitors: number;
  returnVisitors: number;
  returnRate: number;
}

export interface BothFeaturesUsage {
  simplifyOnly: number;
  summarizeOnly: number;
  bothFeatures: number;
}

export interface ScrollDepthStats {
  avgScrollDepth: number;
  fullyRead: number; // 90%+
  partialRead: number; // 25-89%
  noScroll: number; // <25%
}

export interface ScreenReaderUsage {
  detected: number;
  notDetected: number;
  detectionRate: number;
}

/**
 * Get peak hours distribution (0-23)
 */
export async function getPeakHours(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<PeakHourData[]> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("created_at")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("Peak hours error:", error);
    return [];
  }

  // Initialize all hours with 0
  const hourMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  // Count events by hour
  data?.forEach((event) => {
    const hour = new Date(event.created_at).getUTCHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Get return visitor statistics
 */
export async function getReturnVisitorStats(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<ReturnVisitorStats> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("visitor_id, is_return_visitor")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("visitor_id", "is", null);

  if (error) {
    console.error("Return visitor stats error:", error);
    return { newVisitors: 0, returnVisitors: 0, returnRate: 0 };
  }

  // Get unique visitors and their return status
  const visitorMap = new Map<string, boolean>();
  data?.forEach((event) => {
    if (event.visitor_id && !visitorMap.has(event.visitor_id)) {
      visitorMap.set(event.visitor_id, event.is_return_visitor || false);
    }
  });

  const newVisitors = Array.from(visitorMap.values()).filter((isReturn) => !isReturn).length;
  const returnVisitors = Array.from(visitorMap.values()).filter((isReturn) => isReturn).length;
  const total = newVisitors + returnVisitors;
  const returnRate = total > 0 ? Math.round((returnVisitors / total) * 100 * 10) / 10 : 0;

  return { newVisitors, returnVisitors, returnRate };
}

/**
 * Get both features usage (sessions using one or both features)
 */
export async function getBothFeaturesUsage(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<BothFeaturesUsage> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("session_id, content_type")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("session_id", "is", null);

  if (error) {
    console.error("Both features usage error:", error);
    return { simplifyOnly: 0, summarizeOnly: 0, bothFeatures: 0 };
  }

  // Group by session and track which features used
  const sessionFeatures = new Map<string, Set<string>>();
  data?.forEach((event) => {
    if (event.session_id && event.content_type) {
      if (!sessionFeatures.has(event.session_id)) {
        sessionFeatures.set(event.session_id, new Set());
      }
      sessionFeatures.get(event.session_id)!.add(event.content_type);
    }
  });

  let simplifyOnly = 0;
  let summarizeOnly = 0;
  let bothFeatures = 0;

  sessionFeatures.forEach((features) => {
    const hasSimplify = features.has("simplify");
    const hasSummarize = features.has("summarize");

    if (hasSimplify && hasSummarize) {
      bothFeatures++;
    } else if (hasSimplify) {
      simplifyOnly++;
    } else if (hasSummarize) {
      summarizeOnly++;
    }
  });

  return { simplifyOnly, summarizeOnly, bothFeatures };
}

/**
 * Get scroll depth statistics
 */
export async function getScrollDepthStats(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<ScrollDepthStats> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("scroll_depth")
    .eq("customer_id", customerId)
    .eq("event_type", "panel_close")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("scroll_depth", "is", null);

  if (error) {
    console.error("Scroll depth stats error:", error);
    return { avgScrollDepth: 0, fullyRead: 0, partialRead: 0, noScroll: 0 };
  }

  const sessions = data || [];
  const total = sessions.length;

  if (total === 0) {
    return { avgScrollDepth: 0, fullyRead: 0, partialRead: 0, noScroll: 0 };
  }

  const totalDepth = sessions.reduce((sum, s) => sum + (s.scroll_depth || 0), 0);
  const avgScrollDepth = Math.round(totalDepth / total);

  const fullyRead = sessions.filter((s) => (s.scroll_depth || 0) >= 90).length;
  const partialRead = sessions.filter((s) => {
    const depth = s.scroll_depth || 0;
    return depth >= 25 && depth < 90;
  }).length;
  const noScroll = sessions.filter((s) => (s.scroll_depth || 0) < 25).length;

  return { avgScrollDepth, fullyRead, partialRead, noScroll };
}

/**
 * Get screen reader usage statistics
 */
export async function getScreenReaderUsage(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<ScreenReaderUsage> {
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("screen_reader_detected")
    .eq("customer_id", customerId)
    .eq("event_type", "click")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .not("screen_reader_detected", "is", null);

  if (error) {
    console.error("Screen reader usage error:", error);
    return { detected: 0, notDetected: 0, detectionRate: 0 };
  }

  const sessions = data || [];
  const detected = sessions.filter((s) => s.screen_reader_detected === true).length;
  const notDetected = sessions.filter((s) => s.screen_reader_detected === false).length;
  const total = detected + notDetected;
  const detectionRate = total > 0 ? Math.round((detected / total) * 100 * 10) / 10 : 0;

  return { detected, notDetected, detectionRate };
}

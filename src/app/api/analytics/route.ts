import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCustomer } from "@/lib/db/customers";
import {
  getOverviewStats,
  getTimelineData,
  getFeatureBreakdown,
  getDeviceBreakdown,
  getGeoBreakdown,
  getTopPages,
  getEngagementStats,
  getBrowserBreakdown,
  getPeakHours,
  getReturnVisitorStats,
  getBothFeaturesUsage,
  getScrollDepthStats,
} from "@/lib/db/analytics";
import {
  getPagesWithoutContent,
  getContentFreshness,
} from "@/lib/db/content-health";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";
    const customStart = searchParams.get("start");
    const customEnd = searchParams.get("end");

    const { startDate, endDate } = getDateRange(range, customStart, customEnd);

    // Fetch all aggregated data in parallel
    const [
      overview,
      timeline,
      featureBreakdown,
      deviceBreakdown,
      geoBreakdown,
      topPages,
      engagement,
      browserBreakdown,
      pagesWithoutContent,
      contentFreshness,
      peakHours,
      returnVisitorStats,
      bothFeaturesUsage,
      scrollDepthStats,
    ] = await Promise.all([
      getOverviewStats(customer.id, startDate, endDate),
      getTimelineData(customer.id, startDate, endDate),
      getFeatureBreakdown(customer.id, startDate, endDate),
      getDeviceBreakdown(customer.id, startDate, endDate),
      getGeoBreakdown(customer.id, startDate, endDate),
      getTopPages(customer.id, startDate, endDate),
      getEngagementStats(customer.id, startDate, endDate),
      getBrowserBreakdown(customer.id, startDate, endDate),
      getPagesWithoutContent(customer.id),
      getContentFreshness(customer.id),
      getPeakHours(customer.id, startDate, endDate),
      getReturnVisitorStats(customer.id, startDate, endDate),
      getBothFeaturesUsage(customer.id, startDate, endDate),
      getScrollDepthStats(customer.id, startDate, endDate),
    ]);

    return NextResponse.json({
      overview,
      timeline,
      featureBreakdown,
      deviceBreakdown,
      geoBreakdown,
      topPages,
      engagement,
      browserBreakdown,
      contentHealth: {
        pagesWithoutContent,
        contentFreshness,
      },
      peakHours,
      returnVisitorStats,
      bothFeaturesUsage,
      scrollDepthStats,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getDateRange(
  range: string,
  customStart?: string | null,
  customEnd?: string | null
): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  if (range === "custom" && customStart && customEnd) {
    return { startDate: new Date(customStart), endDate: new Date(customEnd) };
  }

  switch (range) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  return { startDate, endDate };
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { parseUserAgent } from "@/lib/utils/user-agent";

// Edge runtime for low latency and access to geo headers
export const runtime = "edge";

interface AnalyticsEventRequest {
  event_type: "click" | "error" | "panel_close";
  content_type?: "simplify" | "summarize";
  page_url: string;
  error_message?: string;
  error_code?: string;
  duration_seconds?: number;
  scroll_depth?: number;
  session_id?: string;
  visitor_id?: string;
  is_return_visitor?: boolean;
  screen_reader_detected?: boolean;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get API key from header
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // 2. Validate API key and get customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // 3. Parse request body
    const body: AnalyticsEventRequest = await request.json();
    const {
      event_type,
      content_type,
      page_url,
      error_message,
      error_code,
      duration_seconds,
      scroll_depth,
      session_id,
      visitor_id,
      is_return_visitor,
      screen_reader_detected,
    } = body;

    // 4. Validate required fields
    if (!event_type || !page_url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (event_type === "click" && !content_type) {
      return NextResponse.json(
        { success: false, error: "content_type required for click events" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 5. Extract geo data from Vercel Edge headers
    const country = request.headers.get("x-vercel-ip-country") || null;
    const region = request.headers.get("x-vercel-ip-country-region") || null;
    const cityHeader = request.headers.get("x-vercel-ip-city");
    const city = cityHeader ? decodeURIComponent(cityHeader) : null;

    // 6. Parse User-Agent for device info
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = parseUserAgent(userAgent);

    // 7. Normalize URL (remove trailing slash)
    const normalizedUrl = page_url.replace(/\/$/, "");

    // 8. Try to find matching page_id (optional - don't fail if not found)
    const { data: page } = await supabaseAdmin
      .from("pages")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("url", normalizedUrl)
      .single();

    // 9. Insert analytics event
    const { data: event, error: insertError } = await supabaseAdmin
      .from("analytics_events")
      .insert({
        customer_id: customer.id,
        page_id: page?.id || null,
        event_type,
        content_type: content_type || null,
        page_url: normalizedUrl,
        country,
        region,
        city,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        error_message: error_message || null,
        error_code: error_code || null,
        duration_seconds: duration_seconds || null,
        scroll_depth: scroll_depth ?? null,
        session_id: session_id || null,
        visitor_id: visitor_id || null,
        is_return_visitor: is_return_visitor ?? null,
        screen_reader_detected: screen_reader_detected ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Analytics insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to record event" },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, event_id: event.id },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

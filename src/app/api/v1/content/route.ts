import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

// Edge runtime for low latency globally
export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    // Get parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const type = searchParams.get("type") as "simplify" | "summarize" | null;
    const apiKey = request.headers.get("x-api-key");

    // Validate required parameters
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 401, headers: corsHeaders() }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!type || !["simplify", "summarize"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type parameter. Use 'simplify' or 'summarize'" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate API key and get customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, domain")
      .eq("api_key", apiKey)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Normalize URL for lookup
    const normalizedUrl = url.replace(/\/$/, "");

    // Find the page
    const { data: page, error: pageError } = await supabaseAdmin
      .from("pages")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("url", normalizedUrl)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get approved processed content
    const { data: content, error: contentError } = await supabaseAdmin
      .from("processed_content")
      .select("content, created_at")
      .eq("page_id", page.id)
      .eq("type", type)
      .eq("approved", true)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not available or not yet approved" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Return the content
    return NextResponse.json(
      {
        content: content.content,
        type,
        generatedAt: content.created_at,
      },
      {
        headers: {
          ...corsHeaders(),
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("Content API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

// CORS headers for widget access
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

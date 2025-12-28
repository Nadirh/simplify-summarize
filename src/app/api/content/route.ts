import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCustomer } from "@/lib/db/customers";
import { supabaseAdmin } from "@/lib/db/supabase";

// Get processed content for a page
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("processed_content")
      .select("*")
      .eq("page_id", pageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update content (approve/reject/edit)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, approved, content } = body;

    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof approved === "boolean") updates.approved = approved;
    if (typeof content === "string") updates.content = content;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("processed_content")
      .update(updates)
      .eq("id", contentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCustomer } from "@/lib/db/customers";
import { processPage, processAllPendingPages } from "@/lib/services/processor";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer
    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return NextResponse.json({ error: "Failed to get customer" }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const { pageId, all = false } = body;

    if (all) {
      // Process all pending pages
      const result = await processAllPendingPages(customer.id);
      return NextResponse.json({
        success: true,
        processed: result.processed,
        failed: result.failed,
      });
    } else if (pageId) {
      // Process a single page
      const result = await processPage(pageId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        simplified: result.simplified,
        summarized: result.summarized,
      });
    } else {
      return NextResponse.json(
        { error: "Either pageId or all=true is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

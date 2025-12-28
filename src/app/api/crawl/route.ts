import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCustomer, updateCustomerDomain } from "@/lib/db/customers";
import { crawlWebsite, addSinglePage } from "@/lib/services/crawler";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create customer
    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return NextResponse.json({ error: "Failed to get customer" }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const { url, mode = "crawl" } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Update customer domain
    await updateCustomerDomain(customer.id, parsedUrl.hostname);

    if (mode === "single") {
      // Add a single page
      const result = await addSinglePage(customer.id, url);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Page added" });
    } else {
      // Start crawling (this runs synchronously for now - could be async with job queue later)
      const result = await crawlWebsite(customer.id, url);
      return NextResponse.json({
        success: true,
        pagesFound: result.pagesFound,
        pagesCrawled: result.pagesCrawled,
      });
    }
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

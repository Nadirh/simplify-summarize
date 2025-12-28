import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateCustomer } from "@/lib/db/customers";
import { getCustomerPages } from "@/lib/services/crawler";

export async function GET() {
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

    // Get pages
    const pages = await getCustomerPages(customer.id);

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

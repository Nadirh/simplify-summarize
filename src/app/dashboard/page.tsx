import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCustomer } from "@/lib/db/customers";
import { supabaseAdmin } from "@/lib/db/supabase";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const customer = await getOrCreateCustomer(userId);

  if (!customer) {
    return <div>Error loading customer data</div>;
  }

  // Get pages with their processed content
  const { data: pages } = await supabaseAdmin
    .from("pages")
    .select(`
      *,
      processed_content (*)
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardClient
      customer={customer}
      initialPages={pages || []}
    />
  );
}

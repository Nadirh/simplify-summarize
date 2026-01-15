import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCustomer } from "@/lib/db/customers";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const customer = await getOrCreateCustomer(userId);

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error loading customer data</p>
      </div>
    );
  }

  return <AnalyticsClient customerId={customer.id} />;
}

import { supabaseAdmin, Customer } from "./supabase";

/**
 * Get or create a customer record for a Clerk user
 */
export async function getOrCreateCustomer(clerkUserId: string): Promise<Customer | null> {
  // Try to find existing customer
  const { data: existing, error: findError } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (existing) {
    return existing;
  }

  // Create new customer if not found
  if (findError?.code === "PGRST116") {
    const { data: newCustomer, error: createError } = await supabaseAdmin
      .from("customers")
      .insert({ clerk_user_id: clerkUserId })
      .select()
      .single();

    if (createError) {
      console.error("Error creating customer:", createError);
      return null;
    }

    return newCustomer;
  }

  console.error("Error finding customer:", findError);
  return null;
}

/**
 * Get customer by API key (for widget requests)
 */
export async function getCustomerByApiKey(apiKey: string): Promise<Customer | null> {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("api_key", apiKey)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update customer domain
 */
export async function updateCustomerDomain(
  customerId: string,
  domain: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("customers")
    .update({ domain })
    .eq("id", customerId);

  return !error;
}

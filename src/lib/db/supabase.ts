import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Customer {
  id: string;
  clerk_user_id: string;
  api_key: string;
  domain: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  customer_id: string;
  url: string;
  title: string | null;
  raw_content: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface ProcessedContent {
  id: string;
  page_id: string;
  type: "simplify" | "summarize";
  content: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

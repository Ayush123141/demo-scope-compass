import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = typeof import.meta !== "undefined" ? import.meta.env?.["VITE_SUPABASE_URL"] || "" : "";
const SUPABASE_ANON_KEY = typeof import.meta !== "undefined" ? import.meta.env?.["VITE_SUPABASE_ANON_KEY"] || "" : "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes("your-project") && 
  !SUPABASE_ANON_KEY.includes("your-anon-key")
);

// Singleton Supabase Client
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || "https://dqxbzwenqirxuinfedqa.supabase.co",
  SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder"
);

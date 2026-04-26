import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isConfigured = supabaseUrl.includes("supabase.co") && supabaseAnonKey.length > 0;

// Use safe placeholders so missing env vars do not crash app boot in production.
const safeUrl = isConfigured ? supabaseUrl : "https://placeholder.supabase.co";
const safeAnonKey = isConfigured ? supabaseAnonKey : "public-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey);

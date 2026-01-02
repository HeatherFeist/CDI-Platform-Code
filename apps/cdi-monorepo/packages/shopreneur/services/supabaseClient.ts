import { createClient } from "@supabase/supabase-js";

/**
 * 💡 HELP FOR MOM:
 * Your credentials have been successfully formatted below.
 * The app is now ready to talk to your Supabase database!
 */

// Your specific project URL
export const supabaseUrl = "https://gjbrjysuqdvvqlxklvos.supabase.co"; 

// Your specific public anon key
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqYnJqeXN1cWR2dnFseGtsdm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTQ3MTAsImV4cCI6MjA3NzI3MDcxMH0.YN3BuI6f39P4Vl3yF6nFlMYnbBEu47dpTwmyjDsMfKg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

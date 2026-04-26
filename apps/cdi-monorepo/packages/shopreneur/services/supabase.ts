import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isConfigured = supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 0;

// Safe placeholders prevent app boot crashes when env vars are missing.
const safeUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeAnonKey = isConfigured ? supabaseAnonKey : 'public-anon-key';

// Create Supabase client
export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export auth helper
export const auth = supabase.auth;

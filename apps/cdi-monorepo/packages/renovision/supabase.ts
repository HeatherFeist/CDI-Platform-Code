/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// --- START: SUPABASE CONFIGURATION ---
// IMPORTANT: Replace the placeholder values below with your actual
// Supabase project's configuration. You can find these details in your
// Supabase project settings.
//
// HOW TO FIND YOUR CONFIG:
// 1. Go to your Supabase dashboard: https://app.supabase.com/
// 2. Select your project
// 3. Go to Settings > API
// 4. Copy the Project URL and anon/public key
//
// SECURITY WARNING:
// For production, use environment variables to store these credentials.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is configured
const isSupabaseConfigured = 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseUrl.includes('supabase.co');

let supabase: any = null;
let supabaseError: string | null = null;

if (!isSupabaseConfigured) {
  supabaseError = "Supabase configuration is missing. Add your Supabase URL and anon key to enable authentication and database features.";
  console.warn("⚠️ Supabase not configured. The app will work in local-only mode.");
  console.warn("To enable Supabase features:");
  console.warn("1. Go to https://app.supabase.com/");
  console.warn("2. Create a new project or select existing");
  console.warn("3. Get your URL and anon key from Settings > API");
  console.warn("4. Update the values in supabase.ts or use environment variables");
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase initialized successfully.");
  } catch (e) {
    supabaseError = e instanceof Error ? e.message : String(e);
    console.error("❌ Supabase initialization failed:", supabaseError);
    supabase = null;
  }
}

export { supabase, supabaseError };
export const isConfigured = isSupabaseConfigured;

// Database Types (matching your business.ts interfaces)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          role: 'admin' | 'manager' | 'technician' | 'sales';
          business_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          role: 'admin' | 'manager' | 'technician' | 'sales';
          business_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          phone?: string;
          role?: 'admin' | 'manager' | 'technician' | 'sales';
          business_id?: string;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          description?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address: any; // JSON
          communication_preferences: any; // JSON
          source: string;
          tags: string[];
          last_contact_date?: string;
          total_spent: number;
          project_count: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address: any;
          communication_preferences: any;
          source: string;
          tags?: string[];
          last_contact_date?: string;
          total_spent?: number;
          project_count?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          address?: any;
          communication_preferences?: any;
          source?: string;
          tags?: string[];
          last_contact_date?: string;
          total_spent?: number;
          project_count?: number;
          notes?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          name: string;
          title: string;
          description: string;
          status: 'inquiry' | 'estimated' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high';
          category: string;
          estimate_id?: string;
          design_id?: string;
          location: any; // JSON
          scheduled_date?: string;
          start_date?: string;
          estimated_duration: number;
          completed_date?: string;
          photos: any[]; // JSON
          notes: any[]; // JSON
          tasks: any[]; // JSON
          payments: any[]; // JSON
          assigned_team: string[];
          materials: any[]; // JSON
          permits: any[]; // JSON
          inspections: any[]; // JSON
          warranties: any[]; // JSON
          milestones: any[]; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          name: string;
          title: string;
          description: string;
          status?: 'inquiry' | 'estimated' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          category: string;
          estimate_id?: string;
          design_id?: string;
          location: any;
          scheduled_date?: string;
          start_date?: string;
          estimated_duration: number;
          completed_date?: string;
          photos?: any[];
          notes?: any[];
          tasks?: any[];
          payments?: any[];
          assigned_team?: string[];
          materials?: any[];
          permits?: any[];
          inspections?: any[];
          warranties?: any[];
          milestones?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          name?: string;
          title?: string;
          description?: string;
          status?: 'inquiry' | 'estimated' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          category?: string;
          estimate_id?: string;
          design_id?: string;
          location?: any;
          scheduled_date?: string;
          start_date?: string;
          estimated_duration?: number;
          completed_date?: string;
          photos?: any[];
          notes?: any[];
          tasks?: any[];
          payments?: any[];
          assigned_team?: string[];
          materials?: any[];
          permits?: any[];
          inspections?: any[];
          warranties?: any[];
          milestones?: any[];
          updated_at?: string;
        };
      };
    };
  };
}
// Test Supabase Connection
// Run this in browser console to test if your database schema is set up

console.log('Testing Supabase connection...');

// Check if environment variables are loaded
console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test connection
import { supabase } from './supabase.js';

if (supabase) {
  console.log('✅ Supabase client initialized');
  
  // Test basic connection
  supabase
    .from('businesses')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 You need to run the SQL schema in your Supabase project');
        console.log('📋 Copy the contents of supabase-schema.sql');
        console.log('🔧 Go to https://app.supabase.com/project/gjbrjysuqdvvqlxklvos/sql');
        console.log('📥 Paste and execute the SQL schema');
      } else {
        console.log('✅ Database connected successfully!');
        console.log('📊 Found', data?.length || 0, 'businesses');
      }
    });
} else {
  console.error('❌ Supabase client not initialized');
}
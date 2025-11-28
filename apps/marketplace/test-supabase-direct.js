// Direct test of Supabase connection with detailed error info
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Detailed Supabase Connection Test\n');
console.log('URL:', supabaseUrl);
console.log('Key starts with:', supabaseKey?.substring(0, 20) + '...');
console.log('Key length:', supabaseKey?.length);
console.log('\n---\n');

// Test 1: Check if URL is reachable
console.log('Test 1: Checking if Supabase URL is reachable...');
try {
  const response = await fetch(supabaseUrl);
  console.log('✅ URL is reachable! Status:', response.status);
} catch (error) {
  console.error('❌ URL is NOT reachable!');
  console.error('Error:', error.message);
  console.error('\nThis usually means:');
  console.error('  1. Your Supabase project is PAUSED');
  console.error('  2. Network connectivity issue');
  console.error('  3. Firewall blocking the connection');
  console.error('\n👉 Go to https://supabase.com/dashboard and check if your project is paused!\n');
  process.exit(1);
}

// Test 2: Try to create Supabase client
console.log('\nTest 2: Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Client created');

// Test 3: Try a simple query
console.log('\nTest 3: Attempting to query profiles table...');
try {
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Query failed with error:', error.message);
    console.error('Error details:', error);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 The "profiles" table does not exist yet.');
      console.log('   You need to create your database schema in Supabase.');
    }
  } else {
    console.log('✅ Query successful!');
    console.log('   Table exists with', count, 'row(s)');
  }
} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  console.error('\nFull error:', error);
}

// Test 4: Check auth
console.log('\nTest 4: Testing authentication system...');
try {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Auth check failed:', error.message);
  } else {
    console.log('✅ Auth system is working');
    console.log('   Current session:', session ? 'Logged in' : 'Not logged in');
  }
} catch (error) {
  console.error('❌ Auth test failed:', error.message);
}

console.log('\n✨ Test complete!\n');
process.exit(0);

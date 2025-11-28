// Quick script to check database connectivity and data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('\n🔍 Checking Database Connection...\n');
  
  // Check if we can connect
  console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
  console.log('Anon Key:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...\n');

  try {
    // Check profiles table
    console.log('📋 Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profile(s)`);
      if (profiles && profiles.length > 0) {
        console.log('   Sample profile:', {
          username: profiles[0].username,
          id: profiles[0].id,
          has_city_id: !!profiles[0].city_id,
          city_id: profiles[0].city_id
        });
      }
    }

    // Check cities table
    console.log('\n📋 Checking cities table...');
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .limit(5);

    if (citiesError) {
      console.error('❌ Error fetching cities:', citiesError.message);
      console.log('   This table may not exist yet - need to create it!');
    } else {
      console.log(`✅ Found ${cities?.length || 0} city/cities`);
      if (cities && cities.length > 0) {
        cities.forEach(city => {
          console.log(`   - ${city.name}, ${city.state} (${city.id})`);
        });
      } else {
        console.log('   ⚠️  No cities found - need to seed Dayton, OH');
      }
    }

    // Check for Dayton specifically
    console.log('\n📋 Checking for Dayton, Ohio...');
    const { data: dayton, error: daytonError } = await supabase
      .from('cities')
      .select('*')
      .eq('name', 'Dayton')
      .eq('state', 'Ohio')
      .maybeSingle();

    if (daytonError) {
      console.error('❌ Error fetching Dayton:', daytonError.message);
    } else if (dayton) {
      console.log('✅ Found Dayton:', dayton);
    } else {
      console.log('❌ Dayton, Ohio not found in database');
      console.log('   Need to create city record!');
    }

    // Check listings
    console.log('\n📋 Checking listings table...');
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(5);

    if (listingsError) {
      console.error('❌ Error fetching listings:', listingsError.message);
    } else {
      console.log(`✅ Found ${listings?.length || 0} listing(s)`);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n✨ Database check complete!\n');
  process.exit(0);
}

checkDatabase();

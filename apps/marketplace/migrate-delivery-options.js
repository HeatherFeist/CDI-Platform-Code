// Run SQL migration to add delivery options columns
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use admin key
);

console.log('\n🚚 Adding delivery options to database...\n');

async function runMigration() {
  try {
    // Add columns to listings table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add delivery-related columns to listings table
        ALTER TABLE public.listings 
        ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS seller_address TEXT,
        ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

        -- Add index for querying delivery options
        CREATE INDEX IF NOT EXISTS idx_listings_delivery_options 
        ON public.listings USING GIN (delivery_options);
      `
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.log('⚠️  Using manual column check (RPC not available)...');
      
      // Try to update a test record to see if columns exist
      const { error: testError } = await supabase
        .from('listings')
        .update({
          delivery_options: [{ method: 'pickup', enabled: true, fee: 0, description: 'Test' }],
          seller_address: null,
          pickup_instructions: null
        })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID, just testing schema
      
      if (testError && testError.message.includes('column')) {
        console.error('❌ Columns do not exist. Please run SQL manually in Supabase dashboard.');
        console.log('\n📋 Go to: https://supabase.com/dashboard');
        console.log('   → Select your project');
        console.log('   → SQL Editor → New Query');
        console.log('   → Copy/paste from: add-delivery-options.sql');
        console.log('   → Click Run\n');
        process.exit(1);
      }
    }

    console.log('✅ Columns verified/created!');

    // Set default delivery options for existing listings
    console.log('\n📋 Setting default delivery options for existing listings...');
    
    const { data: existingListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, delivery_options')
      .is('delivery_options', null)
      .limit(100);

    if (fetchError) {
      console.log('⚠️  Could not fetch listings:', fetchError.message);
    } else if (existingListings && existingListings.length > 0) {
      const defaultOptions = [{
        method: 'pickup',
        enabled: true,
        fee: 0,
        description: 'Pick up from seller location'
      }];

      const { error: updateError } = await supabase
        .from('listings')
        .update({ delivery_options: defaultOptions })
        .is('delivery_options', null);

      if (updateError) {
        console.log('⚠️  Could not update listings:', updateError.message);
      } else {
        console.log(`✅ Updated ${existingListings.length} listing(s) with default delivery options`);
      }
    } else {
      console.log('✅ No listings need default delivery options');
    }

    console.log('\n✨ Migration complete!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 Please run the SQL manually:');
    console.log('   File: add-delivery-options.sql');
    console.log('   Location: Supabase Dashboard → SQL Editor\n');
    process.exit(1);
  }
}

runMigration().then(() => process.exit(0));

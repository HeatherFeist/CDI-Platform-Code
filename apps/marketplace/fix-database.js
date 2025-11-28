// Fix missing allow_offers column
// Run with: node fix-database.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Make sure you have:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  console.log('🔧 Fixing missing database columns...\n');

  const fixes = [
    {
      name: 'Add allow_offers column',
      sql: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false'
    },
    {
      name: 'Add listing_type column',
      sql: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT \'auction\''
    },
    {
      name: 'Add stock_quantity column',
      sql: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1'
    },
    {
      name: 'Add compare_at_price column',
      sql: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2)'
    },
    {
      name: 'Make starting_bid nullable',
      sql: 'ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL'
    },
    {
      name: 'Make current_bid nullable',
      sql: 'ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL'
    },
    {
      name: 'Make bid_increment nullable',
      sql: 'ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL'
    },
    {
      name: 'Make end_time nullable',
      sql: 'ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL'
    }
  ];

  for (const fix of fixes) {
    try {
      console.log(`⏳ ${fix.name}...`);
      const { error } = await supabase.rpc('execute_sql', { sql_query: fix.sql });
      
      if (error) {
        console.log(`⚠️  ${fix.name}: ${error.message}`);
      } else {
        console.log(`✅ ${fix.name}: Success`);
      }
    } catch (error) {
      console.log(`❌ ${fix.name}: ${error.message}`);
    }
  }

  // Verify the fix
  console.log('\n🔍 Verifying columns exist...');
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'listings')
      .in('column_name', ['allow_offers', 'listing_type', 'stock_quantity', 'compare_at_price']);

    if (error) {
      console.log('❌ Could not verify columns:', error.message);
    } else {
      console.log('📊 Current listing table columns:');
      console.table(data);
      
      const hasAllowOffers = data.some(col => col.column_name === 'allow_offers');
      if (hasAllowOffers) {
        console.log('\n🎉 SUCCESS! The allow_offers column now exists.');
        console.log('You can now create listings in your app!');
      } else {
        console.log('\n❌ The allow_offers column is still missing.');
        console.log('You may need to run the SQL manually in Supabase dashboard.');
      }
    }
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

// Run the fix
fixDatabase()
  .then(() => {
    console.log('\n✅ Database fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database fix failed:', error);
    process.exit(1);
  });
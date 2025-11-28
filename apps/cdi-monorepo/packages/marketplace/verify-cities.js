// Quick verification with service role key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📊 Verifying Cities with Admin Access...\n');

const { data: cities, error } = await supabase
  .from('cities')
  .select('*')
  .eq('state', 'Ohio')
  .order('population', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log(`✅ Found ${cities.length} Ohio cities:\n`);
  cities.forEach((city, idx) => {
    const star = city.id === '84217ced-f816-4c17-9754-7af1924dcc5d' ? '⭐' : '  ';
    console.log(`${star} ${idx + 1}. ${city.name.padEnd(15)} - ${city.population.toLocaleString().padStart(8)} people`);
  });
  
  const dayton = cities.find(c => c.name === 'Dayton');
  if (dayton) {
    console.log(`\n✅ Dayton is ready to use as default city!`);
    console.log(`   Your user's city_id matches: ${dayton.id === '84217ced-f816-4c17-9754-7af1924dcc5d' ? '✅ YES' : '❌ NO'}`);
  }
}

console.log('\n');
process.exit(0);

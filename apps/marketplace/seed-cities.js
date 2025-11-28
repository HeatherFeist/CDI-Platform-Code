// Seed cities data into Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use service role key to bypass RLS for seeding
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin key bypasses RLS
);

const cities = [
  // Dayton with specific ID (matches your user's city_id)
  {
    id: '84217ced-f816-4c17-9754-7af1924dcc5d',
    name: 'Dayton',
    state: 'Ohio',
    country: 'USA',
    latitude: 39.7589,
    longitude: -84.1916,
    population: 140407,
    timezone: 'America/New_York',
    is_active: true
  },
  // Other major Ohio cities
  { name: 'Columbus', state: 'Ohio', country: 'USA', latitude: 39.9612, longitude: -82.9988, population: 905748, timezone: 'America/New_York', is_active: true },
  { name: 'Cleveland', state: 'Ohio', country: 'USA', latitude: 41.4993, longitude: -81.6944, population: 372624, timezone: 'America/New_York', is_active: true },
  { name: 'Cincinnati', state: 'Ohio', country: 'USA', latitude: 39.1031, longitude: -84.5120, population: 309317, timezone: 'America/New_York', is_active: true },
  { name: 'Toledo', state: 'Ohio', country: 'USA', latitude: 41.6528, longitude: -83.5379, population: 270871, timezone: 'America/New_York', is_active: true },
  { name: 'Akron', state: 'Ohio', country: 'USA', latitude: 41.0814, longitude: -81.5190, population: 197597, timezone: 'America/New_York', is_active: true },
  { name: 'Canton', state: 'Ohio', country: 'USA', latitude: 40.7989, longitude: -81.3784, population: 70872, timezone: 'America/New_York', is_active: true },
  { name: 'Youngstown', state: 'Ohio', country: 'USA', latitude: 41.0998, longitude: -80.6495, population: 60068, timezone: 'America/New_York', is_active: true },
  { name: 'Parma', state: 'Ohio', country: 'USA', latitude: 41.4045, longitude: -81.7229, population: 79937, timezone: 'America/New_York', is_active: true },
  { name: 'Springfield', state: 'Ohio', country: 'USA', latitude: 39.9242, longitude: -83.8088, population: 58662, timezone: 'America/New_York', is_active: true },
  { name: 'Kettering', state: 'Ohio', country: 'USA', latitude: 39.6895, longitude: -84.1688, population: 56163, timezone: 'America/New_York', is_active: true },
  { name: 'Elyria', state: 'Ohio', country: 'USA', latitude: 41.3683, longitude: -82.1076, population: 54533, timezone: 'America/New_York', is_active: true },
  { name: 'Lorain', state: 'Ohio', country: 'USA', latitude: 41.4528, longitude: -82.1824, population: 64097, timezone: 'America/New_York', is_active: true },
  { name: 'Hamilton', state: 'Ohio', country: 'USA', latitude: 39.3995, longitude: -84.5613, population: 62407, timezone: 'America/New_York', is_active: true },
  { name: 'Huber Heights', state: 'Ohio', country: 'USA', latitude: 39.8439, longitude: -84.1246, population: 38101, timezone: 'America/New_York', is_active: true },
  { name: 'Fairfield', state: 'Ohio', country: 'USA', latitude: 39.3461, longitude: -84.5603, population: 42510, timezone: 'America/New_York', is_active: true }
];

console.log('\n🌆 Seeding Ohio cities to Supabase...\n');

async function seedCities() {
  let successCount = 0;
  let errorCount = 0;

  for (const city of cities) {
    try {
      const { data, error } = await supabase
        .from('cities')
        .upsert(city, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Failed to add ${city.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Added: ${city.name}, Ohio (pop: ${city.population.toLocaleString()})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error adding ${city.name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully added: ${successCount} cities`);
  console.log(`   ❌ Failed: ${errorCount} cities`);

  // Verify Dayton exists
  console.log('\n🔍 Verifying Dayton, Ohio...');
  const { data: dayton, error } = await supabase
    .from('cities')
    .select('*')
    .eq('name', 'Dayton')
    .eq('state', 'Ohio')
    .maybeSingle();

  if (dayton) {
    console.log('✅ Dayton found!');
    console.log('   ID:', dayton.id);
    console.log('   Name:', dayton.name + ', ' + dayton.state);
    console.log('   Population:', dayton.population.toLocaleString());
    console.log('   Coordinates:', `${dayton.latitude}, ${dayton.longitude}`);
  } else {
    console.log('❌ Dayton not found:', error?.message);
  }

  console.log('\n✨ Seeding complete!\n');
}

seedCities().then(() => process.exit(0));

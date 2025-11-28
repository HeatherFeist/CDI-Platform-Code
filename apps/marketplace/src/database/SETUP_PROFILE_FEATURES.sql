-- STEP 1: Create the cities and meetup_locations tables
-- Run this first!

-- Cities/Markets table
CREATE TABLE IF NOT EXISTS cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  country VARCHAR(50) DEFAULT 'United States',
  timezone VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  population INTEGER,
  market_launch_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Meetup locations for safe exchanges
CREATE TABLE IF NOT EXISTS meetup_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_type VARCHAR(50) NOT NULL,
  operating_hours TEXT,
  safety_rating INTEGER DEFAULT 3 CHECK (safety_rating BETWEEN 1 AND 5),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Insert Dayton, OH
INSERT INTO cities (name, state, latitude, longitude, timezone, population, is_active)
VALUES 
  ('Dayton', 'OH', 39.7589, -84.1916, 'America/New_York', 140000, true)
ON CONFLICT (name, state) DO UPDATE
SET 
  is_active = true,
  updated_at = NOW();

-- STEP 3: Insert safe meetup locations in Dayton
INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours)
SELECT 
  c.id,
  'Dayton Police Station - District 1',
  '335 W 3rd St, Dayton, OH 45402',
  39.7597,
  -84.1942,
  'police_station',
  5,
  true,
  '24/7'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours)
SELECT 
  c.id,
  'Dayton Mall',
  '2700 Miamisburg Centerville Rd, Dayton, OH 45459',
  39.6289,
  -84.1431,
  'shopping_center',
  4,
  true,
  'Mon-Sat: 10am-9pm, Sun: 11am-6pm'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours)
SELECT 
  c.id,
  'RiverScape MetroPark',
  '111 E Monument Ave, Dayton, OH 45402',
  39.7614,
  -84.1886,
  'public_space',
  4,
  true,
  'Dawn to Dusk'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours)
SELECT 
  c.id,
  'Kroger - Beavercreek',
  '2770 Fairfield Commons Blvd, Beavercreek, OH 45431',
  39.7429,
  -84.0631,
  'parking_lot',
  4,
  true,
  '6am-Midnight'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

-- STEP 4: Add profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);

-- STEP 5: Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- STEP 6: Fix listing deletion policy
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- STEP 7: Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- STEP 8: Set up storage policies for profile photos
DROP POLICY IF EXISTS "Public profile photos are accessible" ON storage.objects;
CREATE POLICY "Public profile photos are accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
CREATE POLICY "Users can update their own profile photo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;
CREATE POLICY "Users can delete their own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- STEP 9: Grant permissions
GRANT ALL ON cities TO authenticated;
GRANT SELECT ON cities TO anon;
GRANT ALL ON meetup_locations TO authenticated;
GRANT SELECT ON meetup_locations TO anon;

-- Done! You should now be able to:
-- ✅ Select Dayton, OH in the city dropdown
-- ✅ Upload profile photos
-- ✅ Delete your own listings
-- ✅ Add location info to your profile

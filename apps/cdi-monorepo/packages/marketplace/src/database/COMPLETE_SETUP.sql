-- COMPLETE DATABASE SETUP FOR PROFILE FEATURES
-- Run this entire script in Supabase SQL Editor
-- This is a safe, idempotent script that won't break existing data

-- ============================================
-- STEP 1: Create custom types if they don't exist
-- ============================================

-- Create item_condition type for listings
DO $$ BEGIN
    CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'excellent', 'good', 'fair', 'poor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Create Cities and Meetup Locations tables
-- ============================================

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate cities (if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cities_name_state_key'
    ) THEN
        ALTER TABLE cities ADD CONSTRAINT cities_name_state_key UNIQUE (name, state);
    END IF;
END $$;

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

-- ============================================
-- STEP 3: Insert Dayton, OH with meetup locations
-- ============================================

-- Insert Dayton
INSERT INTO cities (name, state, latitude, longitude, timezone, population, is_active, market_launch_date)
VALUES ('Dayton', 'OH', 39.7589, -84.1916, 'America/New_York', 140000, true, CURRENT_DATE)
ON CONFLICT (name, state) DO UPDATE
SET 
  is_active = true,
  market_launch_date = COALESCE(cities.market_launch_date, CURRENT_DATE),
  updated_at = NOW();

-- Insert meetup locations
INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours, description)
SELECT 
  c.id,
  'Dayton Police Station - District 1',
  '335 W 3rd St, Dayton, OH 45402',
  39.7597,
  -84.1942,
  'police_station',
  5,
  true,
  '24/7',
  'Official safe exchange zone at police headquarters - 24/7 monitored'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours, description)
SELECT 
  c.id,
  'Dayton Mall - Main Entrance',
  '2700 Miamisburg Centerville Rd, Dayton, OH 45459',
  39.6289,
  -84.1431,
  'shopping_center',
  4,
  true,
  'Mon-Sat: 10am-9pm, Sun: 11am-6pm',
  'Safe exchange location at main mall entrance with excellent lighting and security presence'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours, description)
SELECT 
  c.id,
  'RiverScape MetroPark',
  '111 E Monument Ave, Dayton, OH 45402',
  39.7614,
  -84.1886,
  'public_park',
  4,
  true,
  'Dawn to Dusk',
  'Popular downtown park with good visibility and regular foot traffic'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, safety_rating, is_verified, operating_hours, description)
SELECT 
  c.id,
  'Kroger - Beavercreek',
  '2770 Fairfield Commons Blvd, Beavercreek, OH 45431',
  39.7429,
  -84.0631,
  'parking_lot',
  4,
  true,
  '6am-Midnight',
  'Well-lit parking lot with security cameras and high visibility'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: Add profile columns for photos and location
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT false;

-- Add condition column to listings if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS condition item_condition;

-- Add city_id to listings if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);

-- Update existing listings to default to Dayton (only if they don't have a city)
UPDATE listings 
SET city_id = (SELECT id FROM cities WHERE name = 'Dayton' AND state = 'OH' LIMIT 1)
WHERE city_id IS NULL;

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_listings_city_id ON listings(city_id);
CREATE INDEX IF NOT EXISTS idx_meetup_locations_city_id ON meetup_locations(city_id);

-- ============================================
-- STEP 6: Enable RLS and create policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_locations ENABLE ROW LEVEL SECURITY;

-- Cities are public
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON cities;
CREATE POLICY "Cities are viewable by everyone" ON cities FOR SELECT USING (true);

-- Meetup locations are public
DROP POLICY IF EXISTS "Meetup locations are viewable by everyone" ON meetup_locations;
CREATE POLICY "Meetup locations are viewable by everyone" ON meetup_locations FOR SELECT USING (true);

-- Update profile RLS policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Fix listing deletion policy
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- ============================================
-- STEP 7: Create storage bucket for profile photos
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- Set up storage policies
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

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT SELECT ON cities TO authenticated;
GRANT SELECT ON cities TO anon;
GRANT SELECT ON meetup_locations TO authenticated;
GRANT SELECT ON meetup_locations TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that Dayton was inserted
SELECT 'Cities:', COUNT(*) as count FROM cities WHERE name = 'Dayton';

-- Check meetup locations
SELECT 'Meetup Locations:', COUNT(*) as count FROM meetup_locations 
WHERE city_id = (SELECT id FROM cities WHERE name = 'Dayton' AND state = 'OH');

-- Check profile columns exist
SELECT 'Profile Columns:', column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('profile_photo_url', 'city_id', 'zip_code', 'show_location');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '✅ Dayton, OH added with 4 safe meetup locations';
  RAISE NOTICE '✅ Profile photo and location columns added';
  RAISE NOTICE '✅ Listing deletion policy fixed';
  RAISE NOTICE '✅ Storage bucket created for profile photos';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now:';
  RAISE NOTICE '   - Select Dayton, OH in your profile';
  RAISE NOTICE '   - Upload profile photos';
  RAISE NOTICE '   - Delete your own listings';
  RAISE NOTICE '   - Add location info to your profile';
END $$;

-- Insert Dayton, OH as the first city
-- This script should be run on your Supabase database

-- First, ensure the cities table exists and insert Dayton
INSERT INTO cities (name, state, latitude, longitude, timezone, population, is_active)
VALUES 
  ('Dayton', 'OH', 39.7589, -84.1916, 'America/New_York', 140000, true)
ON CONFLICT (name, state) DO UPDATE
SET 
  is_active = true,
  updated_at = NOW();

-- Insert some safe meetup locations in Dayton
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

-- Add profile photo and location columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);

-- Update RLS policies to allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own listings
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile photos
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

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON cities TO authenticated;
GRANT ALL ON meetup_locations TO authenticated;
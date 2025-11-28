-- QUICK FIX - Run this if COMPLETE_SETUP.sql had errors
-- This will complete any missing parts

-- Ensure Dayton exists
INSERT INTO cities (name, state, latitude, longitude, timezone, population, is_active, market_launch_date)
VALUES ('Dayton', 'OH', 39.7589, -84.1916, 'America/New_York', 140000, true, CURRENT_DATE)
ON CONFLICT (name, state) DO UPDATE
SET 
  is_active = true,
  updated_at = NOW();

-- Ensure meetup locations exist
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
  'Safe exchange location at main mall entrance'
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
  'Popular downtown park'
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
  'Well-lit parking lot'
FROM cities c
WHERE c.name = 'Dayton' AND c.state = 'OH'
ON CONFLICT DO NOTHING;

-- Ensure profile columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT false;

-- Ensure listing columns exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'used';

-- Add store/auction hybrid columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'auction';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false;

-- Make auction-specific fields nullable (for store items)
ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL;

-- Update existing listings to Dayton
UPDATE listings 
SET city_id = (SELECT id FROM cities WHERE name = 'Dayton' AND state = 'OH' LIMIT 1)
WHERE city_id IS NULL;

-- Fix listing deletion policy
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Update profile policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create or update storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- Create or update storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Storage policies for profile photos
DROP POLICY IF EXISTS "Public profile photos are accessible" ON storage.objects;
CREATE POLICY "Public profile photos are accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;
CREATE POLICY "Users can delete their own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for listing images
DROP POLICY IF EXISTS "Public listing images are accessible" ON storage.objects;
CREATE POLICY "Public listing images are accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permissions
GRANT SELECT ON cities TO authenticated;
GRANT SELECT ON cities TO anon;
GRANT SELECT ON meetup_locations TO authenticated;
GRANT SELECT ON meetup_locations TO anon;

-- Verification
SELECT 'Setup Complete!' as status;
SELECT 'Cities:', COUNT(*) FROM cities WHERE name = 'Dayton';
SELECT 'Meetup Locations:', COUNT(*) FROM meetup_locations;
SELECT 'Storage Buckets:', COUNT(*) FROM storage.buckets WHERE id IN ('profile-photos', 'listing-images');
SELECT 'Listing condition column exists:', EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'listings' AND column_name = 'condition'
) as has_condition;
SELECT 'Listing type column exists:', EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'listings' AND column_name = 'listing_type'
) as has_listing_type;
SELECT 'Stock quantity column exists:', EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'listings' AND column_name = 'stock_quantity'
) as has_stock;

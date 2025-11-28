-- =====================================================
-- MARKETPLACE CITIES/MARKETS SETUP
-- =====================================================
-- This script creates the cities table and populates it with initial markets
-- Run this in your Supabase SQL Editor

-- Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  population INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  market_launch_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active cities
CREATE POLICY "Public can view active cities"
ON cities FOR SELECT
USING (is_active = true);

-- Insert initial markets (major US cities)
INSERT INTO cities (name, state, population, latitude, longitude, market_launch_date, is_active)
VALUES
  -- Major Cities
  ('New York', 'NY', 8336817, 40.7128, -74.0060, CURRENT_DATE, true),
  ('Los Angeles', 'CA', 3979576, 34.0522, -118.2437, CURRENT_DATE, true),
  ('Chicago', 'IL', 2693976, 41.8781, -87.6298, CURRENT_DATE, true),
  ('Houston', 'TX', 2320268, 29.7604, -95.3698, CURRENT_DATE, true),
  ('Phoenix', 'AZ', 1680992, 33.4484, -112.0740, CURRENT_DATE, true),
  ('Philadelphia', 'PA', 1584064, 39.9526, -75.1652, CURRENT_DATE, true),
  ('San Antonio', 'TX', 1547253, 29.4241, -98.4936, CURRENT_DATE, true),
  ('San Diego', 'CA', 1423851, 32.7157, -117.1611, CURRENT_DATE, true),
  ('Dallas', 'TX', 1343573, 32.7767, -96.7970, CURRENT_DATE, true),
  ('San Jose', 'CA', 1021795, 37.3382, -121.8863, CURRENT_DATE, true),
  
  -- More Cities
  ('Austin', 'TX', 978908, 30.2672, -97.7431, CURRENT_DATE, true),
  ('Jacksonville', 'FL', 911507, 30.3322, -81.6557, CURRENT_DATE, true),
  ('Fort Worth', 'TX', 909585, 32.7555, -97.3308, CURRENT_DATE, true),
  ('Columbus', 'OH', 898553, 39.9612, -82.9988, CURRENT_DATE, true),
  ('Charlotte', 'NC', 885708, 35.2271, -80.8431, CURRENT_DATE, true),
  ('San Francisco', 'CA', 881549, 37.7749, -122.4194, CURRENT_DATE, true),
  ('Indianapolis', 'IN', 876384, 39.7684, -86.1581, CURRENT_DATE, true),
  ('Seattle', 'WA', 753675, 47.6062, -122.3321, CURRENT_DATE, true),
  ('Denver', 'CO', 727211, 39.7392, -104.9903, CURRENT_DATE, true),
  ('Washington', 'DC', 705749, 38.9072, -77.0369, CURRENT_DATE, true),
  
  -- Additional Markets
  ('Boston', 'MA', 692600, 42.3601, -71.0589, CURRENT_DATE, true),
  ('Nashville', 'TN', 689447, 36.1627, -86.7816, CURRENT_DATE, true),
  ('Detroit', 'MI', 639111, 42.3314, -83.0458, CURRENT_DATE, true),
  ('Portland', 'OR', 652503, 45.5152, -122.6784, CURRENT_DATE, true),
  ('Las Vegas', 'NV', 641903, 36.1699, -115.1398, CURRENT_DATE, true),
  ('Memphis', 'TN', 633104, 35.1495, -90.0490, CURRENT_DATE, true),
  ('Louisville', 'KY', 617638, 38.2527, -85.7585, CURRENT_DATE, true),
  ('Baltimore', 'MD', 585708, 39.2904, -76.6122, CURRENT_DATE, true),
  ('Milwaukee', 'WI', 577222, 43.0389, -87.9065, CURRENT_DATE, true),
  ('Albuquerque', 'NM', 564559, 35.0844, -106.6504, CURRENT_DATE, true),
  
  -- Florida Cities
  ('Miami', 'FL', 467963, 25.7617, -80.1918, CURRENT_DATE, true),
  ('Tampa', 'FL', 399700, 27.9506, -82.4572, CURRENT_DATE, true),
  ('Orlando', 'FL', 307573, 28.5383, -81.3792, CURRENT_DATE, true),
  
  -- More Major Markets
  ('Atlanta', 'GA', 498715, 33.7490, -84.3880, CURRENT_DATE, true),
  ('Minneapolis', 'MN', 429954, 44.9778, -93.2650, CURRENT_DATE, true),
  ('Cleveland', 'OH', 372624, 41.4993, -81.6944, CURRENT_DATE, true),
  ('Raleigh', 'NC', 474069, 35.7796, -78.6382, CURRENT_DATE, true),
  ('Omaha', 'NE', 486051, 41.2565, -95.9345, CURRENT_DATE, true),
  ('Kansas City', 'MO', 508090, 39.0997, -94.5786, CURRENT_DATE, true),
  ('Virginia Beach', 'VA', 459470, 36.8529, -75.9780, CURRENT_DATE, true)
ON CONFLICT (name, state) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Verify cities were created
SELECT COUNT(*) as total_cities, 
       COUNT(CASE WHEN is_active THEN 1 END) as active_cities
FROM cities;

-- Show sample of cities
SELECT name, state, population, market_launch_date
FROM cities
WHERE is_active = true
ORDER BY population DESC
LIMIT 10;

-- =====================================================
-- OHIO MARKETS SETUP - COMPREHENSIVE DATABASE
-- =====================================================
-- This script creates a complete database of Ohio cities/markets
-- with Dayton as the primary market
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
  county TEXT,
  metro_area TEXT,
  market_launch_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  is_primary_market BOOLEAN DEFAULT false,
  market_tier TEXT DEFAULT 'standard', -- 'primary', 'major', 'standard', 'emerging'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active cities" ON cities;

-- Policy: Anyone can view active cities
CREATE POLICY "Public can view active cities"
ON cities FOR SELECT
USING (is_active = true);

-- =====================================================
-- DAYTON - PRIMARY MARKET (Your Home Base!)
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, market_launch_date, is_active, is_primary_market, market_tier)
VALUES
  ('Dayton', 'OH', 'Montgomery', 'Dayton Metro Area', 137644, 39.7589, -84.1916, CURRENT_DATE, true, true, 'primary')
ON CONFLICT (name, state) DO UPDATE SET
  is_primary_market = true,
  market_tier = 'primary',
  market_launch_date = CURRENT_DATE;

-- =====================================================
-- DAYTON METRO AREA CITIES
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  -- Major Dayton suburbs
  ('Kettering', 'OH', 'Montgomery', 'Dayton Metro Area', 55990, 39.6895, -84.1689, true, 'major'),
  ('Beavercreek', 'OH', 'Greene', 'Dayton Metro Area', 47741, 39.7093, -84.0633, true, 'major'),
  ('Huber Heights', 'OH', 'Montgomery', 'Dayton Metro Area', 43439, 39.8439, -84.1244, true, 'major'),
  ('Fairborn', 'OH', 'Greene', 'Dayton Metro Area', 34426, 39.8209, -84.0194, true, 'standard'),
  ('Centerville', 'OH', 'Montgomery', 'Dayton Metro Area', 24087, 39.6284, -84.1594, true, 'standard'),
  ('Miamisburg', 'OH', 'Montgomery', 'Dayton Metro Area', 20421, 39.6428, -84.2866, true, 'standard'),
  ('Riverside', 'OH', 'Montgomery', 'Dayton Metro Area', 25319, 39.7795, -84.1241, true, 'standard'),
  ('Trotwood', 'OH', 'Montgomery', 'Dayton Metro Area', 24431, 39.7973, -84.3133, true, 'standard'),
  ('Vandalia', 'OH', 'Montgomery', 'Dayton Metro Area', 15246, 39.8906, -84.1989, true, 'standard'),
  ('Englewood', 'OH', 'Montgomery', 'Dayton Metro Area', 13465, 39.8778, -84.3022, true, 'standard'),
  ('Clayton', 'OH', 'Montgomery', 'Dayton Metro Area', 13234, 39.8628, -84.3644, true, 'standard'),
  ('Springboro', 'OH', 'Warren', 'Dayton Metro Area', 18416, 39.5531, -84.2333, true, 'standard'),
  ('Xenia', 'OH', 'Greene', 'Dayton Metro Area', 25719, 39.6848, -83.9297, true, 'standard'),
  ('Bellbrook', 'OH', 'Greene', 'Dayton Metro Area', 7191, 39.6334, -84.0733, true, 'emerging'),
  ('Oakwood', 'OH', 'Montgomery', 'Dayton Metro Area', 9202, 39.7245, -84.1741, true, 'emerging')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- MAJOR OHIO CITIES (Statewide Coverage)
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  -- Big 3 Ohio Cities
  ('Columbus', 'OH', 'Franklin', 'Columbus Metro Area', 905748, 39.9612, -82.9988, true, 'major'),
  ('Cleveland', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 372624, 41.4993, -81.6944, true, 'major'),
  ('Cincinnati', 'OH', 'Hamilton', 'Cincinnati Metro Area', 309317, 39.1031, -84.5120, true, 'major'),
  
  -- Other Major Cities
  ('Toledo', 'OH', 'Lucas', 'Toledo Metro Area', 270871, 41.6528, -83.5379, true, 'major'),
  ('Akron', 'OH', 'Summit', 'Akron Metro Area', 190469, 41.0814, -81.5190, true, 'major'),
  ('Canton', 'OH', 'Stark', 'Canton Metro Area', 70872, 40.7989, -81.3781, true, 'standard'),
  ('Youngstown', 'OH', 'Mahoning', 'Youngstown Metro Area', 60068, 41.0998, -80.6495, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- COLUMBUS METRO AREA
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Dublin', 'OH', 'Franklin', 'Columbus Metro Area', 49328, 40.0992, -83.1141, true, 'standard'),
  ('Westerville', 'OH', 'Franklin', 'Columbus Metro Area', 39190, 40.1262, -82.9291, true, 'standard'),
  ('Grove City', 'OH', 'Franklin', 'Columbus Metro Area', 41252, 39.8814, -83.0930, true, 'standard'),
  ('Upper Arlington', 'OH', 'Franklin', 'Columbus Metro Area', 36800, 40.0262, -83.0624, true, 'standard'),
  ('Reynoldsburg', 'OH', 'Franklin', 'Columbus Metro Area', 41076, 39.9548, -82.8121, true, 'standard'),
  ('Hilliard', 'OH', 'Franklin', 'Columbus Metro Area', 37114, 40.0334, -83.1582, true, 'standard'),
  ('Gahanna', 'OH', 'Franklin', 'Columbus Metro Area', 35726, 40.0192, -82.8794, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- CINCINNATI METRO AREA
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Hamilton', 'OH', 'Butler', 'Cincinnati Metro Area', 62082, 39.3995, -84.5613, true, 'standard'),
  ('Middletown', 'OH', 'Butler', 'Cincinnati Metro Area', 50987, 39.5150, -84.3983, true, 'standard'),
  ('Fairfield', 'OH', 'Butler', 'Cincinnati Metro Area', 42635, 39.3456, -84.5603, true, 'standard'),
  ('Mason', 'OH', 'Warren', 'Cincinnati Metro Area', 34792, 39.3600, -84.3097, true, 'standard'),
  ('Lebanon', 'OH', 'Warren', 'Cincinnati Metro Area', 20841, 39.4353, -84.2030, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- CLEVELAND METRO AREA
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Parma', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 81146, 41.4045, -81.7229, true, 'standard'),
  ('Lakewood', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 50942, 41.4820, -81.7982, true, 'standard'),
  ('Euclid', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 49692, 41.5931, -81.5268, true, 'standard'),
  ('Mentor', 'OH', 'Lake', 'Cleveland Metro Area', 46979, 41.6662, -81.3398, true, 'standard'),
  ('Cleveland Heights', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 45312, 41.5200, -81.5563, true, 'standard'),
  ('Strongsville', 'OH', 'Cuyahoga', 'Cleveland Metro Area', 44730, 41.3145, -81.8357, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- TOLEDO METRO AREA
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Sylvania', 'OH', 'Lucas', 'Toledo Metro Area', 19011, 41.7187, -83.7130, true, 'standard'),
  ('Oregon', 'OH', 'Lucas', 'Toledo Metro Area', 20291, 41.6436, -83.4869, true, 'standard'),
  ('Perrysburg', 'OH', 'Wood', 'Toledo Metro Area', 25041, 41.5570, -83.6272, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- AKRON METRO AREA
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Cuyahoga Falls', 'OH', 'Summit', 'Akron Metro Area', 51114, 41.1339, -81.4846, true, 'standard'),
  ('Stow', 'OH', 'Summit', 'Akron Metro Area', 34770, 41.1595, -81.4404, true, 'standard'),
  ('Kent', 'OH', 'Portage', 'Akron Metro Area', 29698, 41.1534, -81.3579, true, 'standard'),
  ('Barberton', 'OH', 'Summit', 'Akron Metro Area', 26550, 41.0128, -81.6051, true, 'standard')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- OTHER NOTABLE OHIO CITIES
-- =====================================================
INSERT INTO cities (name, state, county, metro_area, population, latitude, longitude, is_active, market_tier)
VALUES
  ('Springfield', 'OH', 'Clark', 'Springfield Metro Area', 58662, 39.9242, -83.8088, true, 'standard'),
  ('Lorain', 'OH', 'Lorain', 'Cleveland Metro Area', 65211, 41.4528, -82.1824, true, 'standard'),
  ('Newark', 'OH', 'Licking', 'Columbus Metro Area', 49934, 40.0581, -82.4013, true, 'standard'),
  ('Mansfield', 'OH', 'Richland', 'Mansfield Metro Area', 46830, 40.7584, -82.5154, true, 'standard'),
  ('Elyria', 'OH', 'Lorain', 'Cleveland Metro Area', 54533, 41.3683, -82.1076, true, 'standard'),
  ('Warren', 'OH', 'Trumbull', 'Youngstown Metro Area', 39201, 41.2375, -80.8184, true, 'standard'),
  ('Lima', 'OH', 'Allen', 'Lima Metro Area', 37712, 40.7425, -84.1052, true, 'standard'),
  ('Findlay', 'OH', 'Hancock', 'Findlay Metro Area', 41512, 41.0442, -83.6499, true, 'standard'),
  ('Lancaster', 'OH', 'Fairfield', 'Columbus Metro Area', 40552, 39.7137, -82.5993, true, 'standard'),
  ('Marion', 'OH', 'Marion', 'Marion Metro Area', 36011, 40.5887, -83.1285, true, 'standard'),
  ('Sandusky', 'OH', 'Erie', 'Sandusky Metro Area', 25095, 41.4489, -82.7080, true, 'standard'),
  ('Bowling Green', 'OH', 'Wood', 'Toledo Metro Area', 31638, 41.3748, -83.6513, true, 'standard'),
  ('Delaware', 'OH', 'Delaware', 'Columbus Metro Area', 41302, 40.2987, -83.0680, true, 'standard'),
  ('Athens', 'OH', 'Athens', 'Athens Metro Area', 25806, 39.3292, -82.1013, true, 'standard'),
  ('Oxford', 'OH', 'Butler', 'Cincinnati Metro Area', 23035, 39.5070, -84.7452, true, 'emerging')
ON CONFLICT (name, state) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_metro_area ON cities(metro_area);
CREATE INDEX IF NOT EXISTS idx_cities_market_tier ON cities(market_tier);
CREATE INDEX IF NOT EXISTS idx_cities_primary ON cities(is_primary_market);
CREATE INDEX IF NOT EXISTS idx_cities_county ON cities(county);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show Dayton as primary market
SELECT name, state, county, population, market_tier, is_primary_market
FROM cities
WHERE is_primary_market = true;

-- Show all Dayton Metro Area cities
SELECT name, population, market_tier
FROM cities
WHERE metro_area = 'Dayton Metro Area'
ORDER BY population DESC;

-- Show all Ohio cities by tier
SELECT market_tier, COUNT(*) as city_count, SUM(population) as total_population
FROM cities
WHERE state = 'OH'
GROUP BY market_tier
ORDER BY 
  CASE market_tier
    WHEN 'primary' THEN 1
    WHEN 'major' THEN 2
    WHEN 'standard' THEN 3
    WHEN 'emerging' THEN 4
  END;

-- Show top 20 Ohio cities by population
SELECT name, county, metro_area, population, market_tier
FROM cities
WHERE state = 'OH' AND is_active = true
ORDER BY population DESC
LIMIT 20;

-- Total summary
SELECT 
  COUNT(*) as total_ohio_cities,
  SUM(population) as total_population,
  COUNT(CASE WHEN market_tier = 'primary' THEN 1 END) as primary_markets,
  COUNT(CASE WHEN market_tier = 'major' THEN 1 END) as major_markets,
  COUNT(CASE WHEN market_tier = 'standard' THEN 1 END) as standard_markets,
  COUNT(CASE WHEN market_tier = 'emerging' THEN 1 END) as emerging_markets
FROM cities
WHERE state = 'OH' AND is_active = true;

-- ============================================
-- CITIES TABLE - Add Ohio Cities
-- ============================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query

-- Insert Dayton, Ohio as default city
INSERT INTO public.cities (id, name, state, country, latitude, longitude, population, timezone, is_active)
VALUES 
  ('84217ced-f816-4c17-9754-7af1924dcc5d', 'Dayton', 'Ohio', 'USA', 39.7589, -84.1916, 140407, 'America/New_York', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  population = EXCLUDED.population,
  timezone = EXCLUDED.timezone,
  is_active = EXCLUDED.is_active;

-- Insert other major Ohio cities
INSERT INTO public.cities (name, state, country, latitude, longitude, population, timezone, is_active)
VALUES 
  ('Columbus', 'Ohio', 'USA', 39.9612, -82.9988, 905748, 'America/New_York', true),
  ('Cleveland', 'Ohio', 'USA', 41.4993, -81.6944, 372624, 'America/New_York', true),
  ('Cincinnati', 'Ohio', 'USA', 39.1031, -84.5120, 309317, 'America/New_York', true),
  ('Toledo', 'Ohio', 'USA', 41.6528, -83.5379, 270871, 'America/New_York', true),
  ('Akron', 'Ohio', 'USA', 41.0814, -81.5190, 197597, 'America/New_York', true),
  ('Canton', 'Ohio', 'USA', 40.7989, -81.3784, 70872, 'America/New_York', true),
  ('Youngstown', 'Ohio', 'USA', 41.0998, -80.6495, 60068, 'America/New_York', true),
  ('Parma', 'Ohio', 'USA', 41.4045, -81.7229, 79937, 'America/New_York', true),
  ('Springfield', 'Ohio', 'USA', 39.9242, -83.8088, 58662, 'America/New_York', true),
  ('Kettering', 'Ohio', 'USA', 39.6895, -84.1688, 56163, 'America/New_York', true),
  ('Elyria', 'Ohio', 'USA', 41.3683, -82.1076, 54533, 'America/New_York', true),
  ('Lorain', 'Ohio', 'USA', 41.4528, -82.1824, 64097, 'America/New_York', true),
  ('Hamilton', 'Ohio', 'USA', 39.3995, -84.5613, 62407, 'America/New_York', true),
  ('Huber Heights', 'Ohio', 'USA', 39.8439, -84.1246, 38101, 'America/New_York', true),
  ('Fairfield', 'Ohio', 'USA', 39.3461, -84.5603, 42510, 'America/New_York', true)
ON CONFLICT (name, state, country) DO NOTHING;

-- Verify insertion
SELECT 
  name, 
  state, 
  population,
  CASE WHEN id = '84217ced-f816-4c17-9754-7af1924dcc5d' THEN '⭐ DEFAULT' ELSE '' END as note
FROM public.cities 
WHERE state = 'Ohio' 
ORDER BY population DESC;

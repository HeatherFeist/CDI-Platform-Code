-- Location-based marketplace database schema
-- This adds city-specific auctions, local delivery, and community meetup locations

-- Cities/Markets table
CREATE TABLE cities (
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

-- Insert Dayton, OH as the first market
INSERT INTO cities (name, state, timezone, latitude, longitude, is_active, population, market_launch_date) 
VALUES ('Dayton', 'Ohio', 'America/New_York', 39.7589, -84.1916, true, 140640, CURRENT_DATE);

-- Meetup locations for safe exchanges
CREATE TABLE meetup_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('police_station', 'shopping_center', 'public_park', 'library', 'community_center', 'parking_lot')),
  operating_hours JSONB, -- {"monday": "9:00-21:00", "tuesday": "9:00-21:00", etc}
  safety_features TEXT[], -- ["security_cameras", "well_lit", "high_traffic", "police_presence"]
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  contact_info JSONB, -- {"phone": "", "website": "", "contact_person": ""}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add meetup locations for Dayton
INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, operating_hours, safety_features, is_verified, description) 
SELECT 
  c.id,
  'Dayton Mall - Main Entrance',
  '2700 Miamisburg Centerville Rd, Dayton, OH 45459',
  39.6389,
  -84.1658,
  'shopping_center',
  '{"monday": "10:00-21:00", "tuesday": "10:00-21:00", "wednesday": "10:00-21:00", "thursday": "10:00-21:00", "friday": "10:00-22:00", "saturday": "10:00-22:00", "sunday": "11:00-19:00"}'::jsonb,
  ARRAY['security_cameras', 'well_lit', 'high_traffic', 'security_patrol'],
  true,
  'Safe exchange location at main mall entrance with excellent lighting and security presence'
FROM cities c WHERE c.name = 'Dayton' AND c.state = 'Ohio';

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, operating_hours, safety_features, is_verified, description) 
SELECT 
  c.id,
  'Dayton Police Headquarters',
  '335 W 3rd St, Dayton, OH 45402',
  39.7589,
  -84.1994,
  'police_station',
  '{"monday": "24:00", "tuesday": "24:00", "wednesday": "24:00", "thursday": "24:00", "friday": "24:00", "saturday": "24:00", "sunday": "24:00"}'::jsonb,
  ARRAY['police_presence', 'security_cameras', 'well_lit', 'official_exchange_zone'],
  true,
  'Official safe exchange zone at police headquarters - 24/7 monitored'
FROM cities c WHERE c.name = 'Dayton' AND c.state = 'Ohio';

INSERT INTO meetup_locations (city_id, name, address, latitude, longitude, location_type, operating_hours, safety_features, is_verified, description) 
SELECT 
  c.id,
  'Greene County Public Library',
  '76 E Market St, Xenia, OH 45385',
  39.6845,
  -83.9297,
  'library',
  '{"monday": "9:00-21:00", "tuesday": "9:00-21:00", "wednesday": "9:00-21:00", "thursday": "9:00-21:00", "friday": "9:00-18:00", "saturday": "9:00-17:00", "sunday": "13:00-17:00"}'::jsonb,
  ARRAY['security_cameras', 'well_lit', 'public_space', 'family_friendly'],
  true,
  'Community library with designated safe exchange area in parking lot'
FROM cities c WHERE c.name = 'Dayton' AND c.state = 'Ohio';

-- Delivery services and local drivers
CREATE TABLE delivery_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  service_name VARCHAR(200) NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('individual_driver', 'delivery_company', 'community_volunteer')),
  contact_info JSONB NOT NULL, -- {"phone": "", "email": "", "website": ""}
  service_area JSONB, -- Geographic boundaries they serve
  base_fee DECIMAL(10, 2),
  per_mile_fee DECIMAL(10, 2),
  max_item_weight INTEGER, -- in pounds
  max_item_dimensions JSONB, -- {"length": 48, "width": 36, "height": 24} inches
  available_days TEXT[], -- ["monday", "tuesday", etc]
  available_hours JSONB, -- {"start": "09:00", "end": "18:00"}
  rating DECIMAL(3, 2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  insurance_info JSONB,
  background_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery requests/bookings
CREATE TABLE delivery_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  delivery_service_id UUID REFERENCES delivery_services(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_address JSONB NOT NULL, -- {"street": "", "city": "", "state": "", "zip": "", "special_instructions": ""}
  delivery_address JSONB NOT NULL,
  pickup_time_requested TIMESTAMP WITH TIME ZONE,
  delivery_time_requested TIMESTAMP WITH TIME ZONE,
  pickup_time_actual TIMESTAMP WITH TIME ZONE,
  delivery_time_actual TIMESTAMP WITH TIME ZONE,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  delivery_status VARCHAR(50) DEFAULT 'requested' CHECK (delivery_status IN (
    'requested', 'accepted', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'
  )),
  special_instructions TEXT,
  signature_required BOOLEAN DEFAULT false,
  photo_proof_required BOOLEAN DEFAULT true,
  tracking_code VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add city_id to existing tables
ALTER TABLE listings ADD COLUMN city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN city_id UUID REFERENCES cities(id);
ALTER TABLE profiles ADD COLUMN preferred_meetup_radius INTEGER DEFAULT 25; -- miles

-- Update existing listings to Dayton (temporary for migration)
UPDATE listings SET city_id = (SELECT id FROM cities WHERE name = 'Dayton' AND state = 'Ohio' LIMIT 1);

-- Add indexes for performance
CREATE INDEX idx_listings_city_id ON listings(city_id);
CREATE INDEX idx_profiles_city_id ON profiles(city_id);
CREATE INDEX idx_meetup_locations_city_id ON meetup_locations(city_id);
CREATE INDEX idx_delivery_services_city_id ON delivery_services(city_id);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(delivery_status);
CREATE INDEX idx_meetup_locations_coordinates ON meetup_locations(latitude, longitude);

-- Community weekend markets/events
CREATE TABLE community_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  meetup_location_id UUID REFERENCES meetup_locations(id) ON DELETE SET NULL,
  event_name VARCHAR(200) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('weekend_market', 'pickup_event', 'community_sale', 'auction_meetup')),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences for local features
ALTER TABLE profiles ADD COLUMN delivery_preferences JSONB DEFAULT '{
  "willing_to_meet": true,
  "max_travel_distance": 25,
  "preferred_meetup_times": ["weekend_morning", "weekend_afternoon", "weekday_evening"],
  "delivery_service_preferred": false,
  "contact_method": "app_messaging"
}'::jsonb;

-- RLS Policies
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

-- Cities are public
CREATE POLICY "Cities are viewable by everyone" ON cities FOR SELECT USING (true);

-- Meetup locations are public
CREATE POLICY "Meetup locations are viewable by everyone" ON meetup_locations FOR SELECT USING (true);

-- Delivery services are public
CREATE POLICY "Delivery services are viewable by everyone" ON delivery_services FOR SELECT USING (true);

-- Delivery requests - users can see their own
CREATE POLICY "Users can view their own delivery requests" ON delivery_requests FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

CREATE POLICY "Users can create delivery requests" ON delivery_requests FOR INSERT WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

CREATE POLICY "Users can update their own delivery requests" ON delivery_requests FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Community events are public to view
CREATE POLICY "Community events are viewable by everyone" ON community_events FOR SELECT USING (true);

-- Functions for location-based features
CREATE OR REPLACE FUNCTION get_nearby_meetup_locations(
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  radius_miles INTEGER DEFAULT 25
) RETURNS TABLE (
  id UUID,
  name VARCHAR(200),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_type VARCHAR(50),
  distance_miles DECIMAL(10, 2),
  safety_features TEXT[],
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.name,
    ml.address,
    ml.latitude,
    ml.longitude,
    ml.location_type,
    (3959 * acos(cos(radians(user_lat)) * cos(radians(ml.latitude)) * 
     cos(radians(ml.longitude) - radians(user_lng)) + 
     sin(radians(user_lat)) * sin(radians(ml.latitude))))::DECIMAL(10, 2) as distance_miles,
    ml.safety_features,
    ml.is_verified
  FROM meetup_locations ml
  WHERE ml.is_active = true
    AND (3959 * acos(cos(radians(user_lat)) * cos(radians(ml.latitude)) * 
         cos(radians(ml.longitude) - radians(user_lng)) + 
         sin(radians(user_lat)) * sin(radians(ml.latitude)))) <= radius_miles
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get listings by city with distance
CREATE OR REPLACE FUNCTION get_listings_by_city_with_distance(
  target_city_id UUID,
  user_lat DECIMAL(10, 8) DEFAULT NULL,
  user_lng DECIMAL(11, 8) DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  starting_bid DECIMAL(10, 2),
  current_bid DECIMAL(10, 2),
  buy_now_price DECIMAL(10, 2),
  end_time TIMESTAMP WITH TIME ZONE,
  condition item_condition,
  city_name VARCHAR(100),
  seller_distance_miles DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.starting_bid,
    l.current_bid,
    l.buy_now_price,
    l.end_time,
    l.condition,
    c.name as city_name,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        (3959 * acos(cos(radians(user_lat)) * cos(radians(c.latitude)) * 
         cos(radians(c.longitude) - radians(user_lng)) + 
         sin(radians(user_lat)) * sin(radians(c.latitude))))::DECIMAL(10, 2)
      ELSE NULL
    END as seller_distance_miles
  FROM listings l
  JOIN cities c ON l.city_id = c.id
  WHERE l.city_id = target_city_id
    AND l.status = 'active'
    AND l.end_time > NOW()
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update city coordinates when cities are updated
CREATE OR REPLACE FUNCTION update_city_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_city_updated_at();

CREATE TRIGGER update_meetup_locations_updated_at
  BEFORE UPDATE ON meetup_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_city_updated_at();

CREATE TRIGGER update_delivery_services_updated_at
  BEFORE UPDATE ON delivery_services
  FOR EACH ROW
  EXECUTE FUNCTION update_city_updated_at();

CREATE TRIGGER update_delivery_requests_updated_at
  BEFORE UPDATE ON delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_city_updated_at();

-- Add notification triggers for delivery status changes
CREATE OR REPLACE FUNCTION notify_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for buyer
  INSERT INTO notifications (user_id, type, title, message, data, priority)
  VALUES (
    NEW.buyer_id,
    'delivery_update',
    'Delivery Status Update',
    'Your delivery status has been updated to: ' || NEW.delivery_status,
    jsonb_build_object('delivery_id', NEW.id, 'status', NEW.delivery_status, 'tracking_code', NEW.tracking_code),
    'medium'
  );
  
  -- Insert notification for seller
  INSERT INTO notifications (user_id, type, title, message, data, priority)
  VALUES (
    NEW.seller_id,
    'delivery_update',
    'Delivery Status Update',
    'Delivery status updated to: ' || NEW.delivery_status,
    jsonb_build_object('delivery_id', NEW.id, 'status', NEW.delivery_status, 'tracking_code', NEW.tracking_code),
    'medium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_status_notification
  AFTER UPDATE OF delivery_status ON delivery_requests
  FOR EACH ROW
  WHEN (OLD.delivery_status IS DISTINCT FROM NEW.delivery_status)
  EXECUTE FUNCTION notify_delivery_status_change();
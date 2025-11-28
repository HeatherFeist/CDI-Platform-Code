-- Delivery System Database Schema
-- This migration adds support for flexible delivery options

-- 1. Delivery Drivers Table
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  vehicle_type VARCHAR(50) NOT NULL, -- 'car', 'truck', 'motorcycle', 'bike', 'van'
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  license_plate VARCHAR(20),
  
  -- Verification
  license_number VARCHAR(100),
  insurance_verified BOOLEAN DEFAULT false,
  insurance_expiry DATE,
  background_check_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  background_check_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false, -- Currently accepting deliveries
  
  -- Performance
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  
  -- Earnings
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_tips DECIMAL(10,2) DEFAULT 0,
  
  -- Location (for matching nearby deliveries)
  current_location JSONB, -- { lat, lon, updated_at }
  
  -- Contact
  phone VARCHAR(20),
  emergency_contact JSONB, -- { name, phone, relationship }
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Delivery Requests Table
CREATE TABLE IF NOT EXISTS delivery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Delivery Type
  delivery_type VARCHAR(20) NOT NULL, -- 'self_pickup', 'seller_delivery', 'platform_delivery', 'shipping'
  
  -- Addresses
  pickup_address JSONB NOT NULL, -- { street, city, state, zip, lat, lon, instructions }
  delivery_address JSONB NOT NULL,
  
  -- Distance
  distance_miles DECIMAL(6,2),
  
  -- Driver Assignment (for platform delivery)
  driver_id UUID REFERENCES delivery_drivers(id),
  driver_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'
  
  -- Fees
  delivery_fee DECIMAL(10,2) NOT NULL,
  driver_tip DECIMAL(10,2) DEFAULT 0,
  platform_cut DECIMAL(10,2) DEFAULT 0, -- Platform's percentage of delivery fee
  driver_earnings DECIMAL(10,2) DEFAULT 0, -- What driver receives (before tip)
  
  -- Item Details
  item_weight_lbs DECIMAL(6,2),
  item_value DECIMAL(10,2),
  special_instructions TEXT,
  
  -- Timing
  requested_pickup_time TIMESTAMPTZ,
  estimated_pickup_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  
  -- Tracking & Proof
  notes TEXT,
  pickup_signature_url TEXT,
  pickup_photo_url TEXT,
  delivery_signature_url TEXT,
  delivery_photo_url TEXT,
  
  -- Coordination (for self-pickup and seller delivery)
  coordination_notes TEXT,
  meeting_time TIMESTAMPTZ,
  meeting_location JSONB,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  payment_intent_id TEXT, -- Stripe payment intent
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 3. Delivery Ratings Table
CREATE TABLE IF NOT EXISTS delivery_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_request_id UUID REFERENCES delivery_requests(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES delivery_drivers(id),
  
  -- Who is rating whom
  rater_id UUID REFERENCES profiles(id) NOT NULL, -- Who left the rating
  rater_type VARCHAR(10) NOT NULL, -- 'buyer', 'seller', 'driver'
  
  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Specific feedback
  on_time BOOLEAN,
  professional BOOLEAN,
  item_condition BOOLEAN, -- Item arrived in good condition
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Update Listings Table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '["self_pickup"]';
-- Example: ["self_pickup", "seller_delivery", "platform_delivery", "shipping"]

ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_delivery_fee DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_delivery_radius INTEGER DEFAULT 25; -- miles
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_location JSONB; -- For self-pickup
-- Example: { street: "123 Main St", city: "Denver", state: "CO", zip: "80201", instructions: "Ring doorbell" }

ALTER TABLE listings ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS shipping_weight_lbs DECIMAL(6,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS shipping_dimensions JSONB; -- { length, width, height, unit }

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_user_id ON delivery_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_active ON delivery_drivers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_available ON delivery_drivers(is_available) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_delivery_requests_listing ON delivery_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_buyer ON delivery_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_seller ON delivery_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_driver ON delivery_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON delivery_requests(driver_status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_type ON delivery_requests(delivery_type);

CREATE INDEX IF NOT EXISTS idx_delivery_ratings_driver ON delivery_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_delivery ON delivery_ratings(delivery_request_id);

-- 6. Row Level Security (RLS) Policies

-- Delivery Drivers: Public can view active drivers, only user can update their own
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active drivers"
  ON delivery_drivers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own driver profile"
  ON delivery_drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own driver profile"
  ON delivery_drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own driver profile"
  ON delivery_drivers FOR UPDATE
  USING (auth.uid() = user_id);

-- Delivery Requests: Buyers, sellers, and assigned drivers can view
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery requests"
  ON delivery_requests FOR SELECT
  USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    auth.uid() IN (SELECT user_id FROM delivery_drivers WHERE id = delivery_requests.driver_id)
  );

CREATE POLICY "Buyers can create delivery requests"
  ON delivery_requests FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update delivery requests"
  ON delivery_requests FOR UPDATE
  USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    auth.uid() IN (SELECT user_id FROM delivery_drivers WHERE id = delivery_requests.driver_id)
  );

-- Delivery Ratings: Public can read, participants can create
ALTER TABLE delivery_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view delivery ratings"
  ON delivery_ratings FOR SELECT
  USING (true);

CREATE POLICY "Participants can create ratings"
  ON delivery_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM delivery_requests dr
      WHERE dr.id = delivery_request_id
      AND (dr.buyer_id = auth.uid() OR dr.seller_id = auth.uid() OR 
           dr.driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid()))
    )
  );

-- 7. Functions for Common Operations

-- Calculate delivery fee based on distance
CREATE OR REPLACE FUNCTION calculate_platform_delivery_fee(
  distance_miles DECIMAL,
  item_weight_lbs DECIMAL DEFAULT 0,
  item_value DECIMAL DEFAULT 0
)
RETURNS TABLE(
  total_fee DECIMAL,
  platform_cut DECIMAL,
  driver_earnings DECIMAL
) AS $$
DECLARE
  base_fee DECIMAL := 5.00;
  per_mile_fee DECIMAL := 1.50;
  weight_fee DECIMAL := 0;
  insurance_fee DECIMAL := 0;
  calculated_total DECIMAL;
  platform_percentage DECIMAL := 0.20; -- 20% to platform
BEGIN
  -- Weight surcharge for items over 50 lbs
  IF item_weight_lbs > 50 THEN
    weight_fee := (item_weight_lbs - 50) * 0.10;
  END IF;
  
  -- Insurance for high-value items
  IF item_value > 500 THEN
    insurance_fee := 2.00;
  END IF;
  
  -- Calculate total
  calculated_total := base_fee + (distance_miles * per_mile_fee) + weight_fee + insurance_fee;
  
  -- Return breakdown
  RETURN QUERY SELECT 
    calculated_total,
    ROUND(calculated_total * platform_percentage, 2),
    ROUND(calculated_total * (1 - platform_percentage), 2);
END;
$$ LANGUAGE plpgsql;

-- Update driver rating when new rating is added
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE delivery_drivers
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM delivery_ratings
    WHERE driver_id = NEW.driver_id
  )
  WHERE id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_rating
  AFTER INSERT ON delivery_ratings
  FOR EACH ROW
  WHEN (NEW.driver_id IS NOT NULL)
  EXECUTE FUNCTION update_driver_rating();

-- Update driver stats when delivery is completed
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_status = 'delivered' AND OLD.driver_status != 'delivered' THEN
    UPDATE delivery_drivers
    SET 
      completed_deliveries = completed_deliveries + 1,
      total_deliveries = total_deliveries + 1,
      total_earnings = total_earnings + NEW.driver_earnings,
      total_tips = total_tips + NEW.driver_tip
    WHERE id = NEW.driver_id;
  ELSIF NEW.driver_status = 'cancelled' AND OLD.driver_status != 'cancelled' THEN
    UPDATE delivery_drivers
    SET 
      cancelled_deliveries = cancelled_deliveries + 1,
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_stats
  AFTER UPDATE ON delivery_requests
  FOR EACH ROW
  WHEN (NEW.driver_id IS NOT NULL)
  EXECUTE FUNCTION update_driver_stats();

-- Comments
COMMENT ON TABLE delivery_drivers IS 'Platform delivery drivers with verification and performance tracking';
COMMENT ON TABLE delivery_requests IS 'Delivery requests for all delivery types (self-pickup, seller, platform, shipping)';
COMMENT ON TABLE delivery_ratings IS 'Ratings for delivery experiences from buyers, sellers, and drivers';
COMMENT ON COLUMN listings.delivery_options IS 'Array of available delivery methods for this listing';
COMMENT ON COLUMN listings.seller_delivery_fee IS 'Fee charged by seller for personal delivery';
COMMENT ON COLUMN listings.pickup_location IS 'Address details for self-pickup option';

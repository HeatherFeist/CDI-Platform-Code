-- =====================================================
-- MARKETPLACE TABLES SCHEMA
-- =====================================================
-- Run this AFTER unified-profiles-schema.sql
-- This creates marketplace-specific tables (listings, bids, reviews, etc.)
-- Profiles table already exists from RenovVision with marketplace fields added
-- Project: gjbrjysuqdvvqlxklvos.supabase.co

-- =====================================================
-- 1. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. LISTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  starting_bid NUMERIC NOT NULL CHECK (starting_bid > 0),
  current_bid NUMERIC NOT NULL CHECK (current_bid >= starting_bid),
  reserve_price NUMERIC CHECK (reserve_price IS NULL OR reserve_price >= starting_bid),
  buy_now_price NUMERIC CHECK (buy_now_price IS NULL OR buy_now_price > starting_bid),
  bid_increment NUMERIC DEFAULT 1 CHECK (bid_increment > 0),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_time > start_time),
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'sold')) DEFAULT 'active',
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  
  -- INTEGRATION FIELDS (RenovVision cross-app linking)
  -- Note: source_estimate_id will be added later when estimates table exists
  source_estimate_id UUID, -- References estimates(id) when RenovVision deployed
  source_type TEXT CHECK (source_type IN ('leftover', 'bulk_buy', 'new', 'used')) DEFAULT 'new',
  
  -- PRODUCT DETAILS
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'salvage', 'for_parts')) DEFAULT 'used',
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  location_city TEXT, -- For local pickup filtering
  location_state TEXT, -- For regional searches
  shipping_available BOOLEAN DEFAULT false,
  local_pickup_only BOOLEAN DEFAULT true,
  
  -- IMAGE AUTHENTICITY POLICY
  images_certified BOOLEAN DEFAULT false, -- Seller certifies images show true condition
  show_all_defects BOOLEAN DEFAULT true, -- Images must show any wear/damage
  background_edited BOOLEAN DEFAULT false, -- Transparency: was background modified?
  model_used BOOLEAN DEFAULT false, -- For clothing: is product shown on model?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. BIDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  is_winning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(listing_id, bidder_id, amount) -- Prevent duplicate bids
);

-- =====================================================
-- 4. REVIEWS TABLE (NOW IT EXISTS!)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  type TEXT CHECK (type IN ('buyer_to_seller', 'seller_to_buyer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(listing_id, reviewer_id, reviewee_id, type) -- One review per transaction per direction
);

-- =====================================================
-- 5. MARKETPLACE TRANSACTIONS TABLE
-- =====================================================
-- Rename to avoid conflict with existing transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 6. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('outbid', 'won_auction', 'new_bid', 'listing_ended', 'payment_received', 'estimate_leftover')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 7. ESTIMATE MATERIALS INTEGRATION (OPTIONAL)
-- =====================================================
-- Add marketplace linking fields to existing estimate_materials table
-- SKIP THIS if estimate_materials doesn't exist yet (RenovVision not fully deployed)

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'estimate_materials') THEN
    ALTER TABLE estimate_materials
    ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('manual', 'marketplace', 'supplier_api', 'homewyse')) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS source_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS marketplace_seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ estimate_materials integration columns added';
  ELSE
    RAISE NOTICE '⚠️  estimate_materials table not found - skipping integration (run RenovVision schema first)';
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_end_time ON listings(end_time);
CREATE INDEX IF NOT EXISTS idx_listings_source_estimate_id ON listings(source_estimate_id);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_location_city ON listings(location_city);
CREATE INDEX IF NOT EXISTS idx_listings_location_state ON listings(location_state);
CREATE INDEX IF NOT EXISTS idx_listings_shipping ON listings(shipping_available);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(amount DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Index for estimate_materials (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'estimate_materials') THEN
    CREATE INDEX IF NOT EXISTS idx_estimate_materials_source_listing ON estimate_materials(source_listing_id);
    RAISE NOTICE '✅ estimate_materials index created';
  END IF;
END $$;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Add updated_at trigger to listings
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update bid winning status
CREATE OR REPLACE FUNCTION update_winning_bid()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark all bids for this listing as not winning
  UPDATE bids SET is_winning = FALSE WHERE listing_id = NEW.listing_id;
  
  -- Mark the highest bid as winning
  UPDATE bids SET is_winning = TRUE 
  WHERE listing_id = NEW.listing_id 
  AND amount = (SELECT MAX(amount) FROM bids WHERE listing_id = NEW.listing_id);
  
  -- Update current_bid in listings table
  UPDATE listings 
  SET current_bid = (SELECT MAX(amount) FROM bids WHERE listing_id = NEW.listing_id)
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update winning bid
DROP TRIGGER IF EXISTS trigger_update_winning_bid ON bids;
CREATE TRIGGER trigger_update_winning_bid
  AFTER INSERT OR UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_winning_bid();

-- Function to update profile ratings when reviews change
CREATE OR REPLACE FUNCTION update_rating_on_review()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the reviewee's rating
  PERFORM update_profile_rating(NEW.reviewee_id);
  RETURN NEW;
END;
$$;

-- Trigger to update ratings when reviews are created
DROP TRIGGER IF EXISTS trigger_update_rating_on_review ON reviews;
CREATE TRIGGER trigger_update_rating_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_rating_on_review();

-- =====================================================
-- LOCATION-BASED SEARCH FUNCTION
-- =====================================================
-- Search listings with location priority (same city > same state > everywhere)

CREATE OR REPLACE FUNCTION search_listings_by_location(
  p_user_city TEXT,
  p_user_state TEXT,
  p_category_id UUID DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  images TEXT[],
  current_bid NUMERIC,
  buy_now_price NUMERIC,
  condition TEXT,
  location_city TEXT,
  location_state TEXT,
  distance_priority INTEGER, -- 1 = same city, 2 = same state, 3 = other
  seller_rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.images,
    l.current_bid,
    l.buy_now_price,
    l.condition,
    l.location_city,
    l.location_state,
    CASE 
      WHEN l.location_city = p_user_city AND l.location_state = p_user_state THEN 1
      WHEN l.location_state = p_user_state THEN 2
      ELSE 3
    END AS distance_priority,
    p.rating AS seller_rating,
    l.created_at
  FROM listings l
  JOIN profiles p ON l.seller_id = p.id
  WHERE l.status = 'active'
    AND l.end_time > NOW()
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_condition IS NULL OR l.condition = p_condition)
    AND (p_max_price IS NULL OR l.current_bid <= p_max_price OR l.buy_now_price <= p_max_price)
    AND (p_search_term IS NULL OR 
         l.title ILIKE '%' || p_search_term || '%' OR 
         l.description ILIKE '%' || p_search_term || '%')
  ORDER BY 
    distance_priority ASC, -- Local first
    l.created_at DESC; -- Then newest
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Categories policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Listings policies
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone" ON listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own listings" ON listings;
CREATE POLICY "Users can insert their own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Bids policies
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
CREATE POLICY "Bids are viewable by everyone" ON bids
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert bids" ON bids;
CREATE POLICY "Authenticated users can insert bids" ON bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Reviews policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Marketplace Transactions policies
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON marketplace_transactions;
CREATE POLICY "Users can view their own transactions" ON marketplace_transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: UNIVERSAL MARKETPLACE CATEGORIES
-- =====================================================
-- Phase 1: Construction & Trade Categories

INSERT INTO categories (name, description, icon) VALUES
('Lumber & Wood', 'Dimensional lumber, plywood, hardwood, trim, molding', '🪵'),
('Drywall & Sheetrock', 'Drywall sheets, joint compound, tape, corner bead', '🧱'),
('Paint & Supplies', 'Paint, primer, brushes, rollers, drop cloths, tape', '🎨'),
('Flooring', 'Hardwood, laminate, tile, carpet, vinyl, underlayment', '🏠'),
('Electrical', 'Wire, outlets, switches, breakers, fixtures, conduit', '⚡'),
('Plumbing', 'Pipes, fittings, fixtures, valves, drains', '🚰'),
('HVAC', 'Ductwork, vents, thermostats, registers', '❄️'),
('Roofing', 'Shingles, underlayment, flashing, gutters', '🏡'),
('Concrete & Masonry', 'Concrete mix, blocks, bricks, mortar, grout', '🧱'),
('Hardware & Fasteners', 'Screws, nails, bolts, anchors, brackets', '🔩'),
('Tools & Equipment', 'Power tools, hand tools, ladders, scaffolding', '🔨'),
('Doors & Windows', 'Entry doors, interior doors, windows, hardware', '🚪'),
('Cabinets & Countertops', 'Kitchen cabinets, bathroom vanities, countertops', '🗄️'),
('Insulation', 'Fiberglass, foam, spray foam, vapor barriers', '🧊'),
('Siding & Exterior', 'Vinyl siding, fiber cement, trim, soffit, fascia', '🏘️'),

-- Phase 2: General Merchandise Categories (Community Marketplace)

('Clothing - Mens', 'Mens clothing, shoes, accessories', '👔'),
('Clothing - Womens', 'Womens clothing, shoes, accessories', '👗'),
('Clothing - Kids', 'Childrens clothing, shoes, baby items', '👶'),
('Electronics', 'Phones, computers, tablets, cameras, gaming', '📱'),
('Furniture', 'Sofas, beds, tables, chairs, desks, storage', '🛋️'),
('Appliances', 'Refrigerators, washers, dryers, dishwashers, stoves', '🔌'),
('Home Decor', 'Art, lamps, rugs, curtains, decorative items', '🖼️'),
('Kitchen & Dining', 'Cookware, dishes, utensils, small appliances', '🍽️'),
('Books & Media', 'Books, movies, music, magazines, educational', '📚'),
('Toys & Games', 'Kids toys, board games, puzzles, outdoor play', '🎮'),
('Sporting Goods', 'Exercise equipment, bikes, camping, sports gear', '⚽'),
('Garden & Outdoor', 'Plants, pots, outdoor furniture, garden tools', '🌱'),
('Pet Supplies', 'Pet food, toys, crates, accessories', '🐾'),
('Automotive', 'Car parts, tools, accessories, maintenance items', '🚗'),
('Musical Instruments', 'Guitars, keyboards, drums, accessories', '🎸'),
('Crafts & Hobbies', 'Art supplies, sewing, woodworking, collectibles', '🎨'),
('Office Supplies', 'Desks, chairs, filing, paper, printers', '📎'),
('Health & Beauty', 'Cosmetics, skincare, haircare, wellness', '💄'),
('Baby & Maternity', 'Strollers, car seats, cribs, maternity clothes', '🍼'),
('Jewelry & Watches', 'Rings, necklaces, bracelets, watches', '💍'),
('Antiques & Collectibles', 'Vintage items, memorabilia, rare finds', '🏺'),
('Free Stuff', 'Items being given away for free', '🎁'),
('Everything Else', 'Miscellaneous items that dont fit other categories', '📦')

ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Make user admin (for your account)
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin'
  WHERE email = user_email;
END;
$$;

-- Usage: SELECT make_user_admin('heatherfeist0@gmail.com');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that all tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('categories', 'listings', 'bids', 'reviews', 'marketplace_transactions', 'notifications');
-- Expected: 6 rows

-- Check that integration fields were added
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' AND column_name IN ('source_estimate_id', 'source_type');
-- Expected: 2 rows

-- Check categories were seeded
-- SELECT COUNT(*) FROM categories;
-- Expected: 38 (15 construction + 23 general merchandise)

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Marketplace tables created and linked to unified profiles
-- ✅ Integration fields added for cross-app functionality
-- ✅ RLS policies ensure security
-- ✅ Triggers maintain data consistency
-- ✅ Categories seeded with contractor-relevant items
--
-- NEXT STEPS:
-- 1. Test marketplace app login with RenovVision credentials
-- 2. Create a test listing in marketplace
-- 3. Build "List Leftovers" button in RenovVision
-- 4. Build "Add to Estimate" button in Marketplace
-- 5. Test full round-trip integration
-- =====================================================

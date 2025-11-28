-- ============================================================================
-- FIX ALL EXISTING TABLES - Add missing columns
-- Run this to update your existing tables with missing columns
-- ============================================================================

-- Fix reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS type TEXT;
UPDATE reviews SET type = 'buyer_to_seller' WHERE type IS NULL;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_type_check CHECK (type IN ('buyer_to_seller', 'seller_to_buyer'));

-- Fix transactions table - add buyer_id and seller_id if they use user_id instead
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix listings table - add all missing columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'auction';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS trade_for TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS trade_preferences TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_address TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'used';

-- Add constraints
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_type_check CHECK (listing_type IN ('auction', 'store', 'trade'));

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_condition_check;
ALTER TABLE listings ADD CONSTRAINT listings_condition_check CHECK (condition IN ('new', 'like-new', 'used', 'poor', 'handcrafted'));

-- Make auction fields nullable
ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);

-- ============================================================================
-- DONE! All tables updated with missing columns.
-- ============================================================================

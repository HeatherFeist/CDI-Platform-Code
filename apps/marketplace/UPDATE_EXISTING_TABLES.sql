-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this if your tables already exist but are missing some columns
-- ============================================================================

-- Add missing columns to listings table (if they don't exist)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type TEXT CHECK (listing_type IN ('auction', 'store', 'trade')) DEFAULT 'auction';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1 CHECK (stock_quantity >= 0);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC CHECK (compare_at_price IS NULL OR compare_at_price > 0);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS trade_for TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS trade_preferences TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_address TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'like-new', 'used', 'poor', 'handcrafted')) DEFAULT 'used';

-- Make auction fields nullable for store/trade listings
ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL;

-- Add missing columns to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('buyer_to_seller', 'seller_to_buyer'));

-- Update existing reviews to have type if not set
UPDATE reviews SET type = 'buyer_to_seller' WHERE type IS NULL;

-- Add index for listing_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);

-- Add comments for clarity
COMMENT ON COLUMN listings.trade_for IS 'What the seller is looking to trade for (required for trade listings)';
COMMENT ON COLUMN listings.trade_preferences IS 'Additional details about acceptable trades (optional)';
COMMENT ON COLUMN listings.listing_type IS 'Type of listing: auction (bidding), store (buy now), or trade (barter)';
COMMENT ON COLUMN listings.condition IS 'Physical condition of the item';

-- ============================================================================
-- DONE! Missing columns have been added to existing tables.
-- ============================================================================

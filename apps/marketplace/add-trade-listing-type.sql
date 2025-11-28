-- Add Trade/Barter listing type support
-- This allows users to list items for trade without monetary exchange

-- Update the CHECK constraint to include 'trade'
ALTER TABLE listings 
DROP CONSTRAINT IF EXISTS listings_listing_type_check;

ALTER TABLE listings 
ADD CONSTRAINT listings_listing_type_check 
CHECK (listing_type IN ('auction', 'store', 'trade'));

-- Add trade-specific fields
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS trade_for TEXT;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS trade_preferences TEXT;

-- Add comments for clarity
COMMENT ON COLUMN listings.trade_for IS 'What the seller is looking to trade for (required for trade listings)';
COMMENT ON COLUMN listings.trade_preferences IS 'Additional details about acceptable trades (optional)';

-- Note: For trade listings:
-- - starting_bid and current_bid will be 0 (no money involved)
-- - stock_quantity will be 1
-- - allow_offers will be true
-- - No end_time (trades don't expire like auctions)
-- - No reserve_price, buy_now_price, or bid_increment

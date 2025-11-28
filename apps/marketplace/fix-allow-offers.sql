-- Fix for missing allow_offers column
-- Run this in Supabase SQL Editor

-- Add the missing allow_offers column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false;

-- Also add other missing store-related columns if needed
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'auction';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);

-- Make auction-specific fields nullable (for store items)
ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('allow_offers', 'listing_type', 'stock_quantity', 'compare_at_price')
ORDER BY column_name;
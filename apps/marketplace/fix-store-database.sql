-- Fix Store Database Issues
-- Run this in Supabase SQL Editor to resolve store listing errors

-- 1. Add missing columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'auction';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS allow_offers BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_address TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

-- 2. Update existing auction listings to have proper listing_type
UPDATE listings 
SET listing_type = 'auction' 
WHERE listing_type IS NULL OR listing_type = '';

-- 3. Ensure all listings have proper stock_quantity
UPDATE listings 
SET stock_quantity = 1 
WHERE stock_quantity IS NULL;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_status_type ON listings(status, listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_seller_type ON listings(seller_id, listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_delivery_options ON listings USING GIN (delivery_options);

-- 5. Add helpful comments
COMMENT ON COLUMN listings.listing_type IS 'Type of listing: auction or store';
COMMENT ON COLUMN listings.allow_offers IS 'Whether store items accept offers';
COMMENT ON COLUMN listings.stock_quantity IS 'Available quantity for store items';
COMMENT ON COLUMN listings.compare_at_price IS 'Original price for comparison (store items)';
COMMENT ON COLUMN listings.delivery_options IS 'Array of delivery options and pricing';

-- 6. Verify schema is complete
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'listing_type')
    THEN '✅ listing_type column exists'
    ELSE '❌ listing_type column MISSING'
  END as listing_type_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'stock_quantity')
    THEN '✅ stock_quantity column exists'
    ELSE '❌ stock_quantity column MISSING'
  END as stock_quantity_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'allow_offers')
    THEN '✅ allow_offers column exists'
    ELSE '❌ allow_offers column MISSING'
  END as allow_offers_status;

-- 7. Show current listings for debugging
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  seller_id,
  created_at
FROM listings 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Store database fix completed successfully!' as status;
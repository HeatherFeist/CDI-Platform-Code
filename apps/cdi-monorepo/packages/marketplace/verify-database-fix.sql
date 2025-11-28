-- Check if columns were actually created
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('listing_type', 'stock_quantity', 'allow_offers', 'compare_at_price', 'delivery_options', 'seller_address', 'pickup_instructions')
ORDER BY column_name;

-- Check current listings data
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  allow_offers,
  seller_id,
  created_at
FROM listings 
ORDER BY created_at DESC 
LIMIT 5;

-- Check for any store-type listings
SELECT 
  COUNT(*) as total_listings,
  COUNT(CASE WHEN listing_type = 'store' THEN 1 END) as store_listings,
  COUNT(CASE WHEN listing_type = 'auction' THEN 1 END) as auction_listings,
  COUNT(CASE WHEN listing_type IS NULL THEN 1 END) as null_type
FROM listings;
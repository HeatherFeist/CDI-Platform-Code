-- QUICK FIX: Convert ALL your listings to store items
-- This will make them show up in the Store tab and on your storefront

UPDATE listings
SET listing_type = 'store',
    stock_quantity = COALESCE(stock_quantity, 1),
    allow_offers = false
WHERE listing_type = 'auction' OR listing_type IS NULL;

-- Verify the change
SELECT 
  'After Update' as status,
  listing_type,
  COUNT(*) as count
FROM listings
GROUP BY listing_type;

-- Show your updated listings
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  starting_bid as price
FROM listings
ORDER BY created_at DESC;
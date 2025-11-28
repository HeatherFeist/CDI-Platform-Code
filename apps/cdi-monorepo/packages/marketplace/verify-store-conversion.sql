-- Verify that listings were converted successfully
SELECT 
  'STORE LISTINGS CHECK' as test,
  COUNT(*) as total_store_listings
FROM listings
WHERE listing_type = 'store';

-- Check if they meet Store tab criteria
SELECT 
  'VISIBLE IN STORE TAB' as test,
  COUNT(*) as visible_count
FROM listings
WHERE listing_type = 'store'
  AND status = 'active'
  AND stock_quantity > 0;

-- Show the actual listings
SELECT 
  'YOUR STORE ITEMS' as test,
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  starting_bid as price
FROM listings
WHERE listing_type = 'store'
ORDER BY created_at DESC;
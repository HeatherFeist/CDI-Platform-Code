-- URGENT: Check current status of listings
-- Run this to see what's actually in your database RIGHT NOW

SELECT 
  '=== LISTING STATUS ===' as section,
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  starting_bid,
  created_at
FROM listings
ORDER BY created_at DESC;

SELECT 
  '=== COUNTS ===' as section,
  listing_type,
  status,
  COUNT(*) as count
FROM listings
GROUP BY listing_type, status;

SELECT 
  '=== STORE TAB WILL SHOW ===' as section,
  COUNT(*) as store_items_visible
FROM listings
WHERE listing_type = 'store'
  AND status = 'active'
  AND stock_quantity > 0;
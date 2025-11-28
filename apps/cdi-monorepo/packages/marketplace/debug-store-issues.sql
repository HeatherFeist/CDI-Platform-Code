-- Debug Store Issues - Run this to diagnose the problem

-- 1. Check if we have ANY listings at all
SELECT 'Total Listings Check' as test_name;
SELECT COUNT(*) as total_listings FROM listings;

-- 2. Check listing types
SELECT 'Listing Types Breakdown' as test_name;
SELECT 
  listing_type,
  COUNT(*) as count
FROM listings
GROUP BY listing_type;

-- 3. Check active listings
SELECT 'Active Listings by Type' as test_name;
SELECT 
  listing_type,
  status,
  COUNT(*) as count
FROM listings
WHERE status = 'active'
GROUP BY listing_type, status;

-- 4. Check stock quantities
SELECT 'Stock Quantities Check' as test_name;
SELECT 
  listing_type,
  COUNT(*) as count,
  MIN(stock_quantity) as min_stock,
  MAX(stock_quantity) as max_stock,
  AVG(stock_quantity) as avg_stock
FROM listings
GROUP BY listing_type;

-- 5. Show sample listings with all details
SELECT 'Sample Listing Data' as test_name;
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  allow_offers,
  starting_bid,
  seller_id,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check for listings that would show in store tab
SELECT 'Store Tab Query Test' as test_name;
SELECT 
  COUNT(*) as listings_matching_store_criteria
FROM listings
WHERE listing_type = 'store'
  AND status = 'active'
  AND stock_quantity > 0;

-- 7. Check for listings that would show in storefront
SELECT 'Storefront Query Test (needs seller_id)' as test_name;
SELECT 
  seller_id,
  COUNT(*) as store_listings
FROM listings
WHERE listing_type = 'store'
  AND status = 'active'
  AND stock_quantity > 0
GROUP BY seller_id
ORDER BY store_listings DESC
LIMIT 5;
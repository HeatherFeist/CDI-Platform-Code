-- Comprehensive Store Debugging
-- Run this to see exactly what's wrong

-- 1. Check your listings
SELECT 'YOUR LISTINGS' as debug_section;
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  starting_bid as price,
  seller_id,
  created_at
FROM listings
ORDER BY created_at DESC;

-- 2. Check listing types breakdown
SELECT 'LISTING TYPES' as debug_section;
SELECT 
  listing_type,
  status,
  COUNT(*) as count
FROM listings
GROUP BY listing_type, status;

-- 3. Check what store tab would show (Browse Store page)
SELECT 'STORE TAB QUERY (what Browse Store sees)' as debug_section;
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity
FROM listings
WHERE listing_type = 'store'
  AND status = 'active'
  AND stock_quantity > 0;

-- 4. Check your user ID and what storefront would show
SELECT 'YOUR SELLER INFO' as debug_section;
SELECT 
  id as seller_id,
  username,
  email
FROM profiles
LIMIT 1;

-- 5. Show what YOUR storefront would display
-- Replace 'YOUR_USER_ID' with the ID from step 4
SELECT 'STOREFRONT QUERY (what /store/username sees)' as debug_section;
SELECT 
  l.id,
  l.title,
  l.listing_type,
  l.status,
  l.stock_quantity,
  p.username as seller_username
FROM listings l
JOIN profiles p ON l.seller_id = p.id
WHERE l.status = 'active'
ORDER BY l.created_at DESC;

-- 6. Check if columns exist
SELECT 'COLUMN CHECK' as debug_section;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('listing_type', 'stock_quantity', 'allow_offers')
ORDER BY column_name;
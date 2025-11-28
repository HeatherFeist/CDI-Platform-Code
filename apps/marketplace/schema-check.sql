-- Complete Database Schema Check
-- Run this in Supabase SQL Editor to verify all required columns exist

-- Check listings table structure
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'listings'
ORDER BY ordinal_position;

-- Specifically check for the new store-related columns
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'allow_offers')
    THEN '✅ allow_offers column exists'
    ELSE '❌ allow_offers column MISSING'
  END as allow_offers_status,
  
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
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'compare_at_price')
    THEN '✅ compare_at_price column exists'
    ELSE '❌ compare_at_price column MISSING'
  END as compare_at_price_status;

-- Check if auction fields are properly nullable
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('starting_bid', 'current_bid', 'bid_increment', 'end_time')
ORDER BY column_name;

-- Test inserting a store listing (this will show us what's missing)
-- Note: This will fail if any required columns are missing, which helps us identify issues
-- (Don't worry, we'll roll this back)

BEGIN;

-- Try to insert a test store listing
INSERT INTO listings (
  seller_id, 
  title, 
  description, 
  listing_type,
  stock_quantity,
  compare_at_price,
  allow_offers,
  buy_now_price
) VALUES (
  (SELECT id FROM profiles LIMIT 1), -- Use first available profile
  'Test Store Item',
  'This is a test store listing to verify schema',
  'store',
  5,
  29.99,
  true,
  19.99
);

-- If we get here, the schema is correct
SELECT '🎉 SUCCESS: Store listing schema is complete!' as result;

-- Rollback the test insert
ROLLBACK;
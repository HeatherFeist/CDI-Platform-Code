-- Fix Listing Prices - Set proper prices for store items
-- This script will help you set prices for your existing listings

-- Step 1: Check current prices
SELECT 
  id,
  title,
  listing_type,
  starting_bid,
  current_bid,
  buy_now_price,
  stock_quantity,
  status
FROM listings
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
ORDER BY created_at DESC;

-- Step 2: Update prices for your store items
-- IMPORTANT: Edit the prices below to match what you want to charge!

-- Option A: Set ALL your store items to the same price (e.g., $25.00)
/*
UPDATE listings
SET 
  starting_bid = 25.00,
  current_bid = 25.00
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
  AND listing_type = 'store'
  AND (starting_bid IS NULL OR starting_bid = 0);
*/

-- Option B: Set prices individually by listing ID
-- First, get the IDs from the SELECT above, then update each one:
/*
UPDATE listings SET starting_bid = 29.99, current_bid = 29.99 WHERE id = 'YOUR-LISTING-ID-1';
UPDATE listings SET starting_bid = 15.50, current_bid = 15.50 WHERE id = 'YOUR-LISTING-ID-2';
UPDATE listings SET starting_bid = 45.00, current_bid = 45.00 WHERE id = 'YOUR-LISTING-ID-3';
*/

-- Step 3: Verify the updates
SELECT 
  id,
  title,
  starting_bid as price,
  stock_quantity,
  status
FROM listings
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
ORDER BY created_at DESC;

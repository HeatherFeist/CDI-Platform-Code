-- Update all your existing listings to be store type instead of auction
-- This will convert your 3 listings to fixed-price store items

-- First, let's see what we have
SELECT id, title, listing_type, starting_bid, buy_now_price, seller_id
FROM listings
WHERE seller_id = (SELECT id FROM auth.users WHERE email LIKE '%heather%')
ORDER BY created_at DESC;

-- Update all your listings to be 'store' type
UPDATE listings
SET 
  listing_type = 'store',
  -- Make sure they have a buy_now_price set
  buy_now_price = COALESCE(buy_now_price, starting_bid, 0),
  -- Set stock quantity if not set
  stock_quantity = COALESCE(stock_quantity, 1),
  -- Update timestamp
  updated_at = NOW()
WHERE seller_id = (SELECT id FROM auth.users WHERE email LIKE '%heather%')
  AND listing_type = 'auction';

-- Verify the changes
SELECT id, title, listing_type, buy_now_price, stock_quantity, seller_id
FROM listings
WHERE seller_id = (SELECT id FROM auth.users WHERE email LIKE '%heather%')
ORDER BY created_at DESC;

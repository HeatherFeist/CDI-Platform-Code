-- First, let's see what your listings look like
SELECT 
  id,
  title,
  listing_type,
  starting_bid,
  current_bid,
  buy_now_price,
  stock_quantity,
  status,
  CASE 
    WHEN starting_bid IS NULL OR starting_bid = 0 THEN 'NEEDS PRICE'
    ELSE 'HAS PRICE'
  END as price_status
FROM listings
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
ORDER BY created_at DESC;

-- If your listings have 0 or NULL price, you'll need to update them
-- For example, to set a price of $25 for all your store items:
/*
UPDATE listings
SET 
  starting_bid = 25.00,
  current_bid = 25.00
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
  AND listing_type = 'store'
  AND (starting_bid IS NULL OR starting_bid = 0);
*/

-- After updating, verify:
-- SELECT id, title, starting_bid, stock_quantity FROM listings 
-- WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0');

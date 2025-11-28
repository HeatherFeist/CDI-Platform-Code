-- Check listing data for price fields
SELECT 
  id,
  title,
  listing_type,
  starting_bid,
  current_bid,
  buy_now_price,
  stock_quantity,
  status,
  seller_id
FROM listings
WHERE seller_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
ORDER BY created_at DESC;

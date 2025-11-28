-- Check your current listings
SELECT 
  id,
  title,
  listing_type,
  stock_quantity,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 10;

-- If the listings above show listing_type = 'auction', run this to convert them to store items:
UPDATE listings
SET 
  listing_type = 'store',
  stock_quantity = CASE 
    WHEN stock_quantity IS NULL OR stock_quantity = 0 THEN 10
    ELSE stock_quantity
  END,
  allow_offers = true,
  status = 'active'
WHERE listing_type = 'auction' OR listing_type IS NULL OR stock_quantity IS NULL OR stock_quantity = 0;

-- Verify the update
SELECT 
  id,
  title,
  listing_type,
  stock_quantity,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 10;

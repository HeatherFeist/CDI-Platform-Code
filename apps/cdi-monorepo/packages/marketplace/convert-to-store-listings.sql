-- Convert existing auction listings to store items
-- This will help you test the store functionality

-- Option A: Convert ALL listings to store items (for testing)
UPDATE listings
SET listing_type = 'store',
    allow_offers = false,
    stock_quantity = COALESCE(stock_quantity, 1)
WHERE listing_type = 'auction';

-- Option B: Convert only specific listings by ID
-- UPDATE listings
-- SET listing_type = 'store',
--     allow_offers = true,
--     stock_quantity = 5
-- WHERE id IN ('your-listing-id-here', 'another-listing-id');

-- Option C: Convert listings from a specific seller
-- UPDATE listings
-- SET listing_type = 'store'
-- WHERE seller_id = 'your-user-id-here'
--   AND listing_type = 'auction';

-- Verify the changes
SELECT 
  listing_type,
  COUNT(*) as count
FROM listings
GROUP BY listing_type;
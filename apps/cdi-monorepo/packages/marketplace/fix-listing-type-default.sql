-- Fix listing_type column to NOT default to 'auction'
-- This allows store items to be created without reverting to auction

-- Remove the DEFAULT constraint
ALTER TABLE listings 
ALTER COLUMN listing_type DROP DEFAULT;

-- Optionally, you can set a new default of 'store' if you want, or leave it without a default
-- If you want NO default (recommended so it fails if not specified):
-- ALTER COLUMN listing_type SET DEFAULT 'store';

-- Add a CHECK constraint to ensure only valid values
ALTER TABLE listings 
DROP CONSTRAINT IF EXISTS listings_listing_type_check;

ALTER TABLE listings 
ADD CONSTRAINT listings_listing_type_check 
CHECK (listing_type IN ('auction', 'store'));

-- Verify the change
-- SELECT column_name, column_default, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'listings' AND column_name = 'listing_type';

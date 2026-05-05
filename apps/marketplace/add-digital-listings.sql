-- Add digital listing support to the listings table
-- Run this in your Supabase SQL editor

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS digital_download_url text,
  ADD COLUMN IF NOT EXISTS digital_file_type text;

-- Update the listing_type check constraint to allow 'digital'
-- (only needed if you have an existing CHECK constraint on listing_type)
-- If the column is just a text field with no constraint, the lines below are optional.

DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_listing_type_check'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT listings_listing_type_check;
  END IF;

  -- Re-add with digital included
  ALTER TABLE listings
    ADD CONSTRAINT listings_listing_type_check
    CHECK (listing_type IN ('auction', 'store', 'trade', 'digital'));
END $$;

-- ============================================================================
-- FIX EXISTING REVIEWS TABLE
-- Run this to add missing reviewee_id column to existing reviews table
-- ============================================================================

-- Add reviewee_id column if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add type column if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing reviews to set type if null
UPDATE reviews SET type = 'buyer_to_seller' WHERE type IS NULL;

-- Add constraint for type (drop first if exists)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_type_check CHECK (type IN ('buyer_to_seller', 'seller_to_buyer'));

-- Add index for reviewee_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- ============================================================================
-- DONE! Reviews table now has reviewee_id and type columns.
-- ============================================================================

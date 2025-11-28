-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING MARKETPLACE TABLES
-- This safely adds only the columns that are missing
-- ============================================================================

-- Add missing columns to listings table
DO $$ 
BEGIN
  -- Add trade_for column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='trade_for') THEN
    ALTER TABLE listings ADD COLUMN trade_for TEXT;
  END IF;
  
  -- Add trade_preferences column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='trade_preferences') THEN
    ALTER TABLE listings ADD COLUMN trade_preferences TEXT;
  END IF;
  
  -- Add listing_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='listing_type') THEN
    ALTER TABLE listings ADD COLUMN listing_type TEXT DEFAULT 'auction';
  END IF;
  
  -- Add condition column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='condition') THEN
    ALTER TABLE listings ADD COLUMN condition TEXT DEFAULT 'used';
  END IF;
  
  -- Add stock_quantity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='stock_quantity') THEN
    ALTER TABLE listings ADD COLUMN stock_quantity INTEGER DEFAULT 1;
  END IF;
  
  -- Add compare_at_price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='compare_at_price') THEN
    ALTER TABLE listings ADD COLUMN compare_at_price NUMERIC;
  END IF;
  
  -- Add allow_offers column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='allow_offers') THEN
    ALTER TABLE listings ADD COLUMN allow_offers BOOLEAN DEFAULT false;
  END IF;
  
  -- Add delivery_options column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='delivery_options') THEN
    ALTER TABLE listings ADD COLUMN delivery_options JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add seller_address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='seller_address') THEN
    ALTER TABLE listings ADD COLUMN seller_address TEXT;
  END IF;
  
  -- Add pickup_instructions column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='pickup_instructions') THEN
    ALTER TABLE listings ADD COLUMN pickup_instructions TEXT;
  END IF;
END $$;

-- Add missing columns to reviews table
DO $$ 
BEGIN
  -- Add reviewee_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='reviewee_id') THEN
    ALTER TABLE reviews ADD COLUMN reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='type') THEN
    ALTER TABLE reviews ADD COLUMN type TEXT;
    UPDATE reviews SET type = 'buyer_to_seller' WHERE type IS NULL;
  END IF;
END $$;

-- Add missing columns to transactions table
DO $$ 
BEGIN
  -- Add buyer_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='buyer_id') THEN
    ALTER TABLE transactions ADD COLUMN buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add seller_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='seller_id') THEN
    ALTER TABLE transactions ADD COLUMN seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make auction fields nullable in listings table (if they're not already)
DO $$
BEGIN
  ALTER TABLE listings ALTER COLUMN starting_bid DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE listings ALTER COLUMN current_bid DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE listings ALTER COLUMN bid_increment DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE listings ALTER COLUMN start_time DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE listings ALTER COLUMN end_time DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- ============================================================================
-- DONE! Missing columns have been added to your existing tables.
-- ============================================================================

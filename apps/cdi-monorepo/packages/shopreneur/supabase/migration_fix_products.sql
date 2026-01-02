-- Migration to fix products table for Shop'reneur
-- Run this in your Supabase SQL Editor

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_review_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_id TEXT,
ADD COLUMN IF NOT EXISTS is_marketplace_synced BOOLEAN DEFAULT false;

-- Update platform check to include all platforms
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_platform_check;

ALTER TABLE products 
ADD CONSTRAINT products_platform_check 
CHECK (platform IN ('Amazon', 'Shein', 'eBay', 'Temu'));

-- Update category check constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products 
ADD CONSTRAINT products_category_check 
CHECK (category IN (
  'Beauty & Skincare',
  'Fashion & Apparel', 
  'Accessories',
  'Hair Care',
  'Tech & Gadgets',
  'Shein Finds',
  'Fashion',
  'Beauty',
  'Electronics',
  'Home & Living',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Health & Wellness',
  'Food & Beverages',
  'Other'
));

-- Change id column to accept text for compatibility
-- Note: This is a significant change. If you have existing UUID data, 
-- you may want to backup first or use a different approach.
-- For a fresh database, you can recreate the table:

-- Create new products table with TEXT id
CREATE TABLE IF NOT EXISTS products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  additional_images TEXT[] DEFAULT '{}',
  video_url TEXT,
  video_review_completed BOOLEAN DEFAULT false,
  affiliate_link TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Amazon', 'Shein', 'eBay', 'Temu')),
  asin TEXT,
  marketplace_id TEXT,
  affiliate_tag TEXT,
  is_wishlist BOOLEAN DEFAULT false,
  is_received BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 0,
  is_marketplace_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing data if any (converting UUID to TEXT)
-- Only copy if old products table exists and has data
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    INSERT INTO products_new (
      id, name, price, cost_price, category, description, 
      image_url, additional_images, video_url, affiliate_link, 
      platform, is_wishlist, is_received, stock_count, 
      created_at, updated_at,
      video_review_completed, asin, marketplace_id, affiliate_tag, is_marketplace_synced
    )
    SELECT 
      id::TEXT,
      name,
      price,
      COALESCE(cost_price, 0),
      category,
      COALESCE(description, ''),
      image_url,
      COALESCE(additional_images, '{}'),
      video_url,
      affiliate_link,
      platform,
      COALESCE(is_wishlist, false),
      COALESCE(is_received, false),
      COALESCE(stock_count, 0),
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW()),
      false, -- video_review_completed (new column)
      NULL,  -- asin (new column)
      NULL,  -- marketplace_id (new column)
      NULL,  -- affiliate_tag (may not exist in old table)
      false  -- is_marketplace_synced (new column)
    FROM products
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS products CASCADE;
ALTER TABLE products_new RENAME TO products;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_products_is_wishlist ON products(is_wishlist);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Recreate trigger
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (true);

-- Enable realtime
DO $$ 
BEGIN
  -- Try to drop the table from publication (ignore if it doesn't exist)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE products;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
  
  -- Add the table to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE products;
END $$;

-- Fix profiles table name if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles RENAME TO profiles;
  END IF;
END $$;

-- Ensure profiles table has shipping_address
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Update profiles RLS to be more permissive for development
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update profiles" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

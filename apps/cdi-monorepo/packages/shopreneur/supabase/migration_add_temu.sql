-- Migration Script: Add Temu Platform Support
-- Run this if you already have existing tables

-- Drop existing platform constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_platform_check;

-- Add new constraint with Temu included
ALTER TABLE products ADD CONSTRAINT products_platform_check 
  CHECK (platform IN ('Amazon', 'Shein', 'Temu'));

-- If you need to add any Temu-specific columns in the future, add them here
-- Example: ALTER TABLE products ADD COLUMN IF NOT EXISTS temu_product_id TEXT;

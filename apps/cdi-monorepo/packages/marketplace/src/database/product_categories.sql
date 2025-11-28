-- Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(64) NOT NULL,
  slug VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example category tree
INSERT INTO product_categories (name, slug, parent_id) VALUES
  ('Men', 'men', NULL),
  ('Women', 'women', NULL),
  ('Children', 'children', NULL),
  ('New', 'new', NULL),
  ('Used', 'used', NULL),
  ('Boho', 'boho', NULL),
  ('Formal Wear', 'formal-wear', NULL);

-- Listings Table Update: Add category_id, condition, style
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES product_categories(id),
  ADD COLUMN IF NOT EXISTS condition VARCHAR(16), -- 'new' or 'used'
  ADD COLUMN IF NOT EXISTS style VARCHAR(32);

-- Area/Zipcode support is already present in the app, so buyers/sellers can filter by location.
-- This schema enables scalable category management and easy filtering by category, condition, style, and location.

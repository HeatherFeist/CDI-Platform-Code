-- Add condition field to listings table for New, Used, and Hand-crafted items
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'used', 'handcrafted')) DEFAULT 'used';

-- Update existing categories to be more specific and add hand-crafted category
INSERT INTO categories (name, description, icon) VALUES
('Hand-crafted Goods', 'Unique handmade items, artisan crafts, and custom creations', '🤲'),
('New Items', 'Brand new, unused items in original packaging', '✨'),
('Used Items', 'Pre-owned items in good condition', '♻️')
ON CONFLICT (name) DO NOTHING;

-- Create index for condition field for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);

-- Create combined index for category and condition filtering
CREATE INDEX IF NOT EXISTS idx_listings_category_condition ON listings(category_id, condition);

-- Add sample data for different conditions (optional)
-- Update some existing listings to have different conditions
UPDATE listings 
SET condition = 'new' 
WHERE title ILIKE '%new%' OR title ILIKE '%brand new%' OR description ILIKE '%unopened%';

UPDATE listings 
SET condition = 'handcrafted' 
WHERE title ILIKE '%handmade%' OR title ILIKE '%custom%' OR title ILIKE '%artisan%' OR description ILIKE '%handcrafted%';

-- All other listings remain as 'used' (default value)
-- SECTION 3: Sample Data and Admin Function
-- Run this after Section 2 completes successfully

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Computers, phones, gadgets and electronic devices', '💻'),
('Collectibles', 'Rare items, antiques, and collectible memorabilia', '🏺'),
('Art & Crafts', 'Paintings, sculptures, handmade items and artwork', '🎨'),
('Sports & Recreation', 'Sports equipment, outdoor gear and recreational items', '⚽'),
('Fashion & Accessories', 'Clothing, jewelry, watches and fashion accessories', '👗'),
('Home & Garden', 'Furniture, decorations, plants and home improvement', '🏡'),
('Automotive', 'Cars, motorcycles, parts and automotive accessories', '🚗'),
('Books & Media', 'Books, movies, music, games and educational materials', '📚')
ON CONFLICT (name) DO NOTHING;

-- Function to make a user admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET is_admin = TRUE 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email
  );
END;
$$;
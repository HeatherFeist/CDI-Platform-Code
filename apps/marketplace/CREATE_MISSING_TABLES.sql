-- ============================================================================
-- CREATE MISSING TABLES
-- This creates only the tables that don't exist yet
-- ============================================================================

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  listing_type TEXT DEFAULT 'auction',
  status TEXT DEFAULT 'active',
  condition TEXT DEFAULT 'used',
  starting_bid NUMERIC,
  current_bid NUMERIC,
  reserve_price NUMERIC,
  buy_now_price NUMERIC,
  bid_increment NUMERIC DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  stock_quantity INTEGER DEFAULT 1,
  compare_at_price NUMERIC,
  allow_offers BOOLEAN DEFAULT FALSE,
  trade_for TEXT,
  trade_preferences TEXT,
  delivery_options JSONB DEFAULT '[]'::jsonb,
  seller_address TEXT,
  pickup_instructions TEXT,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bids table if it doesn't exist
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  is_winning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add missing columns to transactions if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='buyer_id') THEN
    ALTER TABLE transactions ADD COLUMN buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='seller_id') THEN
    ALTER TABLE transactions ADD COLUMN seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public categories" ON categories;
CREATE POLICY "Public categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public listings" ON listings;
CREATE POLICY "Public listings" ON listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own listings" ON listings;
CREATE POLICY "Users insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users update own listings" ON listings;
CREATE POLICY "Users update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Public bids" ON bids;
CREATE POLICY "Public bids" ON bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own bids" ON bids;
CREATE POLICY "Users insert own bids" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

DROP POLICY IF EXISTS "Public reviews" ON reviews;
CREATE POLICY "Public reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own reviews" ON reviews;
CREATE POLICY "Users insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id OR 
  auth.uid() = COALESCE(buyer_id, seller_id, user_id)
);

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Computers, phones, gadgets and electronic devices', '💻'),
('Collectibles', 'Rare items, antiques, and collectible memorabilia', '🏺'),
('Art & Crafts', 'Paintings, sculptures, handmade items and artwork', '🎨'),
('Sports & Recreation', 'Sports equipment, outdoor gear and recreational items', '⚽'),
('Fashion & Accessories', 'Clothing, jewelry, watches and fashion accessories', '👗'),
('Home & Garden', 'Furniture, decorations, plants and home improvement', '🏡'),
('Automotive', 'Cars, motorcycles, parts and automotive accessories', '🚗'),
('Books & Media', 'Books, movies, music, games and educational materials', '📚'),
('Tools & Equipment', 'Power tools, hand tools, construction equipment', '🔧'),
('Materials', 'Building materials, lumber, hardware supplies', '🏗️')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- DONE! All missing tables have been created with trade support.
-- ============================================================================

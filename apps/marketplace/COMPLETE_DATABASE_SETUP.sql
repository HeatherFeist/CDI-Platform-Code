-- ============================================================================
-- COMPLETE MARKETPLACE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor if you're starting fresh
-- ============================================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Listings Table (with all features: auction, store, trade)
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  
  -- Listing type and status (defined first so they can be used in constraints)
  listing_type TEXT DEFAULT 'auction',
  status TEXT DEFAULT 'active',
  condition TEXT DEFAULT 'used',
  
  -- Auction fields
  starting_bid NUMERIC,
  current_bid NUMERIC,
  reserve_price NUMERIC,
  buy_now_price NUMERIC,
  bid_increment NUMERIC DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Store-specific fields
  stock_quantity INTEGER DEFAULT 1,
  compare_at_price NUMERIC,
  allow_offers BOOLEAN DEFAULT FALSE,
  
  -- Trade-specific fields
  trade_for TEXT,
  trade_preferences TEXT,
  
  -- Delivery options
  delivery_options JSONB DEFAULT '[]'::jsonb,
  seller_address TEXT,
  pickup_instructions TEXT,
  
  -- Common fields
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Add constraints after all columns are defined
  CONSTRAINT listings_type_check CHECK (listing_type IN ('auction', 'store', 'trade')),
  CONSTRAINT listings_status_check CHECK (status IN ('active', 'completed', 'cancelled', 'sold')),
  CONSTRAINT listings_condition_check CHECK (condition IN ('new', 'like-new', 'used', 'poor', 'handcrafted')),
  CONSTRAINT listings_view_count_check CHECK (view_count >= 0),
  CONSTRAINT listings_stock_quantity_check CHECK (stock_quantity >= 0),
  CONSTRAINT listings_compare_at_price_check CHECK (compare_at_price IS NULL OR compare_at_price > 0),
  CONSTRAINT listings_bid_increment_check CHECK (bid_increment > 0),
  CONSTRAINT listings_end_time_check CHECK (end_time IS NULL OR end_time > start_time)
);

-- 4. Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  is_winning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(listing_id, bidder_id, amount)
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  type TEXT CHECK (type IN ('buyer_to_seller', 'seller_to_buyer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('outbid', 'won_auction', 'new_bid', 'listing_ended', 'payment_received')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_end_time ON listings(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(amount DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update bid winning status
CREATE OR REPLACE FUNCTION update_winning_bid()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark all bids for this listing as not winning
  UPDATE bids SET is_winning = FALSE WHERE listing_id = NEW.listing_id;
  
  -- Mark the highest bid as winning
  UPDATE bids SET is_winning = TRUE 
  WHERE listing_id = NEW.listing_id 
  AND amount = (SELECT MAX(amount) FROM bids WHERE listing_id = NEW.listing_id);
  
  -- Update current_bid in listings table
  UPDATE listings 
  SET current_bid = (SELECT MAX(amount) FROM bids WHERE listing_id = NEW.listing_id)
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update winning bid
DROP TRIGGER IF EXISTS trigger_update_winning_bid ON bids;
CREATE TRIGGER trigger_update_winning_bid
  AFTER INSERT OR UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_winning_bid();

-- Row Level Security Policies

-- Enable RLS on all tables first
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Listings policies
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone" ON listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own listings" ON listings;
CREATE POLICY "Users can insert their own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Bids policies
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
CREATE POLICY "Bids are viewable by everyone" ON bids
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert bids" ON bids;
CREATE POLICY "Authenticated users can insert bids" ON bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

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
-- DONE! Your marketplace database is ready to use.
-- ============================================================================

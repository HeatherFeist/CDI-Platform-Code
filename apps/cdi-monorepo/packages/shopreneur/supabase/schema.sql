-- Shop'reneur Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2),
  category TEXT NOT NULL CHECK (category IN (
    'Beauty & Skincare',
    'Fashion & Apparel',
    'Accessories',
    'Hair Care',
    'Tech & Gadgets',
    'Shein Finds'
  )),
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  additional_images TEXT[] DEFAULT '{}',
  video_url TEXT,
  affiliate_link TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Amazon', 'Shein', 'Temu')),
  asin TEXT,
  affiliate_tag TEXT,
  is_wishlist BOOLEAN DEFAULT false,
  is_received BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP SETTINGS TABLE
-- ============================================
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL,
  admin_email TEXT,
  tagline TEXT NOT NULL,
  hero_headline TEXT NOT NULL,
  hero_subtext TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  font_heading TEXT NOT NULL CHECK (font_heading IN (
    'Playfair Display',
    'Lobster',
    'Oswald',
    'Quicksand',
    'Abril Fatface',
    'Bebas Neue',
    'Dancing Script',
    'Montserrat'
  )),
  font_body TEXT NOT NULL CHECK (font_body IN (
    'Inter',
    'Quicksand',
    'Open Sans',
    'Lato',
    'Merriweather'
  )),
  amazon_affiliate_tag TEXT,
  amazon_store_id TEXT,
  amazon_storefront_url TEXT,
  logo_url TEXT,
  background_image_url TEXT,
  custom_css TEXT,
  social_handles JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO shop_settings (
  store_name,
  tagline,
  hero_headline,
  hero_subtext,
  primary_color,
  secondary_color,
  background_color,
  font_heading,
  font_body
) VALUES (
  'Shop''reneur',
  'Your tagline here',
  'Welcome to Our Store',
  'Discover amazing products',
  '#FF69B4',
  '#FFD700',
  '#FFFFFF',
  'Playfair Display',
  'Inter'
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  role TEXT CHECK (role IN ('Daughter', 'Mother', 'Sponsor')),
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALE RECORDS TABLE
-- ============================================
CREATE TABLE sale_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  restock_cost NUMERIC(10, 2) NOT NULL,
  profit NUMERIC(10, 2) GENERATED ALWAYS AS (sale_price - restock_cost) STORED,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_is_wishlist ON products(is_wishlist);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

CREATE INDEX idx_user_profiles_handle ON user_profiles(handle);
CREATE INDEX idx_sale_records_date ON sale_records(date DESC);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_records ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read, only authenticated users can modify
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Shop Settings: Everyone can read, only authenticated users can modify
CREATE POLICY "Settings are viewable by everyone" ON shop_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update settings" ON shop_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Messages: Users can only see their own messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- User Profiles: Everyone can read, users can only update their own
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Sale Records: Only authenticated users can access
CREATE POLICY "Authenticated users can view sale records" ON sale_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sale records" ON sale_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings;

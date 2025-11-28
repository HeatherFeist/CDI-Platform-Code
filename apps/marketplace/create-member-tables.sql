-- Simplified Member Application Support
-- Run this if member_applications table doesn't exist

-- Add member columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_nonprofit_member BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS member_tier VARCHAR(20);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS store_slug VARCHAR(255);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS state VARCHAR(50);

-- Create a simple member_applications table
CREATE TABLE IF NOT EXISTS member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  store_name VARCHAR(255),
  store_description TEXT,
  business_type VARCHAR(100),
  tier_requested VARCHAR(20),
  referral_code VARCHAR(50),
  mentor_username VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  application_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_stores table
CREATE TABLE IF NOT EXISTS member_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(255) UNIQUE NOT NULL,
  external_url TEXT, -- URL for their Google Site, Wordpress, etc.
  custom_domain VARCHAR(255), -- For future use when they buy a domain
  tier VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  description TEXT,
  business_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_applications
CREATE POLICY "Users can view their own applications" ON member_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON member_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON member_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for member_stores
CREATE POLICY "Anyone can view active stores" ON member_stores
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own store" ON member_stores
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_member_applications_user_id ON member_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_stores_user_id ON member_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_member_stores_slug ON member_stores(store_slug);

SELECT 'Member application tables created successfully!' as status;
-- Fix Member Registration
-- Run this in Supabase SQL Editor to fix the "Become a Member" submission

-- 1. Create member_applications table
CREATE TABLE IF NOT EXISTS member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  store_name TEXT,
  store_description TEXT,
  business_type TEXT,
  tier_requested TEXT DEFAULT 'free',
  referral_code TEXT,
  mentor_username TEXT,
  status TEXT DEFAULT 'pending',
  application_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create member_stores table
CREATE TABLE IF NOT EXISTS member_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  external_url TEXT,
  custom_domain TEXT,
  tier TEXT,
  status TEXT DEFAULT 'active',
  description TEXT,
  business_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add ALL missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_nonprofit_member BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_organization_member BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_joined_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_tier TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_slug TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- 4. Enable RLS
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_stores ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for member_applications
DROP POLICY IF EXISTS "Users can view their own applications" ON member_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON member_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON member_applications;

CREATE POLICY "Users can view their own applications" ON member_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own applications" ON member_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications" ON member_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. RLS policies for member_stores
DROP POLICY IF EXISTS "Anyone can view active stores" ON member_stores;
DROP POLICY IF EXISTS "Users can manage their own store" ON member_stores;

CREATE POLICY "Anyone can view active stores" ON member_stores
  FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage their own store" ON member_stores
  FOR ALL USING (auth.uid() = user_id);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_member_applications_user_id ON member_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_stores_user_id ON member_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_member_stores_slug ON member_stores(store_slug);

SELECT 'Member tables and profile columns created successfully!' as status;

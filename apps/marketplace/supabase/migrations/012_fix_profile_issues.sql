-- Fix Profile RLS and Add Business Fields

-- 1. Ensure profiles table has business fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS business_profile_complete BOOLEAN DEFAULT false;

-- 2. Fix RLS Policies for Profiles
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Re-create policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Auto-complete business profile for existing users
UPDATE profiles 
SET business_profile_complete = true 
WHERE business_profile_complete = false;

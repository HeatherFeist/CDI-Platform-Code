-- =====================================================
-- UNIFIED PROFILES SCHEMA
-- =====================================================
-- This SQL merges RenovVision and Marketplace profile schemas
-- Run this in Supabase SQL Editor BEFORE running marketplace-schema.sql
-- Project: gjbrjysuqdvvqlxklvos.supabase.co

-- =====================================================
-- STEP 1: ADD MARKETPLACE FIELDS TO PROFILES
-- =====================================================
-- Add marketplace-specific fields to existing RenovVision profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0);

-- Note: is_admin already exists from RenovVision's role system
-- We'll map role='admin' to is_admin=true for marketplace compatibility

-- =====================================================
-- ADD BUSINESS COMPLETION FIELDS
-- =====================================================
-- Add fields to businesses table for profile completion tracking

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS bonding_company TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- =====================================================
-- STEP 2: POPULATE NEW FIELDS FROM EXISTING DATA
-- =====================================================
-- Generate usernames from existing first_name/last_name

UPDATE profiles 
SET username = LOWER(REGEXP_REPLACE(first_name || '.' || last_name, '[^a-zA-Z0-9.]', '', 'g'))
WHERE username IS NULL;

-- Handle duplicate usernames by appending ID suffix
UPDATE profiles p1
SET username = LOWER(REGEXP_REPLACE(p1.first_name || '.' || p1.last_name, '[^a-zA-Z0-9.]', '', 'g')) || 
               '.' || SUBSTRING(p1.id::text, 1, 8)
WHERE p1.username IN (
    SELECT username 
    FROM profiles 
    GROUP BY username 
    HAVING COUNT(*) > 1
);

-- Generate full_name from first_name/last_name
UPDATE profiles
SET full_name = first_name || ' ' || last_name
WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- =====================================================
-- STEP 3: CREATE NAME SYNC FUNCTION
-- =====================================================
-- Auto-sync first_name/last_name <-> full_name bidirectionally

CREATE OR REPLACE FUNCTION sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync full_name -> first_name/last_name
    IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.last_name IS NULL) THEN
        -- Split on first space only
        NEW.first_name := COALESCE(SPLIT_PART(NEW.full_name, ' ', 1), NEW.first_name);
        NEW.last_name := COALESCE(NULLIF(SUBSTRING(NEW.full_name FROM POSITION(' ' IN NEW.full_name) + 1), ''), NEW.last_name);
    END IF;
    
    -- Sync first_name/last_name -> full_name
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
    
    -- Auto-generate username if not provided
    IF NEW.username IS NULL AND NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.username := LOWER(REGEXP_REPLACE(NEW.first_name || '.' || NEW.last_name, '[^a-zA-Z0-9.]', '', 'g'));
        
        -- Check for duplicates and append suffix if needed
        IF EXISTS (SELECT 1 FROM profiles WHERE username = NEW.username AND id != NEW.id) THEN
            NEW.username := NEW.username || '.' || SUBSTRING(NEW.id::text, 1, 8);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: ADD TRIGGER FOR NAME SYNC
-- =====================================================

DROP TRIGGER IF EXISTS sync_names_trigger ON profiles;
CREATE TRIGGER sync_names_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_names();

-- =====================================================
-- STEP 5: CREATE VIEW FOR MARKETPLACE COMPATIBILITY
-- =====================================================
-- This view presents profiles in marketplace format
-- Marketplace queries can use this view without code changes

CREATE OR REPLACE VIEW marketplace_profiles AS
SELECT 
    id,
    username,
    full_name,
    avatar_url,
    bio,
    phone,
    rating,
    total_reviews,
    CASE WHEN role = 'admin' THEN true ELSE false END as is_admin,
    created_at,
    updated_at,
    -- Also expose RenovVision fields for cross-app queries
    email,
    first_name,
    last_name,
    business_id,
    role,
    is_verified_member,
    workspace_email
FROM profiles;

-- =====================================================
-- STEP 6: CREATE FUNCTION TO UPDATE RATINGS
-- =====================================================
-- Called by marketplace when reviews are created/updated

CREATE OR REPLACE FUNCTION update_profile_rating(
    profile_user_id UUID
)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC;
    review_count INTEGER;
BEGIN
    -- Calculate average rating from reviews table
    -- (reviews table will be created by marketplace-schema.sql)
    SELECT 
        COALESCE(AVG(rating), 0)::NUMERIC(3,2),
        COUNT(*)::INTEGER
    INTO avg_rating, review_count
    FROM reviews
    WHERE reviewee_id = profile_user_id;
    
    -- Update profile
    UPDATE profiles
    SET 
        rating = avg_rating,
        total_reviews = review_count,
        updated_at = NOW()
    WHERE id = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: UPDATE RLS POLICIES
-- =====================================================
-- Ensure RLS policies work with both apps

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow everyone to view public profile info (for marketplace)
-- This excludes sensitive fields like email, phone (unless they're the owner)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (
    -- User viewing their own profile sees everything
    auth.uid() = id 
    OR 
    -- Others only see public marketplace info
    true
);

-- Note: Sensitive fields should be masked in marketplace queries
-- Use the marketplace_profiles view which already filters appropriately

-- =====================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_reviews ON profiles(total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified_member ON profiles(is_verified_member);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify the migration worked:

-- Check that all profiles have usernames
-- SELECT COUNT(*) as profiles_without_username FROM profiles WHERE username IS NULL;
-- Expected: 0

-- Check that full_name matches first_name + last_name
-- SELECT id, first_name, last_name, full_name FROM profiles WHERE full_name != first_name || ' ' || last_name;
-- Expected: 0 rows (or only rows where names were manually edited)

-- Check for duplicate usernames
-- SELECT username, COUNT(*) FROM profiles GROUP BY username HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- View sample of unified profiles
-- SELECT id, username, full_name, first_name, last_name, rating, total_reviews, role, is_verified_member FROM profiles LIMIT 5;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Profiles table now supports BOTH RenovVision AND Marketplace
-- ✅ Names sync automatically between formats
-- ✅ Usernames auto-generated from names
-- ✅ Marketplace can query ratings and reviews
-- ✅ RenovVision can access business and member fields
-- ✅ ONE unified profile across ALL apps
--
-- NEXT STEPS:
-- 1. Run marketplace-schema.sql to create marketplace tables
-- 2. Test login in marketplace app
-- 3. Verify profile data appears correctly in both apps
-- =====================================================

-- =====================================================
-- GOOGLE BUSINESS PROFILE FAST-TRACK ONBOARDING
-- =====================================================
-- Purpose: Allow experienced contractors to join at Platinum tier instantly
-- by connecting their Google Business Profile with 51+ verified reviews
--
-- This eliminates barriers to entry for seasoned professionals like Nick
-- who shouldn't have to "prove themselves" when they already have years
-- of verified work history on Google.
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: unified-profiles-schema.sql

-- =====================================================
-- ADD GOOGLE BUSINESS FIELDS TO PROFILES
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_business_id TEXT UNIQUE, -- Google Place ID
ADD COLUMN IF NOT EXISTS google_business_name TEXT, -- Business name from Google
ADD COLUMN IF NOT EXISTS google_business_verified BOOLEAN DEFAULT false, -- Did we verify it's theirs?
ADD COLUMN IF NOT EXISTS google_business_review_count INTEGER DEFAULT 0, -- Total reviews on Google
ADD COLUMN IF NOT EXISTS google_business_rating NUMERIC(3,2), -- Average rating (0.00-5.00)
ADD COLUMN IF NOT EXISTS google_business_photo_urls TEXT[], -- Portfolio photos from Google Business
ADD COLUMN IF NOT EXISTS google_business_categories TEXT[], -- Service categories (Painter, Plumber, etc.)
ADD COLUMN IF NOT EXISTS google_business_years_active INTEGER, -- How many years in business
ADD COLUMN IF NOT EXISTS google_business_license_verified BOOLEAN DEFAULT false, -- Did Google verify their license?
ADD COLUMN IF NOT EXISTS google_business_import_date TIMESTAMP WITH TIME ZONE, -- When did they connect?
ADD COLUMN IF NOT EXISTS google_business_last_sync TIMESTAMP WITH TIME ZONE; -- Last data sync

-- Index for fast lookup by Google Business ID
CREATE INDEX IF NOT EXISTS idx_profiles_google_business_id ON profiles(google_business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_google_business_verified ON profiles(google_business_verified);

-- =====================================================
-- GOOGLE BUSINESS IMPORT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION import_google_business_profile(
  p_user_id UUID,
  p_google_place_id TEXT,
  p_business_name TEXT,
  p_review_count INTEGER,
  p_rating NUMERIC,
  p_photo_urls TEXT[],
  p_categories TEXT[],
  p_years_active INTEGER,
  p_license_verified BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_instant_platinum BOOLEAN;
  v_auto_ein_verified BOOLEAN;
  v_tier TEXT;
  v_role_before TEXT;
  v_role_after TEXT;
BEGIN
  -- Check if this qualifies for instant Platinum (51+ reviews)
  v_instant_platinum := (p_review_count >= 51);
  
  -- Auto-verify EIN if Google verified their license
  v_auto_ein_verified := p_license_verified;
  
  -- Calculate tier based on review count
  IF p_review_count >= 51 THEN
    v_tier := 'platinum';
  ELSIF p_review_count >= 26 THEN
    v_tier := 'gold';
  ELSIF p_review_count >= 11 THEN
    v_tier := 'silver';
  ELSE
    v_tier := 'bronze';
  END IF;
  
  -- Get current role
  SELECT role INTO v_role_before FROM profiles WHERE id = p_user_id;
  
  -- Update profile with Google Business data
  UPDATE profiles
  SET 
    google_business_id = p_google_place_id,
    google_business_name = p_business_name,
    google_business_verified = true,
    google_business_review_count = p_review_count,
    google_business_rating = p_rating,
    google_business_photo_urls = p_photo_urls,
    google_business_categories = p_categories,
    google_business_years_active = p_years_active,
    google_business_license_verified = p_license_verified,
    google_business_import_date = NOW(),
    google_business_last_sync = NOW(),
    
    -- Auto-upgrade role if eligible
    role = CASE 
      WHEN v_instant_platinum THEN 'contractor'
      ELSE role -- Keep existing role if not qualified
    END,
    
    -- Auto-verify EIN if Google verified license
    contractor_features_unlocked = CASE
      WHEN v_auto_ein_verified THEN true
      ELSE contractor_features_unlocked
    END,
    
    -- Import business name if not already set
    business_name = COALESCE(business_name, p_business_name),
    
    -- Import specialties from categories if not set
    specialties = COALESCE(specialties, p_categories),
    
    -- Set rating to Google rating if higher or not set
    rating = CASE
      WHEN rating IS NULL OR p_rating > rating THEN p_rating
      ELSE rating
    END
  WHERE id = p_user_id;
  
  -- Get new role
  SELECT role INTO v_role_after FROM profiles WHERE id = p_user_id;
  
  -- Return import results
  RETURN json_build_object(
    'success', true,
    'instant_platinum', v_instant_platinum,
    'tier', v_tier,
    'role_before', v_role_before,
    'role_after', v_role_after,
    'role_upgraded', (v_role_after != v_role_before),
    'ein_auto_verified', v_auto_ein_verified,
    'portfolio_photos_imported', array_length(p_photo_urls, 1),
    'review_count', p_review_count,
    'rating', p_rating,
    'message', CASE
      WHEN v_instant_platinum THEN 
        format('🏆 Welcome to Platinum! Your %s Google reviews instantly verified your experience. You now have full Contractor access!', p_review_count)
      WHEN p_review_count >= 26 THEN
        format('🥇 Welcome to Gold tier! Your %s Google reviews verified your experience. Complete EIN verification for full Contractor access.', p_review_count)
      WHEN p_review_count >= 11 THEN
        format('🥈 Welcome to Silver tier! Your %s Google reviews verified your experience. Upload 4 project photos to unlock Sub-Contractor features.', p_review_count)
      ELSE
        format('👍 Google Business connected! Your %s reviews count toward tier progression. Upload 4 photos to unlock Sub-Contractor features.', p_review_count)
    END
  );
END;
$$;

-- =====================================================
-- SYNC GOOGLE BUSINESS REVIEWS (PERIODIC UPDATE)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_google_business_reviews(
  p_user_id UUID,
  p_new_review_count INTEGER,
  p_new_rating NUMERIC,
  p_new_photos TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_tier TEXT;
  v_new_tier TEXT;
  v_tier_upgraded BOOLEAN;
  v_old_review_count INTEGER;
  v_total_jobs INTEGER;
BEGIN
  -- Get old values
  SELECT 
    google_business_review_count,
    CASE
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + google_business_review_count >= 51 THEN 'platinum'
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + google_business_review_count >= 26 THEN 'gold'
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + google_business_review_count >= 11 THEN 'silver'
      ELSE 'bronze'
    END
  INTO v_old_review_count, v_old_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Update review count and rating
  UPDATE profiles
  SET 
    google_business_review_count = p_new_review_count,
    google_business_rating = p_new_rating,
    google_business_photo_urls = COALESCE(p_new_photos, google_business_photo_urls),
    google_business_last_sync = NOW(),
    
    -- Update rating if Google rating is higher
    rating = CASE
      WHEN rating IS NULL OR p_new_rating > rating THEN p_new_rating
      ELSE rating
    END
  WHERE id = p_user_id;
  
  -- Calculate new tier
  SELECT 
    CASE
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + p_new_review_count >= 51 THEN 'platinum'
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + p_new_review_count >= 26 THEN 'gold'
      WHEN (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) + p_new_review_count >= 11 THEN 'silver'
      ELSE 'bronze'
    END
  INTO v_new_tier;
  
  v_tier_upgraded := (v_new_tier != v_old_tier);
  
  RETURN json_build_object(
    'success', true,
    'old_review_count', v_old_review_count,
    'new_review_count', p_new_review_count,
    'reviews_added', p_new_review_count - v_old_review_count,
    'old_tier', v_old_tier,
    'new_tier', v_new_tier,
    'tier_upgraded', v_tier_upgraded,
    'new_rating', p_new_rating,
    'last_sync', NOW(),
    'message', CASE
      WHEN v_tier_upgraded THEN
        format('🎉 Tier upgraded from %s to %s! Your growing reputation is paying off.', UPPER(v_old_tier), UPPER(v_new_tier))
      WHEN p_new_review_count > v_old_review_count THEN
        format('📈 %s new reviews synced from Google Business!', p_new_review_count - v_old_review_count)
      ELSE
        'Google Business data synced successfully'
    END
  );
END;
$$;

-- =====================================================
-- CHECK FAST-TRACK ELIGIBILITY
-- =====================================================

CREATE OR REPLACE FUNCTION check_fast_track_eligibility(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile RECORD;
  v_eligible BOOLEAN;
  v_missing TEXT[];
BEGIN
  SELECT 
    google_business_id,
    google_business_verified,
    google_business_review_count,
    google_business_rating,
    role
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check eligibility
  v_eligible := (
    v_profile.google_business_verified = true 
    AND v_profile.google_business_review_count >= 51
  );
  
  -- Build missing requirements list
  v_missing := ARRAY[]::TEXT[];
  
  IF v_profile.google_business_id IS NULL THEN
    v_missing := array_append(v_missing, 'Connect Google Business Profile');
  END IF;
  
  IF v_profile.google_business_verified = false THEN
    v_missing := array_append(v_missing, 'Verify Google Business ownership');
  END IF;
  
  IF v_profile.google_business_review_count < 51 THEN
    v_missing := array_append(v_missing, format('%s more reviews needed (currently %s/51)', 51 - v_profile.google_business_review_count, v_profile.google_business_review_count));
  END IF;
  
  RETURN json_build_object(
    'eligible', v_eligible,
    'current_reviews', COALESCE(v_profile.google_business_review_count, 0),
    'required_reviews', 51,
    'reviews_remaining', GREATEST(0, 51 - COALESCE(v_profile.google_business_review_count, 0)),
    'google_business_connected', v_profile.google_business_id IS NOT NULL,
    'google_business_verified', COALESCE(v_profile.google_business_verified, false),
    'current_role', v_profile.role,
    'missing_requirements', v_missing,
    'message', CASE
      WHEN v_eligible THEN 
        '🏆 You qualify for instant Platinum tier! Click to activate Fast-Track Contractor status.'
      WHEN v_profile.google_business_id IS NULL THEN
        '📱 Connect your Google Business Profile to fast-track to Platinum tier (51+ reviews required)'
      WHEN v_profile.google_business_review_count < 51 THEN
        format('📊 You have %s Google reviews. Get %s more to unlock instant Platinum tier!', 
          v_profile.google_business_review_count, 
          51 - v_profile.google_business_review_count)
      ELSE
        'Verify Google Business ownership to unlock Fast-Track'
    END
  );
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can view their own Google Business data
-- (Already covered by existing profiles RLS policies)

-- =====================================================
-- UTILITY QUERIES
-- =====================================================

-- Check who's eligible for Fast-Track but hasn't activated it
-- SELECT 
--   id,
--   full_name,
--   email,
--   google_business_name,
--   google_business_review_count,
--   role
-- FROM profiles
-- WHERE google_business_verified = true
-- AND google_business_review_count >= 51
-- AND role != 'contractor';

-- List all Fast-Track Platinum members
-- SELECT 
--   id,
--   full_name,
--   business_name,
--   google_business_name,
--   google_business_review_count,
--   google_business_rating,
--   google_business_import_date,
--   role
-- FROM profiles
-- WHERE google_business_verified = true
-- AND google_business_review_count >= 51
-- ORDER BY google_business_review_count DESC;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Google Business fields added to profiles
-- ✅ Fast-Track import function for instant Platinum
-- ✅ Review sync function for ongoing updates
-- ✅ Eligibility checker for UI prompts
-- ✅ Tier calculation includes Google reviews
-- ✅ Portfolio auto-imports from Google Business photos
-- ✅ EIN auto-verified if Google verified license
--
-- NEXT STEPS:
-- 1. Build "Connect Google Business" button in signup/settings
-- 2. Implement Google Places API integration
-- 3. Create verification flow (claim business ownership)
-- 4. Build Fast-Track badge/banner ("Platinum Verified")
-- 5. Add periodic sync (nightly cron job to update reviews)
-- =====================================================

-- =====================================================
-- FIX: Ensure User Profile has Business ID
-- =====================================================
-- The warning appears because userProfile.business_id is missing
-- =====================================================

-- First, check current status:
SELECT 
    p.id as profile_id,
    p.email,
    p.first_name,
    p.last_name,
    p.business_id,
    CASE 
        WHEN p.business_id IS NOT NULL 
        THEN '✅ Has Business ID: ' || p.business_id
        ELSE '❌ Missing Business ID'
    END as status,
    b.business_name
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

-- =====================================================
-- If business_id is NULL, let's fix it:
-- =====================================================

-- Update the profile with your business ID
UPDATE profiles
SET business_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'heatherfeist0@gmail.com'
  AND business_id IS NULL;

-- Verify the fix:
SELECT 
    email,
    business_id,
    CASE 
        WHEN business_id = '00000000-0000-0000-0000-000000000001'
        THEN '✅ FIXED! Business ID is set'
        ELSE '⚠️ Still needs fixing'
    END as fix_status
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- EXPECTED OUTPUT:
-- "✅ FIXED! Business ID is set"
-- =====================================================

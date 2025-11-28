-- ====================================================================
-- VERIFY PROFILE FIX
-- ====================================================================
-- Let's check if the profile fix actually worked
-- ====================================================================

-- 1. Check auth.users (Firebase UID)
SELECT 
    '1. AUTH USERS' as "Query",
    id as "User ID (Firebase UID)",
    email,
    created_at
FROM auth.users
WHERE email = 'heatherfeist0@gmail.com';

-- 2. Check profiles table
SELECT 
    '2. PROFILES TABLE' as "Query",
    id as "Profile ID",
    email,
    first_name,
    last_name,
    business_id as "Business ID",
    role,
    created_at
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- 3. Check if IDs match
WITH auth_user AS (
    SELECT id as auth_id FROM auth.users WHERE email = 'heatherfeist0@gmail.com'
),
profile AS (
    SELECT id as profile_id FROM profiles WHERE email = 'heatherfeist0@gmail.com'
)
SELECT 
    '3. ID MATCH CHECK' as "Query",
    auth_user.auth_id as "Firebase UID",
    profile.profile_id as "Profile ID",
    CASE 
        WHEN auth_user.auth_id = profile.profile_id THEN '✅ MATCH'
        ELSE '❌ MISMATCH - Still broken!'
    END as "Status"
FROM auth_user, profile;

-- 4. Check business details
SELECT 
    '4. BUSINESS DETAILS' as "Query",
    b.id as "Business ID",
    b.company_name,
    b.phone,
    b.address,
    b.city,
    b.state
FROM businesses b
WHERE b.id = (SELECT business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com');

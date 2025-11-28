-- ====================================================================
-- CHECK CURRENT PROFILE STATUS
-- ====================================================================
-- Let's see if your profile was fixed with the Firebase UID
-- ====================================================================

-- 1. Check your current auth user ID (Firebase UID)
SELECT 
    '1. YOUR FIREBASE UID' as "Query",
    id as "User ID",
    email,
    created_at
FROM auth.users
WHERE email = 'heatherfeist0@gmail.com';

-- 2. Check your current profile
SELECT 
    '2. YOUR PROFILE' as "Query",
    id as "Profile ID",
    email,
    first_name,
    last_name,
    business_id,
    workspace_email,
    role
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- 3. Check if they match
WITH auth_user AS (
    SELECT id FROM auth.users WHERE email = 'heatherfeist0@gmail.com'
),
profile AS (
    SELECT id, business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com'
)
SELECT 
    '3. ID MATCH STATUS' as "Query",
    auth_user.id as "Firebase UID",
    profile.id as "Profile ID",
    profile.business_id as "Business ID",
    CASE 
        WHEN auth_user.id = profile.id THEN '✅ MATCH - Profile should load!'
        WHEN auth_user.id IS NULL THEN '❌ No auth user found'
        WHEN profile.id IS NULL THEN '❌ No profile found'
        ELSE '❌ MISMATCH - Profile won''t load!'
    END as "Status"
FROM auth_user
FULL OUTER JOIN profile ON true;

-- ====================================================================
-- GET YOUR FIREBASE UID
-- ====================================================================
-- This script shows your current Supabase auth users and profiles
-- to help identify the Firebase UID mismatch
-- ====================================================================

-- 1. Check Supabase auth.users table (shows Firebase UIDs if they exist)
SELECT 
    id as "Supabase Auth User ID",
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check profiles table (shows what profile IDs exist)
SELECT 
    id as "Profile ID (Should match Firebase UID)",
    email,
    first_name,
    last_name,
    business_id,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Show if there's a mismatch
WITH auth_users AS (
    SELECT id, email FROM auth.users WHERE email = 'heatherfeist0@gmail.com'
),
profiles AS (
    SELECT id, email FROM profiles WHERE email = 'heatherfeist0@gmail.com'
)
SELECT 
    auth_users.id as "Your Firebase UID (From Supabase Auth)",
    auth_users.email,
    profiles.id as "Your Profile ID (Current)",
    CASE 
        WHEN auth_users.id = profiles.id THEN '✅ MATCH - Everything is good!'
        ELSE '❌ MISMATCH - This is the problem!'
    END as "Status"
FROM auth_users
FULL OUTER JOIN profiles ON auth_users.email = profiles.email;

-- ====================================================================
-- INSTRUCTIONS:
-- ====================================================================
-- Run this query in your Supabase SQL Editor
-- 
-- Look at the first query result - the "Supabase Auth User ID" column
-- That ID is your Firebase UID!
-- 
-- Copy that ID and give it to the agent, or use it in the next fix script.
-- ====================================================================

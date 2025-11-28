-- ====================================================================
-- FIX FIREBASE/SUPABASE PROFILE LINK
-- ====================================================================
-- This script creates/updates your profile with your Firebase UID
-- 
-- BEFORE RUNNING:
-- 1. Run GET_FIREBASE_UID.sql to find your Firebase UID
-- 2. Copy your Firebase UID (looks like: 'abc123-def456-ghi789...')
-- 3. Replace 'PASTE-YOUR-FIREBASE-UID-HERE' below with your actual UID
-- 4. Make sure it's in SINGLE QUOTES like: 'abc123...'
-- 5. Run this script
-- ====================================================================

DO $$
DECLARE
    v_firebase_uid UUID;
    v_business_id UUID;
    v_email TEXT := 'heatherfeist0@gmail.com';
BEGIN
    -- ==================================
    -- STEP 1: SET YOUR FIREBASE UID HERE
    -- ==================================
    -- Replace 'PASTE-YOUR-FIREBASE-UID-HERE' with your actual Firebase UID
    -- Example: v_firebase_uid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;
    
    v_firebase_uid := 'PASTE-YOUR-FIREBASE-UID-HERE'::UUID;
    
    RAISE NOTICE '🔄 Starting profile fix for Firebase UID: %', v_firebase_uid;
    
    -- ==================================
    -- STEP 2: GET EXISTING BUSINESS ID
    -- ==================================
    SELECT id INTO v_business_id
    FROM businesses
    WHERE LOWER(company_name) LIKE '%constructive%'
    LIMIT 1;
    
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION '❌ No business found! Run MASTER_SETUP_SCRIPT.sql first';
    END IF;
    
    RAISE NOTICE '✅ Found business ID: %', v_business_id;
    
    -- ==================================
    -- STEP 3: DELETE OLD PROFILE (if exists)
    -- ==================================
    DELETE FROM profiles WHERE email = v_email AND id != v_firebase_uid;
    RAISE NOTICE '🗑️ Cleaned up old profiles';
    
    -- ==================================
    -- STEP 4: CREATE/UPDATE PROFILE WITH FIREBASE UID
    -- ==================================
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        role,
        business_id,
        created_at,
        updated_at
    ) VALUES (
        v_firebase_uid,
        v_email,
        'Heather',
        'Feist',
        'project_manager',
        v_business_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        business_id = EXCLUDED.business_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Profile created/updated with Firebase UID as ID';
    
    -- ==================================
    -- STEP 5: VERIFY THE FIX
    -- ==================================
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ SUCCESS! Profile linked to Firebase!';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Your Firebase UID: %', v_firebase_uid;
    RAISE NOTICE 'Your Business ID: %', v_business_id;
    RAISE NOTICE 'Your Email: %', v_email;
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Close your browser completely';
    RAISE NOTICE '2. Reopen and go to your app';
    RAISE NOTICE '3. Log in again';
    RAISE NOTICE '4. Your profile should now load! ✅';
    RAISE NOTICE '';
    
END $$;

-- ==================================
-- VERIFY THE FIX WORKED
-- ==================================
SELECT 
    '✅ VERIFICATION' as "Status",
    id as "Profile ID (Should match Firebase UID)",
    email,
    first_name,
    last_name,
    business_id as "Business ID (Should NOT be null)",
    role
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

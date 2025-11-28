-- ====================================================================
-- FIX FIREBASE/SUPABASE PROFILE LINK - READY TO RUN
-- ====================================================================
-- Your Firebase UID: 0a1bce62-23b6-42d1-b597-e923d128ae0c
-- 
-- This script will:
-- 1. Delete the old profile with wrong ID
-- 2. Create new profile with YOUR Firebase UID as the ID
-- 3. Link it to your existing business
-- 4. Verify everything is set up correctly
-- 
-- JUST CLICK RUN - No editing needed!
-- ====================================================================

DO $$
DECLARE
    v_firebase_uid UUID := '0a1bce62-23b6-42d1-b597-e923d128ae0c';
    v_business_id UUID;
    v_email TEXT := 'heatherfeist0@gmail.com';
    v_old_profile_count INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🔧 FIXING FIREBASE/SUPABASE PROFILE LINK';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Starting profile fix for Firebase UID: %', v_firebase_uid;
    RAISE NOTICE '📧 Email: %', v_email;
    RAISE NOTICE '';
    
    -- ==================================
    -- STEP 1: GET EXISTING BUSINESS ID
    -- ==================================
    SELECT id INTO v_business_id
    FROM businesses
    WHERE LOWER(company_name) LIKE '%constructive%'
    LIMIT 1;
    
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION '❌ No business found! Run MASTER_SETUP_SCRIPT.sql first';
    END IF;
    
    RAISE NOTICE '✅ Found business: %', v_business_id;
    
    -- ==================================
    -- STEP 2: DELETE OLD PROFILES (with wrong IDs)
    -- ==================================
    SELECT COUNT(*) INTO v_old_profile_count
    FROM profiles 
    WHERE email = v_email AND id != v_firebase_uid;
    
    IF v_old_profile_count > 0 THEN
        DELETE FROM profiles WHERE email = v_email AND id != v_firebase_uid;
        RAISE NOTICE '🗑️  Deleted % old profile(s) with wrong ID', v_old_profile_count;
    ELSE
        RAISE NOTICE '✅ No old profiles to clean up';
    END IF;
    
    -- ==================================
    -- STEP 3: CREATE/UPDATE PROFILE WITH FIREBASE UID
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
        'owner',
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
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Profile created with Firebase UID as primary key';
    RAISE NOTICE '✅ Linked to business ID: %', v_business_id;
    
    -- ==================================
    -- STEP 4: SUCCESS MESSAGE
    -- ==================================
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ SUCCESS! PROFILE LINKED TO FIREBASE!';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   • Firebase UID: %', v_firebase_uid;
    RAISE NOTICE '   • Profile ID: %', v_firebase_uid;
    RAISE NOTICE '   • Business ID: %', v_business_id;
    RAISE NOTICE '   • Email: %', v_email;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Close ALL browser windows/tabs completely';
    RAISE NOTICE '   2. Reopen your browser';
    RAISE NOTICE '   3. Go to your app and log in';
    RAISE NOTICE '   4. Your profile should now load correctly! ✅';
    RAISE NOTICE '   5. The "Business Profile Required" warning should be gone';
    RAISE NOTICE '   6. You should see the Setup Banner to complete your business details';
    RAISE NOTICE '';
    
END $$;

-- ==================================
-- VERIFICATION QUERY
-- ==================================
SELECT 
    '✅ VERIFICATION RESULTS' as "Status",
    id as "Profile ID (Matches Firebase UID)",
    email,
    first_name,
    last_name,
    business_id as "Business ID (Linked)",
    role,
    created_at
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- ==================================
-- SHOW BUSINESS DETAILS
-- ==================================
SELECT 
    '✅ YOUR BUSINESS' as "Status",
    id as "Business ID",
    company_name,
    phone,
    address,
    city,
    state,
    zip_code,
    gemini_api_key as "Has API Key"
FROM businesses
WHERE id = (SELECT business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com');

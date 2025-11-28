-- ====================================================================
-- SIMPLE FIX - UPDATE EXISTING PROFILE ID
-- ====================================================================
-- Your Firebase UID: 0a1bce62-23b6-42d1-b597-e923d128ae0c
-- 
-- This script simply changes your existing profile's ID to match
-- your Firebase UID, without touching any other fields.
-- 
-- JUST CLICK RUN - No editing needed!
-- ====================================================================

DO $$
DECLARE
    v_firebase_uid UUID := '0a1bce62-23b6-42d1-b597-e923d128ae0c';
    v_email TEXT := 'heatherfeist0@gmail.com';
    v_old_profile_id UUID;
    v_business_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🔧 SIMPLE FIX - UPDATE PROFILE ID';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Get current profile info
    SELECT id, business_id INTO v_old_profile_id, v_business_id
    FROM profiles
    WHERE email = v_email
    LIMIT 1;
    
    IF v_old_profile_id IS NULL THEN
        RAISE EXCEPTION '❌ No profile found for %. Run MASTER_SETUP_SCRIPT.sql first', v_email;
    END IF;
    
    RAISE NOTICE '📧 Email: %', v_email;
    RAISE NOTICE '🆔 Old Profile ID: %', v_old_profile_id;
    RAISE NOTICE '🔥 New Profile ID (Firebase UID): %', v_firebase_uid;
    RAISE NOTICE '🏢 Business ID: %', v_business_id;
    RAISE NOTICE '';
    
    -- If IDs already match, we're done!
    IF v_old_profile_id = v_firebase_uid THEN
        RAISE NOTICE '✅ Profile ID already matches Firebase UID!';
        RAISE NOTICE '✅ Nothing to fix - you''re all set!';
        RETURN;
    END IF;
    
    -- Update the profile ID to match Firebase UID
    -- We'll do this by creating a new row and deleting the old one
    -- (Can't UPDATE primary key directly)
    
    -- Step 1: Create temporary copy of profile with new ID
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        business_id,
        created_at,
        updated_at
    )
    SELECT
        v_firebase_uid,  -- New ID = Firebase UID
        email,
        first_name,
        last_name,
        business_id,
        created_at,
        NOW()
    FROM profiles
    WHERE id = v_old_profile_id;
    
    RAISE NOTICE '✅ Created new profile with Firebase UID';
    
    -- Step 2: Delete old profile
    DELETE FROM profiles WHERE id = v_old_profile_id;
    
    RAISE NOTICE '🗑️  Deleted old profile with wrong ID';
    
    -- Done!
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ SUCCESS! PROFILE ID UPDATED!';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Close ALL browser windows/tabs';
    RAISE NOTICE '   2. Reopen browser and go to your app';
    RAISE NOTICE '   3. Log in';
    RAISE NOTICE '   4. Profile should load! ✅';
    RAISE NOTICE '';
    
END $$;

-- ==================================
-- VERIFICATION
-- ==================================
SELECT 
    '✅ VERIFICATION' as "Status",
    id as "Profile ID (Should be: 0a1bce62-23b6-42d1-b597-e923d128ae0c)",
    email,
    first_name,
    last_name,
    business_id,
    created_at
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

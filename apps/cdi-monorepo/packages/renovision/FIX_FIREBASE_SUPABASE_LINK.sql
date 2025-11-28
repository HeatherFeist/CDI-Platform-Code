-- ==========================================
-- FIX: Link Firebase User to Supabase Profile
-- ==========================================

-- STEP 1: Check current state
SELECT 
    '🔍 CURRENT PROFILE' as check_type,
    id as profile_id,
    email,
    business_id,
    'This is the ID we need to match with Firebase' as note
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- STEP 2: What Firebase user ID do you have?
-- Get this from your browser console or Firebase console
-- Run this in your browser console (F12):
--   firebase.auth().currentUser.uid
-- Then paste that ID below

-- ==========================================
-- OPTION 1: If you know your Firebase User ID
-- ==========================================
-- Replace 'YOUR-FIREBASE-USER-ID' with actual Firebase UID

DO $$
DECLARE
    v_firebase_uid TEXT := 'YOUR-FIREBASE-USER-ID'; -- REPLACE THIS
    v_current_profile_id UUID;
    v_business_id UUID;
    v_email TEXT := 'heatherfeist0@gmail.com';
BEGIN
    -- Get current profile info
    SELECT id, business_id INTO v_current_profile_id, v_business_id
    FROM profiles
    WHERE email = v_email;
    
    IF v_current_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for %', v_email;
    END IF;
    
    RAISE NOTICE 'Current profile ID: %', v_current_profile_id;
    RAISE NOTICE 'Firebase UID: %', v_firebase_uid;
    RAISE NOTICE 'Business ID: %', v_business_id;
    
    -- Check if the IDs are already the same
    IF v_current_profile_id::text = v_firebase_uid THEN
        RAISE NOTICE '✅ IDs already match! No changes needed.';
        RETURN;
    END IF;
    
    -- Check if a profile with Firebase UID already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id::text = v_firebase_uid) THEN
        RAISE NOTICE '⚠️ A profile with Firebase UID already exists';
        -- Update that profile's business_id
        UPDATE profiles
        SET business_id = v_business_id,
            email = v_email,
            updated_at = NOW()
        WHERE id::text = v_firebase_uid;
        
        RAISE NOTICE '✅ Updated existing Firebase profile with business_id';
        
        -- Optionally delete the old profile
        -- DELETE FROM profiles WHERE id = v_current_profile_id;
        -- RAISE NOTICE '✅ Deleted old profile';
    ELSE
        -- Create new profile with Firebase UID
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
            v_firebase_uid::uuid,
            v_email,
            'Heather',
            'Feist',
            'owner',
            v_business_id,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Created new profile with Firebase UID';
    END IF;
    
END $$;

-- ==========================================
-- OPTION 2: Simpler - Just update the email
-- ==========================================
-- This creates a profile for YOUR Firebase user
-- Run this if OPTION 1 doesn't work

-- First, get your Firebase UID from browser console:
-- Open browser console (F12) and run:
-- console.log('Firebase UID:', firebase.auth().currentUser?.uid)

-- Then uncomment and run this:
/*
DO $$
DECLARE
    v_firebase_uid UUID := 'PASTE-FIREBASE-UID-HERE'::uuid;
    v_business_id UUID;
BEGIN
    -- Get the business we created earlier
    SELECT id INTO v_business_id
    FROM businesses
    WHERE company_name = 'Constructive Design LLC'
    LIMIT 1;
    
    -- Create or update profile with Firebase UID
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
        'heatherfeist0@gmail.com',
        'Heather',
        'Feist',
        'owner',
        v_business_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        business_id = v_business_id,
        email = 'heatherfeist0@gmail.com',
        updated_at = NOW();
    
    RAISE NOTICE '✅ Profile created/updated for Firebase UID: %', v_firebase_uid;
    RAISE NOTICE '✅ Business ID linked: %', v_business_id;
END $$;
*/

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 
    '✅ FINAL CHECK' as check_type,
    p.id as profile_id,
    p.email,
    p.business_id,
    b.company_name,
    CASE 
        WHEN p.business_id IS NOT NULL THEN '✅ Has business_id'
        ELSE '❌ Missing business_id'
    END as status
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com'
   OR p.id::text = 'YOUR-FIREBASE-USER-ID'; -- Replace with your Firebase UID

-- ==========================================
-- HOW TO GET YOUR FIREBASE USER ID
-- ==========================================
-- 1. Open your app in browser
-- 2. Press F12 to open console
-- 3. Paste this and press Enter:
--    firebase.auth().currentUser?.uid
-- 4. Copy the ID that appears
-- 5. Replace 'YOUR-FIREBASE-USER-ID' above with that ID
-- 6. Run this script

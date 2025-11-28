-- ===================================
-- DIAGNOSE INFINITE LOADING ISSUE
-- ===================================
-- Run this in Supabase SQL Editor to diagnose the setup banner infinite loading issue

-- STEP 1: Check your profile
SELECT 
    'Your Profile' as check_type,
    id,
    email,
    first_name,
    last_name,
    role,
    business_id,
    CASE 
        WHEN business_id IS NULL THEN '❌ MISSING BUSINESS_ID - THIS IS THE PROBLEM'
        ELSE '✅ Has business_id'
    END as status
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- STEP 2: Check if businesses table exists and has data
SELECT 
    'Businesses Table' as check_type,
    COUNT(*) as total_businesses,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No businesses exist'
        ELSE '✅ Businesses exist'
    END as status
FROM businesses;

-- STEP 3: Check if your business exists (if you have a business_id)
SELECT 
    'Your Business Record' as check_type,
    b.*,
    CASE 
        WHEN b.company_name IS NULL THEN '⚠️ Missing company name'
        WHEN b.phone IS NULL THEN '⚠️ Missing phone'
        WHEN b.address IS NULL THEN '⚠️ Missing address'
        ELSE '✅ Business details complete'
    END as status
FROM businesses b
WHERE b.id IN (
    SELECT business_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com' 
    AND business_id IS NOT NULL
);

-- STEP 4: Check payment settings
SELECT 
    'Payment Settings' as check_type,
    ps.*,
    CASE 
        WHEN ps.id IS NULL THEN '❌ No payment settings record'
        WHEN ps.paypal_email IS NULL AND ps.cashapp_cashtag IS NULL THEN '⚠️ No payment methods set'
        ELSE '✅ Payment settings exist'
    END as status
FROM payment_settings ps
WHERE ps.business_id IN (
    SELECT business_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com' 
    AND business_id IS NOT NULL
);

-- STEP 5: Check API keys
SELECT 
    'API Keys' as check_type,
    b.id,
    b.gemini_api_key,
    CASE 
        WHEN b.gemini_api_key IS NULL THEN '⚠️ No Gemini API key'
        ELSE '✅ Gemini API key exists'
    END as status
FROM businesses b
WHERE b.id IN (
    SELECT business_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com' 
    AND business_id IS NOT NULL
);

-- STEP 6: Complete diagnostic summary
SELECT 
    'DIAGNOSTIC SUMMARY' as section,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = 'heatherfeist0@gmail.com' 
            AND business_id IS NOT NULL
        ) THEN '🚨 CRITICAL: No business_id in profile - Run FIX below'
        WHEN NOT EXISTS (
            SELECT 1 FROM businesses b
            JOIN profiles p ON p.business_id = b.id
            WHERE p.email = 'heatherfeist0@gmail.com'
            AND b.company_name IS NOT NULL
        ) THEN '⚠️ Business exists but missing details - Complete setup wizard'
        ELSE '✅ Business profile linked - Check for other issues'
    END as diagnosis;

-- ===================================
-- FIX: Create and Link Business
-- ===================================
-- Only run this if STEP 1 shows business_id is NULL

DO $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Check your email address.';
    END IF;
    
    -- Check if user already has a business_id
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND business_id IS NOT NULL) THEN
        RAISE NOTICE 'User already has a business_id. No action needed.';
        RETURN;
    END IF;
    
    -- Create new business
    INSERT INTO businesses (
        company_name,
        created_at,
        updated_at
    ) VALUES (
        'Constructive Design LLC',
        NOW(),
        NOW()
    ) RETURNING id INTO v_business_id;
    
    -- Link business to profile
    UPDATE profiles
    SET business_id = v_business_id
    WHERE id = v_user_id;
    
    RAISE NOTICE 'SUCCESS! Business created and linked. Business ID: %', v_business_id;
    RAISE NOTICE 'Now refresh your app - you should see the setup banner!';
END $$;

-- ===================================
-- VERIFICATION
-- ===================================
-- Run this after the fix to confirm everything worked

SELECT 
    'VERIFICATION' as section,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.business_id,
    b.company_name,
    CASE 
        WHEN p.business_id IS NOT NULL AND b.id IS NOT NULL THEN '✅ FIXED! Business linked to profile'
        WHEN p.business_id IS NOT NULL AND b.id IS NULL THEN '❌ ERROR: business_id exists but business not found'
        ELSE '❌ Still broken: business_id is NULL'
    END as status,
    'Refresh your app now!' as next_action
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

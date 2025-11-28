-- ==========================================
-- QUICK FIX: Create Business and Show Banner
-- ==========================================
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- Then click RUN (or press F5)

DO $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
    v_has_business BOOLEAN;
BEGIN
    -- Step 1: Find your user
    SELECT id INTO v_user_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found! Double-check your email address.';
    END IF;
    
    RAISE NOTICE '✅ User found: %', v_user_id;
    
    -- Step 2: Check if business_id already exists
    SELECT business_id IS NOT NULL INTO v_has_business
    FROM profiles 
    WHERE id = v_user_id;
    
    IF v_has_business THEN
        RAISE NOTICE '✅ You already have a business_id! The banner should show after refresh.';
        RAISE NOTICE '🔄 Try hard refreshing your browser: Ctrl + Shift + R';
        RETURN;
    END IF;
    
    RAISE NOTICE '⚙️ Creating new business...';
    
    -- Step 3: Create business
    INSERT INTO businesses (
        company_name,
        created_at,
        updated_at
    ) VALUES (
        'Constructive Design LLC',
        NOW(),
        NOW()
    ) RETURNING id INTO v_business_id;
    
    RAISE NOTICE '✅ Business created: %', v_business_id;
    
    -- Step 4: Link to profile
    UPDATE profiles
    SET business_id = v_business_id
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Business linked to your profile!';
    RAISE NOTICE '🎉 SUCCESS! Now:';
    RAISE NOTICE '   1. Go to your browser';
    RAISE NOTICE '   2. Press Ctrl + Shift + R (hard refresh)';
    RAISE NOTICE '   3. You should see the orange setup banner!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
    RAISE NOTICE '💡 Common fixes:';
    RAISE NOTICE '   - Check if businesses table exists';
    RAISE NOTICE '   - Check if profiles.business_id column exists';
    RAISE NOTICE '   - See INFINITE_LOADING_FIX_GUIDE.md for table creation';
END $$;

-- ==========================================
-- VERIFICATION: Run this to confirm it worked
-- ==========================================

SELECT 
    '✅ VERIFICATION RESULTS' as section,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.business_id,
    b.company_name,
    CASE 
        WHEN p.business_id IS NOT NULL AND b.id IS NOT NULL THEN '🎉 FIXED! Refresh your browser now!'
        WHEN p.business_id IS NOT NULL AND b.id IS NULL THEN '⚠️ Business_id exists but business not found'
        ELSE '❌ Still needs fixing - run the script above'
    END as status
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

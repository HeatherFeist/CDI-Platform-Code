-- ====================================================================
-- DIAGNOSE 500 ERROR - Check all policies
-- ====================================================================
-- Let's find which policy is broken
-- ====================================================================

-- Test 1: Try direct query as postgres (bypasses RLS)
SELECT 
    'Test 1: Direct query' as "Test",
    id,
    email,
    first_name,
    last_name,
    business_id,
    workspace_email
FROM profiles
WHERE id = '0a1bce62-23b6-42d1-b597-e923d128ae0c';

-- Test 2: Temporarily disable ALL RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test 3: Try query with RLS disabled
SELECT 
    'Test 2: With RLS disabled' as "Test",
    id,
    email,
    first_name
FROM profiles
WHERE id = '0a1bce62-23b6-42d1-b597-e923d128ae0c';

-- Test 4: Check which columns exist
SELECT 
    'Test 3: All columns in profiles' as "Test",
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- DO NOT re-enable RLS yet - test your app first!
-- If app works with RLS disabled, we know it's a policy issue

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '⚠️  RLS DISABLED FOR TESTING';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Refresh your browser NOW';
    RAISE NOTICE '2. Try logging in';
    RAISE NOTICE '3. If it works, the problem is RLS policies';
    RAISE NOTICE '4. Come back and tell me if it worked';
    RAISE NOTICE '';
    RAISE NOTICE 'DO NOT LEAVE RLS DISABLED!';
    RAISE NOTICE 'We will re-enable and fix policies after testing';
    RAISE NOTICE '';
END $$;

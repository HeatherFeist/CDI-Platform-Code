-- ====================================================================
-- FIX PROFILE 500 ERROR
-- ====================================================================
-- The 500 error happens when fetching profiles. Let's check and fix:
-- 1. Check if workspace_email column exists
-- 2. Check for any broken triggers
-- 3. Check RLS policies
-- 4. Verify profile data integrity
-- ====================================================================

-- Step 1: Check workspace_email column
SELECT 
    'Step 1: workspace_email column' as "Check",
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'workspace_email';

-- Step 2: Check your profile exists and has valid data
SELECT 
    'Step 2: Your profile data' as "Check",
    id,
    email,
    first_name,
    last_name,
    business_id,
    workspace_email,
    role,
    created_at
FROM profiles
WHERE id = '0a1bce62-23b6-42d1-b597-e923d128ae0c';

-- Step 3: Try to select profile (this might show the actual error)
DO $$
BEGIN
    RAISE NOTICE 'Step 3: Testing profile query...';
    PERFORM * FROM profiles WHERE id = '0a1bce62-23b6-42d1-b597-e923d128ae0c';
    RAISE NOTICE '✅ Profile query successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Profile query failed: %', SQLERRM;
END $$;

-- Step 4: Check for problematic triggers
SELECT 
    'Step 4: Triggers on profiles' as "Check",
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Step 5: Check RLS policies
SELECT 
    'Step 5: RLS Policies' as "Check",
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ====================================================================
-- QUICK FIX: Disable RLS temporarily to test
-- ====================================================================
-- Uncomment this if you want to test without RLS:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- 
-- Then refresh your app and see if it loads
-- If it works, we know it's an RLS policy issue
-- 
-- Re-enable after testing:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

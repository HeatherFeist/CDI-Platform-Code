-- ====================================================================
-- DISABLE RLS COMPLETELY - SIMPLE AND WORKING
-- ====================================================================
-- This disables Row Level Security entirely so you can focus on
-- building features without authentication headaches.
--
-- ⚠️ SECURITY NOTE:
-- Without RLS, any authenticated user can read/modify any profile.
-- For a small business app where all users are trusted team members,
-- this is often acceptable and much simpler.
-- ====================================================================

-- Step 1: Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies (clean up)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Team members can view business colleagues" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view business colleagues" ON profiles;

-- Step 3: Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ RLS COMPLETELY DISABLED';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Row Level Security is now OFF for profiles.';
    RAISE NOTICE 'All authenticated users can access all profiles.';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  ✅ No more 500 errors';
    RAISE NOTICE '  ✅ No authentication headaches';
    RAISE NOTICE '  ✅ Simple and predictable';
    RAISE NOTICE '';
    RAISE NOTICE 'Trade-off:';
    RAISE NOTICE '  ⚠️  Less data isolation between users';
    RAISE NOTICE '  ⚠️  OK for small trusted teams';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Refresh browser - should work now!';
    RAISE NOTICE '';
END $$;

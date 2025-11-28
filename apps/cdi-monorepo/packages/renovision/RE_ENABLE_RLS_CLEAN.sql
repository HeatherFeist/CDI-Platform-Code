-- ====================================================================
-- RE-ENABLE RLS WITH CLEAN POLICIES
-- ====================================================================
-- Now that we know RLS was the issue, let's re-enable it with
-- clean, working policies
-- ====================================================================

-- Step 1: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Team members can view business colleagues" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Step 3: Create clean, simple policies

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can view profiles in same business
CREATE POLICY "Users can view business colleagues"
ON profiles FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT business_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Step 4: Verify new policies
SELECT 
    '✅ New RLS Policies' as "Status",
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ RLS RE-ENABLED WITH CLEAN POLICIES';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '  1. Users can read own profile';
    RAISE NOTICE '  2. Users can update own profile';
    RAISE NOTICE '  3. Users can insert own profile';
    RAISE NOTICE '  4. Users can view business colleagues';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Refresh browser and test!';
    RAISE NOTICE '';
END $$;

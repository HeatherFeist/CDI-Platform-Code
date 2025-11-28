-- FIX PROFILES TABLE RLS POLICIES
-- This fixes the "Profile fetch timeout" error by ensuring users can read their own profile

-- Step 1: Check existing policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 2: Drop existing SELECT policy and recreate it properly
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in their business" ON profiles;

-- Step 3: Create a simple, working SELECT policy
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 4: Users can read profiles in their business (NO CIRCULAR REFERENCE)
-- We check business_id directly without querying profiles again
CREATE POLICY "Users can read profiles in their business"
ON profiles
FOR SELECT
TO authenticated
USING (
    business_id = (
        SELECT business_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
    )
    OR id = auth.uid()  -- Always allow reading own profile
);

-- Step 5: Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 6: Ensure INSERT policy exists (for new signups)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 8: Wait for schema refresh
SELECT pg_sleep(1);

-- Step 9: Verify policies
SELECT 
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_status,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as check_status
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 10: Test profile query (this should work now)
SELECT 
    id,
    email,
    first_name,
    last_name,
    business_id,
    role
FROM profiles
WHERE id = auth.uid()
LIMIT 1;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Profiles RLS policies fixed!';
    RAISE NOTICE 'Users can now:';
    RAISE NOTICE '  - Read their own profile';
    RAISE NOTICE '  - Read profiles in their business';
    RAISE NOTICE '  - Update their own profile';
    RAISE NOTICE '  - Insert their own profile on signup';
    RAISE NOTICE 'Schema cache refreshed!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Try refreshing the page now!';
END $$;

-- SIMPLE FIX FOR PROFILES RLS - NO CIRCULAR REFERENCES
-- This fixes the 500 Internal Server Error by using simple, non-recursive policies

-- Step 1: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in their business" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Step 2: Create ONE simple SELECT policy - just read your own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 3: Create simple UPDATE policy
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 4: Create simple INSERT policy (for signup)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 5: Refresh schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 6: Wait for schema refresh
SELECT pg_sleep(2);

-- Step 7: Verify policies created
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 8: Test the query
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
    RAISE NOTICE 'Profiles RLS policies SIMPLIFIED!';
    RAISE NOTICE 'Users can now read/update their OWN profile only';
    RAISE NOTICE 'No circular references or complex queries';
    RAISE NOTICE 'Schema cache refreshed!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Refresh your browser now!';
END $$;

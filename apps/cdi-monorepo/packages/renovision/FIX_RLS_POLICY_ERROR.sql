-- ====================================================================
-- FIX RLS POLICY CAUSING 500 ERROR
-- ====================================================================
-- The policy "Members can view member directory" references a column
-- "is_verified_member" that doesn't exist, causing 500 errors.
-- ====================================================================

-- Step 1: Drop the broken policy
DROP POLICY IF EXISTS "Members can view member directory" ON profiles;

-- Step 2: Verify remaining policies are working
SELECT 
    '✅ Remaining RLS Policies' as "Status",
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ FIXED! Broken RLS policy removed';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Refresh your browser (Ctrl+Shift+R)';
    RAISE NOTICE '2. Your profile should now load correctly!';
    RAISE NOTICE '3. You should see your dashboard';
    RAISE NOTICE '';
END $$;

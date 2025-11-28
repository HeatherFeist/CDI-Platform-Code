-- RUN THIS IN SUPABASE SQL EDITOR TO CHECK STATUS

-- Test 1: Check if cities table exists and has Dayton
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cities WHERE name = 'Dayton' AND state = 'OH') THEN
    RAISE NOTICE '✅ Dayton city exists';
  ELSE
    RAISE NOTICE '❌ Dayton city NOT FOUND';
  END IF;
END $$;

-- Test 2: Check profile columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    RAISE NOTICE '✅ profile_photo_url column exists';
  ELSE
    RAISE NOTICE '❌ profile_photo_url column MISSING';
  END IF;
END $$;

-- Test 3: Check storage bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos') THEN
    RAISE NOTICE '✅ profile-photos bucket exists';
  ELSE
    RAISE NOTICE '❌ profile-photos bucket MISSING - This is the problem!';
  END IF;
END $$;

-- Test 4: Check storage policies
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Storage policies exist'
    ELSE '❌ Storage policies MISSING'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile%';

-- Show actual results
SELECT '=== ACTUAL DATA ===' as section;
SELECT 'Cities:' as type, COUNT(*) as count FROM cities;
SELECT 'Meetup Locations:' as type, COUNT(*) as count FROM meetup_locations;
SELECT 'Storage Buckets:' as type, id, name, public FROM storage.buckets;

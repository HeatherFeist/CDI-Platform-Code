-- Quick verification queries for saved_designs integration

-- 1. Check table exists and structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_designs'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'saved_designs';

-- 3. Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'saved_designs';

-- 4. Check storage bucket
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'designs';

-- 5. Check for any existing designs
SELECT COUNT(*) as total_designs,
       COUNT(DISTINCT user_id) as unique_users
FROM saved_designs;

-- Expected results:
-- ✅ Table has 8 columns (id, user_id, name, storage_path, thumbnail_url, generation_prompt, created_at, updated_at)
-- ✅ Two indexes exist (user_id, created_at)
-- ✅ RLS is disabled (rowsecurity = false)
-- ✅ designs bucket exists and is public
-- ✅ Zero designs initially (until Gemini saves one)

-- ====================================================================
-- COMPREHENSIVE DIAGNOSTICS FOR SAVED DESIGNS
-- ====================================================================
-- Run these queries one by one to diagnose the issue
-- ====================================================================

-- 1️⃣ Check if table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_designs'
) AS table_exists;

-- 2️⃣ Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'saved_designs'
ORDER BY ordinal_position;

-- 3️⃣ Check for ANY data in the table
SELECT COUNT(*) as total_rows FROM saved_designs;

-- 4️⃣ Check last 10 entries (if any)
SELECT 
    id,
    user_id,
    name,
    storage_path,
    thumbnail_url,
    generation_prompt,
    created_at
FROM saved_designs
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ Check storage bucket exists
SELECT 
    id,
    name,
    public,
    created_at,
    updated_at
FROM storage.buckets
WHERE id = 'designs';

-- 6️⃣ Check for any files in designs bucket
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'designs'
ORDER BY created_at DESC
LIMIT 10;

-- 7️⃣ Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'saved_designs';

-- 8️⃣ Check for any errors in Supabase logs (if visible)
-- This might not work depending on permissions, but try it:
SELECT * FROM saved_designs; -- Simple select to trigger any RLS or permission issues

-- ====================================================================
-- RESULTS INTERPRETATION:
-- ====================================================================
-- 
-- If query #1 returns FALSE:
--   → Table doesn't exist - need to run schema creation SQL again
--
-- If query #3 returns 0:
--   → Table exists but no data - Gemini's save didn't work
--   → Check query #6 to see if files uploaded to storage
--
-- If query #3 returns > 0:
--   → Data exists but picker not fetching it - connection issue
--
-- If query #5 returns empty:
--   → Storage bucket doesn't exist - need to create it
--
-- If query #7 shows rls_enabled = TRUE:
--   → RLS is enabled (should be disabled) - this could block access
--
-- ====================================================================

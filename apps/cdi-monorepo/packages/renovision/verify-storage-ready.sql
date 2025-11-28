-- ====================================================================
-- VERIFY STORAGE IS READY (No changes, just checks)
-- ====================================================================

-- 1. Check bucket configuration
SELECT 
    '✅ Bucket Configuration' as check_type,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 || ' MB' as max_size,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'designs';

-- 2. Check existing policies
SELECT 
    '✅ Storage Policies' as check_type,
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{public}' THEN 'Public'
        ELSE roles::text
    END as who_can_access
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 3. Test if we can query the objects table
SELECT 
    '✅ Storage Objects Access' as check_type,
    COUNT(*) as total_files,
    COUNT(CASE WHEN bucket_id = 'designs' THEN 1 END) as designs_files
FROM storage.objects;

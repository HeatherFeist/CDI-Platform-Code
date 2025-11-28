-- ====================================================================
-- FIX STORAGE BUCKET CONFIGURATION
-- ====================================================================
-- The error "provider is not enabled" means storage isn't configured
-- Let's verify and fix the bucket setup
-- ====================================================================

-- 1. Check current bucket configuration
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE id = 'designs';

-- 2. If bucket exists but has issues, update it
UPDATE storage.buckets
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
WHERE id = 'designs';

-- 3. Verify the update
SELECT 
    '✅ Bucket configured for image uploads' as status,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 || ' MB' as max_file_size,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'designs';

-- ====================================================================
-- IF STORAGE PROVIDER ERROR PERSISTS:
-- ====================================================================
-- This usually means Supabase Storage needs to be enabled in your project.
-- 
-- Go to Supabase Dashboard:
-- 1. Select your project
-- 2. Go to Storage (left sidebar)
-- 3. If you see "Storage is not enabled", click "Enable Storage"
-- 4. Once enabled, run this script again
-- 
-- The free tier includes 1GB storage which is plenty for testing!
-- ====================================================================

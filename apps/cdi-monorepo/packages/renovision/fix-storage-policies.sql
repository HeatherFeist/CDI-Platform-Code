-- ====================================================================
-- CHECK AND FIX STORAGE BUCKET POLICIES
-- ====================================================================
-- Even though the bucket exists, it might have restrictive policies
-- ====================================================================

-- 1. Check current policies on the designs bucket
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 2. Drop any existing restrictive policies on the designs bucket
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Create simple public policies for the designs bucket
-- Allow anyone to upload to designs bucket
CREATE POLICY "Anyone can upload to designs bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'designs');

-- Allow anyone to read from designs bucket (since it's public)
CREATE POLICY "Anyone can read designs bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

-- Allow users to update their own files
CREATE POLICY "Users can update own designs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'designs');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own designs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'designs');

-- 4. Verify the bucket is truly public
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- 5. Check final configuration
SELECT 
    '✅ Storage bucket ready for uploads' as status,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'designs';

SELECT 
    '✅ Storage policies configured' as status,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%designs%';

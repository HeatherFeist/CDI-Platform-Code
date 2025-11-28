-- Setup listing-images storage bucket
-- Run this in Supabase SQL Editor

-- Create listing-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public listing images are accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;

-- Policy 1: Anyone can view listing images (public bucket)
CREATE POLICY "Public listing images are accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listing-images');

-- Policy 2: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload listing images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Users can update their own images
CREATE POLICY "Users can update their own listing images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own images
CREATE POLICY "Users can delete their own listing images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verification
SELECT 
  'Bucket created!' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'listing-images';

-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%listing%';

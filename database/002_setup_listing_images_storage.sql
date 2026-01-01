-- ============================================
-- STORAGE BUCKET SETUP FOR LISTING IMAGES
-- ============================================
-- Run this script in your Supabase SQL Editor to create the storage bucket
-- for marketplace listing images

-- Create the storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public listing images are accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload listing images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;

-- Policy 1: Allow public read access to listing images
CREATE POLICY "Public listing images are accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Policy 2: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload listing images to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to update their own images
CREATE POLICY "Users can update own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own images
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'listing-images';

-- Check if policies were created
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%listing%';

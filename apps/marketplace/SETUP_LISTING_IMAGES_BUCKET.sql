-- =====================================================
-- MARKETPLACE LISTING IMAGES STORAGE BUCKET SETUP
-- =====================================================
-- This script creates the storage bucket for marketplace listing images
-- Run this in your Supabase SQL Editor

-- Create the storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,  -- Public bucket so images can be displayed
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for listing images
-- Policy 1: Anyone can view/download images (public bucket)
CREATE POLICY "Public Access for Listing Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Policy 2: Authenticated users can upload their own images
CREATE POLICY "Users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own images
CREATE POLICY "Users can update own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own images
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'listing-images';

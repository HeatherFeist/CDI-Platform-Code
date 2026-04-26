-- ============================================
-- COMPLETE STORAGE BUCKET SETUP
-- ============================================
-- Creates both listing-images and profile-photos buckets
-- with proper RLS policies for the marketplace app.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos/sql/new
-- ============================================

-- ========================
-- BUCKET 1: listing-images
-- ========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- ========================
-- BUCKET 2: profile-photos
-- ========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- ============================================
-- LISTING-IMAGES POLICIES
-- ============================================
-- Upload path format: {user_id}/{timestamp}.{ext}

DROP POLICY IF EXISTS "Public listing images are accessible" ON storage.objects;
CREATE POLICY "Public listing images are accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PROFILE-PHOTOS POLICIES
-- ============================================
-- Upload path format: {user_id}/{timestamp}.{ext}

DROP POLICY IF EXISTS "Public profile photos are accessible" ON storage.objects;
CREATE POLICY "Public profile photos are accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ Buckets created:' as status;
SELECT id, name, public, file_size_limit FROM storage.buckets
WHERE id IN ('listing-images', 'profile-photos');

SELECT '✅ Policies created:' as status;
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (policyname LIKE '%listing%' OR policyname LIKE '%profile photo%')
ORDER BY policyname;

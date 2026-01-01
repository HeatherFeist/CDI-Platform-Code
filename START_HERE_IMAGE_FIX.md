# 🔥 MARKETPLACE STORAGE FIX - START HERE 🔥

## Problem
**"Storage bucket not found"** error when uploading images in the marketplace.

## Quick Fix (30 seconds)

### Copy This SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 5242880, 
        ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'])
ON CONFLICT DO NOTHING;

CREATE POLICY "Public listing images" ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Users upload listings" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete listings" ON storage.objects FOR DELETE
USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Run It:
1. Go to: https://supabase.com/dashboard
2. Open your CDI Platform project
3. Click **SQL Editor** → **New query**
4. Paste the SQL above
5. Click **Run**
6. ✅ Done!

---

## Verify It Worked

1. Click **Storage** in Supabase
2. See **listing-images** bucket? ✅
3. Is it marked **PUBLIC**? ✅
4. Go to marketplace and upload an image ✅

---

## Alternative: Step-by-Step UI Guide

Don't want to use SQL? See: **[QUICK_IMAGE_FIX.md](QUICK_IMAGE_FIX.md)**

---

## More Help

- **Visual Guide**: [FIX_IMAGE_UPLOAD_NOW.txt](FIX_IMAGE_UPLOAD_NOW.txt)
- **Detailed Instructions**: [STORAGE_BUCKET_FIX.md](STORAGE_BUCKET_FIX.md)
- **SQL File**: [database/002_setup_listing_images_storage.sql](database/002_setup_listing_images_storage.sql)

---

**Your Supabase Project:** https://gjbrjysuqdvvqlxklvos.supabase.co

**Time to Fix:** 30 seconds | **Difficulty:** Copy & Paste

# 📸 MARKETPLACE IMAGE UPLOAD - QUICK FIX

## The Error
```
❌ Storage bucket not found
```

## The Fix (Choose One Method)

---

### METHOD 1: Copy-Paste SQL (30 seconds) ⚡ FASTEST

1. Open: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New query**
5. Copy ALL of this:

```sql
-- Create listing images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view images
CREATE POLICY IF NOT EXISTS "Public listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Users upload listings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their images  
CREATE POLICY IF NOT EXISTS "Users delete listings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

6. Click **RUN**
7. ✅ Done! Try uploading again.

---

### METHOD 2: Click Through UI (2 minutes)

#### Step 1: Create Bucket
1. Open Supabase Dashboard
2. Click **Storage** (left sidebar)
3. Click **New bucket** button
4. Enter name: `listing-images`
5. ✅ **CHECK** "Public bucket"
6. File size limit: `5242880`
7. Click **Create**

#### Step 2: Add Policies
1. Click on **listing-images** bucket
2. Click **Policies** tab
3. Click **New policy** button (repeat 3 times)

**Policy 1:**
- Template: Allow `SELECT` for `public`
- Name: `Public listing images`
- Click Save

**Policy 2:**
- Template: Allow `INSERT` for `authenticated`  
- Name: `Users upload listings`
- Policy: `bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- Click Save

**Policy 3:**
- Template: Allow `DELETE` for `authenticated`
- Name: `Users delete listings`
- Policy: `bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- Click Save

---

## ✅ Verify It Works

1. Go to **Storage** in Supabase
2. See **listing-images** listed?
3. Shows **PUBLIC**?
4. Go to marketplace app
5. Try upload → Should work! 🎉

---

## 🐛 Still Not Working?

### Check These:

**Bucket name exactly right?**
- Must be: `listing-images` (no spaces)
- NOT: `listing_images` or `Listing-Images`

**Bucket is PUBLIC?**
- Click on bucket
- Top should say "Public"
- If not, edit settings

**Logged into marketplace?**
- Must be logged in to upload
- Try logout → login again

**Cleared cache?**
- Hard refresh: `Ctrl+Shift+R` (Windows)
- Or: `Cmd+Shift+R` (Mac)

---

## What You Get After Fix

✅ Upload product photos
✅ Multiple images per listing
✅ AI image enhancement
✅ Quality scoring
✅ Photo previews

---

**Need detailed instructions?** 
See: `STORAGE_BUCKET_FIX.md` or `database/002_setup_listing_images_storage.sql`

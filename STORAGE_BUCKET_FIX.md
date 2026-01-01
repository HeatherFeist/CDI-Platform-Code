# 🚨 QUICK FIX: Storage Bucket Not Found

## Problem
Getting "storage bucket not found" error when uploading images in the marketplace.

## Solution (2 Minutes)

### Option 1: SQL Script (Fastest) ⚡

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your CDI Platform project

2. **Run the SQL Script**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**
   - Copy the contents of `database/002_setup_listing_images_storage.sql`
   - Paste into the SQL editor
   - Click **"Run"** or press `Ctrl+Enter`

3. **Verify Success**
   - Go to **"Storage"** in the left sidebar
   - You should see **"listing-images"** bucket
   - Status should show as **PUBLIC**

4. **Test Upload**
   - Go back to your marketplace app
   - Try uploading an image
   - Should work now! ✅

---

### Option 2: Manual UI Setup (Alternative)

If SQL doesn't work, create the bucket manually:

1. **Go to Storage**
   - Supabase Dashboard → **Storage** (left sidebar)
   - Click **"New bucket"**

2. **Create Bucket**
   - **Name:** `listing-images`
   - **Public:** ✅ CHECK THIS BOX (important!)
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:**
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
   - Click **"Create bucket"**

3. **Add Policies**
   - Click on the **"listing-images"** bucket
   - Go to **"Policies"** tab
   - Click **"New policy"**

   **Create 4 policies:**

   **a) Public Read Access**
   - Name: `Public listing images are accessible`
   - Allowed operation: `SELECT`
   - Policy definition: 
     ```sql
     bucket_id = 'listing-images'
     ```
   - Target roles: `public`

   **b) Authenticated Upload**
   - Name: `Users can upload to own folder`
   - Allowed operation: `INSERT`
   - Policy definition:
     ```sql
     bucket_id = 'listing-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   - Target roles: `authenticated`

   **c) Authenticated Update**
   - Name: `Users can update own images`
   - Allowed operation: `UPDATE`
   - Policy definition: Same as above
   - Target roles: `authenticated`

   **d) Authenticated Delete**
   - Name: `Users can delete own images`
   - Allowed operation: `DELETE`
   - Policy definition: Same as above
   - Target roles: `authenticated`

4. **Save and Test**
   - Click **"Save"** after each policy
   - Go back to your app
   - Try uploading an image

---

## Troubleshooting

### Still getting "bucket not found"?
- ✅ Verify bucket name is exactly `listing-images` (no spaces, no capitals)
- ✅ Check that bucket is set to **PUBLIC**
- ✅ Make sure you're logged into the app
- ✅ Clear browser cache and refresh

### Getting "permission denied"?
- ✅ Verify all 4 policies are created
- ✅ Check you're logged into the marketplace app
- ✅ Try logging out and back in

### Image uploads but doesn't show?
- ✅ Verify bucket is set to PUBLIC
- ✅ Check the URL in browser console
- ✅ Verify RLS policies allow SELECT for public

### File size errors?
- Images must be under 5MB
- Compress large images before uploading
- Use JPEG format for photos (smaller file size)

---

## Verification Checklist

After setup, verify everything works:

- [ ] `listing-images` bucket exists in Supabase Storage
- [ ] Bucket is marked as **PUBLIC**
- [ ] File size limit is 5MB (5242880 bytes)
- [ ] Allowed MIME types include image formats
- [ ] 4 storage policies are created and enabled
- [ ] You can upload an image in the marketplace
- [ ] Uploaded image displays correctly
- [ ] Image URL starts with your Supabase project URL

---

## What This Fixes

Once the bucket is set up, these features will work:

✅ Upload listing photos
✅ Multiple images per listing
✅ AI image enhancement
✅ Auto-quality scoring
✅ Image preview thumbnails
✅ Lifestyle image generation (AI)

---

## Need More Help?

See these detailed guides:
- `database/002_setup_listing_images_storage.sql` - Complete SQL script
- Main project README - Full setup instructions

**Still stuck?** Check:
1. Supabase project is active (not paused)
2. Environment variables in `.env` are correct
3. Internet connection is stable
4. Browser console for specific error messages

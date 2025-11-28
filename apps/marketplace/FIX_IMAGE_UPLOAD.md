# Fix: Image Upload Errors

## Problem
Getting "Failed to upload image" error when trying to upload listing images.

## Root Cause
The `listing-images` storage bucket doesn't exist in Supabase or lacks proper permissions.

---

## Solution: Setup Storage Bucket

### Option 1: Using SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy the contents of `src/database/SETUP_LISTING_IMAGES_BUCKET.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - You should see "Bucket created!" message
   - Check that policies are listed

### Option 2: Using Storage UI

1. **Go to Storage Section**
   - Open Supabase Dashboard
   - Click "Storage" in left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Bucket name: `listing-images`
   - Public bucket: ✅ **YES** (check this!)
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`

3. **Set Up Policies**
   - Click on `listing-images` bucket
   - Go to "Policies" tab
   - Click "New policy"
   
   **Policy 1: Public Read**
   - Name: `Public listing images are accessible`
   - Allowed operation: `SELECT`
   - Policy definition: `true`
   
   **Policy 2: Authenticated Upload**
   - Name: `Authenticated users can upload`
   - Allowed operation: `INSERT`
   - Policy definition: `(bucket_id = 'listing-images')`
   - Target roles: `authenticated`

---

## Quick Test

After setting up the bucket:

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)

2. **Try uploading an image**
   - Go to Create Listing page
   - Click the upload image button
   - Select a JPG or PNG file under 5MB

3. **Check browser console** (F12)
   - Look for any error messages
   - Should see successful upload

---

## Common Issues & Fixes

### Issue 1: "Bucket not found"
**Solution:** Run the SQL script to create the bucket

### Issue 2: "Permission denied" or "Policy violation"
**Solution:** 
- Make sure bucket is set to **PUBLIC**
- Check that policies allow authenticated users to INSERT
- Verify you're logged in (check network tab for auth token)

### Issue 3: "File too large"
**Solution:**
- Images must be under 5MB
- Compress large images before uploading
- Or increase file_size_limit in bucket settings

### Issue 4: "Invalid file type"
**Solution:**
- Only JPG, PNG, GIF, WEBP allowed
- Convert HEIC/other formats to JPG first
- Check file extension matches actual format

### Issue 5: Still failing after setup
**Solution:**
1. Check browser console for exact error
2. Go to Supabase Dashboard → Storage → listing-images
3. Try manual upload through dashboard
4. If dashboard works but app doesn't:
   - Check your `.env` file has correct Supabase keys
   - Restart dev server: `npm run dev`
   - Clear browser cache

---

## Verification Checklist

✅ Bucket `listing-images` exists in Supabase Storage
✅ Bucket is set to **PUBLIC** (important!)
✅ File size limit is at least 5MB (5242880 bytes)
✅ MIME types include: jpeg, jpg, png, gif, webp
✅ Policy allows SELECT for everyone
✅ Policy allows INSERT for authenticated users
✅ You are logged in to the app
✅ `.env` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
✅ Dev server restarted after any `.env` changes

---

## Manual Verification

### Check if bucket exists:
```sql
SELECT * FROM storage.buckets WHERE id = 'listing-images';
```

### Check policies:
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%listing%';
```

### Test upload via SQL:
```sql
-- This won't actually upload, but checks permissions
SELECT auth.uid(); -- Should return your user ID if logged in
```

---

## Alternative: Use Image URLs Instead

If you can't get storage working immediately, you can bypass the upload:

1. **Upload image to a free service:**
   - https://imgbb.com
   - https://imgur.com
   - https://postimages.org

2. **Get direct image URL**
   - Copy the direct link (must end in .jpg, .png, etc.)

3. **In Create Listing page:**
   - Click "Or add image by URL"
   - Paste the URL
   - Click OK

This is a temporary workaround while you fix the storage bucket.

---

## Need More Help?

1. **Check browser console** (F12) for detailed errors
2. **Check Supabase logs:**
   - Dashboard → Logs → API
   - Look for 400/403/404 errors
3. **Verify authentication:**
   - Make sure you're logged in
   - Check if auth token is valid
4. **Test with different image:**
   - Try a small (< 1MB) JPG file
   - Different browsers
5. **Contact support:**
   - Share exact error message from console
   - Share relevant Supabase logs

---

## After Fix

Once working, you should see:
- ✅ Image upload progress
- ✅ Thumbnail preview appears
- ✅ No error alerts
- ✅ Image saved in Supabase Storage
- ✅ Image displays in listing preview

Test the AI Image Enhancement feature too!

# Troubleshooting Photo Upload

## Steps to Diagnose the Issue:

### 1. Check if the SQL script ran successfully

In Supabase Dashboard → SQL Editor, run these queries one at a time:

```sql
-- Check if Dayton city exists
SELECT * FROM cities WHERE name = 'Dayton';
```
**Expected:** Should return 1 row with Dayton, OH

```sql
-- Check if profile columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('profile_photo_url', 'city_id', 'zip_code', 'show_location');
```
**Expected:** Should return 4 rows

```sql
-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'profile-photos';
```
**Expected:** Should return 1 row with the bucket details

```sql
-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```
**Expected:** Should show policies for profile-photos bucket

### 2. Test in Browser

1. **Open Developer Tools** (Press F12)
2. **Go to Console tab**
3. **Go to your Profile page**
4. **Click the camera icon to upload a photo**
5. **Look at the console output**

You should see logs like:
- "File selected: {name: ..., size: ..., type: ...}"
- "Starting upload process..."
- "Uploading to path: ..."
- Either success or a specific error message

### 3. Common Issues and Solutions

#### Issue: "Storage bucket not found"
**Solution:** Run the QUICK_FIX.sql script in Supabase

#### Issue: "Permission denied" or policy error
**Solution:** Check that you're logged in and run:
```sql
-- Re-create storage policies
DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Issue: "No cities available"
**Solution:** Dayton wasn't inserted. Run:
```sql
INSERT INTO cities (name, state, latitude, longitude, timezone, population, is_active, market_launch_date)
VALUES ('Dayton', 'OH', 39.7589, -84.1916, 'America/New_York', 140000, true, CURRENT_DATE)
ON CONFLICT (name, state) DO UPDATE
SET is_active = true, updated_at = NOW();
```

#### Issue: Nothing happens when clicking upload
**Solution:** 
1. Check browser console for JavaScript errors
2. Make sure you're signed in
3. Try refreshing the page (F5)
4. Clear browser cache (Ctrl+Shift+Delete)

### 4. Manual Storage Bucket Creation

If the bucket doesn't exist, create it manually in Supabase:

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `profile-photos`
4. Set to **Public**
5. Click "Create bucket"
6. Then run these policies in SQL Editor:

```sql
CREATE POLICY "Public profile photos are accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5. Test Storage Bucket Directly

Try uploading via Supabase Dashboard:
1. Go to Storage → profile-photos bucket
2. Try uploading a file manually
3. If this works, the issue is in the code
4. If this fails, there's a bucket/policy problem

## What to Tell Me

Please provide:
1. ✅ Did the SQL script run without errors?
2. ✅ What do you see in the browser console when trying to upload?
3. ✅ Can you see the "profile-photos" bucket in Supabase Dashboard → Storage?
4. ✅ Are you signed in to your account?
5. ✅ What error message appears (if any)?

This will help me pinpoint exactly what's wrong!

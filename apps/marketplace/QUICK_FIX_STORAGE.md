# Image Upload Fix - Quick Steps

## What's Wrong
The `listing-images` storage bucket doesn't exist in your Supabase project yet.

## How to Fix (2 minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/nwpyfryrhrocvzxtfxxc

### Step 2: Open SQL Editor
- Click **"SQL Editor"** in left sidebar
- Click **"New query"**

### Step 3: Run This SQL
Copy and paste this into the SQL editor:

```sql
-- Create listing-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Allow everyone to view images
CREATE POLICY "Public listing images are accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload listing images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to manage their own images
CREATE POLICY "Users can delete their own listing images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Click "Run" Button
- The green "Run" button in bottom right
- Should see success message

### Step 5: Refresh Your Browser
- Go back to your app: http://localhost:3000
- Hard refresh: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)

### Step 6: Try Upload Again
- Go to "Create Listing"
- Click upload image button
- Select a photo
- Should work now! ✅

---

## Still Not Working?

### Check the Error Message
The app now shows detailed errors. Look for:

**"Storage bucket not found"**
- SQL didn't run successfully
- Try running it again
- Check Supabase logs

**"Permission denied"**
- Policies didn't create
- Make sure you're logged in to the app
- Try logging out and back in

**"File too large"**
- Image must be under 5MB
- Compress or resize the image

---

## Verify It Worked

### Quick Check:
1. Go to Supabase Dashboard
2. Click **"Storage"** in left sidebar
3. You should see **"listing-images"** bucket listed
4. Click on it - should show it's PUBLIC

### Test Upload:
1. In your app, go to Create Listing
2. Upload a small image (< 1MB)
3. Should see preview thumbnail
4. No error alerts = success! 🎉

---

## Alternative: UI Method

If SQL doesn't work, try this:

1. **Supabase Dashboard → Storage**
2. **Click "New bucket"**
3. **Settings:**
   - Name: `listing-images`
   - Public: ✅ **CHECK THIS BOX**
   - Size limit: `5242880`
4. **Click "Create bucket"**
5. **Click on the bucket → Policies → New policy**
6. **Create policy:**
   - SELECT: Allow for everyone
   - INSERT: Allow for authenticated users

---

## After It Works

Once images upload successfully:
- ✅ Try the AI Image Enhancement feature
- ✅ Upload multiple photos
- ✅ Test the auto-enhance button
- ✅ See your quality scores

**The AI features are all ready to go once storage is set up!** 🚀

# Marketplace Setup Guide

This guide will help you set up the necessary database tables and storage buckets for the Constructive Designs Marketplace.

## Prerequisites
- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Setup Steps

### 1. Create Storage Bucket for Listing Images

**Issue**: "Failed to upload image. Bucket not found"

**Solution**:
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `SETUP_LISTING_IMAGES_BUCKET.sql`
5. Click **Run** to execute

**What this does**:
- Creates a `listing-images` storage bucket
- Sets 5MB file size limit
- Allows JPEG, PNG, WebP, and GIF formats
- Configures public read access
- Sets up user upload permissions (users can only upload to their own folder)

---

### 2. Create Cities/Markets Table

**Issue**: "No Markets Available Yet"

**Solution**:
1. In the same **SQL Editor** in Supabase
2. Click **New Query**
3. Copy and paste the contents of `SETUP_CITIES_MARKETS.sql`
4. Click **Run** to execute

**What this does**:
- Creates the `cities` table
- Populates it with 40+ major US cities/markets
- Includes cities like:
  - New York, Los Angeles, Chicago
  - Houston, Phoenix, Philadelphia
  - San Francisco, Seattle, Denver
  - And many more!
- Sets up proper indexes for fast lookups
- Enables Row Level Security with public read access

---

## Verification

### Check Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. You should see `listing-images` bucket listed
3. Click on it to verify it's configured correctly

### Check Cities Table
1. Go to **Table Editor** in your Supabase dashboard
2. Find the `cities` table
3. You should see 40+ cities listed
4. Verify they all have `is_active = true`

---

## Testing

### Test Image Upload
1. Go to your marketplace: https://cdi-marketplace-platform.web.app
2. Click **Create Listing**
3. Try uploading an image
4. Should work without "Bucket not found" error

### Test Location Selector
1. On the marketplace homepage
2. Click on the location/market selector
3. You should see a list of 40+ cities to choose from
4. Select a city and confirm

---

## Troubleshooting

### Images still not uploading?
- Check that the bucket name is exactly `listing-images` (no typos)
- Verify storage policies are enabled
- Check browser console for specific error messages

### Cities not showing?
- Verify the `cities` table exists in Table Editor
- Check that `is_active = true` for cities
- Verify RLS policies are enabled

### Need to add more cities?
You can add more cities manually in the Table Editor or by running additional INSERT statements in the SQL Editor:

```sql
INSERT INTO cities (name, state, population, latitude, longitude)
VALUES ('Your City', 'ST', 100000, 0.0000, 0.0000);
```

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check Supabase logs in the dashboard
3. Verify all SQL scripts ran successfully without errors

---

## Next Steps

After setup is complete:
1. ✅ Users can upload images to listings
2. ✅ Users can select their local market/city
3. ✅ Marketplace is fully functional!

Enjoy your fully functional marketplace! 🎉

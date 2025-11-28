# Profile Improvements - Installation Guide

## Overview
This guide explains how to add profile photos, user location, and fix the listing deletion issue.

## Database Changes Required

Execute the SQL script `src/database/profile-improvements.sql` on your Supabase instance. This will:

1. ✅ Insert Dayton, OH as the first city
2. ✅ Add 4 safe meetup locations in Dayton
3. ✅ Add profile photo column to profiles table
4. ✅ Add location columns (city_id, zip_code, show_location)
5. ✅ Create profile-photos storage bucket
6. ✅ Fix RLS policies for profile updates
7. ✅ Fix RLS policy for listing deletion

## Features Added

### 1. Profile Photo Upload
- Users can upload profile photos (max 5MB)
- Photos are stored in Supabase Storage
- Automatic deletion of old photos when uploading new ones
- Photos displayed as avatar throughout the app

**Location**: ProfilePage component
- Click the camera icon on profile photo to upload
- Supported formats: jpg, png, gif, webp

### 2. User Location
- Select city from dropdown (Dayton, OH available)
- Enter ZIP code
- Toggle to show/hide location on profile
- Location displayed with MapPin icon

**Benefits**:
- Helps with local meetups
- Shows user's general area to buyers/sellers
- Privacy-conscious (city-level, not exact address)

### 3. Listing Deletion Fixed
- RLS policy updated to allow users to delete their own listings
- Confirmation dialog before deletion
- Automatic refresh after deletion

## How to Use

### For Users:

1. **Upload Profile Photo**:
   - Go to Profile page
   - Click camera icon on profile picture
   - Select an image (max 5MB)
   - Photo uploads and displays immediately

2. **Set Location**:
   - Click "Edit Profile"
   - Select "Dayton, OH" from City dropdown
   - Enter your ZIP code
   - Check "Show my location on my profile" if desired
   - Click "Save Changes"

3. **Delete a Listing**:
   - Go to Dashboard
   - Find the listing under "Selling" tab
   - Click trash icon
   - Confirm deletion

### For Developers:

**Profile Photo Storage**:
```typescript
// Storage bucket: profile-photos
// Path format: {user_id}/{timestamp}.{ext}
// Public access: Yes
// Max size: 5MB
```

**Database Schema**:
```sql
-- Added to profiles table
profile_photo_url TEXT
city_id UUID REFERENCES cities(id)
zip_code VARCHAR(10)
show_location BOOLEAN DEFAULT false
```

## Verification Steps

After running the SQL script:

1. **Check Cities**:
   ```sql
   SELECT * FROM cities WHERE name = 'Dayton';
   ```
   Should return Dayton, OH with 4 meetup locations

2. **Check Storage Bucket**:
   - Go to Supabase Dashboard > Storage
   - Verify `profile-photos` bucket exists
   - Check policies are active

3. **Test Profile Update**:
   - Sign in to app
   - Go to Profile
   - Try uploading a photo
   - Try selecting Dayton as city
   - Save changes

4. **Test Listing Deletion**:
   - Create a test listing
   - Go to Dashboard
   - Try deleting the listing
   - Should work without errors

## Troubleshooting

### Profile Photo Won't Upload
- Check Supabase Storage is enabled
- Verify `profile-photos` bucket exists
- Check file size < 5MB
- Verify file is an image type

### Can't Select City
- Run the SQL script to insert Dayton, OH
- Check cities table has data:
  ```sql
  SELECT * FROM cities;
  ```

### Can't Delete Listing
- Verify RLS policy exists:
  ```sql
  SELECT * FROM pg_policies 
  WHERE tablename = 'listings' 
  AND policyname = 'Users can delete own listings';
  ```

### Location Not Showing
- Ensure "Show my location on my profile" is checked
- Verify city_id is set in database
- Check profile query includes location data

## Future Enhancements

Consider adding:
- Profile cover photos
- Photo cropping tool
- Multiple profile photos/gallery
- Location radius settings
- Automatic city detection from IP
- Google Maps integration for precise location

## Security Notes

- ✅ Profile photos are public (accessible via URL)
- ✅ Users can only update/delete their own photos
- ✅ File type and size validation prevents abuse
- ✅ Location is city-level only (privacy-friendly)
- ✅ Users control location visibility
- ✅ RLS policies enforce user ownership

## API Endpoints Used

**Supabase Storage**:
- `POST /storage/v1/object/profile-photos/{user_id}/{filename}` - Upload
- `GET /storage/v1/object/public/profile-photos/{user_id}/{filename}` - View
- `DELETE /storage/v1/object/profile-photos/{user_id}/{filename}` - Delete

**Database**:
- `PATCH /rest/v1/profiles?id=eq.{user_id}` - Update profile
- `DELETE /rest/v1/listings?id=eq.{listing_id}` - Delete listing
- `GET /rest/v1/cities` - Get cities list

## Testing Checklist

- [ ] SQL script executed successfully
- [ ] Dayton, OH appears in city selector
- [ ] Can upload profile photo
- [ ] Photo appears on profile
- [ ] Can update location information
- [ ] Location shows on profile when enabled
- [ ] Can delete own listings
- [ ] Cannot delete others' listings
- [ ] Profile updates save correctly
- [ ] Old photos are deleted when uploading new ones

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify RLS policies are active
3. Check browser console for errors
4. Ensure user is authenticated
5. Verify storage bucket permissions
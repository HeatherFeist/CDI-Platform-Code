# Quick Database Setup Guide

## Problem: No Cities Available in Profile

The city dropdown is empty because the database hasn't been populated with city data yet.

## Solution: Run the SQL Script

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in to your account
   - Select your "Trader Bid" project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the SQL Script**
   - Open the file: `src/database/profile-improvements.sql`
   - Select all content (Ctrl+A)
   - Copy it (Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)

5. **Wait for Completion**
   - You should see "Success. No rows returned" or similar
   - This means the script ran successfully

6. **Refresh Your App**
   - Go back to your Trader Bid app
   - Refresh the page (F5)
   - Go to Profile > Edit Profile
   - The city dropdown should now show "Dayton, OH"

## What This Script Does:

✅ Adds Dayton, OH to the cities table  
✅ Adds 4 safe meetup locations in Dayton  
✅ Creates profile_photo_url column  
✅ Creates city_id column  
✅ Creates zip_code column  
✅ Creates show_location column  
✅ Fixes RLS policy for deleting listings  
✅ Creates profile-photos storage bucket  

## Troubleshooting:

### "relation 'cities' does not exist"
You need to run the location schema first:
1. Run `src/database/location-schema.sql` first
2. Then run `src/database/profile-improvements.sql`

### "permission denied"
Make sure you're logged in as the database owner/admin in Supabase

### Still no cities showing
1. Check browser console for errors (F12)
2. Verify the script ran: Go to Table Editor > cities table > should see Dayton
3. Try clearing your browser cache and refreshing

## Alternative: Manual City Entry

If you can't run the SQL script right now, you can manually add Dayton:

```sql
-- Run this in Supabase SQL Editor
INSERT INTO cities (id, name, state, country, latitude, longitude, timezone, population)
VALUES (
  gen_random_uuid(),
  'Dayton',
  'OH',
  'USA',
  39.7589,
  -84.1916,
  'America/New_York',
  140000
);
```

Then refresh your app and Dayton should appear in the dropdown!

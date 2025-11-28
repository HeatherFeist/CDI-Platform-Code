# Fix: Store Listings Reverting to Auction Type

## Problem
When creating a store listing, it's being saved as an auction listing instead.

## Root Cause
The `listing_type` column in the database has `DEFAULT 'auction'` set. This was added in several migration files and is interfering with the store listing creation.

## Solution

### Step 1: Run the SQL Fix

Go to your Supabase Dashboard → SQL Editor and run this:

```sql
-- Remove the DEFAULT 'auction' constraint
ALTER TABLE listings 
ALTER COLUMN listing_type DROP DEFAULT;

-- Add a CHECK constraint to ensure only valid values
ALTER TABLE listings 
DROP CONSTRAINT IF EXISTS listings_listing_type_check;

ALTER TABLE listings 
ADD CONSTRAINT listings_listing_type_check 
CHECK (listing_type IN ('auction', 'store'));
```

**Or just run the file:** `fix-listing-type-default.sql`

### Step 2: Test the Fix

1. **Refresh your browser** (Dev server is already running on port 3005)
2. **Open Developer Console** (F12)
3. **Click "Create Listing"**
4. **Select "🏪 Store Item"** (make sure the green box is selected)
5. **Fill in the form**:
   - Title: "Test Store Item"
   - Description: "Testing store functionality"
   - Price: $10
   - Stock: 1
   - Add an image
6. **Click "Create Listing"**
7. **Check the console** - you should see:
   ```
   🎯 Creating listing with type: store
   📦 Full listing data: { ... "listing_type": "store" ... }
   ```

### Step 3: Verify in Store Tab

After creating the listing:
1. Click **"Stores" → "Shop Store Items"**
2. Your test item should appear with:
   - Fixed price (not bidding)
   - "Add to Cart" button
   - Stock quantity shown

### Step 4: Convert Your Existing Listings (Optional)

If you want to convert your current 3 auction listings to store items, run this in Supabase SQL Editor:

```sql
UPDATE listings
SET 
  listing_type = 'store',
  buy_now_price = COALESCE(buy_now_price, starting_bid, 0),
  stock_quantity = COALESCE(stock_quantity, 1)
WHERE seller_id = (SELECT id FROM auth.users WHERE email LIKE '%heatherfeist%')
  AND listing_type = 'auction';
```

## What Changed

### Code Changes
- **Added debug logging** in `CreateListing.tsx` to show what type is being sent to database
- The form already defaults to `'store'` (line 32)
- The form already sends `listing_type: listingType` correctly (line 371)

### Database Change
- **Removed DEFAULT 'auction'** from the `listing_type` column
- This ensures the value from your form isn't overridden

## Why This Happened

Several migration files added the column with:
```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'auction';
```

This DEFAULT value was interfering with explicit values being sent from the form.

## Next Steps

1. ✅ Run the SQL fix (`fix-listing-type-default.sql`)
2. ✅ Test creating a new store listing
3. ✅ Verify it appears in the Store tab
4. (Optional) Convert your existing 3 listings from auction to store

The dev server is already running on **localhost:3005** with the debug logging added!

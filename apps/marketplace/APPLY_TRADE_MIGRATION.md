# Apply Trade Listing Type Migration

## ⚠️ IMPORTANT: Run this SQL in Supabase Dashboard

The `trade_for` and `trade_preferences` columns need to be added to the `listings` table.

### Steps:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** (left sidebar)
3. Create a **New Query**
4. Copy and paste the SQL below
5. Click **Run**

### SQL Migration:

```sql
-- Add Trade/Barter listing type support
-- This allows users to list items for trade without monetary exchange

-- Update the CHECK constraint to include 'trade'
ALTER TABLE listings 
DROP CONSTRAINT IF EXISTS listings_listing_type_check;

ALTER TABLE listings 
ADD CONSTRAINT listings_listing_type_check 
CHECK (listing_type IN ('auction', 'store', 'trade'));

-- Add trade-specific fields
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS trade_for TEXT;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS trade_preferences TEXT;

-- Add comments for clarity
COMMENT ON COLUMN listings.trade_for IS 'What the seller is looking to trade for (required for trade listings)';
COMMENT ON COLUMN listings.trade_preferences IS 'Additional details about acceptable trades (optional)';
```

### Verify Migration Success:

After running the SQL, verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('trade_for', 'trade_preferences', 'listing_type')
ORDER BY column_name;
```

You should see:
- `listing_type` (character varying)
- `trade_for` (text)
- `trade_preferences` (text)

### ✅ Migration Complete!

Once this SQL runs successfully, the TypeScript types have already been updated in `src/lib/supabase.ts` and the app will work correctly.

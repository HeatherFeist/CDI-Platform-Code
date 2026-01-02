# Supabase Database Setup for Shop'reneur

## Issue Found
The products weren't saving because:
1. The Supabase `products` table was using UUID for IDs, but the app generates string IDs
2. Missing columns: `video_review_completed`, `marketplace_id`, `is_marketplace_synced`
3. Missing platform: `Temu` wasn't in the database constraints
4. Wrong table name: Schema had `user_profiles` but code uses `profiles`

## How to Fix Your Supabase Database

### Option 1: Run the Migration Script (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your Shop'reneur project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase/migration_fix_products.sql`
6. Paste it into the SQL editor
7. Click "Run" button

This will:
- Change the products table ID from UUID to TEXT
- Add missing columns (`video_review_completed`, `marketplace_id`, `is_marketplace_synced`)
- Add Temu to the platform options
- Fix the profiles table name
- Add shipping address support
- Update all security policies

### Option 2: Fresh Database Setup
If your database is empty or you want to start fresh:

1. Go to Supabase SQL Editor
2. Drop existing tables:
```sql
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS sale_records CASCADE;
```

3. Run the original `schema.sql` file
4. Then run `migration_fix_products.sql` to add the fixes

## What Was Changed in the Code

### Fixed saveProduct Function
Changed from checking if `product.id` exists (which always did) to using `upsert`:

**Before:**
```typescript
const { error } = product.id 
  ? await supabase.from('products').update(dbPayload).eq('id', product.id)
  : await supabase.from('products').insert([dbPayload]);
```

**After:**
```typescript
const { error } = await supabase
  .from('products')
  .upsert(dbPayload, { onConflict: 'id' });
```

This properly handles both inserting new products and updating existing ones.

## Testing After Migration

1. Clear your browser cache and reload the app
2. Try adding a new Amazon product
3. Check the browser console (F12) for any errors
4. Verify the product appears in your Supabase dashboard under "Table Editor" > "products"
5. Try editing the product
6. Try deleting the product

## Troubleshooting

### Products Still Not Saving?
1. Check browser console (F12) for error messages
2. Go to Supabase dashboard > "Table Editor" > "products" to see if anything is there
3. Check Supabase logs: Dashboard > "Logs" > "Postgres Logs"

### "Row Level Security" Errors?
The migration sets permissive policies for development. If you see RLS errors:
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Still Having Issues?
The app now has localStorage fallback. Even if Supabase isn't working, products will save locally in your browser. They'll sync to Supabase once the database is fixed.

## Security Note
The migration uses permissive RLS policies (`true` for everyone) for ease of development. For production, you should implement proper authentication and restrict access to authenticated users only.

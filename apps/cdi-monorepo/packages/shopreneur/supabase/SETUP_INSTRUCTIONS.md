# Supabase Setup Instructions for Shop'reneur

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `shopreneur` (or your preferred name)
5. Set a strong database password (save this!)
6. Select your region (closest to your users)
7. Click "Create new project"

## Step 2: Run Database Schema
1. Wait for your project to finish initializing
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL editor
6. Click **"Run"** or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

## Step 3: Configure Authentication (Optional)
If you want user authentication:
1. Go to **Authentication** > **Providers** in sidebar
2. Enable **Email** provider (enabled by default)
3. Optional: Enable social providers (Google, GitHub, etc.)
4. Configure email templates under **Authentication** > **Email Templates**

## Step 4: Enable Realtime
1. Go to **Database** > **Replication**
2. Verify that these tables are enabled for realtime:
   - ✅ products
   - ✅ messages
   - ✅ shop_settings
3. If not enabled, click the table and toggle "Enable Replication"

## Step 5: Get Your API Credentials
1. Go to **Project Settings** (gear icon) > **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

## Step 6: Update Your App
1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create `.env` file in your project root:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Update `services/firebase.ts` → rename to `services/supabase.ts` and use the new Supabase configuration

## Step 7: Verify Setup
1. Go to **Table Editor** in Supabase dashboard
2. You should see all tables:
   - products
   - shop_settings
   - messages
   - user_profiles
   - sale_records
3. Check that `shop_settings` has 1 default row

## Step 8: Test Connection
After updating your code, run:
```bash
npm run dev
```

Check browser console for any Supabase connection errors.

## Optional: Storage Setup
If you need file uploads (for product images, logos, etc.):
1. Go to **Storage** in sidebar
2. Create a new bucket: `product-images`
3. Set bucket to **Public** if images should be publicly accessible
4. Update policies for authenticated uploads

## Row Level Security (RLS) Notes
The schema includes RLS policies:
- **Products**: Public read, authenticated write
- **Messages**: Users only see their own
- **Settings**: Public read, authenticated write
- **Profiles**: Public read, own profile write

Modify these in **Authentication** > **Policies** if needed.

## Troubleshooting
- **Can't connect?** Check your API keys in `.env`
- **No data showing?** Verify RLS policies aren't blocking access
- **Realtime not working?** Check Database > Replication settings
- **CORS errors?** Make sure you're using the anon key, not service_role

## Next Steps
1. Migrate existing Firebase data (if any)
2. Update all component imports from Firebase to Supabase
3. Test all CRUD operations
4. Set up backup strategy in Supabase dashboard

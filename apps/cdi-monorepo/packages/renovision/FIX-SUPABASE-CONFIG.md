# =====================================================
# HOW TO GET YOUR CORRECT SUPABASE CREDENTIALS
# =====================================================

## Step 1: Get Your Project URL and API Keys

1. Go to: https://app.supabase.com/
2. Click on your project: "gjbrjysuqdvvqlxklvos"
3. In the left sidebar, click: Settings (gear icon at bottom)
4. Click: API
5. You'll see:
   - Project URL: https://gjbrjysuqdvvqlxklvos.supabase.co
   - anon/public key: eyJhbGc.... (very long key starting with "eyJ")

## Step 2: Update Your .env File

Replace these lines in your .env:

BEFORE (WRONG):
VITE_SUPABASE_URL=https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos
VITE_SUPABASE_ANON_KEY=sb_publishable_NhtJlg9Z179brctGjJKGzw_lu_GTird

AFTER (CORRECT):
VITE_SUPABASE_URL=https://gjbrjysuqdvvqlxklvos.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc.... (paste your actual anon key)

## Step 3: Rebuild and Deploy

1. npm run build
2. firebase deploy --only hosting

## What the Correct Values Look Like:

✅ Project URL format: https://XXXXXXXXXXXXXXXX.supabase.co
   - Must end with .supabase.co
   - Has random characters before .supabase.co

✅ Anon Key format: eyJhbGc....
   - Very long (300+ characters)
   - Starts with "eyJ"
   - Looks like a JWT token

❌ Your current values are:
   - Dashboard URL (for humans to visit, not for apps)
   - Random invalid key

## Why Your App is Stuck Loading:

The app can't connect to Supabase because:
- The URL points to the dashboard website, not your database
- The key is invalid and gets rejected
- Every database query fails and hangs forever

## After You Fix:

Your estimates and team members tabs will load instantly! ✨

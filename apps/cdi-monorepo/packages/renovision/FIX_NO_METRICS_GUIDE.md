# 🔧 Fix "No Metrics Available" - Step by Step

## Problem
You're seeing "No Metrics Available" on the dashboard and no setup banner. This means your user profile doesn't have a `business_id` linked to it.

---

## Quick Fix (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This Query (Replace YOUR_EMAIL)
Copy and paste this into the SQL Editor:

```sql
-- Check your current profile
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    business_id
FROM profiles
WHERE email = 'heatherfeist0@gmail.com'; -- ⚠️ CHANGE THIS TO YOUR EMAIL
```

**Click "Run"**

**Result Analysis:**
- If `business_id` is **NULL** → Continue to Step 3
- If `business_id` has a value → Your issue is elsewhere (skip to Troubleshooting section)

### Step 3: Create Business and Link to Your Profile

```sql
-- Create business and link to your profile
DO $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com'; -- ⚠️ CHANGE THIS TO YOUR EMAIL
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Check your email address.';
    END IF;
    
    -- Create new business
    INSERT INTO businesses (
        company_name,
        created_at,
        updated_at
    ) VALUES (
        'Constructive Design LLC', -- You can change this name later in the setup wizard
        NOW(),
        NOW()
    ) RETURNING id INTO v_business_id;
    
    -- Link business to profile
    UPDATE profiles
    SET business_id = v_business_id
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Success! Business created and linked. Business ID: %', v_business_id;
END $$;
```

**Click "Run"**

### Step 4: Verify the Fix

```sql
-- Verify everything is linked correctly
SELECT 
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.business_id,
    b.company_name
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com'; -- ⚠️ CHANGE THIS TO YOUR EMAIL
```

**Expected Result:**
- `business_id` should now have a UUID value
- `company_name` should show "My Business" (or whatever you set)

### Step 5: Refresh Your App
1. Go back to your app in the browser
2. **Hard refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. You should now see the **orange setup banner** at the top!

---

## What You'll See After the Fix

### ✅ Setup Banner Should Appear:
```
🏢 Complete Your Business Profile
Add your company name, phone, and address to get started
[Complete Setup →]
```

### ✅ Click "Complete Setup" Button
This will take you to `/business/setup` where you'll fill in:

**Step 1 - Business Details:**
- Company Name
- Phone Number  
- Address, City, State, ZIP

**Step 2 - Payment Settings:**
- PayPal Email (optional)
- CashApp $cashtag (optional)

**Step 3 - AI Settings:**
- Gemini API Key (optional)

---

## Troubleshooting

### Issue 1: "businesses table does not exist"

Run this to create the table:

```sql
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Then go back to Step 3.

### Issue 2: "profiles table does not have business_id column"

Run this to add the column:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
```

Then go back to Step 3.

### Issue 3: Still seeing "No Metrics Available" after fix

Check if you have the necessary tables:

```sql
-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'businesses', 'customers', 'projects');
```

If any are missing, you need to run the full database migration scripts.

### Issue 4: Setup banner still not showing

Clear your browser cache:
1. Press F12 to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or manually navigate to:
```
http://localhost:5173/business/setup
```

---

## Alternative: Complete Manual Setup

If the SQL scripts don't work, you can manually create everything:

### 1. Create Business
```sql
INSERT INTO businesses (company_name, created_at, updated_at)
VALUES ('Your Company Name', NOW(), NOW())
RETURNING id;
```
**Copy the returned ID**

### 2. Link to Your Profile
```sql
UPDATE profiles
SET business_id = 'paste-the-id-from-step-1-here'
WHERE email = 'your@email.com';
```

### 3. Complete Business Details
```sql
UPDATE businesses
SET 
    company_name = 'Your Company Name',
    phone = '555-1234',
    address = '123 Main St',
    city = 'Your City',
    state = 'CA',
    zip = '12345'
WHERE id = 'paste-the-id-from-step-1-here';
```

---

## After Setup is Complete

Once you've completed the setup wizard, you should see:
- ✅ Dashboard shows actual metrics
- ✅ Setup banner disappears (or shows 100% complete)
- ✅ Can create customers and projects
- ✅ Can generate estimates and invoices

---

## Need More Help?

If you're still having issues:

1. **Check Browser Console**:
   - Press F12
   - Go to Console tab
   - Look for error messages
   - Share the errors with me

2. **Check Supabase Logs**:
   - Go to Supabase Dashboard
   - Click "Logs" in sidebar
   - Look for errors
   - Share relevant error messages

3. **Verify Your Email**:
   - Make sure you're using the exact email you logged in with
   - Check capitalization (emails are case-sensitive in some databases)

---

## Quick Test

Run this to verify everything is set up:

```sql
SELECT 
    'Profile exists' as check_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM profiles WHERE email = 'your@email.com'
UNION ALL
SELECT 
    'Has business_id',
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM profiles WHERE email = 'your@email.com' AND business_id IS NOT NULL
UNION ALL
SELECT 
    'Business exists',
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM businesses WHERE id IN (SELECT business_id FROM profiles WHERE email = 'your@email.com');
```

All three should show ✅ PASS!

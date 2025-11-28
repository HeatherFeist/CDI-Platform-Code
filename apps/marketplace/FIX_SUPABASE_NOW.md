# 🔴 URGENT: Fix Supabase Connection Issue

## Problem
Authentication and location features are broken because Supabase database queries are failing with `TypeError: fetch failed`.

## Diagnosis
The diagnostic script showed all database tables are unreachable, which means either:
1. ✅ **Most Likely:** Supabase project is paused (free tier auto-pauses after inactivity)
2. Network connectivity issue
3. Incorrect credentials (unlikely - they worked before)

---

## 🛠️ **Immediate Fix Steps**

### **Step 1: Check Supabase Project Status**

1. Go to: **https://supabase.com/dashboard**
2. Sign in with your account
3. Look for your project: `ejjwwbxrhepoztynyqly`
4. Check the status indicator:
   - 🟢 **Active** = Good, skip to Step 3
   - 🟡 **Paused** = Continue to Step 2
   - 🔴 **Inactive** = Continue to Step 2

### **Step 2: Resume/Restore Project**

If your project shows as "Paused" or "Inactive":

1. Click on the project
2. Look for "**Resume Project**" or "**Restore Project**" button
3. Click it and wait 1-2 minutes for the database to wake up
4. You should see the status change to "Active" 🟢

**Why This Happens:**
- Free tier projects pause after 7 days of inactivity
- Completely normal and expected
- Just click to resume - no data is lost!

### **Step 3: Verify Connection**

After resuming the project, test the connection:

**Option A: Use Supabase Dashboard**
1. In your Supabase project, go to "**Table Editor**"
2. Look for the `profiles` table
3. If you can see data → Connection is working! ✅

**Option B: Run Our Diagnostic Script**
```powershell
node "c:\Users\heath\Downloads\Auction App\Auction Platform\check-database.js"
```

Expected output when working:
```
✅ Found X profile(s)
✅ Found X listing(s)
```

---

## 🏗️ **Missing Tables Issue**

If the connection works but you get "table does not exist" errors:

### **Create Cities Table**

The `cities` table is needed for location features (Dayton, OH default).

**SQL to Run in Supabase SQL Editor:**

```sql
-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  timezone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, state, country)
);

-- Create index for fast lookups
CREATE INDEX idx_cities_active ON public.cities(is_active);
CREATE INDEX idx_cities_name_state ON public.cities(name, state);

-- Enable RLS (Row Level Security)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Cities are publicly readable"
  ON public.cities
  FOR SELECT
  TO public
  USING (is_active = true);

-- Insert Dayton, Ohio as default city
INSERT INTO public.cities (name, state, country, latitude, longitude, population, timezone, is_active)
VALUES 
  ('Dayton', 'Ohio', 'USA', 39.7589, -84.1916, 140407, 'America/New_York', true)
ON CONFLICT (name, state, country) DO NOTHING;

-- Insert other major Ohio cities for future use
INSERT INTO public.cities (name, state, country, latitude, longitude, population, timezone, is_active)
VALUES 
  ('Columbus', 'Ohio', 'USA', 39.9612, -82.9988, 905748, 'America/New_York', true),
  ('Cleveland', 'Ohio', 'USA', 41.4993, -81.6944, 372624, 'America/New_York', true),
  ('Cincinnati', 'Ohio', 'USA', 39.1031, -84.5120, 309317, 'America/New_York', true),
  ('Toledo', 'Ohio', 'USA', 41.6528, -83.5379, 270871, 'America/New_York', true),
  ('Akron', 'Ohio', 'USA', 41.0814, -81.5190, 197597, 'America/New_York', true)
ON CONFLICT (name, state, country) DO NOTHING;

-- Verify insertion
SELECT * FROM public.cities WHERE state = 'Ohio' ORDER BY population DESC;
```

**How to Run This:**

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the SQL above
4. Click **Run** (or press `Ctrl+Enter`)
5. You should see "Success. 6 rows returned." or similar

---

## 🔧 **Add city_id to Profiles Table**

If your `profiles` table doesn't have a `city_id` column:

```sql
-- Add city_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city_id);

-- Optional: Set default city (Dayton) for existing users
UPDATE public.profiles 
SET city_id = (SELECT id FROM public.cities WHERE name = 'Dayton' AND state = 'Ohio' LIMIT 1)
WHERE city_id IS NULL;
```

---

## 🧪 **Test After Fixes**

### **1. Test Login**
1. Go to http://localhost:3003
2. Click "Sign In" button (should be visible now)
3. Try logging in with your credentials
4. Should work! ✅

### **2. Test Location**
1. After logging in, the homepage should show "Dayton, OH" as default
2. You should be able to click and change your city
3. Location should persist in your profile

### **3. Test Database Connection**
Run the diagnostic script again:
```powershell
node "c:\Users\heath\Downloads\Auction App\Auction Platform\check-database.js"
```

Expected output:
```
✅ Found X profile(s)
✅ Found X city/cities
✅ Found Dayton: { name: 'Dayton', state: 'Ohio', ... }
✅ Found X listing(s)
```

---

## 📋 **Complete Checklist**

- [ ] Go to Supabase Dashboard
- [ ] Check project status (paused/active)
- [ ] If paused, click "Resume Project"
- [ ] Wait 1-2 minutes for database to wake up
- [ ] Go to SQL Editor
- [ ] Run cities table creation SQL
- [ ] Run city_id column addition SQL
- [ ] Verify 6 Ohio cities were created
- [ ] Refresh your local app (http://localhost:3003)
- [ ] Try signing in
- [ ] Check if Dayton, OH shows as default location
- [ ] Run diagnostic script to confirm
- [ ] Test payment flow (once auth works)

---

## 🎯 **Expected Timeline**

- **Resume Supabase:** 2 minutes
- **Create cities table:** 1 minute
- **Add city_id column:** 1 minute
- **Test login:** 1 minute
- **Total:** ~5 minutes

---

## 🆘 **If Still Not Working**

### **Error: "relation 'cities' does not exist"**
- You need to run the cities table creation SQL above
- Go to Supabase Dashboard → SQL Editor → Run the SQL

### **Error: "column 'city_id' does not exist"**
- Run the ALTER TABLE command to add the column
- Or ignore location features for now (they're optional)

### **Error: "TypeError: fetch failed"**
- Supabase project is still paused/starting
- Wait another minute and try again
- Check your internet connection
- Verify the Supabase URL in .env.local is correct

### **Error: "Invalid login credentials"**
- Create a new account (Sign Up button)
- Check if you remember your password
- Or reset password via Supabase Dashboard

---

## 🚀 **Once Working**

After fixing Supabase:
1. ✅ Authentication will work
2. ✅ Location will show "Dayton, OH"
3. ✅ You can create listings
4. ✅ You can test payments
5. ✅ Ready to deploy!

---

**First Action: Go to https://supabase.com/dashboard and check your project status RIGHT NOW!**

Let me know what you see and I'll guide you through the next steps.

# 🚀 MASTER SETUP - Complete Instructions

## What This Does

The master setup script will:
- ✅ Check what tables and data exist
- ✅ Create any missing tables
- ✅ Create your profile if it doesn't exist
- ✅ Create your business and link it to your profile
- ✅ Set up payment settings record
- ✅ Create all affiliate system tables
- ✅ Verify everything is correct

**This is a ONE-TIME setup. Run it once and you're done.**

---

## 🎯 How to Run It

### Step 1: Open Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Create New Query
1. Click **New Query** button
2. You'll see an empty SQL editor

### Step 3: Copy the Script
1. Open `MASTER_SETUP_SCRIPT.sql` in VS Code
2. Press `Ctrl + A` to select all
3. Press `Ctrl + C` to copy

### Step 4: Paste and Run
1. Go back to Supabase SQL Editor
2. Click in the editor
3. Press `Ctrl + V` to paste
4. Click **RUN** button (or press F5)

### Step 5: Watch the Output
The script will show you messages like:
```
✅ All tables created/verified
✅ Profile created for heatherfeist0@gmail.com
✅ Business created: [UUID]
✅ Business linked to profile
✅ Payment settings record created
🎉 COMPLETE! Ready to use!
```

### Step 6: Check Verification Results
Scroll down in the output to see:
- **YOUR SETUP STATUS** - Should show "🎉 COMPLETE! Ready to use!"
- **PAYMENT SETTINGS** - Should show "✅ Record exists"
- **DATABASE SUMMARY** - Shows counts of all your data

---

## 🎉 After Running the Script

### Immediate Next Steps:

1. **Go to your browser** with the app open
2. **Hard refresh**: Press `Ctrl + Shift + R`
3. **You should now see**:
   - Orange setup banner at the top
   - "Complete Your Business Profile" message
   - "Complete Setup" button

4. **Click "Complete Setup"** button
5. **Fill in the 3-step wizard**:
   - **Step 1 - Business Details**: Company name, phone, address
   - **Step 2 - Payment Settings**: PayPal email, CashApp (optional)
   - **Step 3 - AI Settings**: Gemini API key (optional)

6. **Dashboard will now show metrics** instead of "No Metrics Available"

---

## ✅ What's Now Working

After running the script, these features will work:

### Business Features:
- ✅ Business Dashboard (shows metrics)
- ✅ Business Settings (can save changes)
- ✅ Payment Settings (can add PayPal/CashApp)
- ✅ Customer Management (can add customers)
- ✅ Project Management (can create projects)
- ✅ Team Member Management (can add team)

### Affiliate Features:
- ✅ Member can recruit affiliates
- ✅ Affiliates can sign up via invitation link
- ✅ Affiliates can submit leads
- ✅ PM can review and approve leads
- ✅ Commission tracking system
- ✅ Affiliate earnings dashboard
- ✅ Member override earnings tracking

---

## 🔍 Troubleshooting

### Issue 1: "User not found" Error

**Solution:** Update your email in the script
1. Open `MASTER_SETUP_SCRIPT.sql`
2. Find all instances of `heatherfeist0@gmail.com`
3. Replace with your actual email (5 places total)
4. Save and run again

### Issue 2: "relation does not exist" Error

This means your schema is very incomplete. 

**Solution:** Run the base schema first:
1. Look for `supabase-schema.sql` in your project
2. Run that FIRST
3. Then run `MASTER_SETUP_SCRIPT.sql`

### Issue 3: Banner Still Not Showing After Script

**Check these:**

1. **Did the script succeed?**
   - Look for "🎉 COMPLETE! Ready to use!" in output
   - Check verification section shows business_id

2. **Did you hard refresh?**
   - Press `Ctrl + Shift + R` (not just F5)
   - Or open in incognito window

3. **Is dev server running?**
   - Check terminal for `npm run dev`
   - Try restarting: `Ctrl+C` then `npm run dev`

4. **Check browser console:**
   - Press F12
   - Look for errors
   - Should see "User profile exists but no business_id" or similar

### Issue 4: "duplicate key value" Error

This means you already have some data.

**Solution:** That's fine! The script is smart:
- It only creates what's missing
- If profile exists, it updates it
- If business exists, it keeps it
- Just check the verification output to see your status

---

## 📊 Verification Queries

If you want to manually check your setup, run these:

### Check Your Profile:
```sql
SELECT 
    email,
    first_name,
    last_name,
    role,
    business_id
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';
```

**Expected:** Should show your email and a business_id UUID

### Check Your Business:
```sql
SELECT 
    p.email,
    b.id as business_id,
    b.company_name,
    b.phone,
    b.address
FROM profiles p
JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';
```

**Expected:** Should show your business details

### Check Payment Settings:
```sql
SELECT 
    ps.*
FROM payment_settings ps
WHERE ps.business_id IN (
    SELECT business_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com'
);
```

**Expected:** Should show one record (even if fields are empty)

---

## 🎯 Success Checklist

After running the script and refreshing, you should have:

- [x] Profile exists in database with business_id
- [x] Business record exists and is linked
- [x] Payment settings record exists
- [x] All tables created (businesses, customers, projects, etc.)
- [x] Setup banner appears in browser
- [x] Business settings page loads (no infinite loading)
- [x] Payment settings page loads (no infinite loading)
- [x] Can complete 3-step setup wizard
- [x] Dashboard shows metrics after setup

---

## 🆘 Still Having Issues?

If after running the script you're still stuck:

1. **Copy the entire output** from the SQL Editor
2. **Share it with me** - I'll see exactly what happened
3. **Check browser console** (F12) for any errors
4. **Let me know which step failed**

The script is designed to be idempotent (safe to run multiple times), so you can run it again if needed.

---

## 🚀 Ready to Deploy Affiliate System?

Once your basic setup is working:

1. ✅ Complete business setup wizard
2. ✅ Add at least one customer
3. ✅ Test creating a project
4. ✅ Follow `AFFILIATE_DEPLOYMENT_GUIDE.md` to deploy:
   - Edge Functions
   - Email service
   - Test affiliate signup flow
   - Test lead submission
   - Test commission tracking

---

## 📝 What This Script Created

**Tables:**
- `businesses` - Your business information
- `payment_settings` - PayPal, CashApp, etc.
- `customers` - Customer records
- `projects` - Project management
- `team_members` - Team roster
- `affiliate_partnerships` - Affiliate contractors
- `sub_opportunities` - Leads submitted by affiliates
- `affiliate_commissions` - Commission tracking

**Your Data:**
- Profile record linked to business
- Business record with company name
- Payment settings record (ready to fill in)

**Indexes:**
- Performance optimizations for all tables

**Total:** Everything you need for a fully functional app!

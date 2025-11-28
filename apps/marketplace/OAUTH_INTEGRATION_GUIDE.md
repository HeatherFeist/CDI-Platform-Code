# Facebook & Google OAuth Integration Guide

## 🎯 Quick Overview

This guide walks you through completing the Facebook and Google OAuth integration for the Constructive Designs Marketplace.

---

## ✅ Already Completed

- ✅ Database schema created (`add-facebook-auth-support-clean.sql`)
- ✅ React components built (SignInWithFacebook, SignInWithGoogle, Login page, callbacks)
- ✅ Routes configured in App.tsx
- ✅ Service account exists: `home-reno-vision-pro@appspot.gserviceaccount.com`
- ✅ Google OAuth Client ID: `667691828187-0q54jf86rnorts4qs2uh5sl7989frap4.apps.googleusercontent.com`

---

## 📋 Step-by-Step Implementation (30 minutes total)

### **STEP 1: Deploy Database Schema** ⚡ (5 min)

1. Go to Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos/sql
   ```

2. Click **"New Query"**

3. Open this file and copy contents:
   ```
   constructive-designs-marketplace/add-facebook-auth-support-clean.sql
   ```

4. Paste into SQL editor and click **"Run"**

5. Verify success - you should see:
   ```
   Success. No rows returned.
   ```

---

### **STEP 2: Create Meta Developer App** 📱 (10 min)

1. Go to: https://developers.facebook.com/apps/create

2. Click **"Create App"**

3. Choose **"Consumer"** app type

4. Fill in:
   - **App Name**: `Constructive Designs Marketplace`
   - **App Contact Email**: Your email
   - **Business Account**: (optional)

5. Click **"Create App"**

6. Add **Facebook Login** product:
   - Dashboard → Add Products → **Facebook Login** → Set Up

7. **SAVE THESE VALUES**:
   - **App ID**: (e.g., 1234567890123456)
   - **App Secret**: Settings → Basic → Show (copy this!)

---

### **STEP 3: Configure Facebook OAuth Settings** ⚙️ (5 min)

Still in Meta Developer Dashboard:

1. Go to: **Products → Facebook Login → Settings**

2. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback
   ```

3. Under **Valid OAuth Redirect URIs**, also add (for local testing):
   ```
   http://localhost:5173/auth/facebook/callback
   ```

4. **Client OAuth Login**: Toggle **ON**

5. **Web OAuth Login**: Toggle **ON**

6. Click **"Save Changes"**

---

### **STEP 4: Enable Facebook in Supabase** 🔐 (3 min)

1. Go to Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos/auth/providers
   ```

2. Find **Facebook** provider → Click to expand

3. Toggle **"Enable Sign in with Facebook"** to **ON**

4. Paste from Meta Developer App:
   - **Facebook Client ID**: (Your App ID from Step 2)
   - **Facebook Client Secret**: (Your App Secret from Step 2)

5. Set **Site URL**:
   ```
   https://marketplace.constructivedesignsinc.org
   ```

6. Click **"Save"**

---

### **STEP 5: Configure Google OAuth** 🔍 (5 min)

1. Go to Google Cloud Console:
   ```
   https://console.cloud.google.com/apis/credentials?project=home-reno-vision-pro
   ```

2. Find OAuth Client: `667691828187-0q54jf86rnorts4qs2uh5sl7989frap4.apps.googleusercontent.com`

3. Click to edit it

4. Under **Authorized redirect URIs**, add:
   ```
   https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback
   ```

5. Also add (for local testing):
   ```
   http://localhost:5173/auth/google/callback
   ```

6. Click **"Save"**

7. **COPY the Client Secret** (you'll need it next)

---

### **STEP 6: Enable Google in Supabase** 🔐 (3 min)

1. Go to Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos/auth/providers
   ```

2. Find **Google** provider → Click to expand

3. Toggle **"Enable Sign in with Google"** to **ON**

4. Enter:
   - **Client ID**: `667691828187-0q54jf86rnorts4qs2uh5sl7989frap4.apps.googleusercontent.com`
   - **Client Secret**: (Paste from Google Cloud Console)

5. Set **Site URL**:
   ```
   https://marketplace.constructivedesignsinc.org
   ```

6. Click **"Save"**

---

## 🧪 Testing the Integration

### **Test Locally:**

1. Start the marketplace dev server:
   ```bash
   cd "c:\Users\heath\Downloads\constructive-designs-marketplace"
   npm run dev
   ```

2. Navigate to: http://localhost:5173/login

3. Click **"Continue with Facebook"**:
   - ✅ Should redirect to Facebook OAuth
   - ✅ After consent, redirect back to marketplace
   - ✅ User should be signed in
   - ✅ Check Supabase: Profile created with `facebook_id` and `signup_source='facebook'`

4. Sign out and try **"Continue with Google"**:
   - ✅ Should redirect to Google OAuth
   - ✅ After consent, redirect back to marketplace
   - ✅ User should be signed in
   - ✅ Check Supabase: Profile has `signup_source='google'`

### **Verify Database:**

Check profiles table in Supabase:
```sql
SELECT 
  id,
  email,
  facebook_id,
  signup_source,
  marketplace_only,
  member_joined_at,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

Expected results:
- Facebook users have `facebook_id` populated
- Google users have `signup_source='google'`
- New users have `marketplace_only=true` (until they upgrade)

---

## 🚀 Going Live

Once local testing works:

1. **Deploy marketplace to production**
   - Update OAuth redirect URLs to use production domain
   - Both Meta and Google Cloud Console

2. **Update Meta App Status**:
   - Meta Developer Dashboard → App Review
   - Submit for review if you need access to more than 100 users
   - For initial testing, just add test users

3. **Verify production OAuth**:
   - Test on live site
   - Check all redirects work correctly

---

## 🎉 What This Enables

After completing these steps, users can:

✅ **Sign up with Facebook** → Instant marketplace access
✅ **Sign up with Google** → Instant marketplace access  
✅ **One-click login** → No passwords to remember
✅ **Choose membership** → Marketplace-only (free) or Full Member ($29.99/month)
✅ **Automatic profile creation** → Email, name, avatar from OAuth provider

**Marketplace-Only Users Get:**
- Browse and purchase items
- Sell items (with platform donation option)
- Basic features

**Full Members Get:**
- Everything above PLUS:
- Workspace email (@constructivedesignsinc.org)
- Google Workspace access
- Tax-deductible donations
- Priority support
- Board volunteer opportunities

---

## 🔧 Troubleshooting

### Issue: "Invalid redirect URI"
- **Fix**: Make sure the exact callback URL is added in both Meta and Google OAuth settings
- **Check**: No trailing slash, correct protocol (http vs https)

### Issue: "Provider not enabled"
- **Fix**: Toggle the provider ON in Supabase → Authentication → Providers
- **Check**: Client ID and Secret are correct

### Issue: "No profile created after OAuth"
- **Fix**: Check browser console for errors
- **Check**: Database schema is deployed (profiles table has facebook_id column)

### Issue: Facebook says "App not setup"
- **Fix**: Add Facebook Login product in Meta Developer Dashboard
- **Check**: Valid OAuth Redirect URIs are configured

---

## 📝 File Reference

**Database:**
- `add-facebook-auth-support-clean.sql` - Schema migration

**Components:**
- `src/components/auth/LoginPage.tsx` - Main login page
- `src/components/auth/SignInWithFacebook.tsx` - Facebook OAuth button
- `src/components/auth/SignInWithGoogle.tsx` - Google OAuth button
- `src/components/auth/FacebookAuthCallback.tsx` - Facebook callback handler
- `src/components/auth/GoogleAuthCallback.tsx` - Google callback handler

**Routes:**
- `/login` - Login page
- `/auth/facebook/callback` - Facebook OAuth callback
- `/auth/google/callback` - Google OAuth callback

---

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ Login page loads with both Facebook and Google buttons
2. ✅ Clicking Facebook redirects to Facebook OAuth
3. ✅ After consent, redirects back and user is signed in
4. ✅ Profile created in Supabase with `facebook_id` populated
5. ✅ Same flow works for Google
6. ✅ Users can sign in repeatedly with same OAuth provider
7. ✅ Existing users with workspace emails maintain their accounts

---

**Need Help?** 
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Authentication
- Check Meta Developer Dashboard → App Review for any issues

Good luck! 🚀

# Fix Facebook OAuth - "Incorrect App ID" Error

## Problem
Getting "incorrect app id" error when trying to connect Facebook to marketplace.

## Root Cause
Facebook OAuth is not properly configured in Supabase.

---

## ✅ Solution - Step by Step

### Step 1: Get Your Facebook App Credentials

1. Go to **Facebook Developers**: https://developers.facebook.com/apps
2. Select your app (or create a new one)
3. Go to **Settings → Basic**
4. Copy these values:
   - **App ID** (e.g., `1234567890123456`)
   - **App Secret** (click "Show", then copy)

### Step 2: Configure Facebook OAuth in Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos
2. Click **Authentication** (left sidebar)
3. Click **Providers**
4. Find **Facebook** in the list
5. Click **Enable**
6. Enter your credentials:
   - **Facebook Client ID**: Your App ID from Step 1
   - **Facebook Client Secret**: Your App Secret from Step 1
7. Copy the **Callback URL** shown (it will look like: `https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback`)
8. Click **Save**

### Step 3: Configure Facebook App Redirect URI

1. Back in **Facebook Developers Console**
2. Go to **Facebook Login → Settings** (left sidebar)
3. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback
   ```
4. Click **Save Changes**

### Step 4: Update Your .env File

Update `c:\Users\heath\Downloads\constructive-designs-marketplace\.env`:

```env
# Replace this line:
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here

# With your actual Facebook App ID:
VITE_FACEBOOK_APP_ID=1234567890123456

# Keep the Meta App ID (it's different):
VITE_META_APP_ID=81ccfb22f361eca101181609980f522d6e927e929cc51
```

### Step 5: Rebuild and Deploy

```powershell
cd "c:\Users\heath\Downloads\constructive-designs-marketplace"
npm run build
firebase deploy --only hosting
```

---

## 🔍 Quick Check - What These IDs Are For

| Variable | Purpose | Where It's Used |
|----------|---------|-----------------|
| `VITE_FACEBOOK_APP_ID` | Facebook SDK for sharing | Social share buttons |
| `VITE_META_APP_ID` | Meta OAuth (login) | Facebook login button |
| Supabase Facebook Provider | Supabase Auth | Backend authentication |

**Note:** The `VITE_META_APP_ID` in your .env looks unusual (too long). A Facebook App ID should be 15-16 digits like `1234567890123456`.

---

## ✅ Testing

After completing all steps:

1. Go to your marketplace: https://constructivedesignsinc.org
2. Click "Sign in with Facebook"
3. Should redirect to Facebook login (no "incorrect app id" error)
4. After login, redirects back to marketplace with user authenticated

---

## 🛠️ Common Issues

### "App Not Set Up" Error
- Make sure Facebook app is in "Live" mode (not Development)
- Go to Facebook App → Settings → Basic → App Mode → Switch to Live

### "URL Blocked" Error
- Add your domain to Facebook App → Settings → Basic → App Domains
- Add: `constructivedesignsinc.org`

### Still Getting "Incorrect App ID"
- Double-check the App ID matches between:
  * Facebook Developers Console
  * Supabase Auth Providers
  * Your .env file

### Users Can't Login
- Check Supabase logs: Dashboard → Logs → Auth Logs
- Look for error messages

---

## 📝 Notes

**Facebook App Requirements:**
- Must be in "Live" mode for public use
- Must have "Facebook Login" product added
- Must have valid OAuth redirect URIs
- Domain must be verified

**Supabase Requirements:**
- Facebook provider must be enabled
- Correct App ID and Secret
- Redirect URI must match exactly

**Your Current Setup:**
- Supabase URL: `https://gjbrjysuqdvvqlxklvos.supabase.co`
- Callback URL: `https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback`
- Domain: `constructivedesignsinc.org`

---

## 🎯 Quick Fix Commands

If you just need to update the .env and redeploy:

```powershell
# Edit .env file first, then:
cd "c:\Users\heath\Downloads\constructive-designs-marketplace"
npm run build
firebase deploy --only hosting
```

**After deployment, Facebook login should work!**

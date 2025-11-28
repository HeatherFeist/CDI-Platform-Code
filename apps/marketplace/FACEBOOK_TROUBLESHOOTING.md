# Facebook Integration - Troubleshooting Checklist

## ✅ What's Already Set Up (Code-wise)

Your marketplace already has:
- ✅ Facebook login button on `/login` page
- ✅ Facebook OAuth callback handler at `/auth/facebook/callback`
- ✅ Automatic profile creation for new users
- ✅ Facebook ID storage in profiles table
- ✅ Profile picture sync from Facebook

## 🔍 Quick Verification Steps

### 1. Check Supabase Configuration

Go to: https://supabase.com/dashboard → Your Project → Authentication → Providers

**Verify**:
- [ ] Facebook provider is **ENABLED** (toggle is ON)
- [ ] **Facebook Client ID** is filled in (your App ID)
- [ ] **Facebook Client Secret** is filled in (your App Secret)
- [ ] **Redirect URL** matches: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 2. Check Facebook App Configuration

Go to: https://developers.facebook.com/ → Your App → Facebook Login → Settings

**Verify**:
- [ ] **Valid OAuth Redirect URIs** includes:
  ```
  https://cdi-marketplace-platform.web.app/auth/facebook/callback
  https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
  ```
- [ ] **Client OAuth Login** is ENABLED
- [ ] **Web OAuth Login** is ENABLED
- [ ] App is in **Development** or **Live** mode (not disabled)

### 3. Test the Login Flow

1. **Go to**: https://cdi-marketplace-platform.web.app/login
2. **Look for**: Blue "Continue with Facebook" button
3. **Click it**: Should redirect to Facebook
4. **Authorize**: Click "Continue as [Your Name]"
5. **Redirect back**: Should go to `/auth/facebook/callback` then `/dashboard`

### 4. Check Browser Console

If login fails:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click Facebook login button
4. Look for errors (red text)
5. Common errors:
   - `redirect_uri_mismatch` → Check OAuth redirect URIs
   - `App Not Set Up` → Facebook app not configured
   - `Invalid client_id` → Wrong App ID in Supabase

### 5. Check Supabase Logs

1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Click Facebook login button
3. Look for auth events
4. Check for error messages

## 🐛 Common Issues & Fixes

### Issue: "App Not Set Up: This app is still in development mode"

**Fix**: 
1. Go to Facebook App → **Settings** → **Basic**
2. Scroll to **App Mode**
3. Switch from "Development" to "Live" mode
4. OR add your Facebook account as a test user

### Issue: "redirect_uri_mismatch"

**Fix**:
1. Copy the exact error message (it shows the redirect URI Facebook received)
2. Go to Facebook App → **Facebook Login** → **Settings**
3. Add that EXACT URI to **Valid OAuth Redirect URIs**
4. Make sure there are NO trailing slashes
5. Save changes

### Issue: Button doesn't appear

**Fix**:
1. Clear browser cache
2. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Try incognito/private browsing mode

### Issue: "Invalid client_id"

**Fix**:
1. Go to Facebook App → **Settings** → **Basic**
2. Copy **App ID** (not App Secret)
3. Go to Supabase → **Authentication** → **Providers** → **Facebook**
4. Paste into **Facebook Client ID** field
5. Save

### Issue: Login works but no location data

**Fix**:
1. Go to Facebook App → **App Review** → **Permissions and Features**
2. Request **`user_location`** permission
3. Provide use case for review
4. Wait for Facebook approval (1-3 days)
5. Until approved, users must manually select city

## 📊 Expected Behavior

### For New Users:
1. Click "Continue with Facebook"
2. Redirected to Facebook
3. Authorize app
4. Redirected back to marketplace
5. Profile automatically created
6. Membership offer modal appears
7. Choose "Marketplace Only" or "Become a Member"
8. Redirected to dashboard

### For Existing Users:
1. Click "Continue with Facebook"
2. Redirected to Facebook
3. Authorize app (if first time)
4. Redirected back to marketplace
5. Facebook ID linked to existing profile
6. Redirected to dashboard
7. "Welcome back!" message

## 🔐 Security Check

**Verify these are NOT exposed**:
- [ ] Facebook App Secret is NOT in client-side code
- [ ] App Secret is ONLY in Supabase (server-side)
- [ ] `.env` files are in `.gitignore`
- [ ] No API keys in public GitHub repos

## 📍 Location Data Integration

### Current Status:
- ✅ Code ready to use Facebook location
- ⏳ Requires `user_location` permission approval
- ⏳ Fallback to manual city selection

### When Approved:
```typescript
// User's city from Facebook
const facebookCity = user.user_metadata.location?.name;
// Example: "New York, New York"

// Auto-match to marketplace city
const matchingCity = cities.find(city => 
  facebookCity?.includes(city.name)
);
```

## ✅ Final Checklist

- [ ] Facebook app created and configured
- [ ] Facebook Login product added
- [ ] OAuth redirect URIs set correctly
- [ ] App ID and Secret in Supabase
- [ ] Facebook provider enabled in Supabase
- [ ] Tested login flow successfully
- [ ] Profile created in database
- [ ] User redirected to dashboard

## 🆘 Still Not Working?

1. **Check Supabase Auth Logs** for specific errors
2. **Check Facebook App Dashboard** → **Roles** → Add yourself as test user
3. **Try different browser** (Chrome, Firefox, Edge)
4. **Disable browser extensions** (ad blockers can interfere)
5. **Check network tab** in DevTools for failed requests

## 📞 Need Help?

If you're still stuck:
1. Check browser console for errors
2. Check Supabase logs for auth failures
3. Verify all redirect URIs match exactly
4. Make sure Facebook app is in correct mode (Development vs Live)

---

**Note**: The Facebook login button is already on your login page at:
`https://cdi-marketplace-platform.web.app/login`

Just verify the Supabase and Facebook configurations match the checklist above!

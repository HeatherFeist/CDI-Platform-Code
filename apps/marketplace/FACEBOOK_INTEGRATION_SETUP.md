# Facebook Integration Setup Guide

This guide will help you set up Facebook OAuth login and location data integration for the Constructive Designs Marketplace.

## 🎯 What You'll Get

✅ **Facebook Login** - Users can sign in with their Facebook account  
✅ **Location Data** - Access user's city/location from Facebook profile  
✅ **Profile Data** - Get user's name, email, and profile picture  
✅ **Social Sharing** - Share listings to Facebook (future feature)

---

## 📋 Prerequisites

1. A Facebook Developer account
2. Access to your Supabase project dashboard
3. Your marketplace URL: `https://cdi-marketplace-platform.web.app`

---

## 🚀 Setup Steps

### Step 1: Create Facebook App

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Consumer"** as the app type
4. Fill in app details:
   - **App Name**: `Constructive Designs Marketplace`
   - **App Contact Email**: Your email
   - **Business Account**: (optional)
5. Click **"Create App"**

---

### Step 2: Configure Facebook Login

1. In your Facebook App dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** platform
4. Enter your **Site URL**: `https://cdi-marketplace-platform.web.app`
5. Click **"Save"** and **"Continue"**

---

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. Add these **Valid OAuth Redirect URIs**:
   ```
   https://cdi-marketplace-platform.web.app/auth/facebook/callback
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   *(Replace YOUR_SUPABASE_PROJECT_ID with your actual project ID)*

3. **Client OAuth Settings**:
   - ✅ Enable **"Client OAuth Login"**
   - ✅ Enable **"Web OAuth Login"**
   - ✅ Enable **"Use Strict Mode for Redirect URIs"**

4. **Deauthorize Callback URL**: (optional)
   ```
   https://cdi-marketplace-platform.web.app/auth/deauthorize
   ```

5. Click **"Save Changes"**

---

### Step 4: Request Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - ✅ **`email`** - Get user's email (usually auto-approved)
   - ✅ **`public_profile`** - Get name, profile picture (auto-approved)
   - ✅ **`user_location`** - Get user's city/location (requires review)

3. For **`user_location`**:
   - Click **"Request Advanced Access"**
   - Provide use case: *"We use location data to show users local marketplace listings and connect them with nearby buyers/sellers in their city."*
   - Submit for review (may take 1-3 days)

---

### Step 5: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy these values:
   - **App ID**: `1234567890123456` (example)
   - **App Secret**: Click **"Show"** to reveal

3. **Keep these secret!** Don't commit them to Git.

---

### Step 6: Configure Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Facebook** in the list
4. Toggle **"Enable Facebook provider"** to ON
5. Enter your credentials:
   - **Facebook Client ID**: (Your App ID from Step 5)
   - **Facebook Client Secret**: (Your App Secret from Step 5)
6. **Redirect URL** (copy this):
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
7. Click **"Save"**

---

### Step 7: Test Facebook Login

1. Go to your marketplace: https://cdi-marketplace-platform.web.app
2. Click **"Sign In"** or **"Login"**
3. Click the **"Continue with Facebook"** button (blue button)
4. You should be redirected to Facebook
5. Authorize the app
6. You should be redirected back and logged in!

---

## 📍 Using Facebook Location Data

Once Facebook login is working and `user_location` permission is approved:

### Automatic Location Detection

The marketplace can automatically detect the user's city from their Facebook profile:

```typescript
// After Facebook login, get user's location
const { data: { user } } = await supabase.auth.getUser();

// Facebook provides location in user metadata
const userCity = user?.user_metadata?.location?.name; // e.g., "New York, NY"

// Auto-select matching city in marketplace
const matchingCity = cities.find(city => 
  userCity?.includes(city.name)
);
```

### Benefits

✅ **No manual selection** - City auto-detected from Facebook  
✅ **Accurate location** - Uses Facebook's verified data  
✅ **Better UX** - One less step for users  

---

## 🔒 Privacy & Security

### What Data We Access

- ✅ **Email**: For account creation
- ✅ **Name**: For user profile
- ✅ **Profile Picture**: For avatar
- ✅ **Location** (City only): For local marketplace matching

### What We DON'T Access

- ❌ Friends list
- ❌ Posts or timeline
- ❌ Messages
- ❌ Exact GPS coordinates (only city-level)

### User Control

- Users can revoke access anytime in Facebook Settings
- Users can manually change their city in marketplace settings
- Location data is only used for marketplace matching

---

## 🧪 Testing Checklist

- [ ] Facebook app created
- [ ] OAuth redirect URIs configured
- [ ] Permissions requested (email, public_profile, user_location)
- [ ] App ID and Secret added to Supabase
- [ ] Facebook provider enabled in Supabase
- [ ] Test login works
- [ ] User data (email, name) appears correctly
- [ ] Location data accessible (after approval)

---

## 🐛 Troubleshooting

### "Invalid OAuth Redirect URI"
- Check that redirect URIs in Facebook match exactly
- Include both marketplace URL and Supabase callback URL
- No trailing slashes

### "App Not Set Up"
- Make sure Facebook Login product is added
- Check that app is in "Development" or "Live" mode
- Verify OAuth settings are saved

### "Permission Denied"
- User may have denied permission
- Check App Review status for advanced permissions
- `user_location` requires Facebook approval

### Location Not Working
- `user_location` permission may not be approved yet
- Check App Review status
- Fallback to manual city selection

---

## 📚 Additional Resources

- **Facebook Login Docs**: https://developers.facebook.com/docs/facebook-login/
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-facebook
- **Facebook App Review**: https://developers.facebook.com/docs/app-review

---

## 🎉 Next Steps

After setup:
1. ✅ Users can log in with Facebook
2. ✅ City auto-detected from Facebook profile
3. ✅ Seamless onboarding experience
4. 🔜 Share listings to Facebook (future feature)

---

## 💡 Pro Tips

1. **Test in Development Mode** first before going live
2. **Request permissions early** - App review takes time
3. **Provide clear use case** for location permission
4. **Keep credentials secure** - Use environment variables
5. **Monitor login analytics** in Facebook dashboard

---

Need help? Check the Supabase logs and Facebook App Dashboard for error details!

# Facebook Authentication Setup Guide

## Step 1: Enable Facebook Provider in Supabase (5 min)

### Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/dashboard
   - Select project: `gjbrjysuqdvvqlxklvos`

2. **Navigate to Authentication Providers**
   - Click on `Authentication` in the left sidebar
   - Click on `Providers`

3. **Enable Facebook**
   - Find **Facebook** in the providers list
   - Click the toggle to **Enable**

4. **Add Facebook App Credentials**
   - You'll see two fields:
     - `Client ID` - Paste your **Facebook App ID**
     - `Client Secret` - Paste your **Facebook App Secret**
   
   > ⚠️ **Where to find these:**
   > 1. Go to https://developers.facebook.com/apps
   > 2. Select your "CDI Marketplace" app
   > 3. Go to Settings → Basic
   > 4. Copy **App ID** and **App Secret**

5. **Redirect URI** (Supabase will show this)
   - Should already be set to: `https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback`
   - If not, manually add it

6. **Save Changes**
   - Click **Save** button at bottom

---

## Step 2: Configure Facebook App Redirect URLs (5 min)

### Instructions:

1. **Open Meta Developer Console**
   - Go to: https://developers.facebook.com/apps
   - Select your **CDI Marketplace** app

2. **Add Facebook Login Product** (if not already added)
   - Click **+ Add Product**
   - Search for "Facebook Login"
   - Click **Set Up**
   - Choose "Web"

3. **Configure OAuth Redirect URIs**
   - Go to: **Settings** → **Facebook Login** → **Settings**
   - Find: **Valid OAuth Redirect URIs**
   - Add all three URLs (one per line):
     ```
     https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback
     https://marketplace.constructivedesignsinc.org/auth/facebook/callback
     http://localhost:3000/auth/facebook/callback
     ```

4. **Save Changes**
   - Click **Save Changes** at bottom of page

5. **Verify App ID and Secret**
   - Go to: **Settings** → **Basic**
   - Copy your **App ID** and **App Secret**
   - These are what you'll paste into Supabase (Step 1)

---

## Verification Checklist

After completing both steps, verify everything works:

- [ ] Facebook is enabled in Supabase Providers
- [ ] Facebook App ID is entered in Supabase
- [ ] Facebook App Secret is entered in Supabase
- [ ] Redirect URL `https://gjbrjysuqdvvqlxklvos.supabase.co/auth/v1/callback` is in Meta app
- [ ] Redirect URL `https://marketplace.constructivedesignsinc.org/auth/facebook/callback` is in Meta app
- [ ] Redirect URL `http://localhost:3000/auth/facebook/callback` is in Meta app (for testing)

---

## What's Ready to Go

Once these settings are configured, these components are already built and ready to use:

### 1. **SignInWithFacebook Button**
   - Location: `src/components/auth/SignInWithFacebook.tsx`
   - Handles OAuth redirect and button styling

### 2. **Facebook OAuth Callback Handler**
   - Location: `src/components/auth/FacebookAuthCallback.tsx`
   - Creates user profile with facebook_id
   - Sets marketplace_only=true for new users
   - Shows MembershipOfferModal

### 3. **Membership Offer Modal**
   - Location: `src/components/auth/MembershipOfferModal.tsx`
   - Beautiful UI with membership benefits
   - Two CTA buttons: "Become Member" or "Maybe Later"

### 4. **Route Configuration**
   - App.tsx already has `/auth/facebook/callback` route configured
   - Ready to handle OAuth responses

### 5. **Edge Function Updated**
   - `create-workspace-account` function handles Facebook users
   - Automatically sets marketplace_only=false when workspace created
   - Tracks signup_source='facebook'

---

## Next: Add Button to Login Page

Once settings are configured, add the button to your marketplace login/signup page:

```tsx
import SignInWithFacebook from '@/components/auth/SignInWithFacebook';

export function LoginPage() {
  return (
    <div className="space-y-4">
      <h2>Sign in to Marketplace</h2>
      
      {/* Facebook Login */}
      <SignInWithFacebook 
        onSuccess={() => navigate('/dashboard')}
        onError={(error) => console.error('Facebook auth failed:', error)}
      />
      
      {/* Other options */}
      <div className="text-center text-sm text-gray-500">or</div>
      <button>Sign up with Email</button>
    </div>
  );
}
```

---

## Testing the Flow

Once configured, test locally:

1. Run dev server: `npm run dev`
2. Visit: http://localhost:3000
3. Click "Sign in with Facebook"
4. Complete Facebook OAuth
5. You should see the **Membership Offer Modal**
6. Click "Become Member" to test workspace creation
7. Verify profile in Supabase with facebook_id and signup_source='facebook'

---

**Status:** Configuration is manual in Meta/Supabase dashboards. Once done, everything else is code-ready! 🚀

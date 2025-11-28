# Firebase Subdomain Deployment Guide

## Overview
Deploy two apps to **constructivedesignsinc.org** with subdomains:
- **marketplace.constructivedesignsinc.org** → Marketplace app
- **renovision.constructivedesignsinc.org** → Home Reno Vision Pro app

---

## Prerequisites

✅ Domain: `constructivedesignsinc.org` (registered with GoDaddy)
✅ Firebase Hosting active
✅ Both apps ready to deploy

---

## Part 1: Firebase Project Setup

### Step 1: Initialize Firebase in Home Reno Vision Pro

```bash
# Navigate to project directory
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"

# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init
```

**During initialization, select:**
- ✅ Hosting: Configure files for Firebase Hosting
- Choose existing project or create new one
- **Public directory**: `dist` (Vite builds to dist folder)
- **Single-page app**: Yes
- **Set up automatic builds with GitHub**: No (for now)

### Step 2: Configure firebase.json

The project already has `firebase.json`. Update it:

```json
{
  "hosting": {
    "site": "renovision",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

---

## Part 2: Build and Deploy

### Step 1: Build the Application

```powershell
# Install dependencies
npm install

# Build for production
npm run build
```

This creates the `dist` folder with your production build.

### Step 2: Test Locally (Optional)

```powershell
# Preview the build
firebase hosting:channel:deploy preview

# Or serve locally
firebase serve
```

### Step 3: Deploy to Firebase

```powershell
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy specific site
firebase deploy --only hosting:renovision
```

---

## Part 3: Set Up Firebase Hosting Sites

### Step 1: Create Hosting Sites in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Hosting** in left sidebar
4. Click **Add another site**

Create two sites:
- **Site 1**: `marketplace` (or whatever you named the marketplace)
- **Site 2**: `renovision` (for Home Reno Vision Pro)

### Step 2: Link Sites to Your Apps

**For Marketplace App:**
```bash
cd path/to/marketplace-app

# Update firebase.json
{
  "hosting": {
    "site": "marketplace",
    "public": "dist",
    ...
  }
}

# Deploy
firebase deploy --only hosting:marketplace
```

**For Home Reno Vision Pro:**
```bash
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"

# firebase.json already configured with site: "renovision"

# Deploy
firebase deploy --only hosting:renovision
```

---

## Part 4: GoDaddy DNS Configuration

### Step 1: Get Firebase IP Addresses

Firebase uses these IP addresses for custom domains:
```
151.101.1.195
151.101.65.195
```

### Step 2: Configure DNS in GoDaddy

1. **Login to GoDaddy**
   - Go to [godaddy.com](https://www.godaddy.com/)
   - Sign in to your account
   - Go to **My Products** → **DNS**

2. **Set Up Root Domain** (constructivedesignsinc.org)

   Add **A Records**:
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
   TTL: 600 seconds (10 minutes)
   ```
   
   ```
   Type: A
   Name: @
   Value: 151.101.65.195
   TTL: 600 seconds
   ```

3. **Set Up Marketplace Subdomain**

   Add **CNAME Record**:
   ```
   Type: CNAME
   Name: marketplace
   Value: marketplace.web.app
   TTL: 600 seconds
   ```

4. **Set Up RenoVision Subdomain**

   Add **CNAME Record**:
   ```
   Type: CNAME
   Name: renovision
   Value: renovision.web.app
   TTL: 600 seconds
   ```

**Your GoDaddy DNS records should look like:**
```
Type    Name          Value                        TTL
----    ----          -----                        ---
A       @             151.101.1.195               600
A       @             151.101.65.195              600
CNAME   marketplace   marketplace.web.app         600
CNAME   renovision    renovision.web.app          600
CNAME   www           constructivedesignsinc.org  600
```

---

## Part 5: Connect Custom Domains in Firebase

### Step 1: Add Custom Domain for Root (Optional)

1. Firebase Console → Hosting → Your default site
2. Click **Add custom domain**
3. Enter: `constructivedesignsinc.org`
4. Follow verification steps
5. Firebase will provide TXT record for verification
6. Add TXT record to GoDaddy DNS
7. Wait for verification (can take up to 24 hours)

### Step 2: Add Custom Domain for Marketplace

1. Firebase Console → Hosting → **marketplace** site
2. Click **Add custom domain**
3. Enter: `marketplace.constructivedesignsinc.org`
4. Firebase will show verification instructions
5. Verify the CNAME record is in GoDaddy (already added above)
6. Click **Verify** in Firebase
7. Wait for SSL certificate provisioning (usually 1-2 hours)

### Step 3: Add Custom Domain for RenoVision

1. Firebase Console → Hosting → **renovision** site
2. Click **Add custom domain**
3. Enter: `renovision.constructivedesignsinc.org`
4. Verify the CNAME record is in GoDaddy (already added above)
5. Click **Verify** in Firebase
6. Wait for SSL certificate provisioning

---

## Part 6: Update Environment Variables

### Update Supabase URL References

In your code, you may have references to `localhost`. Update them for production:

**supabase.ts:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Create `.env` file:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Create `.env.production` file:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Add to .gitignore

```
.env
.env.local
.env.production
dist
node_modules
```

---

## Part 7: Configure OAuth Redirects

### Update Supabase Auth Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL**: `https://renovision.constructivedesignsinc.org`
5. Add **Redirect URLs**:
   ```
   https://renovision.constructivedesignsinc.org
   https://renovision.constructivedesignsinc.org/auth/callback
   https://renovision.web.app
   https://renovision.web.app/auth/callback
   http://localhost:5173 (for development)
   ```

### Update Google OAuth (if using Google Workspace)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add **Authorized JavaScript origins**:
   ```
   https://renovision.constructivedesignsinc.org
   https://renovision.web.app
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://renovision.constructivedesignsinc.org/auth/callback
   https://renovision.web.app/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```

---

## Part 8: Deployment Script

Create **deploy.ps1** (PowerShell script):

```powershell
# Home Reno Vision Pro Deployment Script

Write-Host "🚀 Starting deployment for Home Reno Vision Pro..." -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Run build
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Step 3: Deploy to Firebase
    Write-Host "🌐 Deploying to Firebase..." -ForegroundColor Yellow
    firebase deploy --only hosting:renovision
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "🎉 App is live at: https://renovision.constructivedesignsinc.org" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
}
```

**Usage:**
```powershell
.\deploy.ps1
```

---

## Part 9: GitHub Actions (Optional Automation)

Create **.github/workflows/deploy.yml**:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

---

## Part 10: Testing Checklist

After deployment, test these URLs:

### Marketplace App
- [ ] `https://marketplace.constructivedesignsinc.org` loads
- [ ] `https://marketplace.constructivedesignsinc.org` redirects to HTTPS
- [ ] SSL certificate is valid (green lock icon)
- [ ] All pages work correctly
- [ ] Authentication works
- [ ] Database operations work

### Home Reno Vision Pro
- [ ] `https://renovision.constructivedesignsinc.org` loads
- [ ] `https://renovision.constructivedesignsinc.org` redirects to HTTPS
- [ ] SSL certificate is valid
- [ ] All routes work (estimates, team members, etc.)
- [ ] Login/signup works
- [ ] Supabase connection works
- [ ] Google Workspace integration works (if applicable)

### Root Domain (if configured)
- [ ] `https://constructivedesignsinc.org` loads
- [ ] Redirects to correct app or landing page

---

## Troubleshooting

### Issue: DNS not resolving
**Solution:** DNS changes can take 24-48 hours. Check with:
```powershell
nslookup marketplace.constructivedesignsinc.org
nslookup renovision.constructivedesignsinc.org
```

### Issue: SSL certificate pending
**Solution:** Firebase SSL provisioning takes 1-2 hours. Just wait.

### Issue: "Site not found" error
**Solution:** 
1. Check firebase.json has correct `site` name
2. Verify site exists in Firebase Console → Hosting
3. Redeploy: `firebase deploy --only hosting:renovision`

### Issue: OAuth redirect mismatch
**Solution:**
1. Check Supabase → Authentication → URL Configuration
2. Add all redirect URLs (production + development)
3. Update Google OAuth settings if using Google

### Issue: Environment variables not working
**Solution:**
1. Check `.env.production` file exists
2. Verify variables start with `VITE_`
3. Rebuild: `npm run build`

### Issue: 404 on page refresh
**Solution:** Already handled by rewrites in firebase.json:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

---

## Quick Reference Commands

```powershell
# Build the app
npm run build

# Test locally
firebase serve

# Deploy to Firebase
firebase deploy --only hosting:renovision

# View deployment
firebase hosting:channel:list

# Check deploy status
firebase hosting:sites:list

# Roll back deployment (if needed)
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## Cost Estimation

### Firebase Hosting (Free Tier)
- ✅ 10 GB storage
- ✅ 360 MB/day bandwidth
- ✅ SSL certificates included
- ✅ Custom domains included

**Blaze Plan (Pay as you go):**
- Storage: $0.026/GB
- Bandwidth: $0.15/GB
- Very affordable for most apps

### GoDaddy Domain
- Already paid (annual fee)
- No additional cost for DNS management

---

## Final Deployment Steps

1. **Build both apps**
   ```powershell
   # Marketplace
   cd path/to/marketplace-app
   npm run build
   firebase deploy --only hosting:marketplace
   
   # Home Reno Vision Pro
   cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"
   npm run build
   firebase deploy --only hosting:renovision
   ```

2. **Configure GoDaddy DNS** (as shown in Part 4)

3. **Add custom domains in Firebase Console** (as shown in Part 5)

4. **Wait for DNS propagation** (up to 24 hours)

5. **Test all URLs** (use checklist in Part 10)

6. **Update OAuth settings** (Supabase + Google if applicable)

7. **Celebrate! 🎉** Your apps are live!

---

## Support Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [GoDaddy DNS Help](https://www.godaddy.com/help/manage-dns-records-680)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Status:** Ready to deploy
**Last Updated:** November 1, 2025
**Estimated Time:** 30-60 minutes + DNS propagation time

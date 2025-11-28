# Firebase Deployment Guide for Constructive Designs Marketplace

## Prerequisites
- Your app is already built and working locally ✅
- You have a Google account (use your constructivedesignsinc.org email)
- Domain: constructivedesignsinc.org

---

## Step 1: Install Firebase CLI

Open PowerShell and run:
```bash
npm install -g firebase-tools
```

---

## Step 2: Login to Firebase

```bash
Y
```

This will open a browser - **sign in with your constructivedesignsinc.org email**.

---

## Step 3: Initialize Firebase in Your Project

In your project folder (`Auction Platform`), run:
```bash
firebase init
```

**Select these options:**
1. Choose: **Hosting** (use spacebar to select, then Enter)
2. Choose: **Use an existing project** (if you have one) OR **Create a new project**
3. Project name: `constructive-designs-marketplace` (or similar)
4. Public directory: Enter `dist` (this is where Vite builds your app)
5. Configure as single-page app: **Yes**
6. Set up automatic builds: **No** (for now)
7. Overwrite index.html: **No**

---

## Step 4: Build Your App

```bash
npm run build
```

This creates the `dist` folder with your compiled app.

---

## Step 5: Deploy to Firebase

```bash
firebase deploy
```

You'll get a URL like: `https://constructive-designs-marketplace.web.app`

---

## Step 6: Connect Your Domain (constructivedesignsinc.org)

### In Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Hosting** → **Add custom domain**
4. Enter: `constructivedesignsinc.org`
5. Firebase will give you DNS records to add

### In Google Domains (or wherever your domain is registered):
1. Go to DNS settings for constructivedesignsinc.org
2. Add the A records Firebase provides (usually looks like):
   ```
   Type: A
   Name: @
   Value: 151.101.1.195 (example - use what Firebase gives you)
   ```
3. Add the TXT record for verification
4. Save changes

### Wait for DNS propagation (usually 1-24 hours)

Once complete, your app will be live at `https://constructivedesignsinc.org` 🎉

---

## Step 7: Environment Variables

Firebase doesn't use `.env` files directly. You need to set them in Firebase:

```bash
firebase functions:config:set supabase.url="YOUR_SUPABASE_URL"
firebase functions:config:set supabase.key="YOUR_SUPABASE_ANON_KEY"
```

**However**, since you're using Vite's `import.meta.env`, those variables are compiled into your build at build-time, so your current setup should work fine!

---

## Automated Deployment (Optional)

### Using GitHub Actions:
1. Push your code to GitHub
2. Create `.github/workflows/firebase-hosting.yml`:

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
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

Every time you push to `main` branch, it auto-deploys!

---

## Quick Reference Commands

### Build and Deploy:
```bash
npm run build
firebase deploy
```

### Deploy only Hosting:
```bash
firebase deploy --only hosting
```

### View deployment history:
```bash
firebase hosting:channel:list
```

### Rollback to previous version:
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## Cost Estimate

**Firebase Hosting Free Tier:**
- 10 GB storage
- 360 MB/day bandwidth (≈10.8 GB/month)
- Perfect for starting out!

**If you exceed free tier:**
- $0.026 per GB storage
- $0.15 per GB bandwidth

For a nonprofit marketplace, you'll likely stay within free tier for months.

---

## Important: Update Your Supabase Settings

After deploying, you need to allow your domain in Supabase:

1. Go to Supabase Dashboard
2. Settings → API
3. Under "Site URL" add: `https://constructivedesignsinc.org`
4. Under "Redirect URLs" add: `https://constructivedesignsinc.org/**`

This ensures authentication works on your live domain!

---

## Troubleshooting

### Build fails?
- Check that all dependencies are installed: `npm install`
- Verify `.env` file exists and has correct values
- Run `npm run build` locally first to catch errors

### Deployment succeeds but site shows blank page?
- Check browser console for errors (F12)
- Verify Supabase URL is correct in production
- Check that all API keys are set

### Domain not working after 24 hours?
- Verify DNS records match exactly what Firebase provided
- Try `nslookup constructivedesignsinc.org` in terminal
- Clear your browser cache

### Authentication redirects to wrong URL?
- Update Supabase Site URL and Redirect URLs (see above)
- Clear browser cookies and try again

---

## Support

- Firebase Docs: https://firebase.google.com/docs/hosting
- Firebase Support (for nonprofits): https://firebase.google.com/support
- Supabase Docs: https://supabase.com/docs

---

## Next Steps After Deployment

1. ✅ Test all features on live site
2. Set up Google Analytics in Firebase
3. Enable monitoring and alerts
4. Set up regular backups of Supabase database
5. Consider Firebase Functions for advanced features (optional)
6. Apply for Google Ad Grants (Google Workspace nonprofits get $10k/month in free ads!)

---

**Ready to deploy?** Start with Step 1 and work your way through. Let me know if you hit any issues!

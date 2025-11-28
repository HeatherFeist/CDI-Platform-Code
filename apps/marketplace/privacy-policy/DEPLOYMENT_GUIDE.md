# Privacy Policy Subdomain Deployment Guide

## Overview
This guide will help you deploy the privacy policy to `privacy.constructivedesignsinc.org` using Firebase Hosting.

---

## Step 1: Update Firebase Configuration

1. **Edit `.firebaserc`** in the `privacy-policy` folder
2. Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID
   - Find your project ID in Firebase Console → Project Settings
   - Example: `constructive-designs-marketplace`

```json
{
  "projects": {
    "default": "constructive-designs-marketplace"
  }
}
```

---

## Step 2: Initialize Firebase (First Time Only)

If you haven't already set up Firebase CLI for this project:

```powershell
# Navigate to privacy-policy directory
cd "c:\Users\heath\Downloads\constructive-designs-marketplace\privacy-policy"

# Login to Firebase (if not already logged in)
firebase login

# Initialize hosting (select your project when prompted)
firebase init hosting
```

When prompted:
- **What do you want to use as your public directory?** → Press Enter (uses current directory `.`)
- **Configure as a single-page app?** → No
- **Set up automatic builds and deploys with GitHub?** → No
- **File index.html already exists. Overwrite?** → No

---

## Step 3: Deploy to Firebase

```powershell
cd "c:\Users\heath\Downloads\constructive-designs-marketplace\privacy-policy"
firebase deploy --only hosting
```

You'll see output like:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT/overview
Hosting URL: https://YOUR_PROJECT.web.app
```

---

## Step 4: Configure Custom Domain in Firebase Console

1. **Go to Firebase Console** → Your Project → Hosting

2. **Click "Add custom domain"**

3. **Enter domain:** `privacy.constructivedesignsinc.org`

4. **Verify ownership** (if this is your first time):
   - Firebase will give you a TXT record
   - Add it to your DNS settings at your domain registrar
   - Wait for verification (can take up to 24 hours, usually much faster)

5. **Add DNS records** as instructed by Firebase:
   - Usually an `A` record pointing to Firebase's IP addresses
   - Or a `CNAME` record if using a subdomain

   **Example DNS Configuration:**
   ```
   Type: A
   Name: privacy
   Value: 151.101.1.195

   Type: A
   Name: privacy
   Value: 151.101.65.195
   ```

6. **Wait for SSL certificate** (automatic, takes 10-30 minutes)

---

## Step 5: DNS Configuration (Your Domain Registrar)

### If using GoDaddy, Namecheap, Cloudflare, etc.:

1. Login to your domain registrar
2. Find DNS settings for `constructivedesignsinc.org`
3. Add the records Firebase provided in Step 4

**Example (Generic DNS Provider):**
```
Type: A
Host: privacy
Value: 151.101.1.195
TTL: Auto or 3600

Type: A
Host: privacy
Value: 151.101.65.195
TTL: Auto or 3600
```

### If using Cloudflare:
- Set **Proxy status** to "DNS only" (gray cloud) initially
- After SSL certificate is issued, you can enable proxy (orange cloud)

---

## Step 6: Verify Deployment

After DNS propagates (5 minutes to 24 hours):

1. Visit `https://privacy.constructivedesignsinc.org`
2. Verify:
   - Page loads correctly
   - HTTPS/SSL works (green padlock)
   - All sections display properly
   - Navigation works
   - Responsive on mobile

---

## Step 7: Update Links in Your Apps

Add links to the privacy policy in:

### Marketplace App Footer:
```tsx
<footer>
  <a href="https://privacy.constructivedesignsinc.org" target="_blank">
    Privacy Policy
  </a>
  <a href="https://privacy.constructivedesignsinc.org#contact" target="_blank">
    Contact
  </a>
</footer>
```

### Signup/Login Forms:
```tsx
<p className="text-sm text-gray-600">
  By signing up, you agree to our{' '}
  <a 
    href="https://privacy.constructivedesignsinc.org" 
    target="_blank"
    className="text-blue-600 hover:underline"
  >
    Privacy Policy
  </a>
</p>
```

### Image Generator App:
```tsx
<footer>
  <a href="https://privacy.constructivedesignsinc.org">Privacy Policy</a>
</footer>
```

---

## Alternative: Deploy to Existing Firebase Project

If you want to deploy as a subdirectory of your main marketplace app instead:

1. **Move files to marketplace project:**
   ```powershell
   mkdir "c:\Users\heath\Downloads\constructive-designs-marketplace\public\privacy"
   copy "c:\Users\heath\Downloads\constructive-designs-marketplace\privacy-policy\index.html" "c:\Users\heath\Downloads\constructive-designs-marketplace\public\privacy\index.html"
   ```

2. **Deploy marketplace:**
   ```powershell
   cd "c:\Users\heath\Downloads\constructive-designs-marketplace"
   firebase deploy --only hosting
   ```

3. **Access at:**
   - `https://marketplace.constructivedesignsinc.org/privacy`
   - Or `https://YOUR_PROJECT.web.app/privacy`

---

## Troubleshooting

### DNS not propagating?
```powershell
# Check DNS records
nslookup privacy.constructivedesignsinc.org
```

### SSL certificate issues?
- Wait 15-30 minutes after DNS verification
- Check Firebase Console → Hosting → "View Details" for status
- Ensure DNS records match exactly what Firebase provided

### 404 Error?
- Verify `index.html` is in the correct directory
- Check `firebase.json` public path is set to `.`
- Redeploy: `firebase deploy --only hosting --force`

### Page not updating?
```powershell
# Clear Firebase cache and redeploy
firebase deploy --only hosting --force
```

Clear browser cache or use incognito mode

---

## Maintenance

### Update Privacy Policy:
1. Edit `privacy-policy/index.html`
2. Update "Last Updated" date
3. Deploy:
   ```powershell
   cd "c:\Users\heath\Downloads\constructive-designs-marketplace\privacy-policy"
   firebase deploy --only hosting
   ```

### Check deployment history:
```powershell
firebase hosting:channel:list
```

---

## Quick Reference

**Deploy Command:**
```powershell
cd "c:\Users\heath\Downloads\constructive-designs-marketplace\privacy-policy"
firebase deploy --only hosting
```

**View Live Site:**
- Default: `https://YOUR_PROJECT.web.app`
- Custom: `https://privacy.constructivedesignsinc.org`

**Firebase Console:**
- `https://console.firebase.google.com`

---

## Security Headers Included

The deployment includes security headers in `firebase.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

These protect against common web vulnerabilities.

---

## Support

If you encounter issues:
1. Check Firebase Console → Hosting for error messages
2. Review DNS settings in domain registrar
3. Contact Firebase Support or consult [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

---

**Ready to deploy?** Start with Step 1!

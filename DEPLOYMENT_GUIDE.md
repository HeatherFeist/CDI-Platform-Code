# Smart Hub & Image Editor Deployment Guide

## ✅ Prerequisites Complete
- [x] Smart Hub project created and configured
- [x] Supabase credentials added to `.env`
- [x] Firebase configuration files created
- [x] Image Editor rebuilt with fresh dist folder

---

## 🚀 Deployment Steps

### 1. Deploy Image Editor (Fix Caching Issue)

```powershell
cd "c:\Users\heath\Downloads\CDI Gemini Image Editor"

# Deploy to Firebase
firebase deploy --only hosting

# After deployment, hard refresh browser:
# Press Ctrl+Shift+R or Ctrl+F5
```

**Expected Result:** Image Editor at https://cdimage-gen.web.app will show the NEW version

---

### 2. Deploy Smart Hub to Main Domain

```powershell
cd "c:\Users\heath\Downloads\CDI-Smart-Hub"

# Initialize Firebase (first time only)
firebase init hosting

# When prompted:
# ? What do you want to use as your public directory? dist
# ? Configure as a single-page app (rewrite all urls to /index.html)? Yes
# ? Set up automatic builds and deploys with GitHub? No
# ? File dist/index.html already exists. Overwrite? No

# Deploy to constructivedesignsinc.org
firebase deploy --only hosting
```

**Expected Result:** Smart Hub will be live at https://constructivedesignsinc.org

---

### 3. Configure Firebase Hosting for Main Domain

If you need to set up the main domain (constructivedesignsinc.org), you'll need to:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to **Hosting** > **Add custom domain**
4. Enter: `constructivedesignsinc.org`
5. Follow the DNS configuration steps (add A records or CNAME)

---

### 4. Set Up Subdomains (Future)

For the subdomain architecture:

**RenovVision** (`renovvision.constructivedesignsinc.org`):
```powershell
cd "c:\Users\heath\Downloads\home-reno-vision-pro (2)"
firebase init hosting
# Select or create a new Firebase site for this subdomain
firebase deploy --only hosting
```

**Image Editor** (`images.constructivedesignsinc.org`):
- Create a new Firebase Hosting site
- Update `.firebaserc` to point to the new site
- Deploy

**Marketplace** (`marketplace.constructivedesignsinc.org`):
- Clone the repository (URL needed)
- Set up Firebase Hosting
- Deploy

---

## 🔍 Verification Checklist

After deployment:

- [ ] Visit https://cdimage-gen.web.app and verify NEW version loads
- [ ] Visit https://constructivedesignsinc.org and see Smart Hub landing page
- [ ] Click "Sign In" button on Smart Hub
- [ ] Test login with existing Supabase account
- [ ] Verify Dashboard shows app cards (RenovVision, Image Editor, Marketplace)
- [ ] Click app cards and verify links work

---

## 🐛 Troubleshooting

### Image Editor Still Shows Old Version
- Clear browser cache completely
- Try incognito/private browsing mode
- Check Firebase Hosting cache headers in `firebase.json`

### Smart Hub Login Doesn't Work
- Verify `.env` file exists in `CDI-Smart-Hub` directory
- Check Supabase credentials are correct
- Open browser console (F12) and check for errors

### Firebase Deploy Fails
- Run `firebase login` to re-authenticate
- Check you have the correct project selected: `firebase use --add`
- Verify `dist` folder exists before deploying

---

## 📝 Next Steps After Deployment

1. **Add Cross-App Navigation**
   - Update Image Editor to include "Back to Hub" link
   - Update Home-Reno to include "Back to Hub" link

2. **Migrate Marketplace**
   - Get repository URL
   - Clone and set up
   - Deploy to subdomain

3. **Test SSO**
   - Login via Smart Hub
   - Navigate to RenovVision
   - Verify session persists

---

## 🔗 Final Architecture

```
constructivedesignsinc.org (Smart Hub)
├─ Landing Page
├─ Login/Auth
└─ Dashboard
   ├─ Link to renovvision.constructivedesignsinc.org
   ├─ Link to images.constructivedesignsinc.org
   └─ Link to marketplace.constructivedesignsinc.org
```

All apps share:
- Supabase instance: gjbrjysuqdvvqlxklvos.supabase.co
- Unified dark theme design system
- Single sign-on (SSO)

# Firebase Subdomain Deployment Checklist

## 🎯 Goal
Deploy two apps to subdomains:
- **marketplace.constructivedesignsinc.org** → Marketplace app
- **renovision.constructivedesignsinc.org** → Home Reno Vision Pro

---

## ✅ Prerequisites

- [ ] Domain registered: constructivedesignsinc.org (GoDaddy)
- [ ] Firebase project created
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Both apps built and ready

---

## 📝 Step-by-Step Deployment

### Phase 1: Prepare Home Reno Vision Pro (20 min)

#### 1.1 Install Firebase CLI
```powershell
npm install -g firebase-tools
```
- [ ] Installed successfully

#### 1.2 Login to Firebase
```powershell
firebase login
```
- [ ] Logged in successfully

#### 1.3 Create Firebase Sites in Console
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **Hosting** in sidebar
4. Click **Add another site**
5. Create site named: **renovision**
6. Create site named: **marketplace** (if not already done)

- [ ] Created `renovision` site
- [ ] Created `marketplace` site

#### 1.4 Test Build Locally
```powershell
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"
npm install
npm run build
```
- [ ] Build completed without errors
- [ ] `dist` folder created

---

### Phase 2: Deploy Apps to Firebase (15 min)

#### 2.1 Deploy RenoVision
```powershell
# Make sure you're in the RenoVision project folder
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"

# Deploy
firebase deploy --only hosting:renovision
```

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/...
Hosting URL: https://renovision.web.app
```

- [ ] RenoVision deployed successfully
- [ ] Noted the hosting URL: _________________

#### 2.2 Deploy Marketplace (if not already done)
```powershell
cd path/to/marketplace-app
npm run build
firebase deploy --only hosting:marketplace
```
- [ ] Marketplace deployed successfully
- [ ] Noted the hosting URL: _________________

---

### Phase 3: Configure GoDaddy DNS (15 min)

#### 3.1 Login to GoDaddy
1. Go to https://godaddy.com
2. Sign in
3. Go to **My Products** → Find your domain
4. Click **DNS** button

- [ ] Accessed DNS management

#### 3.2 Add DNS Records

**Add these records exactly:**

**For Marketplace:**
```
Type: CNAME
Name: marketplace
Value: marketplace.web.app
TTL: 600
```
- [ ] Added marketplace CNAME

**For RenoVision:**
```
Type: CNAME
Name: renovision
Value: renovision.web.app
TTL: 600
```
- [ ] Added renovision CNAME

**For Root Domain (Optional):**
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 600
```
```
Type: A
Name: @
Value: 151.101.65.195
TTL: 600
```
- [ ] Added A records (optional)

#### 3.3 Save DNS Changes
- [ ] Clicked "Save" on all records
- [ ] Verified all records appear in DNS table

---

### Phase 4: Connect Custom Domains in Firebase (20 min)

#### 4.1 Add Marketplace Domain
1. Firebase Console → Hosting → **marketplace** site
2. Click **Add custom domain**
3. Enter: `marketplace.constructivedesignsinc.org`
4. Firebase shows CNAME verification (already added in GoDaddy)
5. Click **Verify**
6. Click **Finish**

- [ ] Started domain verification for marketplace
- [ ] Status: _________________ (Pending/Connected)

#### 4.2 Add RenoVision Domain
1. Firebase Console → Hosting → **renovision** site
2. Click **Add custom domain**
3. Enter: `renovision.constructivedesignsinc.org`
4. Firebase shows CNAME verification (already added in GoDaddy)
5. Click **Verify**
6. Click **Finish**

- [ ] Started domain verification for renovision
- [ ] Status: _________________ (Pending/Connected)

---

### Phase 5: Wait for Propagation (1-24 hours)

#### 5.1 DNS Propagation
- [ ] Wait 1-2 hours minimum
- [ ] Check status: https://www.whatsmydns.net/

#### 5.2 SSL Certificate Provisioning
Firebase automatically provisions SSL certificates after domain verification.
- [ ] SSL for marketplace (can take 1-2 hours)
- [ ] SSL for renovision (can take 1-2 hours)

---

### Phase 6: Update OAuth Settings (10 min)

#### 6.1 Update Supabase Auth URLs
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL**: `https://renovision.constructivedesignsinc.org`
5. Add to **Redirect URLs**:
```
https://renovision.constructivedesignsinc.org
https://renovision.constructivedesignsinc.org/auth/callback
https://renovision.web.app
https://renovision.web.app/auth/callback
http://localhost:5173
```

- [ ] Updated Supabase Site URL
- [ ] Added all redirect URLs

#### 6.2 Update Google OAuth (if applicable)
1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add to **Authorized JavaScript origins**:
```
https://renovision.constructivedesignsinc.org
https://renovision.web.app
```
5. Add to **Authorized redirect URIs**:
```
https://renovision.constructivedesignsinc.org/auth/callback
https://your-project.supabase.co/auth/v1/callback
```

- [ ] Updated Google OAuth settings (if applicable)

---

### Phase 7: Testing (15 min)

#### 7.1 Test RenoVision
- [ ] Open: https://renovision.constructivedesignsinc.org
- [ ] Site loads (may take 1-2 hours for SSL)
- [ ] Green lock icon (HTTPS)
- [ ] Login/signup works
- [ ] Create test estimate
- [ ] Database operations work
- [ ] All routes work

#### 7.2 Test Marketplace
- [ ] Open: https://marketplace.constructivedesignsinc.org
- [ ] Site loads
- [ ] HTTPS working
- [ ] All features work

#### 7.3 Test Fallback URLs
- [ ] https://renovision.web.app works
- [ ] https://marketplace.web.app works

---

## 🚨 Troubleshooting

### DNS not resolving
```powershell
# Check DNS
nslookup renovision.constructivedesignsinc.org
```
**Solution:** Wait up to 24 hours for full propagation

### SSL certificate pending
**Solution:** Wait 1-2 hours after domain verification

### "Site not found" error
```powershell
# Redeploy
firebase deploy --only hosting:renovision
```

### OAuth redirect mismatch
**Solution:** Verify all URLs in Supabase and Google OAuth settings

---

## 📊 Status Tracker

### Deployment Status
| App        | Built | Deployed | DNS | SSL | Tested |
|------------|-------|----------|-----|-----|--------|
| RenoVision | ⬜    | ⬜       | ⬜  | ⬜  | ⬜     |
| Marketplace| ⬜    | ⬜       | ⬜  | ⬜  | ⬜     |

### URLs
- RenoVision: https://renovision.constructivedesignsinc.org
- Marketplace: https://marketplace.constructivedesignsinc.org
- RenoVision (Firebase): https://renovision.web.app
- Marketplace (Firebase): https://marketplace.web.app

---

## 🎉 Success Criteria

Your deployment is complete when:
- ✅ Both custom domains load without errors
- ✅ HTTPS (green lock) on both sites
- ✅ Authentication works on both apps
- ✅ Database operations work
- ✅ All pages/routes accessible

---

## 📚 Additional Resources

- Full Guide: See `FIREBASE_SUBDOMAIN_DEPLOYMENT.md`
- DNS Setup: See `GODADDY_DNS_SETUP.md`
- Deploy Script: Run `.\deploy.ps1`

---

## ⏱️ Time Estimate

- Setup & Deploy: **1-2 hours**
- DNS Propagation: **1-24 hours**
- SSL Provisioning: **1-2 hours**
- **Total: 3-27 hours** (mostly waiting)

---

## 💡 Quick Deploy Command

For future deployments, just run:
```powershell
.\deploy.ps1
```

This script automatically:
1. Cleans old build
2. Installs dependencies
3. Builds the app
4. Deploys to Firebase

---

**Last Updated:** November 1, 2025
**Status:** Ready to deploy! 🚀

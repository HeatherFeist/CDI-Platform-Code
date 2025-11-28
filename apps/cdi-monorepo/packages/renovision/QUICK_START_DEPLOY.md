# 🚀 Quick Start: Deploy to Subdomain

## What You're Doing
Deploy **Home Reno Vision Pro** to `renovision.constructivedesignsinc.org`

---

## ⚡ Fast Track (Do This First)

### 1. Build the App (2 minutes)
```powershell
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"
npm install
npm run build
```

### 2. Deploy to Firebase (3 minutes)
```powershell
# Make sure Firebase CLI is installed
npm install -g firebase-tools

# Login (if not already)
firebase login

# Deploy
firebase deploy --only hosting:renovision
```

### 3. GoDaddy DNS (5 minutes)
1. Go to https://godaddy.com → Sign in
2. My Products → constructivedesignsinc.org → DNS
3. Click **Add New Record**
4. Add this:
   ```
   Type: CNAME
   Name: renovision
   Value: renovision.web.app
   TTL: 600
   ```
5. Click **Save**

### 4. Firebase Console (5 minutes)
1. Go to https://console.firebase.google.com/
2. Select your project → **Hosting**
3. Find **renovision** site (or click "Add another site")
4. Click **Add custom domain**
5. Enter: `renovision.constructivedesignsinc.org`
6. Click **Verify** → **Finish**

### 5. Wait & Test (1-2 hours)
```powershell
# Check if DNS propagated
nslookup renovision.constructivedesignsinc.org

# Test site (wait for SSL)
# Open: https://renovision.constructivedesignsinc.org
```

---

## 📋 That's It!

**For the marketplace app**, repeat with:
- Site name: `marketplace`
- Subdomain: `marketplace.constructivedesignsinc.org`
- CNAME value: `marketplace.web.app`

---

## 🔧 Troubleshooting

### TypeScript Errors in VS Code?
The 27 errors are mostly in Supabase Edge Functions (Deno files) - these are **normal**.

To fix the main error:
```powershell
# Restart VS Code TypeScript server
# Press: Ctrl+Shift+P
# Type: "TypeScript: Restart TS Server"
# Press Enter
```

Or just restart VS Code.

### "firebase: command not found"?
```powershell
npm install -g firebase-tools
```

### "Site not found" after deploy?
Make sure `firebase.json` has:
```json
{
  "hosting": {
    "site": "renovision",
    ...
  }
}
```

### SSL certificate pending?
Just wait 1-2 hours. Firebase provisions it automatically.

---

## 📚 Detailed Guides

- **Complete Guide**: `FIREBASE_SUBDOMAIN_DEPLOYMENT.md`
- **GoDaddy Setup**: `GODADDY_DNS_SETUP.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Next Deploy

After first setup, future deploys are just:
```powershell
.\deploy.ps1
```

That's it! ✨

---

**Status**: Ready to deploy
**Time**: ~15 minutes + waiting for DNS/SSL

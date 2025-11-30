# Firebase Multi-Site Hosting Setup Guide

This guide will walk you through deploying all CDI apps to Firebase Hosting with custom subdomain configuration.

## 🎯 Goal Architecture

```
constructivedesignsinc.org           → Smart Hub (main landing page)
renovision.constructivedesignsinc.org → RenovVision app
images.constructivedesignsinc.org     → Image Editor app
marketplace.constructivedesignsinc.org → Marketplace app
wallet.constructivedesignsinc.org     → Quantum Wallet app
```

## 📋 Prerequisites

1. **Firebase Project**: You already have `cdi-marketplace-platform` and `constructive-designs-inc`
2. **Domain**: Register `constructivedesignsinc.org` (GoDaddy, Namecheap, Google Domains, etc.)
3. **Firebase CLI**: Already installed
4. **Built Apps**: Make sure all apps are built before deploying

---

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Hosting Sites

Firebase allows multiple sites per project. We'll create 5 sites total.

```powershell
# Login to Firebase (if not already)
firebase login

# Set the default project (use your existing project)
cd apps\smart-hub
firebase use cdi-marketplace-platform

# Create hosting sites for each app
firebase hosting:sites:create smart-hub
firebase hosting:sites:create renovision
firebase hosting:sites:create images
firebase hosting:sites:create marketplace
firebase hosting:sites:create wallet
```

**Note**: If sites already exist, you'll see a message saying so - that's fine!

---

### Step 2: Configure Each App's Firebase Settings

#### **Smart Hub** (Main Landing Page)

```powershell
cd apps\smart-hub
```

Update `firebase.json`:
```json
{
    "hosting": {
        "site": "smart-hub",
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
                "source": "**",
                "headers": [
                    {
                        "key": "Cache-Control",
                        "value": "no-cache, no-store, must-revalidate"
                    }
                ]
            },
            {
                "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2)",
                "headers": [
                    {
                        "key": "Cache-Control",
                        "value": "max-age=31536000"
                    }
                ]
            }
        ]
    }
}
```

#### **RenovVision**

```powershell
cd apps\cdi-monorepo\packages\renovision
```

Update `firebase.json` (already configured):
```json
{
  "hosting": {
    "site": "renovision",
    "public": "dist",
    ...
  }
}
```

Create `.firebaserc` if missing:
```json
{
  "projects": {
    "default": "cdi-marketplace-platform"
  }
}
```

#### **Image Editor**

```powershell
cd apps\image-editor
```

Already configured with `"site": "images"` ✅

#### **Marketplace**

```powershell
cd apps\marketplace
```

Update `firebase.json` to add site name:
```json
{
  "hosting": {
    "site": "marketplace",
    "public": "dist",
    ...
  }
}
```

#### **Quantum Wallet**

```powershell
cd apps\cdi-monorepo\packages\quantum-wallet
```

Update `firebase.json`:
```json
{
    "hosting": {
        "site": "wallet",
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
        ]
    }
}
```

Create `.firebaserc`:
```json
{
  "projects": {
    "default": "cdi-marketplace-platform"
  }
}
```

---

### Step 3: Build All Apps

Build each app before deploying:

```powershell
# Smart Hub
cd apps\smart-hub
npm install
npm run build

# RenovVision
cd ..\cdi-monorepo\packages\renovision
npm install
npm run build

# Image Editor
cd ..\..\..\image-editor
npm install
npm run build

# Marketplace
cd ..\marketplace
npm install
npm run build

# Quantum Wallet
cd ..\cdi-monorepo\packages\quantum-wallet
npm install
npm run build
```

---

### Step 4: Deploy Each App

Deploy each app to its respective Firebase Hosting site:

```powershell
# Smart Hub
cd apps\smart-hub
firebase deploy --only hosting

# RenovVision
cd ..\cdi-monorepo\packages\renovision
firebase deploy --only hosting

# Image Editor
cd ..\..\..\image-editor
firebase deploy --only hosting

# Marketplace
cd ..\marketplace
firebase deploy --only hosting

# Quantum Wallet
cd ..\cdi-monorepo\packages\quantum-wallet
firebase deploy --only hosting
```

After deploying, you'll get Firebase URLs like:
- `smart-hub.web.app`
- `renovision.web.app`
- `images.web.app`
- `marketplace.web.app`
- `wallet.web.app`

---

### Step 5: Add Custom Domain in Firebase Console

Now we'll connect your custom domain `constructivedesignsinc.org` to Firebase.

#### **A. Main Domain (Smart Hub)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `cdi-marketplace-platform`
3. Click **Hosting** in left sidebar
4. Click on the **smart-hub** site
5. Click **Add custom domain**
6. Enter: `constructivedesignsinc.org`
7. Click **Continue**
8. Firebase will show you DNS records to add

#### **B. Subdomains (Each App)**

Repeat for each app:

| App | Site Name | Custom Domain |
|-----|-----------|---------------|
| RenovVision | `renovision` | `renovision.constructivedesignsinc.org` |
| Image Editor | `images` | `images.constructivedesignsinc.org` |
| Marketplace | `marketplace` | `marketplace.constructivedesignsinc.org` |
| Quantum Wallet | `wallet` | `wallet.constructivedesignsinc.org` |

For each:
1. Select the site (e.g., `renovision`)
2. Click **Add custom domain**
3. Enter the subdomain (e.g., `renovision.constructivedesignsinc.org`)
4. Firebase will provide DNS records

---

### Step 6: Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add the DNS records Firebase provided.

**Typical DNS Setup:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `151.101.1.195` | 3600 |
| A | @ | `151.101.65.195` | 3600 |
| TXT | @ | `firebase=cdi-marketplace-platform` | 3600 |
| CNAME | renovision | `smart-hub.web.app` | 3600 |
| CNAME | images | `images.web.app` | 3600 |
| CNAME | marketplace | `marketplace.web.app` | 3600 |
| CNAME | wallet | `wallet.web.app` | 3600 |

**Note**: Firebase will give you the exact records. These are examples.

---

### Step 7: Wait for DNS Propagation

- DNS changes can take **up to 24-48 hours** to propagate globally
- Usually happens within **1-2 hours**
- Check status in Firebase Console (Hosting section)
- Once verified, Firebase will automatically provision **SSL certificates** (free!)

---

### Step 8: Verify Deployment

Once DNS is propagated and SSL is active:

```
✅ https://constructivedesignsinc.org → Smart Hub
✅ https://renovision.constructivedesignsinc.org → RenovVision
✅ https://images.constructivedesignsinc.org → Image Editor
✅ https://marketplace.constructivedesignsinc.org → Marketplace
✅ https://wallet.constructivedesignsinc.org → Quantum Wallet
```

---

## 🔄 Future Deployments

After initial setup, deploying updates is simple:

```powershell
# Update Smart Hub
cd apps\smart-hub
npm run build
firebase deploy --only hosting

# Update RenovVision
cd ..\cdi-monorepo\packages\renovision
npm run build
firebase deploy --only hosting

# Same pattern for other apps...
```

---

## 🛠️ Troubleshooting

### Issue: "Site already exists"
**Solution**: That's fine! Use the existing site. Just make sure firebase.json references it.

### Issue: DNS not propagating
**Solution**: 
- Check DNS with: `nslookup constructivedesignsinc.org`
- Use [DNS Checker](https://dnschecker.org/)
- Verify records in registrar dashboard

### Issue: SSL certificate pending
**Solution**: 
- Wait 24 hours after DNS propagation
- Verify ownership in Firebase Console
- Ensure DNS records are correct

### Issue: 404 errors on refresh
**Solution**: Already handled! The `rewrites` section in firebase.json routes all requests to index.html (SPA support).

### Issue: Build fails
**Solution**: 
```powershell
# Clean install
rm -r node_modules
rm package-lock.json
npm install
npm run build
```

---

## 📊 Quick Command Reference

```powershell
# Check Firebase sites
firebase hosting:sites:list

# Check current project
firebase projects:list

# Switch project
firebase use <project-id>

# Deploy specific site
firebase deploy --only hosting:smart-hub

# View deploy history
firebase hosting:channel:list

# Open Firebase Console
firebase open hosting
```

---

## 💡 Pro Tips

1. **Use Environment Variables**: Different API keys per app (already set up in your .env files)
2. **CI/CD**: Set up GitHub Actions to auto-deploy on push
3. **Analytics**: Enable Firebase Analytics for each site
4. **Performance**: Use Firebase Performance Monitoring
5. **Rollback**: Firebase keeps deployment history - you can rollback anytime

---

## 📝 Summary Checklist

- [ ] Create 5 Firebase Hosting sites (smart-hub, renovision, images, marketplace, wallet)
- [ ] Update all firebase.json files with site names
- [ ] Build all 5 apps (`npm run build`)
- [ ] Deploy all apps (`firebase deploy --only hosting`)
- [ ] Register domain `constructivedesignsinc.org`
- [ ] Add custom domain in Firebase Console for main site
- [ ] Add custom subdomains for 4 apps
- [ ] Configure DNS records at domain registrar
- [ ] Wait for DNS propagation (1-48 hours)
- [ ] Verify SSL certificates are active
- [ ] Test all 5 URLs

---

## 🎉 You're Done!

Your complete CDI ecosystem will be live at:
- **Main Portal**: https://constructivedesignsinc.org
- **Apps**: All accessible via subdomains with automatic HTTPS

Need help with any step? Let me know!

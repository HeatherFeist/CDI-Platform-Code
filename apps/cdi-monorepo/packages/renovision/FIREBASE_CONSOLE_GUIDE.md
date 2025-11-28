# Firebase Console - Add Custom Domain Guide

## 🎯 Goal
Connect `renovision.constructivedesignsinc.org` to your Firebase app

---

## 📍 Current Status
✅ App deployed at: https://renovision.web.app
⏳ Need to add custom domain

---

## 🖱️ Click-by-Click Instructions

### Step 1: Open Firebase Hosting

1. Go to: https://console.firebase.google.com/project/home-reno-vision-pro/hosting
2. You should see your hosting sites

Expected screen:
```
╔═══════════════════════════════════════════════════╗
║ Firebase Hosting                                  ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  home-reno-vision-pro (default)                   ║
║  https://home-reno-vision-pro.web.app            ║
║                                                   ║
║  renovision                             [⋮]      ║
║  https://renovision.web.app                      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

### Step 2: Click "Add custom domain"

**On the 'renovision' site:**
1. Click the three dots (⋮) next to "renovision"
2. Select **"Add custom domain"**

OR

1. Click on the **"renovision"** site itself
2. Look for **"Add custom domain"** button

---

### Step 3: Enter Your Domain

A popup will appear:

```
╔════════════════════════════════════════════════╗
║  Add a custom domain                           ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Domain name                                   ║
║  ┌──────────────────────────────────────────┐ ║
║  │ renovision.constructivedesignsinc.org    │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  [Cancel]                        [Continue]   ║
╚════════════════════════════════════════════════╝
```

**Type:** `renovision.constructivedesignsinc.org`
**Click:** Continue

---

### Step 4: Verify Domain Ownership

Firebase will show verification instructions:

```
╔═══════════════════════════════════════════════════╗
║  Verify domain ownership                          ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Add this TXT record to your DNS provider:        ║
║                                                   ║
║  Name:  @ (or leave blank)                       ║
║  Type:  TXT                                      ║
║  Value: google-site-verification=abc123...       ║
║                                                   ║
║  This helps verify you own the domain.           ║
║                                                   ║
║  [< Back]                          [Verify]      ║
╚═══════════════════════════════════════════════════╝
```

**IMPORTANT:** 
- **COPY the TXT record value** (it's a long string starting with "google-site-verification=")
- Keep this window open
- Go to GoDaddy in a new tab

---

### Step 5: Add TXT Record in GoDaddy

**Open new tab:**
1. Go to: https://godaddy.com
2. Sign in
3. My Products → constructivedesignsinc.org → DNS

**Add TXT Record:**
```
╔════════════════════════════════════════╗
║  Add Record                            ║
╠════════════════════════════════════════╣
║  Type: [TXT ▼]                        ║
║  Name: [@                           ] ║
║  Value: [google-site-verif...      ] ║  ← Paste here
║  TTL: [600 seconds ▼]                ║
║                                        ║
║  [Cancel]                    [Save]   ║
╚════════════════════════════════════════╝
```

**Click:** Save

---

### Step 6: Add CNAME Record in GoDaddy

**While still in GoDaddy DNS:**

Click "Add New Record" again:
```
╔════════════════════════════════════════╗
║  Add Record                            ║
╠════════════════════════════════════════╣
║  Type: [CNAME ▼]                      ║
║  Name: [renovision                  ] ║
║  Value: [renovision.web.app         ] ║  ← Type this exactly
║  TTL: [600 seconds ▼]                ║
║                                        ║
║  [Cancel]                    [Save]   ║
╚════════════════════════════════════════╝
```

**Click:** Save

**Your GoDaddy DNS should now show:**
```
┌──────┬────────────┬──────────────────────────────────┬─────┐
│ Type │ Name       │ Value                            │ TTL │
├──────┼────────────┼──────────────────────────────────┼─────┤
│ TXT  │ @          │ google-site-verification=abc...  │ 600 │
│ CNAME│ renovision │ renovision.web.app               │ 600 │
└──────┴────────────┴──────────────────────────────────┴─────┘
```

---

### Step 7: Verify in Firebase

**Go back to Firebase tab:**
1. Click the **"Verify"** button
2. Firebase will check if TXT record exists

**If verification succeeds:**
```
╔═══════════════════════════════════════════════════╗
║  ✓ Ownership verified!                            ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Your domain has been verified.                   ║
║  SSL certificate will be provisioned shortly.     ║
║                                                   ║
║  This may take up to 24 hours.                   ║
║                                                   ║
║                               [Finish]            ║
╚═══════════════════════════════════════════════════╝
```

**Click:** Finish

**If verification fails:**
- Wait 5-10 minutes for DNS to propagate
- Click "Verify" again
- Check TXT record in GoDaddy is correct

---

### Step 8: Wait for SSL Certificate

**Back on Hosting page:**
```
╔═══════════════════════════════════════════════════╗
║ renovision                                        ║
╠═══════════════════════════════════════════════════╣
║  https://renovision.web.app                      ║
║                                                   ║
║  Custom domains:                                  ║
║  • renovision.constructivedesignsinc.org         ║
║    Status: ⏳ SSL certificate pending            ║
╚═══════════════════════════════════════════════════╝
```

**Wait 1-2 hours for status to change to:**
```
║    Status: ✓ Connected                           ║
```

---

## 🧪 Testing

### After DNS Propagation (30 min - 2 hours):
```powershell
nslookup renovision.constructivedesignsinc.org
```

Should return Firebase IP addresses.

### After SSL Certificate (1-2 hours):
Open: https://renovision.constructivedesignsinc.org

Should show:
- ✅ Your app loads
- ✅ Green lock icon (HTTPS)
- ✅ No security warnings

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Deploy to Firebase | ✅ Done (2 min) |
| Add DNS records | ⏳ 5 min |
| DNS propagation | ⏳ 30 min - 2 hours |
| Domain verification | ⏳ 5 min (after DNS) |
| SSL provisioning | ⏳ 1-2 hours |
| **Total** | **~2-4 hours** |

---

## 🎯 Current URLs

**Working Now:**
- https://renovision.web.app ✅

**Working Soon:**
- https://renovision.constructivedesignsinc.org (after DNS + SSL)

---

## 🆘 Troubleshooting

### "Verification failed"
**Solution:** Wait 10 minutes, DNS records need time to propagate

### Can't find "Add custom domain" button
**Solution:** Make sure you're looking at the "renovision" site, not the default site

### CNAME record error in GoDaddy
**Solution:** Make sure you typed exactly: `renovision.web.app` (no https://, no trailing slash)

### Site not loading after 24 hours
**Solution:** 
1. Check DNS records in GoDaddy are correct
2. Check Firebase Console shows "Connected" status
3. Clear browser cache (Ctrl+Shift+Del)

---

**Need help?** The app is already live at https://renovision.web.app - the custom domain is just a nice-to-have!

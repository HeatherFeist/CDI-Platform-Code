# Custom Domain Setup - Step by Step

## ✅ Your App is Live!
**Current URL:** https://renovision.web.app

---

## 🌐 Connect Custom Domain (renovision.constructivedesignsinc.org)

### Step 1: Firebase Console

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com/project/home-reno-vision-pro/hosting

2. **Find the 'renovision' site:**
   - You should see it listed with URL: https://renovision.web.app

3. **Add Custom Domain:**
   - Click the **"Add custom domain"** button (or three dots menu → "Add custom domain")
   - Enter: `renovision.constructivedesignsinc.org`
   - Click **"Continue"**

4. **Verify Ownership:**
   Firebase will show you a TXT record to add to GoDaddy (for verification)
   - Copy the TXT record details
   - Go to next step

---

### Step 2: GoDaddy DNS Setup

1. **Login to GoDaddy:**
   - Go to: https://godaddy.com
   - Sign in with your account

2. **Navigate to DNS:**
   - Click your profile → "My Products"
   - Find: constructivedesignsinc.org
   - Click the three dots (⋯) → "Manage DNS"

3. **Add TXT Record (for verification):**
   ```
   Type: TXT
   Name: @ (or leave blank)
   Value: [paste the value from Firebase]
   TTL: 600 seconds
   ```
   Click "Save"

4. **Add CNAME Record (for the subdomain):**
   ```
   Type: CNAME
   Name: renovision
   Value: renovision.web.app
   TTL: 600 seconds
   ```
   Click "Save"

---

### Step 3: Complete Verification in Firebase

1. **Go back to Firebase Console**
   - You should still be on the "Add custom domain" screen

2. **Click "Verify"**
   - Firebase will check if the TXT record exists
   - This may take a few minutes

3. **Wait for SSL Certificate**
   - Firebase automatically provisions an SSL certificate
   - This takes 1-2 hours typically
   - Status will show "Pending" then "Connected"

---

## 📊 Current Status

- ✅ App deployed to Firebase
- ✅ Accessible at: https://renovision.web.app
- ⏳ Custom domain pending setup
- ⏳ SSL certificate pending

---

## 🧪 Testing URLs

### Currently Working:
- https://renovision.web.app ✅

### After Custom Domain Setup:
- https://renovision.constructivedesignsinc.org (wait 1-2 hours)

---

## 🔍 Check DNS Propagation

After adding DNS records, verify with:
```powershell
nslookup renovision.constructivedesignsinc.org
```

Or use online tool: https://www.whatsmydns.net/

---

## ⚠️ Important Notes

1. **DNS Propagation Time:**
   - Initial: 30 minutes to 2 hours
   - Full propagation: Up to 24 hours

2. **SSL Certificate Time:**
   - Usually: 1-2 hours after domain verification
   - You'll see "Your connection is not private" until SSL is ready

3. **Don't Panic If:**
   - Site shows "Not Found" initially (DNS not propagated yet)
   - Shows SSL error (certificate not provisioned yet)
   - Takes longer than expected (sometimes DNS is slow)

---

## 🎉 Success Checklist

- [ ] Firebase deployment complete (https://renovision.web.app works)
- [ ] Added TXT record in GoDaddy (for verification)
- [ ] Added CNAME record in GoDaddy (renovision → renovision.web.app)
- [ ] Verified domain in Firebase Console
- [ ] Waited 1-2 hours for SSL
- [ ] Tested custom domain (https://renovision.constructivedesignsinc.org)
- [ ] Green lock icon (HTTPS working)
- [ ] Updated Supabase redirect URLs
- [ ] Updated OAuth settings (if applicable)

---

## 🚀 What's Next?

Once the custom domain is working:

1. **Update Supabase URLs** (if not already done)
2. **Test authentication** on the custom domain
3. **Update any hardcoded URLs** in your code
4. **Repeat process for marketplace app** (marketplace.constructivedesignsinc.org)

---

**Your app is LIVE at:** https://renovision.web.app

**Custom domain will be:** https://renovision.constructivedesignsinc.org (after DNS setup)

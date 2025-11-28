# Firebase Storage Upload Guide for Subscription Images

## 🎯 Quick Upload Instructions

### Step 1: Download Images from Artifacts Panel

Look at the **Artifacts** panel on the right side of this window. You should see 5 images:

1. `quantum_wallet_premium.png`
2. `marketplace_seller_basic.png`
3. `marketplace_seller_pro.png`
4. `renovision_contractor_basic.png`
5. `renovision_contractor_pro.png`

**Click on each image** and download them to your Downloads folder.

---

## 📤 Step 2: Upload via Firebase Console (Easiest Method)

### Method A: Firebase Console (Recommended - No Commands Needed!)

1. **Go to Firebase Console**:
   - Open: https://console.firebase.google.com/project/home-reno-vision-pro/storage

2. **Create Folder**:
   - Click "Create folder"
   - Name it: `subscription-images`
   - Click "Create"

3. **Upload Images**:
   - Click on the `subscription-images` folder
   - Click "Upload file"
   - Select all 5 downloaded images
   - Wait for upload to complete

4. **Get Public URLs**:
   - Click on each uploaded image
   - Click the "Download URL" or "Get download URL" button
   - Copy each URL

5. **Make Images Public** (if needed):
   - Click on each image
   - Go to "Permissions" tab
   - Add rule: `allUsers` with role `Storage Object Viewer`
   - Or use the URLs as-is (they include auth tokens)

---

## 🔧 Method B: Using Firebase CLI (Alternative)

If you prefer command line:

### Step 1: Ensure Images are in a Local Folder

First, move all downloaded images to a folder:

```powershell
# Create folder for images
New-Item -ItemType Directory -Force -Path "C:\Users\heath\Downloads\subscription-images"

# Move images there (after downloading from artifacts)
Move-Item "C:\Users\heath\Downloads\quantum_wallet_premium*.png" "C:\Users\heath\Downloads\subscription-images\quantum_wallet_premium.png"
Move-Item "C:\Users\heath\Downloads\marketplace_seller_basic*.png" "C:\Users\heath\Downloads\subscription-images\marketplace_seller_basic.png"
Move-Item "C:\Users\heath\Downloads\marketplace_seller_pro*.png" "C:\Users\heath\Downloads\subscription-images\marketplace_seller_pro.png"
Move-Item "C:\Users\heath\Downloads\renovision_contractor_basic*.png" "C:\Users\heath\Downloads\subscription-images\renovision_contractor_basic.png"
Move-Item "C:\Users\heath\Downloads\renovision_contractor_pro*.png" "C:\Users\heath\Downloads\subscription-images\renovision_contractor_pro.png"
```

### Step 2: Upload Using Firebase CLI

```powershell
# Navigate to Renovision project
cd "C:\Users\heath\Downloads\home-reno-vision-pro (2)"

# Upload each image
firebase storage:upload "C:\Users\heath\Downloads\subscription-images\quantum_wallet_premium.png" subscription-images/quantum_wallet_premium.png
firebase storage:upload "C:\Users\heath\Downloads\subscription-images\marketplace_seller_basic.png" subscription-images/marketplace_seller_basic.png
firebase storage:upload "C:\Users\heath\Downloads\subscription-images\marketplace_seller_pro.png" subscription-images/marketplace_seller_pro.png
firebase storage:upload "C:\Users\heath\Downloads\subscription-images\renovision_contractor_basic.png" subscription-images/renovision_contractor_basic.png
firebase storage:upload "C:\Users\heath\Downloads\subscription-images\renovision_contractor_pro.png" subscription-images/renovision_contractor_pro.png
```

---

## 🔗 Step 3: Get Your Image URLs

After uploading via Firebase Console, your URLs will look like:

```
https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Fquantum_wallet_premium.png?alt=media&token=XXXXXXXX
```

### Save These URLs:

```
QUANTUM_WALLET_IMAGE_URL=https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Fquantum_wallet_premium.png?alt=media&token=XXXXXXXX

MARKETPLACE_BASIC_IMAGE_URL=https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Fmarketplace_seller_basic.png?alt=media&token=XXXXXXXX

MARKETPLACE_PRO_IMAGE_URL=https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Fmarketplace_seller_pro.png?alt=media&token=XXXXXXXX

RENOVISION_BASIC_IMAGE_URL=https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Frenovision_contractor_basic.png?alt=media&token=XXXXXXXX

RENOVISION_PRO_IMAGE_URL=https://firebasestorage.googleapis.com/v0/b/home-reno-vision-pro.appspot.com/o/subscription-images%2Frenovision_contractor_pro.png?alt=media&token=XXXXXXXX
```

---

## 📋 Step 4: Use URLs in PayPal

When creating each subscription plan in PayPal:

1. Fill in plan details (name, price, billing cycle)
2. Find the **"Product Image"** field
3. Paste the corresponding Firebase Storage URL
4. PayPal will preview the image
5. Save the plan

---

## ✅ Verification Checklist

- [ ] Downloaded all 5 images from Artifacts panel
- [ ] Uploaded to Firebase Storage (via Console or CLI)
- [ ] Got public URLs for all 5 images
- [ ] Tested URLs in browser (should show images)
- [ ] Ready to add to PayPal plans

---

## 🎯 Next Steps After Upload

1. **Copy all 5 image URLs** from Firebase Storage
2. **Create subscription plans** in PayPal
3. **Add image URLs** to each plan
4. **Copy Plan IDs** from PayPal
5. **Send me the Plan IDs** and I'll integrate everything!

---

## 💡 Pro Tip: Test Your URLs

Before adding to PayPal, test each URL:
1. Copy the URL
2. Paste in a new browser tab
3. Image should load immediately
4. If it asks for login, the permissions aren't set correctly

---

**Recommended: Use Method A (Firebase Console) - it's the easiest and most visual!**

Let me know once you've uploaded the images and I'll help you with the next steps!

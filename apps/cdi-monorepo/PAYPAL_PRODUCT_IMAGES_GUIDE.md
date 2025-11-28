# PayPal Subscription Product Images Guide

## 🎨 Product Images Created

I've generated professional product images for all your subscription tiers. You can find them in the artifacts panel.

### Images Available:
1. **Quantum Wallet Premium** - `quantum_wallet_premium.png`
2. **Marketplace Seller Basic** - `marketplace_seller_basic.png`
3. **Marketplace Seller Pro** - `marketplace_seller_pro.png`
4. **Renovision Contractor Basic** - `renovision_contractor_basic.png`
5. **Renovision Contractor Pro** - `renovision_contractor_pro.png`

---

## 📤 How to Upload Images to PayPal Plans

### Step 1: Host Your Images
PayPal requires images to be hosted online (they need a URL). You have several options:

#### Option A: Upload to Firebase Storage (Recommended)
```bash
# Navigate to each app directory and upload
firebase storage:upload quantum_wallet_premium.png /subscription-images/quantum_wallet_premium.png
```

Then get the public URL from Firebase Console.

#### Option B: Use Imgur (Quick & Easy)
1. Go to https://imgur.com/upload
2. Upload each image
3. Right-click the image → "Copy image address"
4. Use that URL in PayPal

#### Option C: Use Your Own CDN/Server
Upload to any publicly accessible server and get the URL.

---

## 🔧 Adding Images to PayPal Plans

### When Creating a New Plan:

1. Go to https://www.paypal.com/billing/plans
2. Click "Create Plan"
3. Fill in the plan details
4. Look for **"Product Image"** field
5. Paste the image URL (must be HTTPS)
6. PayPal will preview the image
7. Save the plan

### For Existing Plans:

1. Go to your plan in PayPal Dashboard
2. Click "Edit"
3. Find the **"Product Image"** section
4. Add/update the image URL
5. Save changes

---

## 📋 Image URLs Template

Once you upload the images, fill in these URLs:

```
# Quantum Wallet
QUANTUM_WALLET_IMAGE_URL=https://your-cdn.com/quantum_wallet_premium.png

# Marketplace
MARKETPLACE_BASIC_IMAGE_URL=https://your-cdn.com/marketplace_seller_basic.png
MARKETPLACE_PRO_IMAGE_URL=https://your-cdn.com/marketplace_seller_pro.png

# Renovision
RENOVISION_BASIC_IMAGE_URL=https://your-cdn.com/renovision_contractor_basic.png
RENOVISION_PRO_IMAGE_URL=https://your-cdn.com/renovision_contractor_pro.png
```

---

## 🎯 Image Requirements (PayPal)

- **Format**: JPG, PNG, or GIF
- **Size**: Minimum 1200x630px (recommended)
- **Max File Size**: 5MB
- **URL**: Must be HTTPS (secure)
- **Aspect Ratio**: 1.91:1 (like 1200x630) works best

✅ All generated images meet these requirements!

---

## 🚀 Quick Upload to Firebase Storage

### Step 1: Create Storage Bucket Structure
```bash
# In Firebase Console, create folder:
/subscription-images/
```

### Step 2: Upload Images
You can upload via:
- **Firebase Console** (easiest)
- **Firebase CLI**
- **Your app's admin panel**

### Step 3: Make Images Public
1. Go to Firebase Console → Storage
2. Select each image
3. Click "Get download URL"
4. Copy the URL

### Step 4: Use in PayPal
Paste those URLs when creating/editing plans.

---

## 📱 Alternative: Use GitHub/Public Repo

If you have a public GitHub repo:

1. Create folder: `/assets/subscription-images/`
2. Upload all images there
3. Get raw URLs like:
   ```
   https://raw.githubusercontent.com/your-username/your-repo/main/assets/subscription-images/quantum_wallet_premium.png
   ```
4. Use these URLs in PayPal

---

## 🎨 Image Mapping to Plans

| Plan | Image File | Recommended URL Path |
|------|-----------|---------------------|
| Quantum Wallet Premium (Monthly & Annual) | `quantum_wallet_premium.png` | `/subscription-images/quantum_wallet_premium.png` |
| Marketplace Basic (Monthly & Annual) | `marketplace_seller_basic.png` | `/subscription-images/marketplace_seller_basic.png` |
| Marketplace Pro (Monthly & Annual) | `marketplace_seller_pro.png` | `/subscription-images/marketplace_seller_pro.png` |
| Renovision Basic (Monthly & Annual) | `renovision_contractor_basic.png` | `/subscription-images/renovision_contractor_basic.png` |
| Renovision Pro (Monthly & Annual) | `renovision_contractor_pro.png` | `/subscription-images/renovision_contractor_pro.png` |

**Note**: Use the same image for both Monthly and Annual versions of each tier.

---

## 💡 Pro Tips

### Why Product Images Matter:
- ✅ Increases conversion rates by 30-40%
- ✅ Makes plans look more professional
- ✅ Helps users quickly identify tiers
- ✅ Improves brand recognition

### Best Practices:
- Use consistent branding across all images
- Make sure images are high quality
- Use different colors/styles for different tiers
- Keep text minimal (let the plan details do the talking)

---

## 🔗 Complete Setup Checklist

- [ ] Download all 5 product images from artifacts
- [ ] Upload images to Firebase Storage (or Imgur/CDN)
- [ ] Get public HTTPS URLs for each image
- [ ] Create subscription plans in PayPal
- [ ] Add image URLs to each plan
- [ ] Copy Plan IDs
- [ ] Send Plan IDs to me for integration

---

## 📸 Where Images Appear

Your product images will show up in:
- PayPal subscription checkout page
- PayPal billing agreements
- Customer's PayPal account (active subscriptions)
- Email receipts from PayPal
- Your app's pricing pages (if you use them)

---

## 🎯 Next Steps

1. **Download the images** from the artifacts panel (right side)
2. **Upload to Firebase Storage** or Imgur
3. **Get the public URLs**
4. **Add URLs to PayPal** when creating plans
5. **Send me the Plan IDs** and I'll integrate everything!

**Need help uploading? Let me know which method you prefer (Firebase, Imgur, or other) and I can guide you through it!**

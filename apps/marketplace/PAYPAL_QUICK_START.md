# 💰 PayPal Integration - Quick Start

## ✅ What's Been Created

I've set up complete PayPal integration for your marketplace:

### 📁 New Files Created

1. **`src/components/payment/PayPalDonationButton.tsx`**
   - Handles one-time and monthly donations
   - Shows PayPal button
   - Processes payments
   - Returns success/error status

2. **`src/components/payment/PayPalCheckoutButton.tsx`**
   - Handles marketplace purchases
   - Records transactions in database
   - Updates listing status to "sold"
   - Supports PayPal Credit and Pay Later

3. **`src/components/nonprofit/DonatePage.tsx`** (Updated)
   - Now uses PayPal instead of "coming soon" message
   - Shows success screen after donation
   - Displays impact preview
   - Tax-deductible information (EIN: 86-3183952)

4. **`PAYPAL_SETUP_GUIDE.md`**
   - Complete step-by-step setup instructions
   - Sandbox testing guide
   - Webhook configuration
   - Troubleshooting tips

5. **`.env.example`** (Updated)
   - Added PayPal configuration variables
   - Template for your actual `.env` file

---

## 🚀 Quick Setup (5 Steps)

### 1. Install PayPal SDK

```bash
cd c:\Users\heath\Downloads\constructive-designs-marketplace
npm install @paypal/react-paypal-js
```

### 2. Create PayPal Business Account

- Go to: https://www.paypal.com/us/business
- Sign up as **Nonprofit** (for donations)
- Verify with EIN: 86-3183952

### 3. Get API Credentials

- Go to: https://developer.paypal.com/dashboard/
- Create app: "Constructive Designs Marketplace"
- Copy **Client ID** and **Secret**

### 4. Create `.env` File

Create `c:\Users\heath\Downloads\constructive-designs-marketplace\.env`:

```env
VITE_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_PAYPAL_SECRET=YOUR_SECRET_HERE
VITE_PAYPAL_BUSINESS_EMAIL=donations@constructivedesignsinc.org
```

### 5. Test & Deploy

```bash
# Test locally
npm run dev

# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## 💡 How It Works

### Donations (`/donate` page)

1. User selects amount ($25, $50, $100, etc.)
2. Chooses one-time or monthly
3. Clicks PayPal button
4. Completes payment on PayPal
5. Returns to success screen
6. Receives tax-deductible receipt

### Marketplace Payments

1. Buyer views listing
2. Clicks "Buy Now"
3. PayPal button appears
4. Buyer pays through PayPal
5. Transaction recorded in database
6. Listing marked as "sold"
7. Seller receives notification

---

## 🎯 Features

✅ **One-Time Donations** - Single payments  
✅ **Monthly Donations** - Recurring subscriptions  
✅ **Marketplace Payments** - Secure checkout  
✅ **Tax Receipts** - Automatic for 501(c)(3)  
✅ **Multiple Options** - PayPal, PayPal Credit, Pay Later  
✅ **Mobile Optimized** - Works on all devices  
✅ **Success Screens** - Beautiful confirmation pages  

---

## 📊 Platform Fee

Currently set to **5%** for nonprofit operations.

To change:
- Edit `src/components/payment/PayPalCheckoutButton.tsx`
- Line 34: `const platformFeePercent = 0.05;`
- Change to your desired percentage

---

## 🔐 Security

✅ **API Keys** - Stored in `.env` (not in Git)  
✅ **Server Validation** - Payments verified via PayPal API  
✅ **HTTPS Only** - Secure connections  
✅ **PCI Compliant** - PayPal handles card data  

---

## 🧪 Testing

### Sandbox Mode

1. Use **Sandbox Client ID** from PayPal Developer Dashboard
2. Create test accounts (Business + Personal)
3. Test donations at: http://localhost:5173/donate
4. Verify in Sandbox Business Account

### Live Mode

1. Switch to **Live Client ID**
2. Make $1 test donation
3. Verify in PayPal Business Dashboard
4. Check receipt email

---

## 📧 Receipts

PayPal automatically sends receipts with:
- Donation amount
- Date
- Organization name
- EIN: 86-3183952
- Tax-deductible statement

Customize in: PayPal Business Dashboard → Account Settings → Email

---

## 🐛 Troubleshooting

### "PayPal is not configured"

**Fix**: Add `VITE_PAYPAL_CLIENT_ID` to `.env` file

### Payment fails

**Check**:
- Correct Client ID (Sandbox vs Live)
- PayPal account has funds (for testing)
- No browser ad blockers

### Button doesn't appear

**Fix**:
- Clear browser cache
- Check console for errors
- Verify PayPal SDK installed

---

## 📚 Full Documentation

See **`PAYPAL_SETUP_GUIDE.md`** for:
- Detailed setup instructions
- Webhook configuration
- Monthly subscription setup
- Advanced features
- Troubleshooting guide

---

## ✅ Next Steps

1. [ ] Install PayPal SDK: `npm install @paypal/react-paypal-js`
2. [ ] Create PayPal Business Account
3. [ ] Get API credentials from Developer Dashboard
4. [ ] Create `.env` file with credentials
5. [ ] Test in Sandbox mode
6. [ ] Switch to Live credentials
7. [ ] Deploy to production
8. [ ] Make test donation
9. [ ] Verify receipt email

---

## 🎉 You're Ready!

Your marketplace now accepts PayPal for:
- ✅ Donations (one-time and monthly)
- ✅ Marketplace purchases
- ✅ Tax-deductible receipts

**Donation Page**: https://cdi-marketplace-platform.web.app/donate

---

## 💬 Need Help?

- **PayPal Setup Guide**: `PAYPAL_SETUP_GUIDE.md`
- **PayPal Support**: https://www.paypal.com/us/smarthelp/contact-us
- **Developer Docs**: https://developer.paypal.com/docs/

---

**Note**: Remember to add `.env` to your `.gitignore` to keep credentials secure!

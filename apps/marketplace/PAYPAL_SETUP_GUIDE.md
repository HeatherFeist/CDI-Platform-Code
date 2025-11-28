# PayPal Integration Setup Guide

Complete guide to set up PayPal for donations and marketplace payments.

## 🎯 What You'll Get

✅ **PayPal Donations** - One-time and monthly recurring donations  
✅ **Marketplace Payments** - Secure checkout for listings  
✅ **Tax-Deductible Receipts** - Automatic for 501(c)(3) donations  
✅ **Multiple Payment Options** - PayPal, PayPal Credit, Pay Later  

---

## 📋 Prerequisites

1. PayPal Business Account
2. Node.js and npm installed
3. Access to your marketplace codebase

---

## 🚀 Step 1: Create PayPal Business Account

### For Nonprofit (Donations)

1. **Go to**: https://www.paypal.com/us/business
2. Click **"Sign Up"** → **"Business Account"**
3. Choose **"Nonprofit"** as business type
4. Fill in organization details:
   - **Organization Name**: Constructive Designs Inc.
   - **EIN**: 86-3183952
   - **Address**: Dayton, OH 45402
5. Verify your nonprofit status (may require documentation)
6. Complete account setup

### For Marketplace (Payments)

- Same PayPal Business account can handle both
- Or create separate account for marketplace transactions

---

## 🔑 Step 2: Get API Credentials

### Create App in PayPal Developer Dashboard

1. **Go to**: https://developer.paypal.com/dashboard/
2. Click **"Apps & Credentials"**
3. Click **"Create App"**
4. Fill in details:
   - **App Name**: `Constructive Designs Marketplace`
   - **App Type**: **Merchant**
5. Click **"Create App"**

### Get Client ID and Secret

1. In your app dashboard, you'll see:
   - **Client ID**: `AXXXXxxxxxXXXXXxxxxxx` (copy this)
   - **Secret**: Click **"Show"** to reveal (copy this)

2. **Important**: 
   - Use **Sandbox** credentials for testing
   - Use **Live** credentials for production

---

## 📦 Step 3: Install PayPal SDK

In your marketplace directory:

```bash
cd c:\Users\heath\Downloads\constructive-designs-marketplace
npm install @paypal/react-paypal-js
```

This installs the official PayPal React SDK.

---

## 🔧 Step 4: Configure Environment Variables

### Create `.env` file

Create `c:\Users\heath\Downloads\constructive-designs-marketplace\.env`:

```env
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_PAYPAL_SECRET=YOUR_SECRET_HERE
VITE_PAYPAL_BUSINESS_EMAIL=donations@constructivedesignsinc.org

# For monthly donations (optional - requires subscription setup)
VITE_PAYPAL_SUBSCRIPTION_PLAN_ID=P-XXXXXXXXXXXXX
```

### Get Values:

- **VITE_PAYPAL_CLIENT_ID**: From Step 2 (Client ID)
- **VITE_PAYPAL_SECRET**: From Step 2 (Secret) - Keep this secure!
- **VITE_PAYPAL_BUSINESS_EMAIL**: Your PayPal business email

### Add to `.gitignore`

Make sure `.env` is in your `.gitignore`:

```
.env
.env.local
.env.*.local
```

---

## 💰 Step 5: Set Up Monthly Donations (Optional)

For recurring monthly donations, you need to create subscription plans:

### Create Subscription Plan

1. **Go to**: PayPal Dashboard → **Products & Services** → **Subscriptions**
2. Click **"Create Plan"**
3. Fill in details:
   - **Plan Name**: `Monthly Donation - $25`
   - **Billing Cycle**: Monthly
   - **Price**: $25 (create multiple plans for different amounts)
4. Copy the **Plan ID** (starts with `P-`)
5. Add to `.env` as `VITE_PAYPAL_SUBSCRIPTION_PLAN_ID`

### Create Multiple Plans

Create plans for each preset amount:
- $25/month → Plan ID: `P-XXXXX25`
- $50/month → Plan ID: `P-XXXXX50`
- $100/month → Plan ID: `P-XXXXX100`

---

## 🧪 Step 6: Test in Sandbox Mode

### Use Sandbox Credentials

1. In PayPal Developer Dashboard, switch to **"Sandbox"**
2. Use **Sandbox Client ID** in your `.env`
3. Create test accounts:
   - **Business Account**: Receives payments
   - **Personal Account**: Makes test payments

### Test Donations

1. Go to: http://localhost:5173/donate
2. Select an amount
3. Click PayPal button
4. Log in with **Sandbox Personal Account**
5. Complete payment
6. Verify in **Sandbox Business Account**

---

## 🌐 Step 7: Go Live

### Switch to Live Credentials

1. In PayPal Developer Dashboard, switch to **"Live"**
2. Get **Live Client ID** and **Secret**
3. Update `.env` with live credentials
4. Rebuild and deploy:

```bash
npm run build
firebase deploy --only hosting
```

### Verify Live Payments

1. Go to: https://cdi-marketplace-platform.web.app/donate
2. Make a small test donation ($1)
3. Verify in PayPal Business Dashboard
4. Check that receipt email is sent

---

## 📊 Step 8: Configure Webhooks (Recommended)

Webhooks notify your app when payments complete:

### Set Up Webhook

1. **Go to**: PayPal Developer Dashboard → **Webhooks**
2. Click **"Add Webhook"**
3. **Webhook URL**: `https://cdi-marketplace-platform.web.app/api/paypal/webhook`
4. **Event types** to subscribe:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
5. Save webhook

### Handle Webhooks (Backend)

You'll need a backend endpoint to process webhooks. This can be:
- Supabase Edge Function
- Firebase Cloud Function
- Separate Node.js server

---

## 💳 Marketplace Payments

The `PayPalCheckoutButton` component handles marketplace purchases:

### How It Works

1. Buyer clicks "Buy Now" on listing
2. PayPal button appears
3. Buyer pays through PayPal
4. Payment captured
5. Transaction recorded in database
6. Listing marked as sold
7. Seller notified

### Platform Fee

Currently set to 5% (line 34 in `PayPalCheckoutButton.tsx`):

```typescript
const platformFeePercent = 0.05; // 5% for nonprofit operations
```

Adjust as needed for your business model.

---

## 🔐 Security Best Practices

### Never Expose Secrets

✅ **DO**:
- Store `VITE_PAYPAL_SECRET` in `.env`
- Add `.env` to `.gitignore`
- Use environment variables in deployment

❌ **DON'T**:
- Commit `.env` to Git
- Expose secrets in client-side code
- Share credentials publicly

### Validate Payments Server-Side

Always verify payments on the backend:
- Don't trust client-side payment confirmations
- Use PayPal API to verify transaction IDs
- Check payment amounts match expected values

---

## 📧 Email Receipts

PayPal automatically sends receipts, but you can customize:

### PayPal Settings

1. **Go to**: PayPal Business Dashboard → **Account Settings**
2. **Notifications** → **Email**
3. Customize receipt template
4. Add your nonprofit logo
5. Include EIN for tax purposes

### Custom Receipts

For more control, send custom receipts from your backend:
- Use Supabase Edge Functions
- Send via SendGrid, Mailgun, or similar
- Include donation details and tax information

---

## 🧾 Tax-Deductible Donations

### IRS Requirements for 501(c)(3)

Include in receipts:
- ✅ Organization name and EIN
- ✅ Donation amount
- ✅ Date of donation
- ✅ Statement: "No goods or services were provided"
- ✅ Tax-deductible disclaimer

### PayPal Receipt Customization

1. Add EIN (86-3183952) to business profile
2. Enable "Nonprofit" account features
3. PayPal will include tax-deductible language

---

## 📱 Mobile Optimization

PayPal buttons are mobile-responsive by default:
- Works on iOS and Android
- Supports PayPal app integration
- One-touch payments for returning users

---

## 🐛 Troubleshooting

### "Client ID not found"

**Fix**: Check that `VITE_PAYPAL_CLIENT_ID` is in `.env` and starts with `A`

### "Payment failed"

**Possible causes**:
- Sandbox vs Live mismatch
- Insufficient funds in test account
- API credentials expired

**Fix**: Check PayPal Developer Dashboard logs

### "Subscription plan not found"

**Fix**: Create subscription plans in PayPal Dashboard and add Plan IDs to `.env`

### Webhook not firing

**Fix**:
- Verify webhook URL is accessible
- Check webhook signature validation
- Review PayPal webhook logs

---

## 📚 Additional Resources

- **PayPal Developer Docs**: https://developer.paypal.com/docs/
- **React PayPal SDK**: https://www.npmjs.com/package/@paypal/react-paypal-js
- **Nonprofit Guide**: https://www.paypal.com/us/webapps/mpp/nonprofit
- **Webhook Events**: https://developer.paypal.com/api/rest/webhooks/

---

## ✅ Final Checklist

- [ ] PayPal Business Account created
- [ ] App created in Developer Dashboard
- [ ] Client ID and Secret obtained
- [ ] `.env` file configured
- [ ] PayPal SDK installed (`npm install @paypal/react-paypal-js`)
- [ ] Tested in Sandbox mode
- [ ] Subscription plans created (for monthly donations)
- [ ] Switched to Live credentials
- [ ] Deployed to production
- [ ] Webhooks configured
- [ ] Test donation completed
- [ ] Receipt emails working

---

## 🎉 You're Done!

Your marketplace now accepts PayPal donations and payments!

**Donation Page**: https://cdi-marketplace-platform.web.app/donate  
**Test it**: Make a $1 test donation to verify everything works!

---

## 💡 Pro Tips

1. **Offer multiple payment options**: PayPal + PayPal Credit + Pay Later
2. **Set up recurring donations**: Monthly donors are more valuable
3. **Track conversions**: Monitor donation completion rates
4. **Optimize button placement**: A/B test button colors and labels
5. **Send thank-you emails**: Personal touch increases donor retention

---

Need help? Check PayPal's support or contact their nonprofit team!

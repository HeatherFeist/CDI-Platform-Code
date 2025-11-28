# PayPal API Integration Guide

## Overview
This guide walks through integrating PayPal's REST API for accepting payments in the Constructive Home Reno application.

## Prerequisites
1. PayPal Business Account
2. PayPal Developer Account (developer.paypal.com)
3. API Credentials (Client ID & Secret)

---

## Step 1: Get PayPal API Credentials

### Create PayPal App
1. Go to https://developer.paypal.com/dashboard/
2. Click **"My Apps & Credentials"**
3. Click **"Create App"**
4. Enter App Name: "Constructive Home Reno"
5. Select **"Merchant"** as App Type
6. Click **"Create App"**

### Get Credentials
You'll receive:
- **Client ID** (for frontend)
- **Secret** (for backend - keep secure!)

### Sandbox vs Live
- **Sandbox** (testing): Use sandbox credentials
- **Live** (production): Use live credentials

---

## Step 2: Install PayPal SDK

### Frontend (React)
```bash
npm install @paypal/react-paypal-js
```

### Backend (Optional - for server-side)
```bash
npm install @paypal/checkout-server-sdk
```

---

## Step 3: Environment Variables

Add to `.env`:
```
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_client_id_here
VITE_PAYPAL_MODE=sandbox  # or 'live' for production

# Backend (if using server-side)
PAYPAL_CLIENT_SECRET=your_secret_here
```

---

## Step 4: Database Schema (Already Created)

Run `fix-payment-settings-complete.sql` if not already done:
```sql
-- Adds these columns to payment_settings:
- paypal_email (VARCHAR)
- paypal_client_id (TEXT)
- paypal_secret (TEXT - encrypted)
- payment_methods_enabled (JSONB)
```

---

## Step 5: Create PayPal Payment Component

### Basic Payment Button
```tsx
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

export const PayPalPaymentButton = ({ amount, onSuccess }) => {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD"
      }}
    >
      <PayPalButtons
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount.toString()
              }
            }]
          });
        }}
        onApprove={async (data, actions) => {
          const order = await actions.order.capture();
          onSuccess(order);
        }}
      />
    </PayPalScriptProvider>
  );
};
```

---

## Step 6: Payment Flow

### For Estimates/Invoices
1. Customer views estimate
2. Clicks "Pay with PayPal"
3. PayPal modal opens
4. Customer completes payment
5. Payment confirmed
6. Invoice marked as paid in database
7. Notification sent to business owner

### Database Flow
```
1. Create transaction record (status: 'pending')
2. PayPal payment initiated
3. On success:
   - Update transaction (status: 'completed')
   - Update invoice (paid: true)
   - Create notification
4. On failure:
   - Update transaction (status: 'failed')
   - Show error to user
```

---

## Step 7: Security Best Practices

### DO:
✅ Validate payments server-side
✅ Store secrets in environment variables
✅ Use HTTPS in production
✅ Log all transactions
✅ Verify webhook signatures

### DON'T:
❌ Store PayPal Secret in frontend
❌ Trust client-side payment amounts
❌ Skip webhook verification
❌ Store credit card data

---

## Step 8: Webhook Setup (Recommended)

### Create Webhook in PayPal Dashboard
1. Go to Developer Dashboard → Webhooks
2. Add Webhook URL: `https://yourdomain.com/api/paypal-webhook`
3. Select Events:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.REFUNDED

### Verify Webhook
```typescript
// Supabase Edge Function: paypal-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Verify webhook signature
  // Update transaction status
  // Send notifications
})
```

---

## Step 9: Testing

### Sandbox Test Accounts
PayPal provides test accounts:
- **Buyer**: Use sandbox buyer account to test payments
- **Seller**: Your sandbox business account receives test payments

### Test Flow
1. Use sandbox credentials
2. Make test payment with sandbox account
3. Verify transaction in database
4. Check PayPal sandbox dashboard
5. Test refunds and failures

---

## Step 10: Go Live Checklist

- [ ] Replace sandbox credentials with live credentials
- [ ] Update VITE_PAYPAL_MODE to 'live'
- [ ] Test with real small amount ($1)
- [ ] Set up webhook URL
- [ ] Enable email notifications
- [ ] Test refund process
- [ ] Document payment handling in team docs

---

## Payment Methods Enabled

### PayPal Email (Simple)
- Business provides PayPal email
- Customer sends payment manually
- Business manually marks as paid
- **No API integration needed**

### PayPal API (Automated)
- Business provides Client ID
- Customer pays via PayPal button
- Automatic payment confirmation
- **Requires API setup**

---

## Common Issues

### Issue: "Client ID not found"
**Fix**: Check `.env` file has `VITE_PAYPAL_CLIENT_ID`

### Issue: "Payment not showing in dashboard"
**Fix**: Using sandbox? Check sandbox dashboard, not live

### Issue: "Webhook not working"
**Fix**: Ensure webhook URL is publicly accessible (not localhost)

### Issue: "Transaction marked as pending forever"
**Fix**: Check browser console for errors, verify webhook setup

---

## Support Resources

- PayPal Developer Docs: https://developer.paypal.com/docs/
- PayPal SDK Repo: https://github.com/paypal/paypal-js
- Integration Wizard: https://developer.paypal.com/dashboard/applications/

---

## Summary

**Simple Integration** (Email only):
- Just save PayPal email in settings
- Customer pays manually
- Business marks as paid

**Full Integration** (API):
- Install SDK
- Add Client ID to env
- Use PayPalButtons component
- Set up webhooks
- Automatic payment tracking

Choose based on your needs! Start with email, upgrade to API later.

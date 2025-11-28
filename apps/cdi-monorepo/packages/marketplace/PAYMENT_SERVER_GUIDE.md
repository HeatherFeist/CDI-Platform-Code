# 🚀 Payment Server - Quick Start Guide

## You're Ready to Test Payments! 🎉

I've created a local payment server that lets you test Stripe payments with test cards.

---

## How to Start the Payment Server

### Option 1: Using PowerShell (Recommended)

Open a **NEW** PowerShell terminal and run:

```powershell
cd "c:\Users\heath\Downloads\Auction App\Auction Platform\server"
npm start
```

You should see:
```
🚀 Payment Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Local:   http://localhost:3001
  Health:  http://localhost:3001/health
  
  Stripe Mode: 🧪 TEST
  
  Ready to process payments! 💳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Option 2: Add to VS Code Tasks

Or I can create a VS Code task so you can start both servers with one click!

---

## Testing Payments - Step by Step

### 1. Start Both Servers

**Terminal 1** (Vite - Your Frontend):
```powershell
cd "c:\Users\heath\Downloads\Auction App\Auction Platform"
npm run dev
```

**Terminal 2** (Payment Server):
```powershell
cd "c:\Users\heath\Downloads\Auction App\Auction Platform\server"
npm start
```

### 2. Add CheckoutButton to a Listing Page

Update `src/components/listings/ListingDetail.tsx`:

```typescript
import { CheckoutButton } from '../checkout/CheckoutButton';

// Inside your component, where you want the buy button:
<CheckoutButton
  listingId={listing.id}
  title={listing.title}
  price={listing.price}
  sellerId={listing.seller_id}
  imageUrl={listing.images?.[0]}
/>
```

### 3. Add Routes to App.tsx

Update `src/App.tsx`:

```typescript
import { CheckoutSuccess } from './components/checkout/CheckoutSuccess';
import { CheckoutCancel } from './components/checkout/CheckoutCancel';

// Inside your <Routes>:
<Route path="/success" element={<CheckoutSuccess />} />
<Route path="/cancel" element={<CheckoutCancel />} />
```

### 4. Test a Payment!

1. Go to any listing page
2. Click the **"Buy Now"** button
3. You'll be redirected to Stripe's test checkout page
4. Use these **test card numbers**:

```
✅ SUCCESS:
Card: 4242 4242 4242 4242
Exp: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)

🔐 REQUIRES AUTHENTICATION:
Card: 4000 0025 0000 3155
(Tests 3D Secure authentication)

❌ DECLINED:
Card: 4000 0000 0000 9995
(Tests payment failures)
```

5. Complete the checkout
6. You'll be redirected to the **Success Page**!

---

## What Each Server Does

### Vite Server (Port 5173)
```
✅ Serves your React frontend
✅ Shows listings, UI components
✅ Handles routing
```

### Payment Server (Port 3001)
```
✅ Creates Stripe Checkout Sessions
✅ Processes payments securely
✅ Handles webhooks (for order fulfillment)
```

---

## API Endpoints Available

### Health Check
```
GET http://localhost:3001/health
```
Check if server is running.

### Create Checkout Session
```
POST http://localhost:3001/api/create-checkout-session

Body:
{
  "listingId": "123",
  "title": "Handmade Soap",
  "price": 20.00,
  "sellerId": "456",
  "imageUrl": "https://..."
}

Response:
{
  "id": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

### Get Session Details
```
GET http://localhost:3001/api/checkout-session/:sessionId

Response:
{
  "id": "cs_test_xxxxx",
  "amount": 2000,
  "currency": "usd",
  "payment_status": "paid",
  ...
}
```

---

## Troubleshooting

### "Cannot connect to payment server"

**Problem:** Payment server isn't running  
**Solution:** Start it in a separate terminal (see above)

### "Stripe key not found"

**Problem:** `.env.local` file not loaded  
**Solution:** Make sure `.env.local` is in the root directory (not in /server)

### "CORS error"

**Problem:** Frontend can't talk to backend  
**Solution:** Server has CORS enabled for localhost:5173 - should work automatically

### Payment redirects but shows error

**Check these:**
1. Both servers running? ✅
2. Stripe test keys in `.env.local`? ✅
3. Using test card numbers? ✅

---

## Next Steps

### After Testing Works:

1. **Add to More Pages**
   - Add CheckoutButton to ListingCard (for quick buy)
   - Create a shopping cart for multiple items
   - Add delivery options to checkout

2. **Database Integration**
   - Save orders to Supabase after successful payment
   - Update listing status (sold/available)
   - Send confirmation emails

3. **When You Get Your ID**
   - Complete Stripe identity verification
   - Get Connect Client ID
   - Enable payment splits (seller/sponsor/nonprofit)
   - Switch to live mode!

---

## Running in Production

When ready to deploy:

1. **Move to Supabase Edge Functions** (free tier)
2. **Or deploy to Google Cloud Run** (also free with your credits)
3. Update API URLs from `localhost:3001` to production URL
4. Switch from test keys to live keys
5. Set up Stripe webhooks for production

---

## Need Help?

If you run into issues:

1. Check both terminals are running
2. Verify `.env.local` has your Stripe test keys
3. Make sure ports 5173 and 3001 aren't blocked
4. Try the health check: http://localhost:3001/health

---

## Ready to Test?

1. Open **Terminal 1**: `npm run dev` (frontend)
2. Open **Terminal 2**: `cd server && npm start` (payment server)
3. Visit a listing page
4. Click "Buy Now"
5. Use test card: **4242 4242 4242 4242**
6. See the magic happen! ✨

**LET'S TEST IT!** 🚀

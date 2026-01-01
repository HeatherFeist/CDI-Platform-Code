# 🚀 PRODUCTION DEPLOYMENT GUIDE
## Facebook & Instagram OAuth + Quantum Wallet Setup

This guide walks you through EXACTLY what to do to go live with Facebook/Instagram integration and the Quantum Wallet for real financial data.

---

## 📋 Table of Contents

1. [Facebook OAuth Setup](#facebook-oauth-setup)
2. [Instagram API Setup](#instagram-api-setup)
3. [Backend API Implementation](#backend-api-implementation)
4. [Quantum Wallet Production Setup](#quantum-wallet-production-setup)
5. [Environment Variables](#environment-variables)
6. [Testing & Launch](#testing--launch)

---

# Part 1: Facebook OAuth Setup

## Step 1: Create Facebook Developer Account

### 1.1 Register as Developer
1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Click **"Get Started"** in the top right
3. Log in with your Facebook account
4. Complete the registration:
   - Accept Terms of Service
   - Verify your email
   - Verify your phone number (required for apps)

### 1.2 Create a New App
1. Go to [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Select app type: **"Consumer"** or **"Business"**
   - Choose **"Business"** for Shop'reneur
4. Fill in app details:
   - **App Name:** Shop'reneur
   - **App Contact Email:** your_email@domain.com
   - **Business Account:** Select or create one
5. Click **"Create App"**
6. **SAVE YOUR APP ID** - you'll need this!

## Step 2: Configure Facebook Login

### 2.1 Add Facebook Login Product
1. In your app dashboard, scroll to **"Add Products"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Select platform: **"Web"**
4. Enter your website URL:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### 2.2 Configure OAuth Settings
1. Go to **Settings → Basic** (left sidebar)
2. Scroll to **"App Domains"**
   - Add: `localhost` (for dev)
   - Add: `yourdomain.com` (for production)
3. Click **"Save Changes"**

### 2.3 Set Up Redirect URIs
1. Go to **Facebook Login → Settings**
2. Find **"Valid OAuth Redirect URIs"**
3. Add these URLs:
   ```
   http://localhost:5173/auth/facebook/callback
   https://yourdomain.com/auth/facebook/callback
   ```
4. Enable **"Login with the JavaScript SDK"** (ON)
5. Click **"Save Changes"**

### 2.4 Get Your Credentials
1. Go to **Settings → Basic**
2. Copy these values:
   - **App ID:** `123456789012345`
   - **App Secret:** Click "Show" → Copy the secret
3. **SAVE THESE SECURELY** - you'll add them to environment variables

## Step 3: Request Permissions

### 3.1 Basic Permissions (Auto-Approved)
These are automatically available:
- `public_profile`
- `email`

### 3.2 Advanced Permissions (Need Approval)
For posting to Facebook, you need:
1. Go to **App Review → Permissions and Features**
2. Request these permissions:
   - `pages_manage_posts` - Post to Facebook Pages
   - `pages_read_engagement` - Read page insights
   - `instagram_basic` - Access Instagram account
   - `instagram_content_publish` - Post to Instagram

### 3.3 Submit for App Review
1. Click **"Request Advanced Access"** for each permission
2. Fill out the form:
   - Explain how you'll use the permission
   - Provide screenshots of your app
   - Show privacy policy URL
   - Demonstrate functionality in a video
3. Submit and wait for approval (3-7 business days)

**NOTE:** You can test with your own account without approval!

---

# Part 2: Instagram API Setup

## Step 4: Connect Instagram Business Account

### 4.1 Prerequisites
✅ You need:
- Facebook Business Page (not personal profile)
- Instagram Business or Creator account
- Instagram account connected to Facebook Page

### 4.2 Convert Instagram to Business Account
1. Open Instagram app
2. Go to **Settings → Account**
3. Tap **"Switch to Professional Account"**
4. Choose **"Business"**
5. Complete setup

### 4.3 Connect Instagram to Facebook Page
1. Go to [https://www.facebook.com/pages](https://www.facebook.com/pages)
2. Select your Business Page
3. Click **"Settings"** → **"Instagram"**
4. Click **"Connect Account"**
5. Log in to Instagram and authorize
6. Your Instagram is now connected!

### 4.4 Get Instagram Business Account ID
1. In Facebook Developer Console
2. Go to **Tools → Graph API Explorer**
3. Select your app
4. Select your Facebook Page
5. Enter this query:
   ```
   me?fields=instagram_business_account
   ```
6. Click **"Submit"**
7. Copy the `instagram_business_account.id`
8. **SAVE THIS ID** - you'll need it for API calls

---

# Part 3: Backend API Implementation

## Step 5: Create Backend Server

### 5.1 Set Up Node.js Backend
Create a new backend folder:

```bash
mkdir shop-reneur-api
cd shop-reneur-api
npm init -y
```

### 5.2 Install Dependencies
```bash
npm install express cors dotenv axios firebase-admin
npm install --save-dev @types/express @types/node typescript ts-node
```

### 5.3 Create OAuth Routes

Create `src/routes/auth.ts`:

```typescript
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Facebook OAuth - Initiate
router.get('/facebook', (req, res) => {
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
    `&scope=public_profile,email,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`;
  
  res.redirect(fbAuthUrl);
});

// Facebook OAuth - Callback
router.get('/facebook/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/social?error=no_code`);
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code: code
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user info
    const userResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me`,
      {
        params: {
          fields: 'id,name,email',
          access_token: accessToken
        }
      }
    );
    
    // Store in your database
    // await saveSocialConnection(userId, 'facebook', {
    //   accessToken,
    //   userId: userResponse.data.id,
    //   userName: userResponse.data.name,
    //   expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000) // 60 days
    // });
    
    res.redirect(`${process.env.FRONTEND_URL}/social?success=facebook_connected`);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/social?error=oauth_failed`);
  }
});

// Instagram OAuth - Uses same Facebook flow
router.get('/instagram', (req, res) => {
  // Instagram API uses Facebook OAuth
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}` +
    `&scope=instagram_basic,instagram_content_publish,pages_read_engagement`;
  
  res.redirect(fbAuthUrl);
});

// Instagram OAuth - Callback
router.get('/instagram/callback', async (req, res) => {
  // Similar to Facebook callback, but focus on Instagram Business Account
  const { code } = req.query;
  
  try {
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code: code
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get Instagram Business Account
    const igResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: {
          fields: 'instagram_business_account{id,username}',
          access_token: accessToken
        }
      }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}/social?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/social?error=oauth_failed`);
  }
});

export default router;
```

### 5.4 Create Posting API

Create `src/routes/social.ts`:

```typescript
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Post to Facebook
router.post('/facebook/post', async (req, res) => {
  const { accessToken, message, imageUrl } = req.body;
  
  try {
    // Get user's Facebook pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: { access_token: accessToken }
      }
    );
    
    const pageId = pagesResponse.data.data[0].id;
    const pageToken = pagesResponse.data.data[0].access_token;
    
    // Create post
    const postResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        url: imageUrl,
        message: message,
        access_token: pageToken
      }
    );
    
    res.json({
      success: true,
      postId: postResponse.data.id,
      postUrl: `https://facebook.com/${postResponse.data.id}`
    });
  } catch (error) {
    console.error('Facebook posting error:', error);
    res.status(500).json({ error: 'Failed to post to Facebook' });
  }
});

// Post to Instagram
router.post('/instagram/post', async (req, res) => {
  const { accessToken, caption, imageUrl, igAccountId } = req.body;
  
  try {
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    );
    
    const creationId = containerResponse.data.id;
    
    // Step 2: Publish media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );
    
    res.json({
      success: true,
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/p/${publishResponse.data.id}`
    });
  } catch (error) {
    console.error('Instagram posting error:', error);
    res.status(500).json({ error: 'Failed to post to Instagram' });
  }
});

export default router;
```

### 5.5 Create Main Server

Create `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import socialRoutes from './routes/social';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/social', socialRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
```

---

# Part 4: Quantum Wallet Production Setup

## Step 6: Set Up Payment Processing

### 6.1 Choose Payment Provider

**Option A: Stripe (Recommended)**

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Start now"** → Create account
3. Complete business verification:
   - Business details
   - Bank account info
   - Tax information
4. Get API keys:
   - Go to **Developers → API keys**
   - Copy **Publishable key** (starts with `pk_`)
   - Copy **Secret key** (starts with `sk_`)

**Option B: PayPal**

1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Create developer account
3. Create app in sandbox
4. Get credentials:
   - Client ID
   - Client Secret

### 6.2 Install Stripe SDK

```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur
npm install @stripe/stripe-js stripe
```

### 6.3 Create Payment Service

Create `services/paymentService.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const paymentService = {
  // Create payment intent
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    const response = await fetch(`${process.env.VITE_API_URL}/api/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency })
    });
    
    return response.json();
  },
  
  // Process payment
  async processPayment(paymentIntentId: string) {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');
    
    const result = await stripe.confirmPayment({
      clientSecret: paymentIntentId,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`
      }
    });
    
    return result;
  },
  
  // Award merchant coins after purchase
  async awardCoinsForPurchase(userId: string, purchaseAmount: number, earnRate: number) {
    const coinsEarned = Math.floor(purchaseAmount * earnRate);
    
    const response = await fetch(`${process.env.VITE_API_URL}/api/wallet/award-coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, coins: coinsEarned })
    });
    
    return response.json();
  }
};
```

## Step 7: Create Quantum Wallet Integration

### 7.1 Add Wallet Service

Create `services/walletService.ts`:

```typescript
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

export const walletService = {
  // Get user wallet
  async getWallet(userId: string) {
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);
    
    if (!walletSnap.exists()) {
      // Create new wallet
      const newWallet = {
        userId,
        merchantCoins: [],
        totalValue: 0,
        transactions: [],
        createdAt: new Date().toISOString()
      };
      await setDoc(walletRef, newWallet);
      return newWallet;
    }
    
    return walletSnap.data();
  },
  
  // Add merchant coin to wallet
  async addMerchantCoin(userId: string, coinData: any) {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const existingCoinIndex = wallet.merchantCoins.findIndex(
      (c: any) => c.merchantId === coinData.merchantId
    );
    
    if (existingCoinIndex >= 0) {
      // Update existing coin
      wallet.merchantCoins[existingCoinIndex].balance += coinData.balance;
    } else {
      // Add new coin
      wallet.merchantCoins.push({
        ...coinData,
        addedAt: new Date().toISOString()
      });
    }
    
    await updateDoc(walletRef, {
      merchantCoins: wallet.merchantCoins,
      totalValue: this.calculateTotalValue(wallet.merchantCoins)
    });
  },
  
  // Award coins after purchase
  async awardCoins(userId: string, merchantId: string, amount: number) {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const coinIndex = wallet.merchantCoins.findIndex(
      (c: any) => c.merchantId === merchantId
    );
    
    if (coinIndex >= 0) {
      wallet.merchantCoins[coinIndex].balance += amount;
      
      // Add transaction
      wallet.transactions.push({
        type: 'earned',
        merchantId,
        amount,
        timestamp: new Date().toISOString(),
        description: 'Coins earned from purchase'
      });
      
      await updateDoc(walletRef, {
        merchantCoins: wallet.merchantCoins,
        transactions: wallet.transactions,
        totalValue: this.calculateTotalValue(wallet.merchantCoins)
      });
    }
  },
  
  // Redeem coins
  async redeemCoins(userId: string, merchantId: string, amount: number) {
    const walletRef = doc(db, 'wallets', userId);
    const wallet = await this.getWallet(userId);
    
    const coinIndex = wallet.merchantCoins.findIndex(
      (c: any) => c.merchantId === merchantId
    );
    
    if (coinIndex >= 0 && wallet.merchantCoins[coinIndex].balance >= amount) {
      wallet.merchantCoins[coinIndex].balance -= amount;
      
      // Add transaction
      wallet.transactions.push({
        type: 'redeemed',
        merchantId,
        amount,
        timestamp: new Date().toISOString(),
        description: 'Coins redeemed for discount'
      });
      
      await updateDoc(walletRef, {
        merchantCoins: wallet.merchantCoins,
        transactions: wallet.transactions,
        totalValue: this.calculateTotalValue(wallet.merchantCoins)
      });
      
      return true;
    }
    
    return false;
  },
  
  // Calculate total wallet value
  calculateTotalValue(merchantCoins: any[]): number {
    return merchantCoins.reduce((total, coin) => {
      return total + (coin.balance / coin.redemptionRate);
    }, 0);
  }
};
```

### 7.2 Update CartDrawer with Wallet

Update `components/CartDrawer.tsx` to show coin redemption:

```typescript
// Add this to your checkout section
<div className="border-t pt-4">
  <h3 className="font-semibold mb-3">Use Merchant Coins</h3>
  {availableCoins > 0 ? (
    <div className="bg-purple-50 rounded-lg p-4">
      <div className="flex justify-between mb-2">
        <span>Available: {availableCoins} 🪙</span>
        <span className="text-purple-600 font-semibold">
          = ${(availableCoins / redemptionRate).toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={Math.min(availableCoins, maxRedeemableCoins)}
        value={coinsToRedeem}
        onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
        className="w-full"
      />
      <div className="text-sm text-gray-600 mt-2">
        Redeeming: {coinsToRedeem} coins (-${discount.toFixed(2)})
      </div>
    </div>
  ) : (
    <p className="text-gray-500 text-sm">
      Earn coins by making purchases!
    </p>
  )}
</div>
```

---

# Part 5: Environment Variables

## Step 8: Configure Environment

### 8.1 Create `.env` file

In `/workspaces/CDI-Platform-Code/Shop-reneur/`, create `.env`:

```env
# Facebook OAuth
VITE_FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
VITE_FACEBOOK_REDIRECT_URI=http://localhost:5173/auth/facebook/callback

# Instagram
VITE_INSTAGRAM_REDIRECT_URI=http://localhost:5173/auth/instagram/callback

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# API
VITE_API_URL=http://localhost:3001

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 8.2 Create `.env.production`

```env
# Facebook OAuth - PRODUCTION
VITE_FACEBOOK_APP_ID=your_production_app_id
FACEBOOK_APP_SECRET=your_production_secret
VITE_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback

# Instagram - PRODUCTION
VITE_INSTAGRAM_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback

# Stripe - PRODUCTION
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key

# API - PRODUCTION
VITE_API_URL=https://api.yourdomain.com

# Frontend - PRODUCTION
FRONTEND_URL=https://yourdomain.com
```

### 8.3 Add to `.gitignore`

```
.env
.env.local
.env.production
.env.development
```

---

# Part 6: Testing & Launch

## Step 9: Test Everything

### 9.1 Test Facebook OAuth
1. Start backend: `cd shop-reneur-api && npm start`
2. Start frontend: `cd Shop-reneur && npm run dev`
3. Go to Social tab
4. Click "Connect Facebook"
5. Authorize with YOUR Facebook account
6. Check database for saved token

### 9.2 Test Instagram OAuth
1. Ensure Instagram Business account is connected to Facebook
2. Click "Connect Instagram"
3. Authorize
4. Verify connection

### 9.3 Test Challenge Submission with Social Post
1. Go to Challenges tab
2. Submit a challenge entry
3. Check "Post to Facebook" option
4. Submit
5. Verify post appears on Facebook

### 9.4 Test Wallet Integration
1. Make a test purchase
2. Check that coins are awarded
3. Try redeeming coins on next purchase
4. Verify transaction history

## Step 10: Deploy to Production

### 10.1 Deploy Backend
```bash
# Using Railway, Render, or similar
railway login
railway init
railway up
```

### 10.2 Deploy Frontend
```bash
# Using Netlify or Vercel
netlify deploy --prod
# or
vercel --prod
```

### 10.3 Update Facebook App Settings
1. Go to Facebook Developer Console
2. Settings → Basic
3. Add production domain to App Domains
4. Update OAuth redirect URIs to production URLs

### 10.4 Switch to Live Mode
1. Go to Facebook app dashboard
2. Click "Switch to Live Mode" (top right)
3. Your app is now public!

---

## 🎉 You're Live!

Your Shop'reneur app now has:
- ✅ Facebook OAuth integration
- ✅ Instagram posting capability
- ✅ Quantum Wallet with real payments
- ✅ Merchant coins system
- ✅ Real financial data tracking

## 📞 Support Checklist

Before going live, verify:
- [ ] Facebook app approved and in Live Mode
- [ ] Instagram Business account connected
- [ ] Stripe account verified
- [ ] Backend API deployed and running
- [ ] Frontend deployed with HTTPS
- [ ] Environment variables set correctly
- [ ] Test OAuth flow works
- [ ] Test payments work
- [ ] Test wallet updates correctly
- [ ] Privacy policy and terms published

---

**Last Updated:** January 1, 2026  
**Version:** 1.0.0

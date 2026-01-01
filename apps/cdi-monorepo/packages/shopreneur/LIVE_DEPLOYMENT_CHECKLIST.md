# 🚀 LIVE PRODUCTION DEPLOYMENT GUIDE
## Facebook/Instagram OAuth + Quantum Wallet

Complete step-by-step guide to deploy Shop'reneur to production with real OAuth and payments.

---

## ⏱️ ESTIMATED TIME: 2-3 hours

## 📋 REQUIREMENTS CHECKLIST
- [ ] Facebook account
- [ ] Instagram Business account
- [ ] Stripe account
- [ ] Firebase project
- [ ] Domain name (optional but recommended)
- [ ] Credit card for hosting (~$10-20/month)

---

# PART 1: FACEBOOK & INSTAGRAM SETUP (30 minutes)

## Step 1: Create Facebook Developer Account

### 1.1 Register as Developer
1. Go to https://developers.facebook.com
2. Click "Get Started" in top right
3. Log in with your Facebook account
4. Fill out the registration form
5. Verify your email and phone number

### 1.2 Create Facebook App
1. Click "My Apps" → "Create App"
2. Select **"Business"** as app type
3. Fill in:
   - **App Name**: `Shop'reneur` (or your app name)
   - **Contact Email**: your email
   - **Business Account**: Create new or select existing
4. Click "Create App"
5. **Save your App ID** - you'll need this

### 1.3 Get App Secret
1. In your app dashboard, go to Settings → Basic
2. Click "Show" next to **App Secret**
3. Enter your Facebook password
4. **Copy the App Secret** - save it securely

### 1.4 Add Facebook Login Product
1. In app dashboard, click "Add Product"
2. Find "Facebook Login" → Click "Set Up"
3. Select **"Web"** as platform
4. Enter your site URL (for now use `http://localhost:5173`)
5. Click "Save" → "Continue"

### 1.5 Configure OAuth Redirect URIs
1. Go to Facebook Login → Settings
2. In "Valid OAuth Redirect URIs" add:
   ```
   http://localhost:3001/auth/facebook/callback
   http://localhost:3001/auth/instagram/callback
   ```
3. Enable "Login with the JavaScript SDK"
4. Click "Save Changes"

### 1.6 Request Advanced Permissions (IMPORTANT!)
1. Go to App Review → Permissions and Features
2. Request these permissions:
   - **pages_manage_posts** - To post to Facebook Pages
   - **instagram_basic** - Access Instagram account info
   - **instagram_content_publish** - Post to Instagram
   - **pages_show_list** - Get user's pages
   - **pages_read_engagement** - Read page insights

3. For each permission, click "Request Advanced Access"
4. Fill out the questionnaire:
   - **What will you use this for?** "Allow users to post marketing content to their Facebook and Instagram business accounts directly from our app to help grow their business"
   - Upload screenshots of your app
   - Provide step-by-step usage instructions
   - Record a screen recording demo (use OBS Studio or Loom)

5. Submit for review
6. ⏰ **WAIT TIME**: 3-7 business days for approval

### 1.7 Switch App to Live Mode
1. Go to Settings → Basic
2. Toggle "App Mode" from Development to **Live**
3. Add your production URLs to App Domains
4. Save changes

**✅ CHECKPOINT**: You should have:
- Facebook App ID
- Facebook App Secret  
- Redirect URIs configured
- Permissions requested (waiting for approval)

---

## Step 2: Setup Instagram Business Account

### 2.1 Convert to Business Account
1. Open Instagram app on your phone
2. Go to Settings → Account
3. Tap "Switch to Professional Account"
4. Choose "Business"
5. Complete the setup wizard

### 2.2 Connect to Facebook Page
1. Create a Facebook Page (if you don't have one):
   - Go to https://facebook.com/pages/create
   - Choose "Business or Brand"
   - Enter page name and category
   - Complete setup

2. Connect Instagram to Page:
   - Instagram app → Settings → Account
   - Tap "Linked Accounts"
   - Select Facebook → Log in
   - Choose your Facebook Page
   - Confirm connection

### 2.3 Get Instagram Business Account ID
1. Go to https://developers.facebook.com/tools/explorer
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Grant all permissions
5. In the query box, enter:
   ```
   me/accounts?fields=instagram_business_account
   ```
6. Click "Submit"
7. **Copy the instagram_business_account.id** - you'll need this for testing

**✅ CHECKPOINT**: You should have:
- Instagram Business Account
- Instagram connected to Facebook Page
- Instagram Business Account ID

---

# PART 2: STRIPE SETUP (15 minutes)

## Step 3: Create Stripe Account

### 3.1 Sign Up
1. Go to https://stripe.com
2. Click "Start now" → "Sign up"
3. Enter your email and create password
4. Verify your email

### 3.2 Activate Account
1. Complete business profile:
   - Business name
   - Business type
   - Industry
   - Website URL
2. Add bank account for payouts
3. Verify your identity (upload ID)
4. ⏰ **WAIT TIME**: 1-2 days for verification

### 3.3 Get API Keys
1. Go to Developers → API Keys
2. You'll see:
   - **Publishable key (Test)**: `pk_test_...`
   - **Secret key (Test)**: `sk_test_...` (click Reveal)
   
3. **Save both keys** - you'll use test keys for development

### 3.4 Enable Payment Methods
1. Go to Settings → Payment Methods
2. Enable:
   - Cards (Visa, Mastercard, Amex)
   - Apple Pay
   - Google Pay
3. Save changes

### 3.5 Get Live Keys (when ready for production)
1. Complete account activation
2. Go to Developers → API Keys
3. Switch from "Test" to "Live" mode
4. Copy:
   - **Publishable key (Live)**: `pk_live_...`
   - **Secret key (Live)**: `sk_live_...`

**✅ CHECKPOINT**: You should have:
- Stripe account activated
- Test API keys (pk_test_... and sk_test_...)
- Live API keys (for production later)

---

# PART 3: BACKEND API DEPLOYMENT (30 minutes)

## Step 4: Setup Backend Server

### 4.1 Install Dependencies
```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur-api
npm install
```

### 4.2 Get Firebase Admin Key
1. Go to https://console.firebase.google.com
2. Select your project
3. Click gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the JSON file as `firebase-admin-key.json` in `/workspaces/CDI-Platform-Code/Shop-reneur-api/`

### 4.3 Configure Environment Variables
```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur-api
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Facebook (from Step 1)
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:3001/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=http://localhost:3001/auth/instagram/callback

# Stripe (from Step 3)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 4.4 Test Locally
```bash
npm run dev
```

Visit http://localhost:3001/health - you should see:
```json
{"status":"ok","timestamp":"2024-01-15T..."}
```

### 4.5 Deploy to Railway (Recommended)

#### Option A: Railway (Easiest - Free tier available)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-detect Node.js
6. Add environment variables:
   - Click your service → Variables tab
   - Add all variables from `.env`
   - Upload `firebase-admin-key.json` as a file
7. Deploy!
8. Get your production URL (e.g., `https://shop-reneur-api.up.railway.app`)

#### Option B: Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect repo → Select `Shop-reneur-api` folder
5. Configure:
   - Name: `shop-reneur-api`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy

#### Option C: Heroku
```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur-api
heroku login
heroku create shop-reneur-api
git init
git add .
git commit -m "Initial API"
heroku git:remote -a shop-reneur-api
git push heroku main
```

**✅ CHECKPOINT**: 
- API deployed and running
- Health check returns {"status":"ok"}
- Production URL obtained (e.g., https://your-api.railway.app)

---

# PART 4: FRONTEND DEPLOYMENT (20 minutes)

## Step 5: Configure Frontend Environment

### 5.1 Update Environment Variables
```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur
```

Create `.env.production`:
```env
# Firebase (already configured)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API URL (from Step 4)
VITE_API_URL=https://your-api.railway.app

# Stripe (from Step 3)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Facebook (from Step 1)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

### 5.2 Update Social Service
The `socialService.ts` is already configured to use `VITE_API_URL` ✅

### 5.3 Build for Production
```bash
npm run build
```

### 5.4 Deploy to Netlify (Recommended)

#### Option A: Netlify (Easiest)
1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repo
5. Configure:
   - Base directory: `Shop-reneur`
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables (from `.env.production`)
7. Click "Deploy"
8. Get your site URL (e.g., `https://shop-reneur.netlify.app`)

#### Option B: Vercel
```bash
cd /workspaces/CDI-Platform-Code/Shop-reneur
npm install -g vercel
vercel login
vercel --prod
```

#### Option C: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

**✅ CHECKPOINT**: 
- Frontend deployed
- Site accessible at production URL
- Environment variables configured

---

# PART 5: FINAL CONFIGURATION (15 minutes)

## Step 6: Update Facebook App with Production URLs

### 6.1 Add Production Domains
1. Go to https://developers.facebook.com
2. Select your app
3. Settings → Basic → Add Platform → Website
4. Add your production URLs:
   - **Site URL**: `https://shop-reneur.netlify.app`
   - **App Domains**: `netlify.app`, `railway.app`

### 6.2 Update OAuth Redirect URIs
1. Facebook Login → Settings
2. Add production redirect URIs:
   ```
   https://your-api.railway.app/auth/facebook/callback
   https://your-api.railway.app/auth/instagram/callback
   ```
3. Keep local URLs for testing
4. Save Changes

### 6.3 Update Backend Environment
In Railway/Render dashboard, update:
```env
NODE_ENV=production
FRONTEND_URL=https://shop-reneur.netlify.app
FACEBOOK_REDIRECT_URI=https://your-api.railway.app/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=https://your-api.railway.app/auth/instagram/callback
```

---

# PART 6: GO LIVE! (10 minutes)

## Step 7: Test Complete Flow

### 7.1 Test Facebook OAuth
1. Go to your production site
2. Navigate to Social tab
3. Click "Connect Facebook"
4. You should be redirected to Facebook
5. Grant permissions
6. Should redirect back with success message
7. Check Firebase Console → Firestore → socialConnections
8. Should see your connection with accessToken

### 7.2 Test Instagram OAuth
1. In Social tab, click "Connect Instagram"
2. Grant permissions
3. Should redirect back with success
4. Check Firestore for Instagram connection

### 7.3 Test Challenge Posting
1. Go to Challenges tab
2. Click any challenge → "Submit Entry"
3. Upload an image
4. Select Facebook or Instagram
5. Add caption
6. Click "Submit Challenge"
7. Check your Facebook/Instagram - post should appear!

### 7.4 Test Payments
1. Make a test purchase
2. Use Stripe test card: `4242 4242 4242 4242`
3. Any future expiry (12/25)
4. Any CVV (123)
5. Payment should process
6. Check Wallet - coins should be awarded
7. Check Stripe Dashboard - payment should appear

### 7.5 Test Wallet
1. Go to Profile or Wallet section
2. Should see:
   - Total balance
   - Merchant coins
   - Transaction history
   - Tier status (Bronze/Silver/Gold/Platinum)
3. Try earning coins (complete challenge, make purchase)
4. Try redeeming coins at checkout

---

## Step 8: Switch to Live Mode

### 8.1 Wait for Facebook Approval
- Check email for approval notification
- Usually takes 3-7 business days
- You can test with your own accounts without approval

### 8.2 Activate Stripe Live Mode
1. Complete Stripe account activation
2. Update environment variables with live keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_your_live_key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   ```
3. Redeploy backend and frontend

### 8.3 Switch Facebook App to Live
1. Facebook Developer Console → App Review
2. Make sure all requested permissions are approved
3. Settings → Basic → Toggle "App Mode" to LIVE
4. Confirm the switch

---

# 🎉 YOU'RE LIVE!

## What You've Accomplished:
✅ Facebook OAuth integrated  
✅ Instagram OAuth integrated  
✅ Users can post to Facebook/Instagram from challenges  
✅ Quantum Wallet with real-time balance  
✅ Stripe payment processing  
✅ Coin rewards and redemption  
✅ Transaction history tracking  
✅ Tier progression system  
✅ Full production deployment  

---

# 📊 MONITORING & ANALYTICS

## Track Your Numbers

### Firebase Console
- Real-time user data
- Challenge submissions
- Leaderboard stats
- Wallet balances
- Social connections

### Stripe Dashboard
- Revenue tracking
- Payment volume
- Customer lifetime value
- Failed payments
- Refunds

### Facebook Business Suite
- Post engagement
- Reach and impressions
- Audience demographics
- Best posting times

---

# 🔧 TROUBLESHOOTING

## Common Issues

### "OAuth Failed"
- ✅ Check redirect URIs match exactly
- ✅ Verify App ID and Secret are correct
- ✅ Make sure app is in Live mode (or testing with app administrators)
- ✅ Check browser console for errors

### "Instagram Account Not Found"
- ✅ Verify Instagram is converted to Business
- ✅ Check Instagram is connected to Facebook Page
- ✅ Use Facebook Business Suite to confirm connection

### "Payment Failed"
- ✅ Check Stripe is in test mode (for testing)
- ✅ Verify API keys are correct (pk_test with sk_test, pk_live with sk_live)
- ✅ Check Stripe Dashboard for error details
- ✅ Confirm amount is > $0.50 USD minimum

### "Coins Not Awarded"
- ✅ Check backend logs for errors
- ✅ Verify payment completed successfully
- ✅ Check Firebase rules allow wallet updates
- ✅ Look in Firestore → wallets → {userId}

### "Social Post Failed"
- ✅ Verify access token is valid (not expired)
- ✅ Check permissions are approved
- ✅ Test with simple text post first
- ✅ Check image URL is publicly accessible
- ✅ Instagram requires image (can't be text-only)

---

# 📈 NEXT STEPS

## Growth & Scaling

### Month 1: Soft Launch
- [ ] Invite 10-20 friends/family to test
- [ ] Monitor for bugs and crashes
- [ ] Collect user feedback
- [ ] Test all payment flows
- [ ] Verify OAuth works for all users

### Month 2: Public Beta
- [ ] Open to 100-200 users
- [ ] Add analytics (Google Analytics, Mixpanel)
- [ ] Create onboarding tutorial
- [ ] Build email notifications
- [ ] Add customer support (Intercom, Crisp)

### Month 3: Full Launch
- [ ] Remove beta tags
- [ ] Launch marketing campaign
- [ ] Add referral program
- [ ] Optimize payment flow
- [ ] Scale infrastructure

## Feature Roadmap
- [ ] TikTok integration
- [ ] Twitter/X posting
- [ ] LinkedIn for B2B users
- [ ] Advanced analytics dashboard
- [ ] AI-powered challenge suggestions
- [ ] Team/collaborative challenges
- [ ] Premium subscription tier
- [ ] White-label solution for agencies

---

# 💰 MONETIZATION IDEAS

## Revenue Streams
1. **Transaction Fees**: 2-3% on merchant coin redemptions
2. **Premium Features**: $9.99/month for advanced analytics
3. **Challenge Sponsorships**: Brands pay to feature challenges
4. **Marketplace Commission**: 5-10% on product sales
5. **API Access**: $49-199/month for developer API
6. **White Label**: $299/month for agencies to rebrand

---

# 🆘 SUPPORT

## Get Help
- **Documentation**: See GAMIFICATION_GUIDE.md
- **API Docs**: See Shop-reneur-api/README.md  
- **Facebook Help**: https://developers.facebook.com/support
- **Stripe Help**: https://support.stripe.com
- **Community**: Create Discord/Slack for users

## Emergency Contacts
- **Firebase Status**: https://status.firebase.google.com
- **Stripe Status**: https://status.stripe.com  
- **Facebook Platform Status**: https://developers.facebook.com/status

---

# 🎯 SUCCESS METRICS

## Week 1 Goals
- [ ] 10 active users
- [ ] 50 challenge submissions
- [ ] 10 social posts published
- [ ] $100 in test transactions
- [ ] 0 critical bugs

## Month 1 Goals
- [ ] 100 active users
- [ ] 500 challenge submissions  
- [ ] 200 social posts
- [ ] $1,000 in real transactions
- [ ] 4.5+ star rating

## Month 3 Goals
- [ ] 1,000 active users
- [ ] 5,000+ challenge submissions
- [ ] 2,000+ social posts
- [ ] $10,000+ in transactions
- [ ] Positive cash flow

---

# ✅ FINAL CHECKLIST

Before announcing your launch:

## Security
- [ ] All secrets in environment variables (not in code)
- [ ] Firebase security rules configured
- [ ] HTTPS enabled on all domains
- [ ] CORS configured properly
- [ ] Rate limiting on API endpoints

## Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner
- [ ] GDPR compliance (if EU users)
- [ ] Stripe Terms of Service accepted

## Business
- [ ] Business entity registered
- [ ] Business bank account opened
- [ ] Accounting system setup (QuickBooks, Wave)
- [ ] Tax ID obtained (EIN in US)
- [ ] Insurance considered

## Marketing
- [ ] Domain purchased and configured
- [ ] Logo and branding finalized
- [ ] Social media accounts created
- [ ] Launch email drafted
- [ ] Press kit prepared

---

# 🚀 LAUNCH SCRIPT

## Day of Launch

### Morning (9 AM)
- [ ] Final smoke test of all features
- [ ] Verify payment processing works
- [ ] Check all OAuth flows
- [ ] Monitor server resources

### Noon (12 PM)
- [ ] Switch app to live mode
- [ ] Send launch email to waitlist
- [ ] Post on social media
- [ ] Share in relevant communities

### Evening (6 PM)
- [ ] Check analytics
- [ ] Respond to user questions
- [ ] Monitor error logs
- [ ] Celebrate! 🎉

---

**You're ready to launch Shop'reneur with full Facebook/Instagram integration and real payment processing! The quantum wallet is live and ready to track real financial data. Good luck! 🚀**

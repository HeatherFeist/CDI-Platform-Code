# Shop'reneur API Server

Backend API for handling Facebook/Instagram OAuth and Stripe payments.

## Quick Setup

### 1. Install Dependencies
```bash
cd Shop-reneur-api
npm install
```

### 2. Get Firebase Admin Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save as `firebase-admin-key.json` in this directory

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `FACEBOOK_APP_ID` - From Facebook Developer Console
- `FACEBOOK_APP_SECRET` - From Facebook Developer Console
- `STRIPE_SECRET_KEY` - From Stripe Dashboard

### 4. Start Development Server
```bash
npm run dev
```

Server will run on http://localhost:3001

## API Endpoints

### OAuth
- `GET /auth/facebook` - Initiate Facebook OAuth
- `GET /auth/facebook/callback` - Handle Facebook OAuth callback
- `GET /auth/instagram` - Initiate Instagram OAuth
- `GET /auth/instagram/callback` - Handle Instagram OAuth callback

### Social Posting
- `POST /api/social/facebook/post` - Post to Facebook
- `POST /api/social/instagram/post` - Post to Instagram
- `GET /api/social/connections/:userId` - Get user's connections
- `POST /api/social/disconnect` - Disconnect account

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/award-coins` - Award coins after payment
- `POST /api/payments/refund` - Refund payment

### Health
- `GET /health` - Health check

## Deployment

### Railway
```bash
railway login
railway init
railway up
```

### Render
1. Connect your GitHub repo
2. Set environment variables
3. Deploy

### Heroku
```bash
heroku create shop-reneur-api
git push heroku main
```

## Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Update Facebook app redirect URIs
- [ ] Switch to Stripe live keys (`sk_live_...`)
- [ ] Add firebase-admin-key.json
- [ ] Test all OAuth flows
- [ ] Test payment processing

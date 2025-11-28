# Merchant Coins Deployment Guide

## Part 1: Database Setup

### Step 1: Apply Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gjbrjysuqdvvqlxklvos
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `merchant-coins-complete.sql` (in this directory)
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify Tables Created

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'projects', 
    'donations', 
    'merchant_coins', 
    'bids',
    'fiat_accounts',
    'fiat_transactions',
    'crypto_wallets',
    'crypto_balances'
)
ORDER BY table_name;
```

You should see all 8 tables listed.

### Step 3: Add Sample Data (Optional)

To test the merchant coins feature, add some sample projects:

```sql
-- Insert sample crowdfunding projects
INSERT INTO projects (name, slug, tagline, description, funding_goal, status, payment_cashtag, payment_paypal_url, redemption_policy, image_url)
VALUES 
    ('Seasonal Greetings', 'seasonal-greetings', 'Holiday Pop-Up Shop', 'A festive holiday experience with gifts, decorations, and seasonal treats', 2000.00, 'funding', '$SeasonalGreetingsDayton', 'https://paypal.me/seasonaldayton', 'Max 50% of total invoice', '🎄'),
    ('Gemstone Trails', 'gemstone-trails', 'Guided Nature Tours', 'Discover hidden gems in nature with expert-led hiking experiences', 1500.00, 'funding', '$GemstoneTrailsDayton', 'https://paypal.me/gemstonetrails', '1 Token per visit', '💎'),
    ('Picnic Perfect', 'picnic-perfect', 'Luxury Pop-Up Events', 'Premium picnic experiences with gourmet food and beautiful setups', 2000.00, 'funding', '$PicnicPerfectDayton', 'https://paypal.me/picnicdayton', 'Max 25% of total bill', '🧺'),
    ('Dayton Micro-Farms', 'dayton-micro-farms', 'Superfoods in the City', 'Indoor vertical microgreens farm delivering fresh produce', 2200.00, 'funding', '$DaytonMicroGreens', 'https://paypal.me/daytonmicro', 'Redeemable for produce', '🌱');
```

## Part 2: Deploy Quantum Wallet

### Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)

### Step 1: Navigate to Wallet Directory

```bash
cd c:\Users\heath\Downloads\CDI-Smart-Hub\apps\cdi-monorepo\packages\quantum-wallet
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Application

```bash
npm run build
```

### Step 4: Deploy to Firebase

```bash
npm run deploy
```

This will deploy to: **wallet.constructivedesignsinc.org**

### Step 5: Verify Deployment

1. Visit https://wallet.constructivedesignsinc.org
2. Navigate to the "Merchant Coins" tab
3. You should see:
   - Demo mode with mock data (if not logged in)
   - Real data from Supabase (if logged in)
   - "Fund Projects" tab showing active crowdfunding campaigns

## Part 3: Testing the Feature

### Test as Guest (Demo Mode)
1. Visit the wallet without logging in
2. Click "Merchant Coins" tab
3. You should see 2 mock coins (Seasonal Greetings, Gemstone Trails)
4. Switch to "Fund Projects" tab to see 2 mock campaigns

### Test as Authenticated User
1. Sign up or log in to the wallet
2. Navigate to "Merchant Coins" → "Fund Projects"
3. You should see the real projects from Supabase
4. To test coin issuance:
   - Manually insert a donation in Supabase:
   ```sql
   INSERT INTO donations (project_id, user_id, amount, status, payment_method)
   VALUES (
       (SELECT id FROM projects WHERE slug = 'seasonal-greetings'),
       'YOUR_USER_ID_HERE',
       100.00,
       'completed',
       'cash_app'
   );
   ```
   - The trigger will automatically create merchant coins
   - Refresh the wallet to see your new coins

## Troubleshooting

### Issue: Tables not appearing
- Verify you're connected to the correct Supabase project
- Check the SQL Editor for error messages
- Ensure RLS policies are enabled

### Issue: Deployment fails
- Check Firebase project permissions
- Verify `.firebaserc` has correct project ID
- Run `firebase login` to re-authenticate

### Issue: Data not loading in wallet
- Check browser console for errors
- Verify Supabase URL and anon key in `src/supabase.ts`
- Check RLS policies allow SELECT for authenticated users

## Next Steps

1. **Set up payment webhooks** to automatically record donations
2. **Create admin panel** to manage projects and unlock coins
3. **Add redemption flow** for merchants to accept coins
4. **Implement auction system** for funded businesses

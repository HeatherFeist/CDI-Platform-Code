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

### Step 3: Add Initial 4 Business Projects

Load the 4 initial turnkey business ideas with complete business plans:

```bash
# Navigate to SQL Editor in Supabase Dashboard
# Copy contents of initial-business-projects.sql
# Execute the script
```

**The 4 Initial Projects:**

1. **🎄 Seasonal Greetings** - Holiday Pop-Up Shop
   - Goal: $2,000 | Equipment, inventory, POS system
   - Timeline: 60 days fundraising
   
2. **💎 Gemstone Trails** - Guided Nature Tours
   - Goal: $1,500 | Hiking equipment, insurance, permits
   - Timeline: 45 days fundraising
   
3. **🧺 Picnic Perfect** - Luxury Pop-Up Events
   - Goal: $2,000 | Picnic sets, decor, transport
   - Timeline: 60 days fundraising
   
4. **🌱 Dayton Micro-Farms** - Indoor Microgreens Farm
   - Goal: $2,200 | Vertical grow systems, seeds, licenses
   - Timeline: 90 days fundraising

**Each project includes:**
- Complete equipment checklist with costs
- Funding breakdown (where money goes)
- 5-year business plan framework
- EIN registration setup
- PayPal donation integration
- Merchant coin configuration (1:1 ratio)
- Tier system (Bronze/Silver/Gold/Platinum)

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

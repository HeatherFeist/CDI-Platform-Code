# Merchant Coin Integration Workflow

## 🔗 Overview

This document explains how Shop'reneur, Image Editor, and Quantum Wallet work together to create a seamless merchant coin experience for your brand.

## 📱 Three-App Ecosystem

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Shop'reneur   │ ───→ │  Image Editor   │ ───→ │ Quantum Wallet  │
│                 │      │                 │      │                 │
│ Configure Coins │      │ Design Logo     │      │ View & Manage   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## 🎯 User Journey

### Step 1: Configure Merchant Coins (Shop'reneur)
**Location:** Admin Panel → Merchant Coins Tab

1. **Enable Merchant Coins** for your store
2. **Set Coin Details:**
   - Coin Name (e.g., "Coffee Coins")
   - Coin Symbol (e.g., "COFFEE")
   - Brand Color
   - Earn Rate (coins per $1 spent)
   - Redemption Rate (how many coins = $1)
   - Minimum Redemption Amount
   
3. **Choose Business Type:**
   - Marketplace Seller
   - Physical Storefront
   - Service Provider
   - Crowdfunding Project

4. **Set Business Status:**
   - Active (accepting orders)
   - Coming Soon (building business)
   - Funding (raising capital)

### Step 2: Design Your Coin Logo (Image Editor)
**How to Access:** Click "Open Image Editor" button in Merchant Coin Configurator

**The Image Editor will open in a new tab** where you can:

1. **Upload Your Design:**
   - Company logo
   - Product photo
   - Brand artwork

2. **AI-Powered Editing:**
   - Remove backgrounds
   - Add text overlays
   - Apply filters
   - Generate designs from scratch using AI

3. **Save to Supabase Storage:**
   - Designs are automatically saved to your account
   - Image URL is generated
   - You can access it later from the wallet

### Step 3: View & Store Coins (Quantum Wallet)
**How to Access:** Click "Open Wallet" button in Merchant Coin Configurator

**The Quantum Wallet will show:**

1. **Your Merchant Coin Card:**
   - Coin name and symbol
   - Your custom logo (from Image Editor)
   - Current balance
   - USD value
   - Redemption rules

2. **Dual View System:**
   - **"My Wallet" Tab:** View all coins you've earned
   - **"Fund Projects" Tab:** Browse businesses to support

3. **Coin Management:**
   - Redeem at store
   - View transaction history
   - Track tier progression (Bronze → Silver → Gold → Platinum)

## 🔧 Technical Integration

### Data Flow

```typescript
// 1. Configure in Shop'reneur
interface MerchantCoinConfig {
  enabled: boolean;
  coinName: string;        // "Coffee Coins"
  coinSymbol: string;      // "COFFEE"
  brandColor: string;      // "#4A2E1B"
  logoUrl?: string;        // Set after designing in Image Editor
  earnRate: number;        // 10 (10 coins per $1)
  redemptionRate: number;  // 100 (100 coins = $1)
  minimumRedemption: number; // 50 coins minimum
  businessType: string;
  businessStatus: string;
}

// 2. Logo URL from Image Editor
// When user saves design in Image Editor, it uploads to Supabase Storage
// Returns: https://gjbrjysuqdvvqlxklvos.supabase.co/storage/v1/object/public/designs/merchant-logos/your-logo.png

// 3. Wallet displays full coin data
interface MerchantCoin {
  merchantName: string;
  symbol: string;
  balance: number;
  valueUsd: number;
  logoUrl: string;        // From Image Editor
  redemptionRule: string; // From Shop'reneur config
  status: 'active' | 'locked' | 'pending';
}
```

### API Endpoints

#### Shop'reneur → Wallet Data Sync

```typescript
// Save merchant coin config to Supabase
import { configureMerchantCoins } from 'quantum-wallet/services/merchantCoinService';

const result = await configureMerchantCoins({
  sellerId: currentUser.id,
  coinName: 'Coffee Coins',
  coinSymbol: 'COFFEE',
  brandColor: '#4A2E1B',
  logoUrl: 'https://...',  // From Image Editor
  businessType: 'physical_storefront',
  earnRate: 10,
  redemptionRate: 100,
  minRedemption: 50
});
```

#### Award Coins to Customers

```typescript
// When customer makes a purchase
import { awardCoins } from 'quantum-wallet/services/merchantCoinService';

await awardCoins({
  userId: customer.id,
  merchantConfigId: yourConfigId,
  amount: 50,  // 50 coins
  type: 'earned',
  description: 'Purchase reward',
  orderId: order.id
});
```

#### Redeem Coins at Checkout

```typescript
// When customer wants to use coins
import { redeemCoins } from 'quantum-wallet/services/merchantCoinService';

await redeemCoins({
  userId: customer.id,
  merchantConfigId: yourConfigId,
  amount: 100,  // Redeem 100 coins
  orderId: order.id,
  description: 'Redeemed at checkout'
});
```

## 🎨 UI Integration Points

### In Shop'reneur Admin Panel

```tsx
// components/AdminPanel.tsx (already integrated)
<div className="flex gap-4 mb-6">
  <button onClick={() => setActiveAdminTab('merchant-coins')}>
    Merchant Coins
  </button>
</div>

{activeAdminTab === 'merchant-coins' && (
  <MerchantCoinConfigurator
    config={shopSettings.merchantCoinConfig}
    onChange={(config) => setShopSettings({ 
      ...shopSettings, 
      merchantCoinConfig: config 
    })}
    onSave={handleSaveSettings}
  />
)}
```

### Cross-App Navigation

```tsx
// Open Image Editor
<button onClick={() => window.open('/image-editor', '_blank')}>
  🎨 Open Image Editor
</button>

// Open Wallet
<button onClick={() => window.open('/wallet', '_blank')}>
  💰 Open Wallet
</button>
```

## 📊 Database Schema (Supabase)

### merchant_coins_config Table
Stores configuration for each merchant's coin system

```sql
CREATE TABLE merchant_coins_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  brand_color TEXT DEFAULT '#6366f1',
  logo_url TEXT,
  business_name TEXT,
  business_type TEXT DEFAULT 'marketplace_seller',
  business_status TEXT DEFAULT 'active',
  earn_rate NUMERIC DEFAULT 1.0,
  redemption_rate NUMERIC DEFAULT 0.01,
  min_redemption INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### merchant_coins_balances Table
Tracks each customer's coin balance per merchant

```sql
CREATE TABLE merchant_coins_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holder_id UUID REFERENCES auth.users(id),
  merchant_config_id UUID REFERENCES merchant_coins_config(id),
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  total_expired NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  current_tier TEXT DEFAULT 'bronze',
  lifetime_purchases INTEGER DEFAULT 0,
  lifetime_spent_usd NUMERIC DEFAULT 0,
  last_earned_at TIMESTAMP,
  last_spent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### merchant_coins_transactions Table
Records every coin transaction

```sql
CREATE TABLE merchant_coins_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance_id UUID REFERENCES merchant_coins_balances(id),
  holder_id UUID REFERENCES auth.users(id),
  merchant_config_id UUID REFERENCES merchant_coins_config(id),
  type TEXT CHECK (type IN ('earned', 'spent', 'expired', 'bonus', 'refund', 'donation_reward', 'crowdfund')),
  amount NUMERIC NOT NULL,
  order_id TEXT,
  donation_id TEXT,
  description TEXT,
  balance_before NUMERIC,
  balance_after NUMERIC,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment Checklist

### Prerequisites
- [ ] Supabase project set up
- [ ] Firebase project configured (for Shop'reneur)
- [ ] All three apps deployed to same domain or CORS enabled

### Configuration
1. **Environment Variables:**
   ```env
   # Shop'reneur
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   
   # Image Editor & Wallet
   VITE_SUPABASE_URL=https://gjbrjysuqdvvqlxklvos.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

2. **Database Setup:**
   ```bash
   # Run SQL migrations
   cd /workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/quantum-wallet
   # Execute schema.sql in Supabase SQL Editor
   ```

3. **Storage Buckets:**
   - `listing-images` (Shop'reneur marketplace images)
   - `designs` (Image Editor logos/graphics)

### Testing the Flow
1. Open Shop'reneur → Admin Panel → Merchant Coins
2. Configure coin settings
3. Click "Open Image Editor" → Design logo → Save
4. Copy logo URL back to Shop'reneur
5. Save merchant coin config
6. Click "Open Wallet" → Verify coin appears

## 💡 Best Practices

### For Merchants
- **Set Attractive Earn Rates:** 5-10 coins per $1 encourages repeat purchases
- **Clear Redemption Rules:** "Max 50% of order" prevents abuse
- **Eye-Catching Logos:** Use Image Editor to create professional designs
- **Promote Your Coins:** Tell customers about coin rewards at checkout

### For Developers
- **Sync Data Regularly:** Update wallet when configs change
- **Handle Edge Cases:** Check for null logoUrl, expired coins
- **Transaction Logging:** Always record coin movements
- **Security:** Validate all coin operations server-side

## 🔐 Security Considerations

### Row Level Security (RLS)
All Supabase tables have RLS policies:

```sql
-- Users can only read their own balances
CREATE POLICY "Users can read own balances" ON merchant_coins_balances
  FOR SELECT USING (holder_id = auth.uid());

-- Only merchants can update their config
CREATE POLICY "Merchants can update config" ON merchant_coins_config
  FOR UPDATE USING (seller_id = auth.uid());
```

### Validation
- Prevent negative balances
- Enforce minimum redemption amounts
- Verify user owns coins before spending
- Check merchant is active before awarding coins

## 📱 Mobile Considerations

All three apps are mobile-responsive:
- Shop'reneur: Mobile-first design with touch-friendly buttons
- Image Editor: Touch drawing for logo creation
- Wallet: Swipeable coin cards, mobile-optimized layout

## 🎉 Success Metrics

Track these KPIs:
- **Coin Issuance Rate:** Coins awarded per day
- **Redemption Rate:** % of coins redeemed vs. earned
- **Repeat Customers:** Users with multiple coin transactions
- **Average Balance:** Total coins held by customers
- **Tier Progression:** Bronze → Platinum upgrades

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure Supabase tables exist
4. Test with demo/mock data first

For help:
- [Image Editor Documentation](/apps/cdi-monorepo/packages/image-editor/README.md)
- [Quantum Wallet Documentation](/apps/cdi-monorepo/packages/quantum-wallet/README.md)
- [Shop'reneur Documentation](./README.md)

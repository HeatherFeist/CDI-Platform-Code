# 🔗 Merchant Coin Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CDI Platform Ecosystem                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
        │  Shop'reneur    │ │Image Editor │ │Quantum Wallet│
        │                 │ │             │ │              │
        │ - Product Mgmt  │ │ - Logo      │ │ - Balance    │
        │ - Coin Config   │ │   Design    │ │   Tracking   │
        │ - Admin Panel   │ │ - AI Tools  │ │ - Redemption │
        │                 │ │ - Storage   │ │ - Tiers      │
        └────────┬────────┘ └──────┬──────┘ └──────┬───────┘
                 │                 │                │
                 │    Navigation   │                │
                 │  ┌──────────────┼────────────────┤
                 │  │              │                │
                 ▼  ▼              ▼                ▼
        ┌─────────────────────────────────────────────────┐
        │           Shared Data Layer                      │
        │                                                  │
        │  Firebase (Shop'reneur)    Supabase (Wallet)    │
        │  - Products                - merchant_coins      │
        │  - Settings                - balances            │
        │  - Messages                - transactions        │
        │                            - storage/designs     │
        └──────────────────────────────────────────────────┘
```

## Data Flow: Creating a Merchant Coin

```
Step 1: Configure Coin
┌────────────────┐
│  Shop'reneur   │
│  Admin Panel   │
│                │
│ 1. Enable      │
│ 2. Set Name    │
│ 3. Set Rates   │
│ 4. Pick Color  │
└───────┬────────┘
        │
        │ Click "Open Image Editor"
        ▼
┌────────────────┐
│  Image Editor  │
│   (New Tab)    │
│                │
│ 1. Upload      │
│ 2. Edit/AI     │
│ 3. Save        │
│ 4. Get URL     │
└───────┬────────┘
        │
        │ Copy Logo URL
        ▼
┌────────────────┐
│  Shop'reneur   │
│                │
│ 1. Paste URL   │
│ 2. Save Config │
└───────┬────────┘
        │
        │ Click "Open Wallet"
        ▼
┌────────────────┐
│ Quantum Wallet │
│   (New Tab)    │
│                │
│ View Coin:     │
│ - Logo ✓       │
│ - Balance      │
│ - Rules        │
└────────────────┘
```

## Component Architecture

```
Shop'reneur App
├── App.tsx
│   └── Renders main layout
│
├── components/
│   ├── AdminPanel.tsx ──────────────┐
│   │   │                            │
│   │   ├── Tab Navigation           │
│   │   │   ├── Inventory            │
│   │   │   ├── Finance              │
│   │   │   ├── Brand                │
│   │   │   └── Merchant Coins ◄─────┼─── NEW!
│   │   │                            │
│   │   └── Tab Content              │
│   │                                │
│   └── MerchantCoinConfigurator.tsx ◄┘
│       │
│       ├── Configuration Form
│       │   ├── Enable Toggle
│       │   ├── Name Input
│       │   ├── Symbol Input
│       │   ├── Color Picker
│       │   ├── Earn Rate Slider
│       │   ├── Redemption Rate Slider
│       │   └── Minimum Input
│       │
│       ├── Integration Links
│       │   ├── Open Image Editor ──────┐
│       │   └── Open Wallet ────────────┼──┐
│       │                               │  │
│       └── Live Preview                │  │
│                                       │  │
├── types.ts                            │  │
│   └── MerchantCoinConfig ◄────────────┘  │
│                                          │
└── Opens External Apps ◄──────────────────┘
    ├── /image-editor (design logos)
    └── /wallet (manage balances)
```

## State Management

```typescript
// Admin Panel State
const [activeAdminTab, setActiveAdminTab] = useState<
  'inventory' | 'brand' | 'finance' | 'merchant-coins'
>('inventory');

const [shopSettings, setShopSettings] = useState<ShopSettings>({
  storeName: "My Shop",
  primaryColor: "#000",
  // ... other settings
  merchantCoinConfig: {        // ◄── NEW!
    enabled: false,
    coinName: "",
    coinSymbol: "",
    brandColor: "#6366f1",
    logoUrl: "",
    earnRate: 10,
    redemptionRate: 100,
    minimumRedemption: 50,
    businessType: "marketplace_seller",
    businessStatus: "active"
  }
});

// MerchantCoinConfigurator Props
interface MerchantCoinConfiguratorProps {
  config?: MerchantCoinConfig;
  onChange: (config: MerchantCoinConfig) => void;
  onSave: () => void;
}
```

## API Integration Points

```
┌─────────────────────────────────────────────────────┐
│ Shop'reneur (Firebase)                              │
│                                                     │
│ • Save Configuration                                │
│   shopSettings.merchantCoinConfig → Firestore      │
│                                                     │
│ • Read Configuration                                │
│   Firestore → shopSettings.merchantCoinConfig      │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ User clicks navigation
                   │
        ┌──────────┴───────────┐
        │                      │
        ▼                      ▼
┌───────────────┐    ┌─────────────────┐
│ Image Editor  │    │ Quantum Wallet  │
│ (Supabase)    │    │ (Supabase)      │
│               │    │                 │
│ • Upload Logo │    │ • Read Config   │
│ • Store in    │    │   from Supabase │
│   storage/    │    │                 │
│   designs     │    │ • Display Coin  │
│               │    │   with Logo     │
│ • Return URL  │    │                 │
│               │    │ • Track Balance │
└───────────────┘    └─────────────────┘
```

## Database Schema Relationships

```sql
-- Shop'reneur (Firebase Firestore)
settings {
  storeName: string,
  primaryColor: string,
  // ...
  merchantCoinConfig: {
    enabled: boolean,
    coinName: string,
    coinSymbol: string,
    // ...
  }
}

-- Quantum Wallet (Supabase PostgreSQL)
merchant_coins_config {
  id: UUID PRIMARY KEY,
  seller_id: UUID → auth.users(id),
  coin_name: TEXT,
  coin_symbol: TEXT,
  logo_url: TEXT,  ◄── From Image Editor
  earn_rate: NUMERIC,
  redemption_rate: NUMERIC,
  // ...
}
    │
    │ One-to-Many
    ▼
merchant_coins_balances {
  id: UUID PRIMARY KEY,
  holder_id: UUID → auth.users(id),
  merchant_config_id: UUID → merchant_coins_config(id),
  current_balance: NUMERIC,
  total_earned: NUMERIC,
  // ...
}
    │
    │ One-to-Many
    ▼
merchant_coins_transactions {
  id: UUID PRIMARY KEY,
  balance_id: UUID → merchant_coins_balances(id),
  type: TEXT (earned, spent, expired, bonus),
  amount: NUMERIC,
  // ...
}
```

## User Journey Map

```
┌──────────────────────────────────────────────────────────┐
│ MERCHANT JOURNEY                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 1. [Open Shop'reneur Admin] ─► Click "Merchant Coins"   │
│                                                          │
│ 2. [Configure Settings] ─► Set name, rates, colors      │
│                                                          │
│ 3. [Click "Image Editor"] ─► Opens in new tab           │
│    ├─ Upload logo                                        │
│    ├─ Use AI tools                                       │
│    ├─ Save design                                        │
│    └─ Copy URL                                           │
│                                                          │
│ 4. [Return to Shop'reneur] ─► Paste logo URL            │
│                                                          │
│ 5. [Click "Save"] ─► Configuration saved!               │
│                                                          │
│ 6. [Click "Wallet"] ─► View coin in wallet              │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 1. [Browse Shop'reneur] ─► Add items to cart            │
│                                                          │
│ 2. [Checkout] ─► Make purchase                          │
│                                                          │
│ 3. [Automatic] ─► Coins awarded                         │
│    └─ Based on earn rate (e.g., $10 = 100 coins)        │
│                                                          │
│ 4. [Open Wallet] ─► See new balance                     │
│    ├─ View merchant coin card                           │
│    ├─ See logo, balance, value                          │
│    └─ Check redemption rules                            │
│                                                          │
│ 5. [Return to Shop] ─► Shop again                       │
│                                                          │
│ 6. [At Checkout] ─► Use coins for discount              │
│    └─ E.g., 100 coins = $1 off                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Security Model

```
┌────────────────────────────────────────────────┐
│ Authentication & Authorization                 │
├────────────────────────────────────────────────┤
│                                                │
│ Shop'reneur (Firebase Auth)                    │
│ ├─ Merchant login                              │
│ ├─ Admin panel access                          │
│ └─ Settings CRUD                               │
│                                                │
│ Image Editor & Wallet (Supabase Auth)          │
│ ├─ User login                                  │
│ ├─ Row Level Security (RLS)                    │
│ │  ├─ Users can read own balances              │
│ │  ├─ Merchants can update own configs         │
│ │  └─ Public read for coin info                │
│ └─ Storage policies                            │
│    ├─ Users can upload to /designs             │
│    └─ Public read for coin logos               │
│                                                │
└────────────────────────────────────────────────┘
```

## Deployment Architecture

```
Production Environment

┌─────────────────────────────────────────────┐
│          CDI Platform Domain                │
│       https://cdi-platform.com              │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│/shopreneur  │ │/image-editor│ │   /wallet   │
│             │ │             │ │             │
│ Vercel      │ │  Vercel     │ │   Vercel    │
│ or Netlify  │ │  or Netlify │ │   or Netlify│
└─────────────┘ └─────────────┘ └─────────────┘
        │               │               │
        │               │               │
        ▼               ▼               ▼
┌─────────────┐ ┌──────────────────────────┐
│  Firebase   │ │       Supabase           │
│             │ │                          │
│ • Firestore │ │ • PostgreSQL Database    │
│ • Auth      │ │ • Storage Buckets        │
│             │ │ • Row Level Security     │
└─────────────┘ └──────────────────────────┘
```

## Technology Stack

```
┌──────────────────────────────────────────┐
│ Frontend Technologies                    │
├──────────────────────────────────────────┤
│ • React 19                               │
│ • TypeScript                             │
│ • Vite 6                                 │
│ • Tailwind CSS (inline)                  │
│ • Lucide React (icons)                   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Backend Services                         │
├──────────────────────────────────────────┤
│ • Firebase Firestore (Shop'reneur)       │
│ • Supabase PostgreSQL (Wallet)           │
│ • Supabase Storage (Image Editor)        │
│ • Google Gemini AI (optional)            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Deployment Platforms                     │
├──────────────────────────────────────────┤
│ • Vercel (recommended)                   │
│ • Netlify (alternative)                  │
│ • GitHub Pages (static)                  │
└──────────────────────────────────────────┘
```

---

**Legend:**
- `─►` = User action
- `→` = Data flow
- `◄─` = Dependency
- `├─` = Child item
- `└─` = Last child item

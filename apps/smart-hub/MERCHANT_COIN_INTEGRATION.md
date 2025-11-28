# Merchant Coin Integration Guide
## Unified Marketplace with Individual Merchant Coins

---

## 🎯 Core Concept

The CDI Marketplace operates as **one unified storefront** where all merchants sell together, but each merchant has their own **unique coin** that serves dual purposes:

1. **Currency**: Payment method for that merchant's products (with benefits)
2. **Discovery Tool**: Direct link to find that merchant's storefront and products

**Think of it like**: A shopping mall where each store has its own gift card, but the gift card also acts as a map to find that specific store and see all their products.

---

## 🏗️ Architecture Overview

### The Unified Marketplace Structure

```
CDI MARKETPLACE (One Platform)
│
├── MERCHANT A
│   ├── Merchant Coin A ($MERCH_A)
│   ├── Storefront Profile
│   └── Products (1-1000+)
│
├── MERCHANT B
│   ├── Merchant Coin B ($MERCH_B)
│   ├── Storefront Profile
│   └── Products (1-1000+)
│
├── MERCHANT C
│   ├── Merchant Coin C ($MERCH_C)
│   ├── Storefront Profile
│   └── Products (1-1000+)
│
└── ... (100s of merchants)
```

### How It Works for Buyers

**Scenario 1: Product-First Discovery**
1. Buyer searches "organic coffee" on marketplace
2. Results show products from multiple merchants
3. Each product displays: Price in USD + Merchant's coin option
4. Buyer clicks merchant coin symbol → Taken to that merchant's storefront
5. Buyer sees ALL products from that merchant
6. Buyer can purchase with USD or merchant coins (with discount)

**Scenario 2: Coin-First Discovery**
1. Buyer browses "Merchant Coins Directory"
2. Sees list of all merchant coins with descriptions
3. Clicks on "COFFEE_COIN" → Taken to Morning Brew Cafe storefront
4. Sees all coffee products, subscriptions, merchandise
5. Can buy coins for 10% discount on all purchases
6. Becomes part of that merchant's loyal customer base

**Scenario 3: Wallet-Driven Shopping**
1. Buyer has coins from previous purchases in wallet
2. Opens wallet, sees: "You have 25 COFFEE_COIN"
3. Clicks "Spend at Morning Brew Cafe"
4. Taken directly to merchant's storefront
5. Shops with existing coins
6. Earns loyalty rewards for repeat purchases

---

## 🪙 Merchant Coin Fundamentals

### What is a Merchant Coin?

A **merchant coin** is a digital token unique to each business that:
- Represents value at that specific merchant (typically 1 coin = $1 USD)
- Provides benefits (discounts, early access, loyalty rewards)
- Links directly to the merchant's storefront in the unified marketplace
- Can be traded, gifted, or saved for future purchases
- Builds community around that specific business

### Why Merchant Coins?

**For Merchants:**
- ✅ Lower transaction fees (0.5% vs 2.5-3.5%)
- ✅ Customer loyalty and retention
- ✅ Upfront capital (when customers buy coins)
- ✅ Unique marketing differentiator
- ✅ Direct link to storefront (discovery tool)
- ✅ Community building
- ✅ Cross-promotion with other CDI merchants

**For Customers:**
- ✅ Discounts (typically 10% off)
- ✅ Exclusive perks and early access
- ✅ Support local/small businesses
- ✅ Easy discovery of merchant products
- ✅ Loyalty rewards
- ✅ Gift-able and tradeable
- ✅ One wallet for all CDI merchants

---

## 🔗 Coin-to-Storefront Linking System

### Database Relationships

```sql
-- Core linking: One merchant = One coin = One storefront
merchant_coins.merchant_id → merchants.id (UNIQUE)
products.merchant_id → merchants.id
transactions.merchant_coin_id → merchant_coins.id

-- Discovery paths
1. Coin Symbol → Merchant Storefront
2. Product → Merchant Coin → Merchant Storefront  
3. Wallet → Coin Balance → Merchant Storefront
4. Search → Coin/Merchant → Storefront
```

### URL Structure

**Merchant Storefront**
```
https://marketplace.cdi.com/merchants/morning-brew-cafe
https://marketplace.cdi.com/merchants/fresh-bread-bakery
https://marketplace.cdi.com/merchants/green-thumb-nursery
```

**Merchant Coin Page**
```
https://marketplace.cdi.com/coins/COFFEE_COIN
https://marketplace.cdi.com/coins/BAKERY_COIN
https://marketplace.cdi.com/coins/GARDEN_COIN
```

**Automatic Redirects**
- Coin page → Merchant storefront (primary CTA)
- Product page → Merchant storefront (via merchant name link)
- Wallet coin → Merchant storefront (via "Spend" button)

### Visual Linking Elements

**Coin Badge on Products**
```
┌─────────────────────────────────┐
│  [Product Image]                │
│                                 │
│  Artisan Sourdough Bread        │
│  $6.50 or 6.5 🪙 BAKERY_COIN   │
│                                 │
│  By: Fresh Bread Bakery         │
│  [🪙 View Storefront]           │
└─────────────────────────────────┘
```

**Coin Symbol as Clickable Link**
- Everywhere a coin symbol appears → Clickable
- Hover shows: "Visit [Merchant Name] Storefront"
- Click goes to: Merchant storefront page
- Consistent across entire marketplace

**Merchant Header on Storefront**
```
┌─────────────────────────────────────────────┐
│  🪙 COFFEE_COIN | Morning Brew Cafe          │
│  [Coin Icon] $0.98 per coin                 │
│                                             │
│  💡 Buy coins now, save 10% on all orders!  │
│  [BUY COFFEE_COIN] [MY WALLET]              │
└─────────────────────────────────────────────┘
```

---

## 🛒 Shopping Experience Flow

### Flow 1: Traditional Shopping (USD)

```
1. Browse marketplace
2. Find product
3. Add to cart
4. Checkout with credit card
5. Receive product

✨ ENHANCEMENT: At checkout, show:
"Save 10% by paying with MERCHANT_COIN!"
[Buy Coins Now] [Learn More]
```

### Flow 2: Coin-Enhanced Shopping

```
1. Browse marketplace
2. Find product from "Morning Brew Cafe"
3. See: $15.00 or 13.5 🪙 COFFEE_COIN (10% off!)
4. Click "🪙 COFFEE_COIN" to learn more
5. Taken to Morning Brew Cafe storefront
6. See ALL products from this merchant
7. Buy COFFEE_COIN (bundle: 100 coins for $90)
8. Shop entire storefront with 10% discount
9. Become loyal customer, return often
```

### Flow 3: Wallet-Driven Shopping

```
1. Open "My Coin Wallet"
2. See: "You have 25 COFFEE_COIN"
3. Click: "Spend at Morning Brew Cafe"
4. Taken directly to merchant storefront
5. Browse products with coin balance visible
6. Add items to cart
7. Checkout shows: "Pay with COFFEE_COIN"
8. Transaction complete, coins deducted
```

---

## 🔍 Discovery & Search Features

### Merchant Coin Directory

**Main Directory Page**
```
┌─────────────────────────────────────────────┐
│  🪙 DISCOVER MERCHANT COINS                 │
├─────────────────────────────────────────────┤
│  Search: [_________________] 🔍             │
│                                             │
│  Categories:                                │
│  [All] [Food & Beverage] [Retail] [Services]│
│  [Health] [Home] [Technology] [More...]     │
│                                             │
│  Sort by:                                   │
│  [Trending ▼] [Newest] [Most Popular]       │
│  [Highest Discount] [Market Cap]            │
├─────────────────────────────────────────────┤
│  FEATURED COINS                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🪙 COFFEE_COIN                       │   │
│  │ Morning Brew Cafe                    │   │
│  │ $0.98 | ↑5% today | 234 holders      │   │
│  │                                      │   │
│  │ ☕ Premium coffee & pastries          │   │
│  │ 💰 10% discount with coins            │   │
│  │ ⭐ 4.8 stars (127 reviews)            │   │
│  │                                      │   │
│  │ [VIEW STOREFRONT] [BUY COINS]        │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🪙 BAKERY_COIN                       │   │
│  │ Fresh Bread Bakery                   │   │
│  │ $1.05 | ↑8% today | 156 holders      │   │
│  │                                      │   │
│  │ 🍞 Artisan breads & pastries          │   │
│  │ 💰 15% discount with coins            │   │
│  │ ⭐ 4.9 stars (89 reviews)             │   │
│  │                                      │   │
│  │ [VIEW STOREFRONT] [BUY COINS]        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Smart Search Integration

**Search Query: "coffee"**
```
┌─────────────────────────────────────────────┐
│  Search Results for "coffee"                │
├─────────────────────────────────────────────┤
│  MERCHANTS (2)                              │
│  • Morning Brew Cafe 🪙 COFFEE_COIN         │
│  • Java Junction 🪙 JAVA_COIN               │
│                                             │
│  PRODUCTS (47)                              │
│  • Ethiopian Single Origin - Morning Brew   │
│    $15.00 or 13.5 🪙 COFFEE_COIN           │
│                                             │
│  • Cold Brew Concentrate - Java Junction   │
│    $12.00 or 10.8 🪙 JAVA_COIN             │
│                                             │
│  COINS (2)                                  │
│  • 🪙 COFFEE_COIN - Morning Brew Cafe       │
│  • 🪙 JAVA_COIN - Java Junction             │
└─────────────────────────────────────────────┘
```

**Search Query: "BAKERY_COIN"**
```
Direct redirect to: Fresh Bread Bakery Storefront
```

### Category Browsing

**Category: Food & Beverage**
```
┌─────────────────────────────────────────────┐
│  Food & Beverage Merchants                  │
├─────────────────────────────────────────────┤
│  Showing 24 merchants                       │
│                                             │
│  Grid View:                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ [Logo]   │ │ [Logo]   │ │ [Logo]   │    │
│  │ Morning  │ │ Fresh    │ │ Java     │    │
│  │ Brew     │ │ Bread    │ │ Junction │    │
│  │ Cafe     │ │ Bakery   │ │          │    │
│  │          │ │          │ │          │    │
│  │ 🪙 COFFEE│ │ 🪙 BAKERY│ │ 🪙 JAVA  │    │
│  │ 23 items │ │ 45 items │ │ 18 items │    │
│  │ ⭐ 4.8   │ │ ⭐ 4.9   │ │ ⭐ 4.7   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  Each card is clickable → Merchant storefront│
└─────────────────────────────────────────────┘
```

---

## 💳 Wallet Integration

### Unified Coin Wallet

**All merchant coins in one place:**
```
┌─────────────────────────────────────────────┐
│  MY MERCHANT COIN WALLET                    │
├─────────────────────────────────────────────┤
│  Total Value: $247.50                       │
│  Coins Held: 5 different merchants          │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ 🪙 COFFEE_COIN                         │ │
│  │ Balance: 25.5 coins ($24.99)           │ │
│  │ Morning Brew Cafe                      │ │
│  │                                        │ │
│  │ [SPEND NOW] [BUY MORE] [SEND/GIFT]     │ │
│  │ [VIEW STOREFRONT] [TRANSACTION HISTORY]│ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ 🪙 BAKERY_COIN                         │ │
│  │ Balance: 12.0 coins ($12.60)           │ │
│  │ Fresh Bread Bakery                     │ │
│  │                                        │ │
│  │ [SPEND NOW] [BUY MORE] [SEND/GIFT]     │ │
│  │ [VIEW STOREFRONT] [TRANSACTION HISTORY]│ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ 🪙 GARDEN_COIN                         │ │
│  │ Balance: 200.0 coins ($224.00)         │ │
│  │ Green Thumb Nursery                    │ │
│  │                                        │ │
│  │ [SPEND NOW] [BUY MORE] [SEND/GIFT]     │ │
│  │ [VIEW STOREFRONT] [TRANSACTION HISTORY]│ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Key Features:**
- **[SPEND NOW]** → Takes user to merchant storefront with wallet balance visible
- **[VIEW STOREFRONT]** → Direct link to merchant's products
- **Transaction History** → Shows all purchases from that merchant
- **Quick Actions** → Buy more coins, send to friends, check balance

### Wallet-to-Storefront Flow

```
User clicks "SPEND NOW" on COFFEE_COIN
        ↓
Redirected to Morning Brew Cafe storefront
        ↓
Header shows: "Your COFFEE_COIN balance: 25.5"
        ↓
Products show both USD and coin prices
        ↓
"Add to Cart" shows: "Pay with COFFEE_COIN"
        ↓
Checkout automatically uses coins
        ↓
Remaining balance updated in wallet
```

---

## 🎨 Storefront Design & Features

### Basic Storefront (All Merchants)

**Header Section**
```
┌─────────────────────────────────────────────┐
│  [MERCHANT LOGO]                            │
│  Morning Brew Cafe                          │
│  ⭐⭐⭐⭐⭐ 4.8 (127 reviews)                  │
│                                             │
│  🪙 COFFEE_COIN | $0.98 per coin            │
│  💰 Save 10% on all orders with coins!      │
│                                             │
│  [BUY COINS] [FOLLOW] [CONTACT]             │
└─────────────────────────────────────────────┘
```

**About Section**
```
┌─────────────────────────────────────────────┐
│  ABOUT MORNING BREW CAFE                    │
├─────────────────────────────────────────────┤
│  We're a family-owned coffee roaster        │
│  specializing in single-origin beans from   │
│  sustainable farms around the world.        │
│                                             │
│  📍 Portland, OR                            │
│  🏷️ Coffee • Organic • Fair Trade          │
│  🌐 morningbrewcafe.com                     │
│  📞 (555) 123-4567                          │
│  📧 hello@morningbrewcafe.com               │
└─────────────────────────────────────────────┘
```

**Coin Benefits Section**
```
┌─────────────────────────────────────────────┐
│  🪙 COFFEE_COIN BENEFITS                    │
├─────────────────────────────────────────────┤
│  ✓ 10% discount on all products             │
│  ✓ Free shipping on orders over 50 coins    │
│  ✓ Early access to new roasts               │
│  ✓ Exclusive monthly subscriber box         │
│  ✓ Birthday bonus: 5 free coins             │
│  ✓ Refer a friend: 10 coins each            │
│                                             │
│  Current holders: 234 customers             │
│  Total coins in circulation: 12,450         │
│                                             │
│  [BUY COFFEE_COIN NOW]                      │
└─────────────────────────────────────────────┘
```

**Products Grid**
```
┌─────────────────────────────────────────────┐
│  OUR PRODUCTS (23)                          │
├─────────────────────────────────────────────┤
│  Filter: [All ▼] [Coffee Beans] [Merch]    │
│  Sort: [Featured ▼]                         │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ [Image]  │ │ [Image]  │ │ [Image]  │    │
│  │ Ethiopian│ │ Colombian│ │ Cold Brew│    │
│  │ Single   │ │ Medium   │ │ Concent. │    │
│  │          │ │          │ │          │    │
│  │ $15.00   │ │ $14.00   │ │ $12.00   │    │
│  │ 13.5 🪙  │ │ 12.6 🪙  │ │ 10.8 🪙  │    │
│  │          │ │          │ │          │    │
│  │ [ADD]    │ │ [ADD]    │ │ [ADD]    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

### Premium Storefront Features

**Enhanced Header** (Growth & Enterprise tiers)
```
┌─────────────────────────────────────────────┐
│  [CUSTOM BANNER VIDEO/IMAGE]                │
│                                             │
│  [MERCHANT LOGO]  Morning Brew Cafe         │
│  "Sustainably sourced, expertly roasted"    │
│                                             │
│  🪙 COFFEE_COIN                             │
│  ┌─────────────────────────────────────┐   │
│  │ Price: $0.98 | 24h: ↑5% | Vol: 1.2K │   │
│  │ [7-day price chart]                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [BUY COINS] [FOLLOW] [CONTACT] [SUBSCRIBE] │
└─────────────────────────────────────────────┘
```

**Featured Products Carousel**
```
┌─────────────────────────────────────────────┐
│  ⭐ FEATURED THIS MONTH                     │
├─────────────────────────────────────────────┤
│  ← [Product 1] [Product 2] [Product 3] →    │
│     Large images, auto-rotating             │
│     Special offers highlighted              │
└─────────────────────────────────────────────┘
```

**Customer Testimonials**
```
┌─────────────────────────────────────────────┐
│  💬 WHAT CUSTOMERS SAY                      │
├─────────────────────────────────────────────┤
│  "Best coffee I've ever had! The coin       │
│   discount makes it even better."           │
│   - Sarah M. ⭐⭐⭐⭐⭐                        │
│                                             │
│  "Love supporting local with COFFEE_COIN!"  │
│   - Mike T. ⭐⭐⭐⭐⭐                         │
└─────────────────────────────────────────────┘
```

**Social Media Integration**
```
┌─────────────────────────────────────────────┐
│  📱 FOLLOW US                               │
│  [Instagram Feed] [Twitter Feed]            │
│  Live social media posts embedded           │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Frontend Components

**CoinBadge Component**
```javascript
// Displays coin symbol with link to merchant storefront
<CoinBadge 
  coinSymbol="COFFEE_COIN"
  merchantSlug="morning-brew-cafe"
  showPrice={true}
  clickable={true}
/>

// Renders as:
// 🪙 COFFEE_COIN ($0.98) [clickable]
// onClick → navigate to /merchants/morning-brew-cafe
```

**MerchantStorefront Component**
```javascript
<MerchantStorefront 
  merchantId="uuid"
  showCoinInfo={true}
  showProducts={true}
  layout="grid" // or "list"
/>

// Fetches:
// - Merchant details
// - Merchant coin info
// - Products
// - Reviews
// - Analytics
```

**WalletCoinCard Component**
```javascript
<WalletCoinCard 
  coinId="uuid"
  balance={25.5}
  merchantSlug="morning-brew-cafe"
  showActions={true}
/>

// Shows coin balance with quick actions:
// - Spend Now (→ storefront)
// - Buy More
// - Send/Gift
// - Transaction History
```

### API Endpoints

**Get Merchant by Coin**
```javascript
GET /api/coins/:coinSymbol/merchant
// Returns merchant details for given coin symbol
// Example: /api/coins/COFFEE_COIN/merchant
// Response: { merchantId, name, slug, ... }
```

**Get Storefront Data**
```javascript
GET /api/merchants/:slug/storefront
// Returns complete storefront data
// Example: /api/merchants/morning-brew-cafe/storefront
// Response: {
//   merchant: {...},
//   coin: {...},
//   products: [...],
//   reviews: [...],
//   stats: {...}
// }
```

**Search with Coin Linking**
```javascript
GET /api/search?q=coffee&includeMerchants=true&includeCoins=true
// Returns products, merchants, and coins
// Each result includes merchant_slug for linking
// Response: {
//   products: [{ ..., merchant_slug, coin_symbol }],
//   merchants: [{ ..., slug, coin_symbol }],
//   coins: [{ ..., merchant_slug }]
// }
```

### Database Queries

**Get Merchant Storefront**
```sql
SELECT 
  m.*,
  mc.coin_symbol,
  mc.coin_name,
  mc.current_price,
  mc.discount_percentage,
  mc.benefits,
  COUNT(DISTINCT p.id) as product_count,
  AVG(r.rating) as avg_rating,
  COUNT(DISTINCT r.id) as review_count
FROM merchants m
LEFT JOIN merchant_coins mc ON m.id = mc.merchant_id
LEFT JOIN products p ON m.id = p.merchant_id
LEFT JOIN reviews r ON m.id = r.merchant_id
WHERE m.slug = 'morning-brew-cafe'
GROUP BY m.id, mc.id;
```

**Get Products for Storefront**
```sql
SELECT 
  p.*,
  mc.coin_symbol,
  mc.current_price as coin_price_base,
  (p.price_usd / mc.current_price) as price_in_coins
FROM products p
JOIN merchants m ON p.merchant_id = m.id
JOIN merchant_coins mc ON m.id = mc.merchant_id
WHERE m.slug = 'morning-brew-cafe'
ORDER BY p.featured DESC, p.created_at DESC;
```

**Track Coin-to-Storefront Navigation**
```sql
INSERT INTO storefront_views (
  merchant_id,
  viewer_id,
  source,
  coin_clicked,
  timestamp
) VALUES (
  'merchant-uuid',
  'user-uuid',
  'coin_directory', -- or 'wallet', 'product_page', 'search'
  true,
  NOW()
);
```

---

## 📊 Analytics & Insights

### Merchant Dashboard

**Coin Performance**
```
┌─────────────────────────────────────────────┐
│  🪙 COFFEE_COIN ANALYTICS                   │
├─────────────────────────────────────────────┤
│  Total Holders: 234 (+12 this week)         │
│  Coins in Circulation: 12,450               │
│  Total Transactions: 1,847                  │
│  Avg Transaction: 15.3 coins                │
│                                             │
│  Coin-to-Storefront Traffic:                │
│  • From Coin Directory: 45%                 │
│  • From Wallet: 30%                         │
│  • From Product Pages: 20%                  │
│  • From Search: 5%                          │
│                                             │
│  Conversion Rate: 23% (coin viewers → buyers)│
└─────────────────────────────────────────────┘
```

**Storefront Performance**
```
┌─────────────────────────────────────────────┐
│  📊 STOREFRONT ANALYTICS                    │
├─────────────────────────────────────────────┤
│  This Month:                                │
│  • Total Visits: 3,456                      │
│  • Unique Visitors: 2,103                   │
│  • Page Views: 12,847                       │
│  • Avg Time on Site: 4m 32s                 │
│                                             │
│  Traffic Sources:                           │
│  • Direct (coin links): 42%                 │
│  • Marketplace Search: 35%                  │
│  • Product Pages: 15%                       │
│  • External: 8%                             │
│                                             │
│  Top Products:                              │
│  1. Ethiopian Single Origin (234 views)     │
│  2. Cold Brew Concentrate (189 views)       │
│  3. Monthly Subscription (156 views)        │
└─────────────────────────────────────────────┘
```

### Platform-Wide Analytics

**Coin Ecosystem Health**
```
┌─────────────────────────────────────────────┐
│  🌐 MARKETPLACE COIN ECOSYSTEM              │
├─────────────────────────────────────────────┤
│  Total Merchants: 127                       │
│  Total Merchant Coins: 127                  │
│  Total Coin Holders: 8,934                  │
│  Total Coins in Circulation: 1.2M           │
│                                             │
│  This Month:                                │
│  • Coin Transactions: 45,678                │
│  • Transaction Volume: $523,456             │
│  • New Coin Holders: 1,234                  │
│  • Avg Coins per Holder: 5.3 merchants      │
│                                             │
│  Top Discovery Method:                      │
│  1. Coin Directory (38%)                    │
│  2. Product Pages (28%)                     │
│  3. Wallet (22%)                            │
│  4. Search (12%)                            │
└─────────────────────────────────────────────┘
```

---

## 🚀 Merchant Onboarding Process

### Step 1: Coin Creation (Week 1)

**Coin Details Form**
```
┌─────────────────────────────────────────────┐
│  CREATE YOUR MERCHANT COIN                  │
├─────────────────────────────────────────────┤
│  Coin Name:                                 │
│  [Morning Brew Cafe Coin____________]       │
│                                             │
│  Coin Symbol (3-12 chars):                  │
│  [COFFEE_COIN___] ✓ Available               │
│                                             │
│  Initial Supply:                            │
│  [10000_____] coins                         │
│                                             │
│  Discount Percentage:                       │
│  [10___]% (recommended: 5-15%)              │
│                                             │
│  Coin Benefits (check all that apply):      │
│  ☑ Discount on purchases                    │
│  ☑ Free shipping threshold                  │
│  ☑ Early access to new products             │
│  ☑ Exclusive products/services              │
│  ☑ Loyalty rewards program                  │
│  ☐ Birthday bonus                           │
│  ☐ Referral rewards                         │
│                                             │
│  [NEXT: Upload Coin Icon]                   │
└─────────────────────────────────────────────┘
```

### Step 2: Storefront Setup (Week 2)

**Storefront Builder**
```
┌─────────────────────────────────────────────┐
│  BUILD YOUR STOREFRONT                      │
├─────────────────────────────────────────────┤
│  Business Name: [Morning Brew Cafe____]     │
│  Tagline: [Sustainably sourced, expertly    │
│            roasted coffee____________]      │
│                                             │
│  Logo: [Upload] ✓ Uploaded                  │
│  Banner: [Upload] ✓ Uploaded                │
│                                             │
│  About Your Business (500 chars):           │
│  [We're a family-owned coffee roaster...]   │
│                                             │
│  Categories (select up to 3):               │
│  ☑ Food & Beverage                          │
│  ☑ Coffee & Tea                             │
│  ☐ Organic Products                         │
│                                             │
│  Location:                                  │
│  City: [Portland___] State: [OR__]          │
│                                             │
│  Contact:                                   │
│  Website: [morningbrewcafe.com_______]      │
│  Phone: [(555) 123-4567___]                 │
│  Email: [hello@morningbrewcafe.com___]      │
│                                             │
│  [PREVIEW STOREFRONT] [SAVE & CONTINUE]     │
└─────────────────────────────────────────────┘
```

### Step 3: Product Upload (Week 3)

**Bulk Product Import**
```
Option 1: CSV Upload
[Download Template] [Upload CSV]

Option 2: Manual Entry
[Add Product] (form with fields)

Option 3: Import from Existing Store
[Connect Shopify] [Connect WooCommerce] [Other]
```

**Product Form**
```
┌─────────────────────────────────────────────┐
│  ADD PRODUCT                                │
├─────────────────────────────────────────────┤
│  Product Name: [Ethiopian Single Origin__]  │
│                                             │
│  Description:                               │
│  [Rich, fruity notes with chocolate finish] │
│                                             │
│  Price (USD): [$15.00__]                    │
│  Price in Coins: [13.5 COFFEE_COIN]         │
│  (Auto-calculated with 10% discount)        │
│                                             │
│  Images: [Upload] (up to 5)                 │
│  ✓ image1.jpg ✓ image2.jpg                  │
│                                             │
│  Category: [Coffee Beans ▼]                 │
│  Tags: [Ethiopian] [Single Origin] [Light]  │
│                                             │
│  Inventory: [50__] units                    │
│  SKU: [ETH-001___]                          │
│                                             │
│  [SAVE PRODUCT] [SAVE & ADD ANOTHER]        │
└─────────────────────────────────────────────┘
```

### Step 4: Launch (Week 4)

**Pre-Launch Checklist**
```
☑ Coin created and configured
☑ Storefront profile complete
☑ At least 5 products uploaded
☑ Payment processing connected
☑ Shipping settings configured
☑ Coin benefits clearly stated
☑ Preview storefront reviewed
☐ Launch!
```

**Launch Actions**
```
1. Storefront goes live on marketplace
2. Coin listed in directory
3. Products appear in search
4. Announcement email to marketplace members
5. Social media promotion
6. Featured in "New Merchants" section (7 days)
```

---

## 💡 Best Practices

### For Merchants

**Coin Strategy**
- ✅ Offer meaningful discount (10-15% recommended)
- ✅ Provide exclusive benefits for coin holders
- ✅ Promote coin prominently on storefront
- ✅ Educate customers about coin benefits
- ✅ Run coin-exclusive promotions
- ✅ Cross-promote with other CDI merchants

**Storefront Optimization**
- ✅ High-quality product photography
- ✅ Detailed product descriptions
- ✅ Clear coin benefits section
- ✅ Customer testimonials
- ✅ Regular content updates
- ✅ Responsive customer service
- ✅ SEO-optimized content

**Customer Engagement**
- ✅ Email newsletter for coin holders
- ✅ Exclusive early access to new products
- ✅ Birthday/anniversary bonuses
- ✅ Referral rewards program
- ✅ Loyalty tiers (bronze/silver/gold)
- ✅ Community building (social media)

### For Platform

**Discovery Enhancement**
- ✅ Prominent coin directory
- ✅ Coin symbols visible everywhere
- ✅ One-click navigation to storefronts
- ✅ Smart search with coin results
- ✅ Wallet integration with "Spend" CTAs
- ✅ Featured merchant rotations

**User Education**
- ✅ "How Merchant Coins Work" tutorial
- ✅ Video walkthroughs
- ✅ FAQ section
- ✅ Success stories
- ✅ Benefits calculator
- ✅ Onboarding wizard for new users

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features

**Coin Trading**
- Secondary market for coins
- Coin-to-coin exchanges
- Price discovery mechanisms
- Trading charts and analytics

**Cross-Merchant Collaborations**
- Bundle deals (coffee + bakery coins)
- Joint promotions
- Shared loyalty programs
- Collaborative products

**Gamification**
- Coin collecting achievements
- Merchant discovery challenges
- Loyalty level badges
- Leaderboards

### Phase 3: Ecosystem Expansion

**Mobile App**
- Native iOS/Android apps
- NFC payments with coins
- Location-based merchant discovery
- Push notifications for deals

**Physical Integration**
- QR codes in stores → Storefront
- In-store coin purchases
- Hybrid online/offline experience
- Point-of-sale coin payments

**AI-Powered Features**
- Personalized merchant recommendations
- Smart coin portfolio management
- Predictive pricing
- Automated cross-promotions

---

**Document Version**: 1.0  
**Last Updated**: November 27, 2025  
**Owner**: CDI Smart Hub - Technology & Merchant Services  
**Status**: Ready for Implementation

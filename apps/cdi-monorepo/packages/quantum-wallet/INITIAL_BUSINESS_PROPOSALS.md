# Initial Turnkey Business Proposals

## Template for Each Business Proposal

### Business Name:
**Tagline:**
**Coin Name & Symbol:**

---

### 📋 Business Overview
- **Business Type:** [e.g., Micro-farm, Mobile Service, Retail, Food Service]
- **Location:** [City, State]
- **EIN Status:** [Pending / Registered: XX-XXXXXXX]
- **LLC Registration Date:** [Date or "Pending"]

---

### 💰 Seed Funding Requirements

**Total Fundraising Goal:** $X,XXX

**Funding Breakdown:**
- Equipment: $XXX
- Initial Inventory/Materials: $XXX
- Licenses & Permits: $XXX
- Marketing Materials: $XXX
- Working Capital: $XXX
- **Total:** $X,XXX

---

### 📦 Equipment Checklist

| Item | Category | Qty | Est. Cost | Vendor | Priority |
|------|----------|-----|-----------|--------|----------|
| Example Item | Equipment | 1 | $500 | Amazon | Essential |
| Example Material | Inventory | 50 | $200 | Local Supply | Important |

---

### 📊 5-Year Business Plan Summary

**Year 1:** [Brief description - Launch phase, customer acquisition]
**Year 2:** [Brief description - Growth phase]
**Year 3:** [Brief description - Expansion]
**Year 4:** [Brief description - Optimization]
**Year 5:** [Brief description - Mature operations]

**Projected Revenue:**
- Year 1: $XX,XXX
- Year 2: $XX,XXX
- Year 3: $XX,XXX
- Year 4: $XX,XXX
- Year 5: $XX,XXX

---

### 🪙 Merchant Coin Details

**Coin Name:** [BusinessName]Coins
**Coin Symbol:** [Emoji]
**Brand Color:** #XXXXXX

**Earning Rate:** 1 coin per $1 spent
**Redemption Rate:** $0.01 per coin (100 coins = $1)
**Max Redemption:** 50% per transaction
**Coin Expiration:** 365 days

---

### 👥 Target Market

**Primary Customers:** [Description]
**Market Size:** [Estimated local market]
**Competitive Advantage:** [What makes this unique?]

---

### 💳 Savings Account Setup

**Account Type:** PayPal Business Account
**PayPal Donate Button ID:** [To be created]
**Transparency Settings:** 
- ✅ Show donor names
- ✅ Show transaction history
- ✅ Public fundraising progress

---

### 🎯 Auction Strategy

**Minimum Bid:** $X,XXX (Equal to fundraising goal)
**Auction Duration:** 7 days
**Auto-Trigger:** ✅ When funding goal reached

**What Winner Gets:**
- ✅ Registered LLC with EIN
- ✅ Bank account with $X,XXX seed capital
- ✅ All equipment & materials (pre-purchased)
- ✅ XXX pre-customers with merchant coins
- ✅ 5 years CDI support & mentorship
- ✅ Complete business plan & SOPs

---

---

## Business Idea #1: [To Be Filled]

[Copy template above and fill in details]

---

## Business Idea #2: [To Be Filled]

[Copy template above and fill in details]

---

## Business Idea #3: [To Be Filled]

[Copy template above and fill in details]

---

## Business Idea #4: [To Be Filled]

[Copy template above and fill in details]

---

## Next Steps

1. **Complete all 4 business proposals** using the template above
2. **Create LLCs & obtain EINs** for each business
3. **Set up PayPal Business Accounts** with donate buttons
4. **Upload 5-year business plans** (PDF format)
5. **Insert into database** using the crowdfunding schema
6. **Launch on Crowdfunding Portal** in Quantum Wallet
7. **Community voting** to prioritize which business to fund first

---

## Database Insert Example

```sql
-- Example: Insert Business Proposal into Database
INSERT INTO projects (name, slug, description, tagline, image_url, status)
VALUES (
    'Dayton Micro-Farms',
    'dayton-micro-farms',
    'Indoor vertical microgreens farm serving local restaurants and health-conscious consumers',
    'Fresh, Local, Sustainable Microgreens',
    'https://example.com/microfarm.jpg',
    'active'
)
RETURNING id; -- Save this project_id

-- Then create merchant coins config
INSERT INTO merchant_coins_config (
    project_id,
    coin_name,
    coin_symbol,
    brand_color,
    business_name,
    business_type,
    business_status,
    fundraising_goal,
    current_funding,
    fundraising_start_date,
    fundraising_deadline,
    auction_trigger_enabled,
    business_plan_url,
    ein,
    ein_verified,
    llc_registration_date,
    funding_breakdown,
    equipment_checklist,
    savings_account_type,
    paypal_donate_button_id,
    max_redemption_pct,
    redemption_rate
)
VALUES (
    '[project_id from above]',
    'MicroFarmCoins',
    '🌱',
    '#10b981',
    'Dayton Micro-Farms LLC',
    'turnkey_business',
    'fundraising',
    2000.00,
    0.00,
    NOW(),
    NOW() + INTERVAL '60 days',
    true,
    'https://drive.google.com/file/d/xxx/business-plan.pdf',
    '12-3456789',
    true,
    '2025-11-15',
    '{"equipment": 800, "inventory": 600, "licenses": 300, "marketing": 200, "workingCapital": 100}',
    '[
        {
            "id": "1",
            "name": "Vertical Growing Rack System",
            "category": "Equipment",
            "estimatedCost": 500,
            "quantity": 1,
            "vendor": "Bootstrap Farmer",
            "priority": "essential"
        },
        {
            "id": "2",
            "name": "LED Grow Lights (Full Spectrum)",
            "category": "Equipment",
            "estimatedCost": 300,
            "quantity": 4,
            "vendor": "Amazon",
            "priority": "essential"
        }
    ]',
    'paypal',
    'XXXXXXXXXX',
    50.00,
    0.01
);
```

---

## Visual Mockup: How It Appears in Quantum Wallet

```
┌─────────────────────────────────────────────────┐
│  🌱 Dayton Micro-Farms                         │
│  Fresh, Local, Sustainable Microgreens         │
├─────────────────────────────────────────────────┤
│  📋 EIN: 12-3456789 ✓ Verified                 │
│  🏢 LLC Registered: Nov 15, 2025               │
│  📊 [View 5-Year Business Plan]                │
├─────────────────────────────────────────────────┤
│  💰 Savings Goal                                │
│  $1,450 / $2,000                                │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 73%                      │
│                                                 │
│  247 Investors | $550 Remaining | 12 Days Left │
├─────────────────────────────────────────────────┤
│  💼 What the money will fund ▼                 │
│                                                 │
│  Investment Breakdown:                          │
│  Equipment: $800                                │
│  Inventory: $600                                │
│  Licenses: $300                                 │
│  Marketing: $200                                │
│  Working Capital: $100                          │
│  ────────────────────                          │
│  Total Needed: $2,000                           │
├─────────────────────────────────────────────────┤
│  🌱 MicroFarmCoins                              │
│  Every $1 donated = 1 MicroFarmCoin             │
├─────────────────────────────────────────────────┤
│  [💚 Invest & Get MicroFarmCoins]              │
│  [💳 Donate via PayPal]                        │
└─────────────────────────────────────────────────┘
```

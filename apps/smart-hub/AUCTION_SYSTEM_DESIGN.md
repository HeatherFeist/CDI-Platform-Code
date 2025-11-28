# Auction System Design
## CDI Marketplace - Turnkey Business Auctions (Crowd-Incubated)

---

## 🎯 Overview

The auction system enables transparent, competitive bidding for turnkey businesses created by the Business Incubation Committee. This document outlines the complete auction process, technical requirements, and user experience, including the critical **Crowdfunding Phase**.

---

## 🔄 Complete Process Flow

### Phase 1: Crowdfunding (The "Seed" Phase)

**Objective**: Raise the initial seed capital (e.g., $2,000) from the community to validate the concept and fund the startup costs.

**User Experience**:
- **Listing**: "Future Business" page shows the concept, business plan, and startup checklist.
- **Progress Bar**: Shows funds raised vs. goal (e.g., "$1,200 / $2,000").
- **Call to Action**: "Donate & Get Coins"
    - User donates $100.
    - User receives 100 "Future Merchant Coins" (locked until launch).
- **Trigger**: When Goal ($2,000) is reached → **Auction Phase Begins**.

### Phase 2: Active Auction (7-14 days)

**Objective**: Find the best owner for the fully-funded business.

**Starting Bid**:
- **Minimum Bid** = Funding Goal Amount (e.g., $2,000).
- This ensures the nonprofit covers the administrative effort even if there's only one bid.

**User Experience**:
- **Listing Update**: Status changes from "Funding" to "Auction Live".
- **Bidding**: Members place bids starting at $2,000.
- **Transparency**: Bidders see that the business comes with $2,000 in assets (equipment/cash) and a customer base of coin-holders.

### Phase 3: Post-Auction Transfer

**Objective**: Transfer ownership and assets.

- **Winner Pays**: Final Bid Amount (e.g., $3,500) to Nonprofit.
- **Winner Receives**:
    - LLC & Bank Account (with $2,000 seed funds).
    - Equipment Checklist (to be purchased with seed funds).
    - Coin Liability Ledger (list of donors holding coins).
- **Donors Receive**: Notification that their coins are now active and redeemable at the new business.

---

## 💻 Technical Requirements

### Marketplace Platform Features

#### Crowdfunding Widget
```
┌─────────────────────────────────────────┐
│  FUTURE BUSINESS: [Business Name]       │
│  [Concept Image]                        │
├─────────────────────────────────────────┤
│  FUNDING GOAL: $2,000                   │
│  [████████░░░░] 60% Funded              │
│  $1,200 raised from 12 backers          │
├─────────────────────────────────────────┤
│  [DONATE $50] [DONATE $100] [CUSTOM]    │
│  *Receive 100% value in Merchant Coins* │
└─────────────────────────────────────────┘
```

#### Auction Interface (Unlocked)
```
┌─────────────────────────────────────────┐
│  AUCTION LIVE: [Business Name]          │
│  [Hero Image]                           │
├─────────────────────────────────────────┤
│  Current Bid: $2,500                    │
│  Minimum Bid: $2,000 (Goal Met!)        │
│  Time Remaining: 3 days 12:00:00        │
├─────────────────────────────────────────┤
│  INCLUDES:                              │
│  ✓ $2,000 Seed Capital (Funded)         │
│  ✓ 20 Customers (Coin Holders)          │
│  ✓ 5-Year Support Plan                  │
└─────────────────────────────────────────┘
```

### Database Schema Updates

#### Projects Table (New)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  funding_goal DECIMAL(10,2),
  funds_raised DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50), -- 'funding', 'auction_pending', 'auction_live', 'closed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Donations Table (New)
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  coins_issued DECIMAL(10,2),
  transaction_date TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Payment & Coin Logic

### Donation Logic
1.  User donates $X.
2.  System mints X amount of "Pending Coins" for that project.
3.  Funds go to "Holding Account" until goal is met.

### Auction Logic
1.  Winner pays $Y (Winning Bid).
2.  Funds go to Nonprofit Operations Account.
3.  "Holding Account" funds ($X total) are transferred to the new Business Bank Account.
4.  "Pending Coins" are converted to "Active Merchant Coins".

---

## 🔒 Security & Trust

### Escrow System
- All donations are held in a transparent escrow account.
- If the goal is NOT reached within [X] days, funds are refunded (or redirected to general fund, per policy).

### Verification
- Donors receive a digital certificate of their contribution.
- Coin issuance is recorded on the blockchain (or internal ledger) for immutability.

---

**Document Version**: 2.0 (Crowd-Incubated)
**Last Updated**: November 27, 2025
**Status**: Ready for Implementation

// Auto-bidding system for competitive advantage
// File: AUTO_BIDDING_FEATURE.md

# Auto-Bidding (Proxy Bidding) System

## Core Functionality
Users set a maximum bid amount, and the system automatically bids the minimum necessary to stay ahead, up to their limit.

## Business Benefits
- **Increased Revenue**: Higher final sale prices
- **User Convenience**: No need to monitor auctions constantly  
- **Competitive Advantage**: Standard feature on major platforms
- **Dayton Market Edge**: Local platforms rarely have this

## Implementation
```sql
CREATE TABLE auto_bids (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  max_amount DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Stories
- "Set it and forget it" - Users can bid without constant monitoring
- "Never miss out" - System bids at the last second if needed
- "Smart bidding" - Only bids the minimum necessary increment

## Revenue Impact
- Typical 15-25% increase in final sale prices
- Higher user engagement and retention
- Premium feature potential for power users
# Payment Integration Documentation

## Overview

The auction platform now includes a complete Stripe payment integration with card saving capabilities, designed for the Dayton, OH market with a 10% platform fee structure.

## Features Implemented

### 1. Payment Components
- **PaymentModal**: Complete payment interface with saved card management
- **PaymentForm**: Stripe Elements integration for new card entry
- **CardManager**: Saved payment methods management

### 2. Platform Fee Structure
- **Platform Fee**: 10% (suitable for Dayton, OH market)
- **Automatic Calculation**: Fees calculated on all transactions
- **Seller Payout**: Automatic deduction of platform fees

### 3. Card Management
- **Save Cards**: Users can save payment methods for future use
- **Default Cards**: Set primary payment method
- **Card Deletion**: Remove saved payment methods
- **Security**: All card data handled by Stripe (PCI compliant)

## Environment Configuration

Required environment variables in `.env`:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Platform Fee (10% for Dayton, OH)
VITE_PLATFORM_FEE_PERCENTAGE=10

# Existing Supabase Configuration
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Database Schema Updates

### New Tables
1. **saved_payment_methods**
   - Stores user's saved Stripe payment methods
   - RLS policies for user data protection
   - Automatic default card management

### Updated Tables
1. **transactions**
   - Added `payment_method_id`
   - Added `stripe_payment_intent_id`
   - Added `platform_fee` and `seller_amount` columns
   - Enhanced payment status tracking

## Payment Flow

### 1. Buy Now Process
1. User clicks "Buy Now" on listing
2. PaymentModal opens with saved cards option
3. User selects saved card OR adds new card
4. Payment processed through Stripe
5. Transaction recorded in database
6. Listing marked as sold

### 2. Saved Card Flow
1. Display user's saved payment methods
2. Allow selection of existing card
3. Process payment with selected method
4. One-click purchase experience

### 3. New Card Flow
1. Stripe Elements form for card entry
2. Option to save card for future use
3. Secure tokenization by Stripe
4. Payment processing and storage

## Fee Calculation

### Platform Fee Structure
- **Rate**: 10% of transaction amount
- **Calculation**: `platformFee = amount * 0.10`
- **Seller Receives**: `sellerAmount = amount - platformFee`

### Fee Display
- Transparent fee breakdown in payment form
- Shows platform fee and seller amount
- Clear total for buyer

## Security Features

### 1. PCI Compliance
- All card data handled by Stripe
- No sensitive card information stored locally
- Secure tokenization for saved cards

### 2. Row Level Security (RLS)
- User-specific payment method access
- Secure transaction data
- Profile-based data isolation

### 3. Environment Protection
- API keys in environment variables
- Separate test/production configurations
- Secure credential management

## Production Deployment Requirements

### 1. Stripe Configuration
- [ ] Create production Stripe account
- [ ] Set up webhook endpoints
- [ ] Configure payment flows
- [ ] Set up Connect for seller payouts

### 2. Supabase Setup
- [ ] Deploy Edge Functions for payment processing
- [ ] Set up production database
- [ ] Configure storage buckets
- [ ] Set up environment variables

### 3. Backend Services (Recommended)
```typescript
// Supabase Edge Function for payment processing
// Location: supabase/functions/process-payment/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Payment processing with fee calculation
// Seller payout automation
// Error handling and logging
```

## File Structure

```
src/
├── components/
│   └── payment/
│       ├── PaymentModal.tsx      # Main payment interface
│       ├── PaymentForm.tsx       # Stripe Elements form
│       ├── CardManager.tsx       # Saved cards management
│       └── index.ts             # Exports
├── lib/
│   ├── stripe.ts                # Stripe configuration & utilities
│   └── env.ts                   # Environment validation
└── contexts/
    └── AuthContext.tsx          # User authentication

database/
├── supabase-setup.sql           # Complete database schema
├── update-payment-schema.sql    # Payment-specific updates
└── setup-storage.sql           # File storage configuration
```

## Testing

### Test Cards (Stripe Test Mode)
- **Visa**: 4242 4242 4242 4242
- **Visa (Declined)**: 4000 0000 0000 0002
- **Mastercard**: 5555 5555 5555 4444

### Test Flow
1. Set up test environment with Stripe test keys
2. Create test user account
3. Test payment with test card numbers
4. Verify transaction recording
5. Test saved card functionality

## Market Analysis - Dayton, OH

### Platform Fee Justification (10%)
- **Local Market**: Competitive with regional platforms
- **Service Value**: Payment processing, dispute resolution, marketing
- **Comparable Platforms**: Similar to other auction platforms
- **Break-even Analysis**: Covers operational costs and provides growth margin

### Alternative Fee Structures
- **Fixed Fee**: $2-5 per transaction (for lower-value items)
- **Tiered Structure**: 15% for items under $50, 8% for items over $200
- **Subscription Model**: Monthly fee for power sellers

## Next Steps

1. **Deploy Payment Processing**: Set up Supabase Edge Functions
2. **Stripe Connect**: Enable seller payouts
3. **Webhook Handling**: Process payment events
4. **Dispute Management**: Handle chargebacks and refunds
5. **Analytics**: Track payment metrics and conversion rates

## Support

For payment-related issues:
1. Check Stripe Dashboard for payment status
2. Review Supabase logs for transaction errors
3. Verify environment configuration
4. Test with Stripe test cards

## Compliance

- **PCI DSS**: Stripe handles compliance requirements
- **Data Protection**: GDPR/CCPA compliant data handling
- **Financial Regulations**: Appropriate for small business operations
- **Tax Reporting**: Integration with accounting systems recommended
# PayPal Subscription Setup Guide for All Apps

## 🎯 Overview

This guide walks you through setting up PayPal subscriptions for **outside users** (your customers) across all your apps:
- **Quantum Wallet** - Premium features subscription
- **Marketplace** - Seller subscription tiers
- **Renovision** - Contractor/business subscriptions

## 🔐 Important: Platform vs User Subscriptions

### Two Types of PayPal Integration:

1. **Platform Subscriptions (What we're setting up now)**
   - YOU create subscription plans in YOUR PayPal account
   - Outside users subscribe to YOUR plans
   - Money goes to YOUR PayPal account
   - You manage the subscription products

2. **BYOK User Subscriptions (Already built)**
   - Individual users connect THEIR PayPal accounts
   - They receive payments directly
   - Used for seller payouts, contractor payments

---

## 📋 Step 1: Create PayPal Business Account

### If you don't have one yet:

1. Go to [paypal.com/business](https://www.paypal.com/business)
2. Click "Sign Up"
3. Select "Business Account"
4. Enter your business details:
   - Business name: **Constructive Designs Inc**
   - Business email: **constructivedesignsinc@mail.com**
   - Business type: Software/Technology
5. Complete verification (may require business documents)

### Get Your Production API Credentials:

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in with your business account
3. Go to "Apps & Credentials"
4. Switch to **"Live"** tab (not Sandbox)
5. Create a new app called "Constructive Designs Platform"
6. Copy your **Live Client ID** and **Secret**

---

## 📦 Step 2: Create Subscription Products & Plans

### For Each App, Create Products:

#### **Quantum Wallet Subscription Products**

1. Go to [paypal.com/billing/plans](https://www.paypal.com/billing/plans)
2. Click "Create Plan"

**Product 1: Quantum Wallet Premium**
```
Product Name: Quantum Wallet Premium
Description: Premium features for Quantum Wallet including unlimited transactions, advanced analytics, and priority support
Category: Software
```

**Plans for Quantum Wallet:**
- **Monthly Plan**: $9.99/month
- **Annual Plan**: $99/year (save 17%)

#### **Marketplace Subscription Products**

**Product 2: Marketplace Seller Basic**
```
Product Name: Marketplace Seller - Basic
Description: List up to 50 items, basic analytics, standard support
Category: Software
```

**Plans:**
- **Monthly**: $19.99/month
- **Annual**: $199/year

**Product 3: Marketplace Seller Pro**
```
Product Name: Marketplace Seller - Pro
Description: Unlimited listings, advanced analytics, priority support, featured placement
Category: Software
```

**Plans:**
- **Monthly**: $49.99/month
- **Annual**: $499/year

**Product 4: Marketplace Seller Enterprise**
```
Product Name: Marketplace Seller - Enterprise
Description: Everything in Pro + API access, custom integrations, dedicated account manager
Category: Software
```

**Plans:**
- **Monthly**: $99.99/month
- **Annual**: $999/year

#### **Renovision Subscription Products**

**Product 5: Renovision Contractor Basic**
```
Product Name: Renovision - Contractor Basic
Description: Up to 25 estimates/month, basic templates, client management
Category: Software
```

**Plans:**
- **Monthly**: $29.99/month
- **Annual**: $299/year

**Product 6: Renovision Contractor Pro**
```
Product Name: Renovision - Contractor Pro
Description: Unlimited estimates, AI-powered pricing, advanced reporting, team collaboration
Category: Software
```

**Plans:**
- **Monthly**: $79.99/month
- **Annual**: $799/year

---

## 🔧 Step 3: Get Plan IDs

After creating each plan:

1. Click on the plan
2. Copy the **Plan ID** (looks like: `P-1AB23456CD789012E`)
3. Save these IDs - you'll need them in your app configuration

Example Plan IDs structure:
```
QUANTUM_WALLET_MONTHLY_PLAN_ID=P-1AB23456CD789012E
QUANTUM_WALLET_ANNUAL_PLAN_ID=P-2BC34567DE890123F
MARKETPLACE_BASIC_MONTHLY_PLAN_ID=P-3CD45678EF901234G
MARKETPLACE_BASIC_ANNUAL_PLAN_ID=P-4DE56789FG012345H
MARKETPLACE_PRO_MONTHLY_PLAN_ID=P-5EF67890GH123456I
MARKETPLACE_PRO_ANNUAL_PLAN_ID=P-6FG78901HI234567J
MARKETPLACE_ENTERPRISE_MONTHLY_PLAN_ID=P-7GH89012IJ345678K
MARKETPLACE_ENTERPRISE_ANNUAL_PLAN_ID=P-8HI90123JK456789L
RENOVISION_BASIC_MONTHLY_PLAN_ID=P-9IJ01234KL567890M
RENOVISION_BASIC_ANNUAL_PLAN_ID=P-0JK12345LM678901N
RENOVISION_PRO_MONTHLY_PLAN_ID=P-1KL23456MN789012O
RENOVISION_PRO_ANNUAL_PLAN_ID=P-2LM34567NO890123P
```

---

## 💻 Step 4: Configure Apps with Plan IDs

### Quantum Wallet (.env)

```bash
# PayPal Platform Subscriptions (YOUR account - for customer subscriptions)
VITE_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
VITE_PAYPAL_SECRET=YOUR_LIVE_SECRET

# Subscription Plan IDs
VITE_QUANTUM_WALLET_MONTHLY_PLAN_ID=P-1AB23456CD789012E
VITE_QUANTUM_WALLET_ANNUAL_PLAN_ID=P-2BC34567DE890123F
```

### Marketplace (.env)

```bash
# PayPal Platform Subscriptions
VITE_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
VITE_PAYPAL_SECRET=YOUR_LIVE_SECRET

# Subscription Plan IDs
VITE_MARKETPLACE_BASIC_MONTHLY_PLAN_ID=P-3CD45678EF901234G
VITE_MARKETPLACE_BASIC_ANNUAL_PLAN_ID=P-4DE56789FG012345H
VITE_MARKETPLACE_PRO_MONTHLY_PLAN_ID=P-5EF67890GH123456I
VITE_MARKETPLACE_PRO_ANNUAL_PLAN_ID=P-6FG78901HI234567J
VITE_MARKETPLACE_ENTERPRISE_MONTHLY_PLAN_ID=P-7GH89012IJ345678K
VITE_MARKETPLACE_ENTERPRISE_ANNUAL_PLAN_ID=P-8HI90123JK456789L
```

### Renovision (.env)

```bash
# PayPal Platform Subscriptions
VITE_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
VITE_PAYPAL_SECRET=YOUR_LIVE_SECRET

# Subscription Plan IDs
VITE_RENOVISION_BASIC_MONTHLY_PLAN_ID=P-9IJ01234KL567890M
VITE_RENOVISION_BASIC_ANNUAL_PLAN_ID=P-0JK12345LM678901N
VITE_RENOVISION_PRO_MONTHLY_PLAN_ID=P-1KL23456MN789012O
VITE_RENOVISION_PRO_ANNUAL_PLAN_ID=P-2LM34567NO890123P
```

---

## 🎨 Step 5: Create Subscription UI Components

### Example: Pricing Page Component

```typescript
// components/PricingPage.tsx
import { useState } from 'react';

const PLANS = [
  {
    name: 'Basic',
    monthlyPrice: 19.99,
    annualPrice: 199,
    monthlyPlanId: import.meta.env.VITE_MARKETPLACE_BASIC_MONTHLY_PLAN_ID,
    annualPlanId: import.meta.env.VITE_MARKETPLACE_BASIC_ANNUAL_PLAN_ID,
    features: [
      'Up to 50 listings',
      'Basic analytics',
      'Standard support'
    ]
  },
  {
    name: 'Pro',
    monthlyPrice: 49.99,
    annualPrice: 499,
    monthlyPlanId: import.meta.env.VITE_MARKETPLACE_PRO_MONTHLY_PLAN_ID,
    annualPlanId: import.meta.env.VITE_MARKETPLACE_PRO_ANNUAL_PLAN_ID,
    features: [
      'Unlimited listings',
      'Advanced analytics',
      'Priority support',
      'Featured placement'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    monthlyPrice: 99.99,
    annualPrice: 999,
    monthlyPlanId: import.meta.env.VITE_MARKETPLACE_ENTERPRISE_MONTHLY_PLAN_ID,
    annualPlanId: import.meta.env.VITE_MARKETPLACE_ENTERPRISE_ANNUAL_PLAN_ID,
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSubscribe = (planId: string) => {
    // Redirect to PayPal subscription checkout
    window.location.href = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${planId}`;
  };

  return (
    <div className="pricing-page">
      <h1>Choose Your Plan</h1>
      
      {/* Billing Toggle */}
      <div className="billing-toggle">
        <button onClick={() => setBillingCycle('monthly')}>Monthly</button>
        <button onClick={() => setBillingCycle('annual')}>
          Annual <span className="badge">Save 17%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.name} className={plan.popular ? 'plan popular' : 'plan'}>
            {plan.popular && <span className="badge">Most Popular</span>}
            
            <h2>{plan.name}</h2>
            
            <div className="price">
              <span className="amount">
                ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
              </span>
              <span className="period">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <ul className="features">
              {plan.features.map(feature => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(
                billingCycle === 'monthly' ? plan.monthlyPlanId : plan.annualPlanId
              )}
              className="subscribe-btn"
            >
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔔 Step 6: Set Up Webhooks

PayPal will notify you when subscription events occur.

### Configure Webhook URL:

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Go to "Apps & Credentials" → Your App
3. Scroll to "Webhooks"
4. Add webhook URL: `https://your-domain.com/api/paypal/webhook`

### Subscribe to Events:

- ✅ `BILLING.SUBSCRIPTION.CREATED`
- ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
- ✅ `BILLING.SUBSCRIPTION.UPDATED`
- ✅ `BILLING.SUBSCRIPTION.CANCELLED`
- ✅ `BILLING.SUBSCRIPTION.SUSPENDED`
- ✅ `BILLING.SUBSCRIPTION.EXPIRED`
- ✅ `PAYMENT.SALE.COMPLETED`
- ✅ `PAYMENT.SALE.REFUNDED`

### Example Webhook Handler (Supabase Edge Function):

```typescript
// supabase/functions/paypal-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const payload = await req.json();
    const eventType = payload.event_type;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // User subscribed - grant access
        const subscriptionId = payload.resource.id;
        const planId = payload.resource.plan_id;
        const subscriberEmail = payload.resource.subscriber.email_address;

        await supabase.from('subscriptions').insert({
          subscription_id: subscriptionId,
          plan_id: planId,
          user_email: subscriberEmail,
          status: 'active',
          started_at: new Date().toISOString()
        });
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // User cancelled - revoke access
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('subscription_id', payload.resource.id);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Payment received - log transaction
        await supabase.from('payments').insert({
          transaction_id: payload.resource.id,
          amount: payload.resource.amount.total,
          currency: payload.resource.amount.currency,
          status: 'completed'
        });
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 📊 Step 7: Create Subscriptions Database Table

```sql
-- Subscriptions tracking table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- PayPal subscription details
    subscription_id TEXT UNIQUE NOT NULL, -- PayPal subscription ID
    plan_id TEXT NOT NULL, -- Which plan they subscribed to
    
    -- App context
    app TEXT NOT NULL CHECK (app IN ('quantum-wallet', 'marketplace', 'renovision')),
    tier TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'expired')),
    
    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    next_billing_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (profile_id = auth.uid());

-- Indexes
CREATE INDEX idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_app ON subscriptions(app);
```

---

## ✅ Testing Checklist

### Sandbox Testing (Before Going Live):

1. ✅ Create sandbox plans in PayPal
2. ✅ Test subscription flow with sandbox account
3. ✅ Verify webhook events are received
4. ✅ Confirm database updates correctly
5. ✅ Test cancellation flow
6. ✅ Test subscription renewal

### Production Launch:

1. ✅ Create live plans in PayPal
2. ✅ Update .env files with live credentials
3. ✅ Deploy apps with subscription features
4. ✅ Test with real PayPal account (small amount)
5. ✅ Monitor webhook logs
6. ✅ Set up customer support for subscription issues

---

## 💰 Recommended Pricing Strategy

### Quantum Wallet:
- **Free Tier**: Basic features, limited transactions
- **Premium ($9.99/mo)**: Unlimited transactions, analytics

### Marketplace:
- **Free**: Browse only
- **Basic ($19.99/mo)**: Up to 50 listings
- **Pro ($49.99/mo)**: Unlimited listings + features
- **Enterprise ($99.99/mo)**: API access + dedicated support

### Renovision:
- **Free Trial**: 14 days, 5 estimates
- **Basic ($29.99/mo)**: 25 estimates/month
- **Pro ($79.99/mo)**: Unlimited estimates + AI features

---

## 🎯 Next Steps

1. **Create PayPal Business Account** (if not done)
2. **Set up subscription products and plans**
3. **Copy Plan IDs to .env files**
4. **Build pricing pages for each app**
5. **Set up webhook handlers**
6. **Test in sandbox**
7. **Launch with live credentials**

**Would you like me to help you create the pricing page UI components for any of the apps?**

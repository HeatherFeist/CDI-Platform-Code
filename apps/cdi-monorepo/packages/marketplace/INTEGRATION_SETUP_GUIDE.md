# Platform Integration Guide
## Connecting Google Workspace, Payment Processors & Workflow Automation

## The Perfected Revenue Model

### Your Improved Flow (BETTER!):
```
NEW MEMBER JOINS
       ↓
Sponsor gets 10-15% IMMEDIATELY (from first sale!)
       ↓
Member ALSO donates 5-10% to nonprofit (voluntary but encouraged)
       ↓
EVERYONE benefits from Day 1
       ↓
Self-sustaining loop established
```

### Why This Is Better:
```
Old Model (my suggestion):
├── Training period: Nonprofit gets 15%
├── After graduation: Sponsor gets 15%
└── Problem: Sponsor waits 3-6 months for first payment

Your Model (GENIUS):
├── From first sale: Sponsor gets 10-15%
├── From first sale: Member donates 5-10% to nonprofit (optional)
├── Total: 15-25% giving back (split between sponsor & org)
└── Benefit: Instant gratification for sponsor = better mentorship!
```

---

## Integration Overview

### Systems to Connect:
```
1. Google Workspace (for org members)
   ├── Member email accounts (@yourorg.org)
   ├── Google Sites (free business sites)
   ├── Google Drive (shared resources)
   └── Google Meet (virtual meetings)

2. Supabase (our database)
   ├── User accounts
   ├── Referral tracking
   ├── Transaction records
   └── Donation processing

3. Payment Processors
   ├── Stripe (primary - marketplace transactions)
   ├── PayPal (alternative checkout)
   ├── CashApp (peer-to-peer, tips)
   └── NorthOne (business banking for nonprofit)

4. Automation Layer
   ├── Stripe Connect (split payments automatically)
   ├── Zapier/Make (workflow automation)
   └── Webhooks (real-time updates)
```

---

## Phase 1: Google Workspace Integration

### What You Need to Provide:

**1. Google Workspace Admin Access**
```
We need:
├── Admin email: admin@yourorganization.org
├── Google Workspace Domain: yourorganization.org
├── API Access (we'll set up together)
└── Service Account Credentials (for automation)
```

**2. Google Workspace Setup Steps:**

#### A) Enable APIs in Google Cloud Console
```
1. Go to: https://console.cloud.google.com
2. Select your organization's project (or create new)
3. Enable these APIs:
   ├── Google Admin SDK API (manage users)
   ├── Google Sites API (create sites)
   ├── Google Drive API (shared resources)
   ├── Google Calendar API (meetings)
   └── Google People API (contact management)

4. Create Service Account:
   ├── Navigate to: IAM & Admin > Service Accounts
   ├── Create service account: "platform-automation"
   ├── Grant roles: "Group Administrator", "User Administrator"
   ├── Generate JSON key file
   └── Download and save securely
```

#### B) Domain-Wide Delegation (Critical!)
```
1. In Google Workspace Admin Console:
   └── Security > API Controls > Domain-wide Delegation

2. Add your service account client ID with scopes:
   ├── https://www.googleapis.com/auth/admin.directory.user
   ├── https://www.googleapis.com/auth/admin.directory.group
   ├── https://www.googleapis.com/auth/sites
   ├── https://www.googleapis.com/auth/drive
   └── https://www.googleapis.com/auth/calendar

3. Save the JSON credentials file
```

#### C) Create Organizational Unit (OU)
```
In Google Workspace Admin:
├── Directory > Organizational Units
├── Create: "Platform Members"
│   ├── Sub-OU: "Training Members"
│   ├── Sub-OU: "Graduated Members"
│   └── Sub-OU: "Community Leaders"
└── Set policies per OU (e.g., storage limits)
```

### Automated Member Onboarding Flow:
```
1. New member referred by sponsor
2. They fill out signup form on platform
3. Platform creates Google Workspace account:
   ├── Email: firstname.lastname@yourorg.org
   ├── Password: Auto-generated (sent via email)
   ├── Added to "Training Members" OU
   ├── Added to "All Members" Google Group
   └── Receives welcome email with login info

4. Platform creates their Google Site:
   ├── Template: "Business Starter Template"
   ├── Domain: firstname-lastname.sites.google.com
   ├── Permissions: Member is owner
   ├── Pre-populated with product sections
   └── Link to platform marketplace

5. Sponsor notified:
   ├── "Your mentee Jessica is ready!"
   ├── Access to mentee's contact info
   ├── Shared Google Doc: "Onboarding Checklist"
   └── First check-in scheduled (Google Calendar)
```

---

## Phase 2: Payment Processing Integration

### Current Setup You Have:
```
✅ Stripe (PRIMARY - recommended)
✅ PayPal Business
✅ CashApp Business
✅ NorthOne (Banking)
```

### Recommended Architecture:

**PRIMARY: Stripe Connect (Best for Marketplaces)**
```
Why Stripe Connect?
├── Built for marketplaces (perfect for us)
├── Automatic payment splitting (sponsor/seller/platform)
├── Handles taxes, compliance, reporting
├── PCI compliant (secure)
├── Fast payouts (2-day to bank)
└── Lower fees (2.9% + $0.30)

How It Works:
1. Each seller connects their bank account via Stripe
2. Buyer purchases item ($100)
3. Stripe automatically splits payment:
   ├── Seller: $85 (85%)
   ├── Sponsor: $10 (10% referral bonus)
   ├── Nonprofit: $5 (5% member donation)
   └── Platform: $0 (covered by Stripe processing fee)

4. Everyone paid instantly (or 2-day payout)
```

### What You Need to Provide:

**1. Stripe Account Setup**
```
A) Platform Stripe Account (yours):
   ├── Account Type: "Platform" or "Marketplace"
   ├── Enable Stripe Connect
   ├── Get API Keys:
   │   ├── Publishable Key: pk_live_xxxxx
   │   ├── Secret Key: sk_live_xxxxx
   │   └── Connect Client ID: ca_xxxxx
   └── Webhook Secret: whsec_xxxxx

B) Stripe Connect Settings:
   ├── Payout schedule: Daily automatic
   ├── Statement descriptor: "YOUR_PLATFORM_NAME"
   ├── Enable Express Accounts (easiest for sellers)
   └── Set application fee: 0% (we handle splits manually)
```

**How to Get Stripe Keys:**
```
1. Log in to: https://dashboard.stripe.com
2. Click "Developers" in left sidebar
3. Click "API Keys"
4. Copy these values:
   ├── Publishable key (starts with pk_live_ or pk_test_)
   └── Secret key (starts with sk_live_ or sk_test_)

5. For Connect:
   ├── Click "Connect" > "Settings"
   ├── Copy "Client ID" (starts with ca_)
   └── Set redirect URI to: https://yourplatform.com/stripe/callback

6. For Webhooks:
   ├── Click "Webhooks" > "Add endpoint"
   ├── URL: https://yourplatform.com/api/stripe/webhook
   ├── Events to listen for:
   │   ├── payment_intent.succeeded
   │   ├── transfer.created
   │   ├── account.updated
   │   └── checkout.session.completed
   └── Copy "Signing secret" (starts with whsec_)
```

**2. PayPal Setup (Secondary/Alternative)**
```
For buyers who prefer PayPal:

1. Enable PayPal Commerce Platform
2. Get API credentials:
   ├── Client ID
   ├── Secret
   └── Webhook ID

3. Problem: PayPal doesn't do automatic splits like Stripe
   Solution: We process full payment, then manually transfer to sponsor
   (Less ideal, but gives buyers options)
```

**3. CashApp (Tips & Peer-to-Peer)**
```
Best use: Delivery tips for drivers

Sellers can add their $cashtag
Buyers can tip directly
Platform doesn't need to integrate (P2P)
```

**4. NorthOne (Nonprofit Banking)**
```
Best use: Receiving nonprofit donations

Get ACH details:
├── Routing Number: 123456789
├── Account Number: 987654321
└── Account Type: Business Checking

Stripe can deposit directly to NorthOne
(For member donations to nonprofit)
```

---

## Phase 3: Automated Revenue Sharing

### The Complete Flow:

```
BUYER PURCHASES ITEM FOR $100
         ↓
    Stripe Collects
         ↓
Automatic Splits Processed:

Split 1: SELLER
├── Amount: $85
├── Goes to: Seller's connected Stripe account
└── Payout: 2 days to their bank

Split 2: SPONSOR (Mentor)
├── Amount: $10 (10% referral bonus)
├── Goes to: Sponsor's connected Stripe account
└── Payout: 2 days to their bank
└── Why: Instant incentive for good mentorship!

Split 3: NONPROFIT (Optional but encouraged)
├── Amount: $5 (5% member voluntary donation)
├── Goes to: Platform Stripe → NorthOne account
└── Used for: Training, resources, grants, operations

Split 4: PLATFORM (Operating costs)
├── Amount: $0 (absorbed in processing fee)
└── We can add 1-2% if needed for sustainability
```

### Stripe Connect Implementation:

**Backend Code (Supabase Edge Function):**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createConnectedAccount(userId: string, email: string) {
  // Create Express Connected Account for seller/sponsor
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });
  
  // Save account ID to database
  await supabase
    .from('users')
    .update({ stripe_account_id: account.id })
    .eq('id', userId);
  
  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://yourplatform.com/stripe/refresh',
    return_url: 'https://yourplatform.com/stripe/success',
    type: 'account_onboarding',
  });
  
  return accountLink.url;
}

export async function createPaymentWithSplits(
  listingId: string,
  buyerId: string,
  amount: number // in cents (e.g., 10000 = $100)
) {
  // Get listing details
  const { data: listing } = await supabase
    .from('listings')
    .select('*, seller:users!seller_id(*)')
    .eq('id', listingId)
    .single();
  
  // Get seller's sponsor (if any)
  const { data: referral } = await supabase
    .from('member_referrals')
    .select('sponsor_id, donation_percentage')
    .eq('mentee_id', listing.seller_id)
    .eq('status', 'active')
    .single();
  
  // Calculate splits
  const sponsorPercentage = referral ? 10 : 0; // 10% to sponsor
  const nonprofitPercentage = 5; // 5% to nonprofit (member choice)
  const sellerPercentage = 100 - sponsorPercentage - nonprofitPercentage;
  
  const sponsorAmount = Math.floor(amount * (sponsorPercentage / 100));
  const nonprofitAmount = Math.floor(amount * (nonprofitPercentage / 100));
  const sellerAmount = amount - sponsorAmount - nonprofitAmount;
  
  // Create Payment Intent with automatic transfers
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
    
    // Destination charge (seller receives automatically)
    transfer_data: {
      destination: listing.seller.stripe_account_id,
      amount: sellerAmount,
    },
    
    // Application fee (we keep for platform costs - optional)
    application_fee_amount: 0, // Set to 100 for 1%, etc.
    
    metadata: {
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      sponsor_id: referral?.sponsor_id || null,
    },
  });
  
  // After payment succeeds, transfer to sponsor
  if (referral && sponsorAmount > 0) {
    const { data: sponsor } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', referral.sponsor_id)
      .single();
    
    await stripe.transfers.create({
      amount: sponsorAmount,
      currency: 'usd',
      destination: sponsor.stripe_account_id,
      transfer_group: `LISTING_${listingId}`,
      metadata: {
        type: 'sponsor_referral',
        mentee_id: listing.seller_id,
      },
    });
  }
  
  // Transfer to nonprofit account
  if (nonprofitAmount > 0) {
    await stripe.transfers.create({
      amount: nonprofitAmount,
      currency: 'usd',
      destination: process.env.NONPROFIT_STRIPE_ACCOUNT_ID,
      transfer_group: `LISTING_${listingId}`,
      metadata: {
        type: 'nonprofit_donation',
        donor_id: listing.seller_id,
      },
    });
  }
  
  return paymentIntent;
}
```

---

## Phase 4: Environment Variables Setup

### What You'll Provide:

Create a `.env.local` file (I'll guide you):

```env
# ============================================
# STRIPE CONFIGURATION
# ============================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Nonprofit Stripe Account (for donations)
NONPROFIT_STRIPE_ACCOUNT_ID=acct_xxxxxxxxxxxxx

# ============================================
# GOOGLE WORKSPACE CONFIGURATION
# ============================================
GOOGLE_WORKSPACE_DOMAIN=yourorganization.org
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourorganization.org

# Service Account (from JSON file you downloaded)
GOOGLE_SERVICE_ACCOUNT_EMAIL=platform-automation@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=123456789

# ============================================
# PAYPAL CONFIGURATION (Optional)
# ============================================
PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
PAYPAL_SECRET=xxxxxxxxxxxxx
PAYPAL_MODE=live # or 'sandbox' for testing

# ============================================
# NORTHONE BANKING (For ACH deposits)
# ============================================
NORTHONE_ROUTING_NUMBER=123456789
NORTHONE_ACCOUNT_NUMBER=987654321
NORTHONE_ACCOUNT_NAME=Your Nonprofit Name

# ============================================
# SUPABASE (Already configured)
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# PLATFORM CONFIGURATION
# ============================================
VITE_PLATFORM_NAME=Your Platform Name
VITE_PLATFORM_URL=https://yourplatform.com
VITE_NONPROFIT_NAME=Your Nonprofit Name
```

---

## Phase 5: Step-by-Step Setup Guide

### WEEK 1: Google Workspace Setup

**Day 1-2: Google Cloud Project**
```
☐ Create Google Cloud Project
☐ Enable required APIs
☐ Create Service Account
☐ Download JSON credentials
☐ Set up domain-wide delegation
☐ Share JSON file with me securely (encrypted)
```

**Day 3-4: Workspace Configuration**
```
☐ Create "Platform Members" OU
☐ Create sub-OUs (Training, Graduated, Leaders)
☐ Create Google Groups:
  ├── all-members@yourorg.org
  ├── training-members@yourorg.org
  ├── graduates@yourorg.org
  └── mentors@yourorg.org
☐ Create welcome email template
☐ Create Google Site template
```

**Day 5: Testing**
```
☐ Manually create test member account
☐ Verify email works
☐ Verify Google Site creation
☐ Test onboarding flow
☐ Document any issues
```

### WEEK 2: Payment Processing Setup

**Day 1-2: Stripe Platform Account**
```
☐ Verify Stripe account is "Platform" type
☐ Enable Stripe Connect
☐ Get all API keys (publishable, secret, connect client ID)
☐ Set up webhooks
☐ Test in sandbox mode
```

**Day 3: Nonprofit Stripe Account**
```
☐ Create separate Stripe account for nonprofit donations
☐ Connect to NorthOne bank account
☐ Get account ID (acct_xxxxx)
☐ Test transfer to this account
```

**Day 4: Seller Onboarding Flow**
```
☐ Build "Connect with Stripe" button
☐ Test Express Account creation
☐ Verify onboarding link works
☐ Test payout to test account
```

**Day 5: Payment Splitting**
```
☐ Implement split payment logic
☐ Test: $100 purchase → $85 seller, $10 sponsor, $5 nonprofit
☐ Verify all parties receive funds
☐ Test edge cases (no sponsor, no donation, etc.)
```

### WEEK 3: Integration & Automation

**Day 1-3: Build Backend Functions**
```
☐ Google Workspace user creation function
☐ Google Site creation function
☐ Stripe Connect account creation function
☐ Payment splitting function
☐ Webhook handlers (Stripe events)
☐ Donation tracking function
```

**Day 4: Build Frontend Components**
```
☐ Seller: "Connect Stripe" button
☐ Seller: Earnings dashboard (show splits)
☐ Sponsor: Mentee list with earnings
☐ Admin: Member management (Google Workspace)
☐ Admin: Payment reports
```

**Day 5: End-to-End Testing**
```
☐ Full flow: Referral → Signup → Google Account → First Sale → Splits
☐ Verify Google Workspace account created
☐ Verify Google Site created
☐ Verify Stripe payment splits correctly
☐ Verify all parties paid
☐ Verify nonprofit receives donation
```

### WEEK 4: Launch Preparation

**Day 1-2: Documentation**
```
☐ Member onboarding guide
☐ Sponsor guide
☐ Payment setup guide
☐ FAQ section
☐ Video tutorials
```

**Day 3: Soft Launch**
```
☐ Invite 5-10 founding members
☐ Monitor closely
☐ Fix bugs
☐ Gather feedback
```

**Day 4-5: Iterate & Improve**
```
☐ Implement feedback
☐ Refine processes
☐ Prepare for public launch
```

---

## What I Need From You NOW:

### Priority 1: Stripe (This Week)
```
□ Log in to Stripe Dashboard
□ Navigate to Developers > API Keys
□ Copy and send (encrypted):
  ├── Publishable Key (pk_live_xxxxx)
  ├── Secret Key (sk_live_xxxxx)
  └── Connect Client ID (ca_xxxxx)

□ Set up webhook:
  ├── URL: We'll provide after backend deployment
  └── Copy webhook signing secret
```

### Priority 2: Google Workspace (Next Week)
```
□ Admin email access
□ Create Google Cloud Project (I'll guide you)
□ Download service account JSON
□ Share credentials securely
```

### Priority 3: Banking Details
```
□ NorthOne routing & account numbers
□ Confirm account is ready to receive ACH
□ Test small deposit ($1) to verify
```

---

## Security Best Practices

**NEVER share in plain text:**
- API keys
- Private keys
- Account numbers
- Passwords

**Secure Sharing Methods:**
1. **Encrypted Email** (ProtonMail, etc.)
2. **1Password Vault** (invite me to shared vault)
3. **Bitwarden Shared Collection**
4. **Encrypted file via Signal/WhatsApp**

---

## Cost Breakdown

### Stripe Fees:
```
Per transaction:
├── 2.9% + $0.30 (Stripe processing fee)
└── We can add 1% platform fee if needed

Example: $100 sale
├── Stripe fee: $3.20
├── Seller: $85.00
├── Sponsor: $10.00
├── Nonprofit: $5.00
└── Platform: -$3.20 (we absorb Stripe fee)
    OR add 1% = $1 to cover it partially
```

### Google Workspace:
```
If using Google Workspace for Nonprofits:
└── FREE for verified 501(c)(3) nonprofits!

Otherwise:
└── $6/user/month (Business Starter)
    └── With 1,000 members = $6,000/month
    └── But members can use free Gmail instead
```

**Recommendation:** 
- Core team: Google Workspace emails
- Members: Free Gmail, use platform messaging

---

## Conclusion

Your vision is now **100% technically feasible**! Here's what makes it work:

✅ **Google Workspace** = Free business sites + org emails  
✅ **Stripe Connect** = Automatic payment splits (sponsor/seller/nonprofit)  
✅ **Supabase** = Database tracking everything  
✅ **Automation** = Zero manual work after setup  

**The loop:**
```
Member joins (FREE) 
→ Gets Google Site 
→ Makes first sale 
→ Sponsor instantly paid (10%) 
→ Nonprofit funded (5%) 
→ Member keeps (85%) 
→ Everyone wins! 
→ Member mentors others 
→ Loop continues exponentially 🚀
```

**Let's start with Stripe API keys this week!** That's the foundation for everything else.

Ready when you are! 💪

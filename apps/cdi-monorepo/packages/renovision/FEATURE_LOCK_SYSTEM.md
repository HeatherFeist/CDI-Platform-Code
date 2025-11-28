# Feature Lock System Documentation

## Overview
The Feature Lock system ensures users complete required setup steps before accessing critical features. This prevents errors and ensures proper application functionality.

## Protected Features

### 1. **Estimates** (`/business/estimates`)
**Required Setup:**
- ✅ Business Details (company name, phone, address)
- ✅ Payment Settings (PayPal OR CashApp)

**Why It's Locked:**
- Estimates cannot be sent without business contact information
- Payment instructions require configured payment methods
- Professional documents need complete business details

**Features Unavailable Without Setup:**
- Creating new estimates
- Viewing existing estimates
- AI-powered estimate generation
- Sending estimates to customers
- Converting estimates to invoices

---

### 2. **Invoices** (`/business/invoices`)
**Required Setup:**
- ✅ Business Details (company name, phone, address)
- ✅ Payment Settings (PayPal OR CashApp)

**Why It's Locked:**
- Invoices must include business contact information
- Payment tracking requires payment method configuration
- Legal documents need valid business address
- Cannot process payments without payment details

**Features Unavailable Without Setup:**
- Creating new invoices
- Viewing invoice history
- Marking invoices as paid
- Sending payment links
- Revenue tracking

---

### 3. **AI Design Studio** (`/` - Canvas page)
**Required Setup:**
- ✅ Gemini API Key

**Why It's Locked:**
- AI features require Google Gemini API access
- Image processing needs valid API credentials
- Design suggestions depend on AI models
- Cannot function without API key

**Features Unavailable Without Setup:**
- Image-to-image AI edits
- Design suggestions
- Material recommendations
- AI-powered room transformations
- Smart color palette generation

---

## Lock Screen Experience

### Visual Design
When users access a locked feature, they see:

1. **Lock Header** (Red to Orange gradient)
   - 🔒 Lock icon
   - "Feature Locked" headline
   - Feature name displayed

2. **Required Setup List**
   - Each missing requirement shown as a card
   - Icon, title, and description
   - Red error indicator

3. **Action Buttons**
   - **Primary:** "Complete Setup Now" → Links to `/business/setup`
   - **Secondary:** "Back to Dashboard" → Returns to dashboard

4. **Info Box**
   - Blue informational message
   - "Setup only takes a few minutes"

### User Flow Example

```
User clicks "Estimates" in sidebar
   ↓
System checks: hasBusinessDetails? hasPaymentSettings?
   ↓ (Missing payment settings)
   ↓
Lock screen displayed
   ↓
User sees: "Payment Methods - PayPal or CashApp configuration"
   ↓
Clicks "Complete Setup Now"
   ↓
Redirected to Setup Wizard (Step 2: Payment Methods)
   ↓
Completes payment setup
   ↓
Automatically unlocked - can now access Estimates
```

---

## Technical Implementation

### FeatureLock Component

**Location:** `components/common/FeatureLock.tsx`

**Usage:**
```tsx
<FeatureLock
  requiredSetup={['businessDetails', 'paymentSettings']}
  featureName="Estimates & Invoicing"
>
  {/* Your feature content */}
</FeatureLock>
```

**Props:**
- `requiredSetup`: Array of required setup items
  - `'businessDetails'` - Company info, phone, address
  - `'paymentSettings'` - PayPal or CashApp
  - `'geminiApiKey'` - Google AI API key
- `featureName`: Display name of the locked feature
- `children`: Feature content (only rendered if setup complete)

**How It Works:**
1. Uses `useSetupStatus()` hook to check completion
2. Compares `requiredSetup` array against actual status
3. If incomplete: Shows lock screen
4. If complete: Renders children (actual feature)

---

## Setup Status Tracking

### useSetupStatus Hook

**Location:** `hooks/useSetupStatus.ts`

**Returns:**
```typescript
{
  status: {
    hasBusinessProfile: boolean,
    hasBusinessDetails: boolean,
    hasPaymentSettings: boolean,
    hasGeminiApiKey: boolean,
    hasTeamMembers: boolean,
    hasCustomers: boolean,
    isComplete: boolean,
    completionPercentage: number,
    nextStep: string
  },
  loading: boolean,
  refreshStatus: () => Promise<void>
}
```

**Checks Performed:**
1. **Business Profile:** User has `business_id` in profile
2. **Business Details:** Businesses table has `company_name`, `phone`, `address`
3. **Payment Settings:** Payment_settings has `paypal_email` OR `cashapp_cashtag`
4. **Gemini API Key:** Businesses table has `gemini_api_key`
5. **Team Members:** Team_members table has at least one member
6. **Customers:** Customers table has at least one customer

---

## Warning System

### Setup Wizard Warnings

**In-Step Warnings:**
- Displayed at top of each setup step
- Color-coded by severity:
  - 🟥 **Red:** Critical (Payment Settings)
  - 🟧 **Amber:** Required (Business Details)
  - 🟦 **Blue:** Optional (AI Features)

**Skip Confirmation Modal:**
- Appears when skipping critical steps (1 & 2)
- Lists specific features that won't work
- Two choices:
  - "Complete Setup Now" (recommended)
  - "Skip Anyway" (proceeds with warning)

### Dashboard Warnings

**SetupBanner Component:**
- Shows at top of dashboard
- Displays next incomplete step
- Progress bar and completion percentage
- Lists consequences for high-priority items
- Direct link to setup wizard

---

## Benefits

### For Users
✅ Clear understanding of why features are locked
✅ Guided path to unlock features
✅ No confusing errors when features don't work
✅ Professional-looking lock screens
✅ Quick access to setup from any locked feature

### For Business
✅ Ensures proper configuration before use
✅ Reduces support tickets from misconfiguration
✅ Professional onboarding experience
✅ Prevents incomplete/invalid documents
✅ Legal compliance (complete business info)

### For Development
✅ Reusable FeatureLock component
✅ Centralized setup status checking
✅ Easy to add new locked features
✅ Consistent lock screen design
✅ Type-safe implementation

---

## Future Enhancements

### Potential Additions
1. **Partial Feature Access**
   - Allow viewing but not creating
   - Read-only mode for some features

2. **Progressive Unlocking**
   - Tier 1: View-only access
   - Tier 2: Create with limitations
   - Tier 3: Full access

3. **Smart Reminders**
   - Email notifications for incomplete setup
   - Dashboard widget showing locked features
   - Push notifications when setup incomplete

4. **Analytics**
   - Track which features users try to access when locked
   - Measure setup completion rates
   - Identify setup friction points

---

## Maintenance

### Adding a New Locked Feature

1. Import FeatureLock:
   ```tsx
   import { FeatureLock } from './common/FeatureLock';
   ```

2. Wrap your component:
   ```tsx
   return (
     <FeatureLock
       requiredSetup={['businessDetails', 'paymentSettings']}
       featureName="Your Feature Name"
     >
       {/* Your feature content */}
     </FeatureLock>
   );
   ```

3. Update documentation (this file)

### Modifying Lock Requirements

To change what's required for a feature:
1. Update the `requiredSetup` array prop
2. Test the lock screen appears correctly
3. Update documentation

### Customizing Lock Screen

To customize the lock screen design:
1. Edit `components/common/FeatureLock.tsx`
2. Modify colors, icons, or layout
3. Keep consistent with app design system

---

## Summary

The Feature Lock system provides a **user-friendly way to enforce required setup** while giving clear guidance on how to unlock features. It prevents frustration, ensures proper configuration, and creates a professional onboarding experience.

**Key Points:**
- 🔒 3 major features protected (Estimates, Invoices, AI Studio)
- ⚠️ Clear warnings at multiple touchpoints
- 🎯 Direct links to complete setup
- ✅ Automatic unlocking when complete
- 📊 Real-time status tracking

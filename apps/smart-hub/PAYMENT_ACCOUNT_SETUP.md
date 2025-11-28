# Payment Account Setup Guide
## Cash App & PayPal for Crowdfunding Projects

This guide walks through setting up dedicated payment accounts for each turnkey business project.

---

## 🎯 Overview

Each business in the incubation pipeline needs its own payment accounts to:
1. **Receive donations** transparently
2. **Track funding progress** in real-time
3. **Build trust** with donors (they can verify the balance)

---

## 💵 Cash App Business Account Setup

### Step 1: Create a Business Cash App Account
1. Download Cash App (if not already installed)
2. Tap your profile icon → **"Business"**
3. Select **"Create a Business Account"**
4. Enter business details:
   - **Business Name**: Use the project name (e.g., "Seasonal Greetings Dayton")
   - **Business Type**: Select appropriate category
   - **EIN**: Use the LLC's EIN (already registered)

### Step 2: Set Up Your $Cashtag
1. Go to profile → **"$Cashtag"**
2. Create a memorable tag: `$SeasonalGreetingsDayton`
3. **Best Practices**:
   - Keep it short and memorable
   - Include location if relevant
   - Match the business name closely

### Step 3: Enable Business Features
1. Go to **"Business Tools"**
2. Enable:
   - ✅ **Payment Links** (for easy sharing)
   - ✅ **QR Codes** (for in-person donations)
   - ✅ **Transaction History** (for transparency)

### Step 4: Add to Database
```sql
UPDATE projects 
SET payment_cashtag = '$SeasonalGreetingsDayton'
WHERE slug = 'seasonal-greetings';
```

### Step 5: Share the Link
- **Direct Link**: `https://cash.app/$SeasonalGreetingsDayton`
- **QR Code**: Download from Cash App and add to marketing materials

---

## 💳 PayPal Business Account Setup

### Step 1: Create PayPal Business Account
1. Go to [paypal.com/business](https://www.paypal.com/business)
2. Click **"Sign Up"**
3. Select **"Business Account"**
4. Enter business information:
   - **Business Name**: "Seasonal Greetings Dayton"
   - **Business Type**: LLC
   - **EIN**: Use the registered EIN
   - **Business Email**: Create a dedicated email (e.g., `seasonalgreetings@constructivedesignsinc.org`)

### Step 2: Set Up PayPal.Me
1. Log in to PayPal Business account
2. Go to **"PayPal.Me"** in settings
3. Create your link: `paypal.me/seasonaldayton`
4. **Best Practices**:
   - Keep it short (20 characters max)
   - Make it memorable
   - Avoid special characters

### Step 3: Enable Donation Features
1. Go to **"Account Settings"** → **"Payment Preferences"**
2. Enable:
   - ✅ **PayPal Giving Fund** (optional, for tax benefits)
   - ✅ **Donation Buttons**
   - ✅ **Recurring Payments** (for future subscription features)

### Step 4: Create a Donation Button (Optional)
1. Go to **"Tools"** → **"PayPal Buttons"**
2. Select **"Donate"**
3. Customize:
   - Button text: "Support Seasonal Greetings"
   - Suggested amounts: $25, $50, $100
4. Copy the HTML code for embedding on the website

### Step 5: Add to Database
```sql
UPDATE projects 
SET payment_paypal_url = 'https://paypal.me/seasonaldayton'
WHERE slug = 'seasonal-greetings';
```

---

## 📊 Tracking Donations

### Manual Tracking (Initial Phase)
1. **Daily Check**: Log in to Cash App/PayPal daily
2. **Record Donations**: Manually update the database:
   ```sql
   INSERT INTO donations (project_id, user_id, amount, payment_method, status)
   VALUES ('project-uuid', 'user-uuid', 50.00, 'cash_app', 'completed');
   ```
3. **Issue Coins**: The database trigger will automatically create merchant coins

### Automated Tracking (Future Phase)
- **Cash App API**: Currently limited; may require manual entry
- **PayPal IPN**: Set up Instant Payment Notifications to auto-update the database
- **Webhook Integration**: Build a webhook endpoint to receive payment notifications

---

## 🔒 Security Best Practices

### Account Access
- **Dedicated Email**: Use a business email, not personal
- **2FA**: Enable two-factor authentication on both accounts
- **Password Manager**: Store credentials securely (e.g., 1Password, Bitwarden)

### Fund Management
- **Separate Accounts**: Each project gets its own Cash App/PayPal
- **Regular Transfers**: Move funds to the LLC bank account weekly
- **Audit Trail**: Keep screenshots of all transactions

---

## 📋 Checklist for Each New Project

- [ ] Register LLC and obtain EIN
- [ ] Create Cash App Business account
- [ ] Set up $Cashtag
- [ ] Create PayPal Business account
- [ ] Set up PayPal.Me link
- [ ] Update database with payment URLs
- [ ] Test donation flow (make a $1 test donation)
- [ ] Add payment links to project page
- [ ] Create QR codes for in-person donations
- [ ] Document account credentials in secure vault

---

## 🚀 Example: Complete Setup for "Seasonal Greetings"

| Field | Value |
|-------|-------|
| **Business Name** | Seasonal Greetings Dayton LLC |
| **EIN** | 12-3456789 |
| **Cash App $Cashtag** | `$SeasonalGreetingsDayton` |
| **Cash App Link** | `https://cash.app/$SeasonalGreetingsDayton` |
| **PayPal.Me** | `paypal.me/seasonaldayton` |
| **PayPal Email** | `seasonalgreetings@constructivedesignsinc.org` |
| **Database Entry** | Updated via SQL migration |

---

**Document Version**: 1.0  
**Last Updated**: November 27, 2025  
**Status**: Ready for Implementation

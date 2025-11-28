# 🔧 Business Profile Setup - Quick Fix Guide

## Issue Identified
When you log into the app, you see a banner saying "Complete Your Business Profile" but you can't interact with it or the flow is missing at the top.

## Root Cause
The **SetupBanner** component is displaying correctly, but there may be:
1. The "Complete Setup" button not being clickable
2. Navigation to `/business/setup` not working
3. The SetupWizardView not loading properly

## Quick Fix Steps

### Step 1: Manual Navigation
Try navigating directly to the setup page by typing in the browser:
```
http://localhost:5173/business/setup
```
(Replace with your actual domain if deployed)

### Step 2: Check Browser Console
1. Open browser DevTools (F12 or Right-click > Inspect)
2. Go to Console tab
3. Look for any errors when clicking "Complete Setup"
4. Share any errors you see

### Step 3: Verify Database Setup
The setup wizard needs these tables to exist in your Supabase database:

1. **businesses** table - stores company info
2. **payment_settings** table - stores payment methods
3. **api_keys** table - stores AI API keys

Check if these exist in Supabase Dashboard > Table Editor

---

## Alternative: Direct Database Setup

If the wizard won't work, you can manually set up your business profile through Supabase:

### 1. Get Your Business ID
```sql
-- In Supabase SQL Editor
SELECT business_id FROM profiles WHERE email = 'your@email.com';
```

### 2. Update Business Details
```sql
-- Replace YOUR_BUSINESS_ID with the ID from step 1
UPDATE businesses 
SET 
  company_name = 'Your Company Name',
  phone = '555-1234',
  address = '123 Main St',
  city = 'Your City',
  state = 'ST',
  zip = '12345'
WHERE id = 'YOUR_BUSINESS_ID';
```

### 3. Set Up Payment Methods
```sql
-- Replace YOUR_BUSINESS_ID
INSERT INTO payment_settings (business_id, paypal_email, cashapp_cashtag, payment_methods_enabled)
VALUES (
  'YOUR_BUSINESS_ID',
  'your@paypal.com',
  '$YourCashTag',
  '{"paypal": true, "cashapp": true}'::jsonb
)
ON CONFLICT (business_id) 
DO UPDATE SET 
  paypal_email = EXCLUDED.paypal_email,
  cashapp_cashtag = EXCLUDED.cashapp_cashtag,
  payment_methods_enabled = EXCLUDED.payment_methods_enabled;
```

### 4. Add Gemini API Key (Optional)
```sql
-- Replace YOUR_BUSINESS_ID and YOUR_API_KEY
INSERT INTO api_keys (business_id, service, api_key, is_active)
VALUES (
  'YOUR_BUSINESS_ID',
  'gemini',
  'YOUR_GEMINI_API_KEY',
  true
)
ON CONFLICT (business_id, service) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  is_active = true;
```

---

## Debugging the Banner Click Issue

If the "Complete Setup" button doesn't respond to clicks:

### Check 1: CSS z-index Issues
Open DevTools > Elements, find the button, check if anything is overlaying it.

### Check 2: Test Manual Navigation
Try this in the browser console:
```javascript
window.location.href = '/business/setup';
```

If this works, the issue is with the Link component.

### Check 3: Verify Route Definition
The route should be defined in `routes.tsx` like:
```tsx
{
  path: "setup",
  element: <SetupWizardView />,
}
```

---

## Immediate Workaround

1. **Direct URL**: Navigate to `http://localhost:5173/business/setup` in your browser
2. **Skip Banner**: Click the X button on the banner to dismiss it temporarily
3. **Use Settings**: Try going to Business Settings to update company info manually

---

## Next Steps for Support

If none of the above works, please provide:

1. **Screenshot** of the banner and any error messages
2. **Browser Console Log** (F12 > Console tab, screenshot any errors)
3. **Current URL** when you see the issue
4. **What happens** when you click "Complete Setup" (nothing? error? redirect?)

---

## Testing the Fix

Once setup is complete, you should see:
- ✅ Banner shows "100% Complete" and disappears
- ✅ Dashboard loads normally
- ✅ Can access all business features
- ✅ No blocking messages

---

## Technical Fix (For Developers)

If the SetupBanner button isn't working, add this debug code:

### In SetupBanner.tsx:
```tsx
<Link
  to={stepInfo.link}
  onClick={(e) => {
    console.log('Setup button clicked!');
    console.log('Navigating to:', stepInfo.link);
    // If navigation doesn't work, force it:
    // e.preventDefault();
    // window.location.href = stepInfo.link;
  }}
  className="flex-1 md:flex-none bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
>
  <span>Complete Setup</span>
  <span className="material-icons">arrow_forward</span>
</Link>
```

This will log when clicked and help identify if it's a routing issue or click issue.

---

Need more help? Let me know what error messages or behavior you're seeing!

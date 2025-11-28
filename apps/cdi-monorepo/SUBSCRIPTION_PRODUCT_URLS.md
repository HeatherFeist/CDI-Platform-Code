# Subscription Product URLs Guide

## 🎯 How PayPal Subscription URLs Work

Once you create your subscription plans in PayPal, you'll get **Plan IDs** that look like: `P-1AB23456CD789012E`

You can then create direct subscription links using this format:
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=YOUR_PLAN_ID
```

---

## 📋 Product Pages to Create

### **Quantum Wallet Subscriptions**

#### Premium Monthly
- **Plan Name**: Quantum Wallet Premium - Monthly
- **Price**: $9.99/month
- **Once you get the Plan ID, your URL will be**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXXXXXXXXXX
  ```
- **Use this URL for**:
  - "Subscribe" buttons in Quantum Wallet
  - Marketing emails
  - Landing pages

#### Premium Annual
- **Plan Name**: Quantum Wallet Premium - Annual
- **Price**: $99/year (Save 17%)
- **Once you get the Plan ID, your URL will be**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-YYYYYYYYYYYYYYY
  ```

---

### **Marketplace Subscriptions**

#### Basic Monthly
- **Plan Name**: Marketplace Seller Basic - Monthly
- **Price**: $19.99/month
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXXXXXXXXXX
  ```

#### Basic Annual
- **Plan Name**: Marketplace Seller Basic - Annual
- **Price**: $199/year
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-YYYYYYYYYYYYYYY
  ```

#### Pro Monthly
- **Plan Name**: Marketplace Seller Pro - Monthly
- **Price**: $49.99/month
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-ZZZZZZZZZZZZZZZ
  ```

#### Pro Annual
- **Plan Name**: Marketplace Seller Pro - Annual
- **Price**: $499/year
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-AAAAAAAAAAAAAAAA
  ```

---

### **Renovision Subscriptions**

#### Contractor Basic Monthly
- **Plan Name**: Renovision Contractor Basic - Monthly
- **Price**: $29.99/month
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXXXXXXXXXX
  ```

#### Contractor Basic Annual
- **Plan Name**: Renovision Contractor Basic - Annual
- **Price**: $299/year
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-YYYYYYYYYYYYYYY
  ```

#### Contractor Pro Monthly
- **Plan Name**: Renovision Contractor Pro - Monthly
- **Price**: $79.99/month
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-ZZZZZZZZZZZZZZZ
  ```

#### Contractor Pro Annual
- **Plan Name**: Renovision Contractor Pro - Annual
- **Price**: $799/year
- **Subscription URL**:
  ```
  https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-AAAAAAAAAAAAAAAA
  ```

---

## 🔧 How to Get Your Actual URLs

### Step 1: Create Plans in PayPal
1. Go to: https://www.paypal.com/billing/plans
2. Create each plan as outlined in `CREATE_PAYPAL_PLANS.md`

### Step 2: Get Plan IDs
After creating each plan:
1. Click on the plan
2. Look for the **Plan ID** (format: `P-XXXXXXXXXXXXX`)
3. Copy it

### Step 3: Build Your URLs
Replace the placeholder in this template:
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=YOUR_PLAN_ID_HERE
```

### Example:
If your Plan ID is `P-5ML4271244454362WXNWU5NQ`, your URL would be:
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-5ML4271244454362WXNWU5NQ
```

---

## 📱 Where to Use These URLs

### In Your Apps
```typescript
// Example: Pricing page button
<button onClick={() => {
  window.location.href = 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXX';
}}>
  Subscribe Now
</button>
```

### In Marketing Materials
- Email campaigns
- Landing pages
- Social media posts
- QR codes

### On Your Website
Create dedicated pricing pages at:
- `https://quantum-wallet-app.web.app/pricing`
- `https://cdi-marketplace-platform.web.app/pricing`
- `https://renovision.web.app/pricing`

---

## 🎨 Example Pricing Page Structure

```html
<!-- Quantum Wallet Pricing Page -->
<div class="pricing-container">
  <div class="plan-card">
    <h3>Premium Monthly</h3>
    <p class="price">$9.99/month</p>
    <ul>
      <li>✓ Unlimited transactions</li>
      <li>✓ Advanced analytics</li>
      <li>✓ Priority support</li>
    </ul>
    <a href="https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXX">
      Subscribe Now
    </a>
  </div>
  
  <div class="plan-card popular">
    <span class="badge">Save 17%</span>
    <h3>Premium Annual</h3>
    <p class="price">$99/year</p>
    <ul>
      <li>✓ Everything in Monthly</li>
      <li>✓ 2 months free</li>
    </ul>
    <a href="https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-YYYYY">
      Subscribe Now
    </a>
  </div>
</div>
```

---

## 📊 Tracking Subscriptions

After users subscribe via these URLs, PayPal will:
1. Process the subscription
2. Send webhook notifications to your app
3. Redirect users back to your return URL

You can set return URLs when creating plans:
- **Success URL**: `https://your-app.web.app/subscription/success`
- **Cancel URL**: `https://your-app.web.app/subscription/cancelled`

---

## 🔗 Quick Reference Template

Once you have your Plan IDs, fill this out:

```
QUANTUM_WALLET_MONTHLY_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
QUANTUM_WALLET_ANNUAL_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________

MARKETPLACE_BASIC_MONTHLY_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
MARKETPLACE_BASIC_ANNUAL_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
MARKETPLACE_PRO_MONTHLY_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
MARKETPLACE_PRO_ANNUAL_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________

RENOVISION_BASIC_MONTHLY_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
RENOVISION_BASIC_ANNUAL_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
RENOVISION_PRO_MONTHLY_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
RENOVISION_PRO_ANNUAL_URL=https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-_______________
```

---

## 🚀 Next Steps

1. **Create plans** in PayPal Dashboard
2. **Copy Plan IDs** from each plan
3. **Build subscription URLs** using the template above
4. **Send me the Plan IDs** and I'll:
   - Add them to your app configs
   - Build pricing pages with working subscribe buttons
   - Set up subscription tracking

---

## 💡 Pro Tips

### Custom Return URLs
You can add return URLs to the subscription link:
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXX&return_url=https://your-app.com/success&cancel_url=https://your-app.com/cancel
```

### Add Metadata
Track where subscriptions come from:
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-XXXXX&custom_id=email_campaign_2024
```

### Test First
- Create **Sandbox** plans first
- Test the complete flow
- Then create **Live** plans for production

---

**Ready to create your plans? Follow the steps in `CREATE_PAYPAL_PLANS.md` and come back with your Plan IDs!**

# 🎯 Quick Reference: Voluntary Donation System

## 💬 **Language to Use Throughout App**

### ✅ **GOOD - Use These:**
- "Voluntary donation"
- "Suggested contribution"
- "Choose your support level"
- "100% optional"
- "Tax-deductible donation"
- "Support our mission"
- "Member contribution"
- "Voluntary tip"
- "Give what feels right"
- "Your choice"

### ❌ **BAD - Never Use These:**
- "Required fee"
- "Mandatory payment"
- "Platform fee"
- "Service charge"
- "Membership dues"
- "You must pay"
- "Payment required"
- "Minimum contribution"
- "Standard rate"
- "Processing fee" (for members)

---

## 🎨 **UI Components Quick Guide**

### **Payment Flows:**
```jsx
import { VoluntaryTipSelector } from './components/shared/VoluntaryTipSelector';

<VoluntaryTipSelector
  baseAmount={projectCost}
  onTipChange={(pct, amt, total) => setTotal(total)}
  transactionType="service_payment"
  showTaxInfo={true}
/>
```

### **Dashboard Banner (Outside Users):**
```jsx
import { MembershipConversionBanner } from './components/shared/MembershipConversionBanner';

{!isMember && <MembershipConversionBanner currentMonthlyFee={29.99} />}
```

### **Check Membership Status:**
```typescript
const isMember = await supabase.rpc('is_user_nonprofit_member', { 
  p_user_id: userId 
});
```

### **Get User's Tip Percentage:**
```typescript
const tipPct = await supabase.rpc('get_user_tip_percentage', {
  p_user_id: userId
}); // Returns 15.00 or user's custom %
```

---

## 📊 **Database Quick Queries**

### **Check User's Membership:**
```sql
SELECT 
  um.status,
  mt.name,
  mt.is_nonprofit_member,
  um.custom_tip_percentage
FROM user_memberships um
JOIN membership_tiers mt ON um.tier_id = mt.id
WHERE um.user_id = 'user-uuid-here';
```

### **See All Voluntary Transactions:**
```sql
SELECT 
  transaction_type,
  base_amount,
  tip_percentage,
  tip_amount,
  total_amount,
  is_voluntary,
  user_acknowledged_voluntary
FROM donation_transactions
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### **Audit Trail (IRS Compliance):**
```sql
SELECT 
  acknowledgment_type,
  acknowledgment_text,
  acknowledged_at,
  ip_address
FROM voluntary_acknowledgments
WHERE user_id = 'user-uuid-here'
ORDER BY acknowledged_at DESC;
```

---

## 🔔 **Important Reminders**

### **For Every Payment Screen:**
1. ✅ Show blue banner if member (voluntary notice)
2. ✅ Show 0% option clearly
3. ✅ Default to 15% but make changeable
4. ✅ Calculate tax deduction preview
5. ✅ Confirm acknowledgment on first payment

### **For Signup Flow:**
1. ✅ Offer member vs outside user choice
2. ✅ Make member option recommended
3. ✅ Show benefit comparison
4. ✅ Emphasize voluntary nature
5. ✅ Log acknowledgment immediately

### **For Outside Users:**
1. ✅ Show conversion banner on dashboard
2. ✅ Calculate savings (current fees vs 15% voluntary)
3. ✅ Highlight tax benefits
4. ✅ One-click conversion process
5. ✅ Log conversion acknowledgment

---

## 📝 **Tax Receipt Template**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAX-DEDUCTIBLE DONATION RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Your Nonprofit Name]
[Address]
Tax ID (EIN): XX-XXXXXXX
501(c)(3) Tax-Exempt Organization

Date: [Transaction Date]
Receipt #: [Transaction ID]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Donor: [User Name]
Transaction: [Service/Product Description]

Base Service Value:      $XXX.XX
Voluntary Contribution:  $XX.XX (XX%)
Total Donation:          $XXX.XX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAX DEDUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The full amount of $XXX.XX is tax-deductible as a 
charitable contribution to the extent allowed by law.

No goods or services were provided in exchange for 
this donation beyond the mission-aligned services of 
our nonprofit organization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please retain this receipt for your tax records.
Consult your tax advisor for deduction eligibility.

Thank you for supporting our mission! 💙
```

---

## 🎯 **Default Settings**

- **Member Default Tip:** 15%
- **Tip Options:** 0%, 10%, 15%, 20%, 25%, Custom
- **Outside User Monthly Fee:** $29.99
- **Outside User Annual Fee:** $299.99 (17% savings)
- **Tax Bracket Assumption:** 24% (for benefit calculations)

---

## ✅ **Pre-Launch Checklist**

- [ ] Run `tax-exempt-voluntary-donation-system.sql`
- [ ] Add `VoluntaryTipSelector` to all payment flows
- [ ] Add `MembershipConversionBanner` to outside user dashboard
- [ ] Update signup with member vs outside user choice
- [ ] Create tax receipt email template
- [ ] Test $0 donation flow (must work!)
- [ ] Test outside user → member conversion
- [ ] Verify acknowledgment logging works
- [ ] Review all UI for "voluntary" language
- [ ] Remove any "required fee" or "mandatory" language
- [ ] Set up automated tax receipt emails
- [ ] Create IRS audit export (CSV of acknowledgments)

---

## 📞 **Support Scenarios**

### **"Can I use the platform without paying?"**
✅ **Members:** "Yes! All contributions are 100% voluntary. You can choose $0 and still have full access."

❌ **Outside Users:** "You have a subscription fee, but you can join as a member anytime to make all fees voluntary!"

### **"Is this tax-deductible?"**
✅ **Members:** "Yes! All your voluntary donations are tax-deductible charitable contributions. You'll receive receipts automatically."

❌ **Outside Users:** "Subscription fees are not deductible, but if you join as a member, all future contributions become tax-deductible donations!"

### **"What if I can't afford the suggested 15%?"**
✅ "No problem! Choose any percentage you're comfortable with - 10%, 5%, or even 0%. We're grateful for your membership and participation in our mission regardless of contribution amount."

---

**🎉 Keep this handy for development and support! All language must emphasize VOLUNTARY for members!**

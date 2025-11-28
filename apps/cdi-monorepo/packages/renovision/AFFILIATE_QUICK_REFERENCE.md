# 🎯 Affiliate System - Quick Reference

## The 3-Step Workflow

```
Member → Recruits → Affiliate → Submits → PM Reviews → Contractor Completes → $$$
   └─ 2% override      └─ 5% commission                                        └─ 3% platform
```

---

## 🚀 For Members (Recruiters)

### How to Recruit an Affiliate

1. Click **"Recruit Affiliate"** button in your dashboard
2. Enter affiliate email and notes
3. Copy the invitation link
4. Send to your contractor friend via text/email
5. Earn 2% override on every lead they submit!

**Earnings Potential:**
- 5 affiliates × 10 leads/month = **$2,000/mo passive income**
- 10 affiliates × 10 leads/month = **$4,000/mo passive income**
- 20 affiliates × 10 leads/month = **$8,000/mo passive income**

**Best Candidates to Recruit:**
- Plumbers who get HVAC calls
- Electricians who get plumbing calls
- Landscapers who get deck/patio calls
- General contractors who get specialty trade calls
- Anyone who turns down 10+ leads/month

---

## 💼 For Affiliates (External Contractors)

### How to Submit a Lead (30 seconds)

1. Bookmark your submission form link (from welcome email)
2. When you get a lead you can't take, open the form
3. Fill in 5 fields:
   - **Where:** Location + brief description
   - **When:** Start date/urgency
   - **How Long:** Estimated duration
   - **Pay:** Budget/estimate
   - **Notes:** Client name, contact, special requirements
4. Click "Submit Lead to Network"
5. Done! PM gets notified immediately

**Earnings Examples:**
- $20,000 kitchen remodel = **$1,000 commission** (5%)
- $15,000 bathroom remodel = **$750 commission** (5%)
- $30,000 deck build = **$1,500 commission** (5%)

**Monthly Income Potential:**
- 10 leads/month × $20k avg × 70% completion = **$7,000/mo**
- 20 leads/month × $20k avg × 70% completion = **$14,000/mo**

**Tips for Higher Completion Rates:**
- Include client contact info in notes
- Provide realistic budgets
- Submit leads immediately (don't wait)
- Quality over quantity

---

## 📋 For Project Managers

### How to Review Affiliate Leads

1. Go to **"Pending Affiliate Leads"** in PM dashboard
2. Review lead details:
   - Location, budget, timeline
   - Affiliate who submitted
   - Member who recruited affiliate
3. Choose action:
   - **Approve** → Lead goes to marketplace
   - **Reject** → Invalid/duplicate/low quality
   - **Assign** → Directly assign to specific contractor
   - **Create Competition** → Turn into multi-bid job
4. Commission automatically calculated and tracked

**Commission Breakdown:**
- **5%** → Affiliate who submitted
- **2%** → Member who recruited affiliate
- **3%** → Platform (covers PM time, software, support)
- **Total:** 10% fee on completed job value

---

## 💰 Commission Calculation Examples

### Example 1: $20,000 Kitchen Remodel
```
Job Value: $20,000
├─ Affiliate Commission: $1,000 (5%)
├─ Member Override: $400 (2%)
└─ Platform Fee: $600 (3%)
Total Fee: $2,000 (10%)
```

### Example 2: $50,000 Home Addition
```
Job Value: $50,000
├─ Affiliate Commission: $2,500 (5%)
├─ Member Override: $1,000 (2%)
└─ Platform Fee: $1,500 (3%)
Total Fee: $5,000 (10%)
```

### Example 3: $10,000 Bathroom Remodel
```
Job Value: $10,000
├─ Affiliate Commission: $500 (5%)
├─ Member Override: $200 (2%)
└─ Platform Fee: $300 (3%)
Total Fee: $1,000 (10%)
```

---

## 🎨 Component Files Reference

### Frontend Components

| File | Purpose | Route |
|------|---------|-------|
| `AffiliateLeadSubmissionForm.tsx` | Affiliates submit leads | `/affiliate/submit?affiliate_id=xxx` |
| `AffiliateSignupForm.tsx` | New affiliate onboarding | `/affiliate/signup?affiliate_id=xxx` |
| `AffiliateDashboard.tsx` | Affiliate earnings portal | `/affiliate/dashboard?affiliate_id=xxx` |
| `RecruitAffiliateButton.tsx` | Member recruiting modal | Component in member dashboard |
| `MemberAffiliatesTab.tsx` | Member override earnings | Tab in member dashboard |
| `PMDashboardPendingLeads.tsx` | PM lead review dashboard | `/dashboard/pm/pending-leads` |

### Backend Files

| File | Purpose |
|------|---------|
| `member-driven-affiliate-recruitment.sql` | Complete database schema |
| `affiliate-instant-submit-helpers.sql` | Helper SQL functions |
| `submit-affiliate-lead/index.ts` | Edge Function for processing submissions |

---

## 📊 Database Tables

### `affiliate_partnerships`
Stores recruited affiliates and their status.

**Key Columns:**
- `affiliate_id` - Unique identifier (format: `af_12345678_username`)
- `recruited_by_member_id` - Member who recruited them
- `business_name` - Affiliate's company name
- `email` - Affiliate contact email
- `status` - `pending`, `active`, `inactive`
- `total_leads_submitted` - Running count
- `total_leads_completed` - Running count

### `affiliate_commissions`
Tracks earnings for each completed job.

**Key Columns:**
- `job_id` - References `sub_opportunities.id`
- `affiliate_id` - Who submitted the lead
- `recruiting_member_id` - Who gets override
- `job_value` - Total job amount
- `affiliate_commission_amount` - 5% to affiliate
- `override_amount` - 2% to recruiting member
- `platform_fee` - 3% to platform
- `status` - `pending`, `paid`

### `sub_opportunities` (Updated)
Existing table with new affiliate tracking columns.

**New Columns:**
- `is_affiliate_referral` - Boolean flag
- `affiliate_id` - Who submitted
- `recruiting_member_id` - Who recruited affiliate
- `affiliate_commission_rate` - Percentage (default 5%)

---

## 🔍 SQL Functions Reference

### `create_affiliate_invitation()`
Creates new affiliate partnership and generates invitation link.

**Usage:**
```sql
SELECT create_affiliate_invitation(
  'member_uuid',
  'affiliate@example.com',
  'Friend from plumbing trade'
);
```

**Returns:** Affiliate ID (format: `af_12345678_username`)

### `activate_affiliate_partnership()`
Activates pending affiliate after signup completion.

**Usage:**
```sql
SELECT activate_affiliate_partnership(
  'af_12345678_username',
  'business_name',
  'phone'
);
```

### `submit_affiliate_lead_instant()`
Alternative to Edge Function for direct database submission.

**Usage:**
```sql
SELECT submit_affiliate_lead_instant(
  'af_12345678_username',
  'Kitchen Remodel',
  'Seattle, WA',
  '2-3 weeks',
  25000,
  'Client: John Doe, 555-5678'
);
```

### `get_affiliate_dashboard_stats()`
Loads complete stats for affiliate dashboard.

**Usage:**
```sql
SELECT * FROM get_affiliate_dashboard_stats('af_12345678_username');
```

**Returns:** Stats object with earnings, submissions, completion rate

### `get_member_affiliate_recruiting_stats()`
Loads override earnings and network performance for members.

**Usage:**
```sql
SELECT * FROM get_member_affiliate_recruiting_stats('member_uuid');
```

**Returns:** Network stats, total override, monthly projection

---

## 🛡️ Security & Permissions

### Row Level Security (RLS)

**Affiliates can:**
- ✅ View their own partnership record
- ✅ View their own commissions
- ✅ Submit leads (via RPC function)
- ❌ Cannot see other affiliates' data

**Members can:**
- ✅ View affiliates they recruited
- ✅ View their override earnings
- ✅ Create new affiliate invitations
- ❌ Cannot see other members' affiliates

**Project Managers can:**
- ✅ View all pending affiliate leads
- ✅ Approve/reject/assign leads
- ✅ View all commission records
- ✅ Generate commission reports

**Admins can:**
- ✅ Full access to all tables
- ✅ Modify commission rates
- ✅ Generate system-wide reports

---

## 📧 Email Notifications

### When Affiliate Submits Lead
**To:** Project Manager assigned to territory
**Subject:** 🎯 New Affiliate Lead: [Location]
**Contains:**
- Lead details (location, budget, timeline)
- Affiliate business name
- Recruiting member name
- Quick approve/reject links

### When Affiliate Signs Up
**To:** Recruiting member
**Subject:** 🎉 [Business Name] joined your affiliate network!
**Contains:**
- Affiliate business name
- Submission form link to share
- Earnings potential reminder

### Monthly Commission Statement
**To:** Affiliate + Recruiting Member
**Subject:** 💰 Your [Month] Commission Statement
**Contains:**
- Total earned this month
- Breakdown by job
- Pending commissions
- YTD totals

---

## 📱 User Flows

### Flow 1: Member Recruits Affiliate

```
1. Member clicks "Recruit Affiliate" button
2. Enters affiliate email and notes
3. System generates unique affiliate_id
4. Member copies invitation link
5. Member texts/emails link to contractor friend
```

### Flow 2: Affiliate Signs Up

```
1. Affiliate clicks invitation link
2. Sees recruiting member name and greeting
3. Fills in business name, phone
4. Clicks "Complete Signup"
5. Status changes from 'pending' to 'active'
6. Sees success screen with submission form link
7. Bookmarks submission form for future use
```

### Flow 3: Affiliate Submits Lead

```
1. Affiliate gets lead they can't take
2. Opens bookmarked submission form
3. Fills 5 fields (30 seconds)
4. Clicks "Submit Lead"
5. Edge Function processes submission
6. PM receives email notification
7. Lead appears in PM dashboard
8. Affiliate stats updated (submission count +1)
```

### Flow 4: PM Reviews Lead

```
1. PM checks "Pending Affiliate Leads" dashboard
2. Reviews lead details
3. Chooses action:
   a. Approve → Opens to marketplace
   b. Reject → Removes from queue
   c. Assign → Directly assign to contractor
   d. Create Competition → Multi-bid job
4. Commission record created automatically
```

### Flow 5: Job Completes & Commission Paid

```
1. Assigned contractor completes job
2. Job marked as 'completed' in system
3. Commission calculated:
   - 5% to affiliate
   - 2% to recruiting member
   - 3% to platform
4. Commission status: 'pending'
5. On payout date (1st of month):
   - Payments processed
   - Commission status: 'paid'
   - Email statements sent
6. Stats updated across all dashboards
```

---

## 🎯 Success Metrics

### For Affiliates
- **Submission count** - How many leads submitted
- **Completion rate** - Percentage that close
- **Total earnings** - Lifetime commission
- **Avg commission** - Per completed lead
- **Monthly projection** - Based on current pace

### For Members
- **Affiliates recruited** - Total count
- **Active affiliates** - Submitted in last 30 days
- **Override earned** - Lifetime passive income
- **Pending override** - Awaiting payout
- **Network performance** - Combined completion rate
- **Monthly projection** - Based on network activity

### For Platform
- **Total affiliates** - System-wide
- **Active affiliates** - Submitted in last 30 days
- **Total leads** - Submitted via affiliates
- **Completion rate** - Percentage closed
- **Total job value** - Completed jobs
- **Total commission** - Paid out
- **Platform revenue** - 3% fee collected

---

## 🆘 Quick Troubleshooting

### "I can't see my dashboard"
- Ensure you're using the link with `?affiliate_id=xxx` parameter
- Check localStorage for saved affiliate_id
- Verify partnership status is 'active' in database

### "My submission didn't go through"
- Check browser console for errors
- Verify all 5 fields are filled
- Ensure affiliate_id is valid
- Check Edge Function logs

### "I'm not earning override"
- Verify affiliate activated their partnership
- Confirm they're using submission form with your affiliate_id
- Check job status is 'completed'
- Review commission record in database

### "Email notifications not working"
- Verify email service API key set correctly
- Check spam folder
- Confirm PM email address is valid
- Review Edge Function email logs

---

## 📞 Support Contacts

| User Type | Email | Purpose |
|-----------|-------|---------|
| Affiliates | affiliates@constructivedesignsinc.org | Submission issues, commission questions |
| Members | support@constructivedesignsinc.org | Recruiting help, override earnings |
| Project Managers | pm@constructivedesignsinc.org | Lead review, assignment issues |
| Technical | tech@constructivedesignsinc.org | Bugs, feature requests |

---

## 🚀 Quick Start Commands

### Deploy Edge Function
```powershell
supabase functions deploy submit-affiliate-lead
```

### Set Environment Variables
```powershell
supabase secrets set SUPABASE_URL="https://xxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_key"
supabase secrets set RESEND_API_KEY="your_key"
```

### Test Submission
```powershell
curl -X POST "https://xxx.supabase.co/functions/v1/submit-affiliate-lead" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "affiliate_id": "test_id",
    "title": "Test Lead",
    "location": "Seattle",
    "duration": "1 week",
    "client_budget": 10000,
    "notes": "Test submission"
  }'
```

### Run SQL Migrations
```sql
-- In Supabase SQL Editor:
-- 1. Run member-driven-affiliate-recruitment.sql
-- 2. Run affiliate-instant-submit-helpers.sql
-- 3. Verify tables created
```

---

## ✅ Launch Checklist

- [ ] SQL migrations executed
- [ ] Edge Function deployed
- [ ] Email service configured
- [ ] Routes added to app
- [ ] RLS policies verified
- [ ] End-to-end test completed
- [ ] Support emails set up
- [ ] Member announcement drafted
- [ ] Recruiting materials prepared
- [ ] Analytics dashboard created

**You're ready to launch!** 🎉

# 🚀 Affiliate System Deployment Guide

## ✅ Phase 1 & 2 Complete!

All core components are built and ready for deployment. This guide will walk you through setting up the system in production.

---

## 📋 Pre-Deployment Checklist

### ✅ Files Created (All Complete)
- [x] `AffiliateLeadSubmissionForm.tsx` - Instant lead submission form
- [x] `submit-affiliate-lead/index.ts` - Edge Function for processing
- [x] `AffiliateSignupForm.tsx` - Onboarding for new affiliates
- [x] `RecruitAffiliateButton.tsx` - Member recruiting modal
- [x] `PMDashboardPendingLeads.tsx` - PM lead review dashboard
- [x] `AffiliateDashboard.tsx` - Affiliate earnings portal
- [x] `MemberAffiliatesTab.tsx` - Member override earnings view
- [x] `member-driven-affiliate-recruitment.sql` - Complete database schema
- [x] `affiliate-instant-submit-helpers.sql` - Helper functions

---

## 🗄️ Step 1: Database Setup

### Run SQL Migrations in Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor**

2. **Execute Schema Migration**
   ```sql
   -- Copy contents of member-driven-affiliate-recruitment.sql
   -- Paste into SQL Editor
   -- Click "Run" button
   ```

3. **Execute Helper Functions**
   ```sql
   -- Copy contents of affiliate-instant-submit-helpers.sql
   -- Paste into SQL Editor
   -- Click "Run" button
   ```

4. **Verify Tables Created**
   - Go to **Table Editor**
   - Confirm these tables exist:
     - `affiliate_partnerships`
     - `affiliate_commissions`
     - `subscription_tiers`
   - Confirm `sub_opportunities` has new columns:
     - `is_affiliate_referral`
     - `affiliate_id`
     - `recruiting_member_id`
     - `affiliate_commission_rate`

5. **Test SQL Functions**
   ```sql
   -- Test affiliate dashboard stats function
   SELECT * FROM get_affiliate_dashboard_stats('test_id');
   
   -- Test member recruiting stats function
   SELECT * FROM get_member_affiliate_recruiting_stats('your_member_id');
   ```

---

## 🔧 Step 2: Edge Function Deployment

### Deploy the Lead Submission Function

1. **Install Supabase CLI** (if not already installed)
   ```powershell
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```powershell
   supabase login
   ```

3. **Link to Your Project**
   ```powershell
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Find your project ref in Supabase Dashboard > Project Settings > General

4. **Deploy Edge Function**
   ```powershell
   supabase functions deploy submit-affiliate-lead
   ```

5. **Set Environment Variables**
   ```powershell
   supabase secrets set SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   supabase secrets set RESEND_API_KEY="your_resend_api_key"
   ```

6. **Test Edge Function**
   ```powershell
   curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-affiliate-lead" `
     -H "Authorization: Bearer YOUR_ANON_KEY" `
     -H "Content-Type: application/json" `
     -d '{
       "affiliate_id": "test_id",
       "title": "Kitchen Remodel",
       "location": "Seattle, WA",
       "duration": "2-3 weeks",
       "client_budget": 25000,
       "notes": "Test submission"
     }'
   ```

---

## 📧 Step 3: Email Service Setup

### Option A: Resend (Recommended)

1. **Sign up at https://resend.com**
   - Free tier: 3,000 emails/month
   - $20/mo: 50,000 emails/month

2. **Create API Key**
   - Dashboard > API Keys > Create
   - Copy key and add to Edge Function secrets:
     ```powershell
     supabase secrets set RESEND_API_KEY="re_..."
     ```

3. **Verify Domain** (optional but recommended)
   - Dashboard > Domains > Add Domain
   - Follow DNS setup instructions
   - Use verified domain in email "from" address

4. **Update Edge Function**
   - Open `submit-affiliate-lead/index.ts`
   - Uncomment email sending code (search for "UNCOMMENT FOR PRODUCTION")
   - Replace `no-reply@constructivedesignsinc.org` with your verified domain

### Option B: SendGrid

1. **Sign up at https://sendgrid.com**
   - Free tier: 100 emails/day
   - $15/mo: 40,000 emails/month

2. **Create API Key**
   - Settings > API Keys > Create API Key
   - Full Access > Create & View
   - Copy key

3. **Update Edge Function**
   - Replace Resend code with SendGrid code:
   ```typescript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));
   
   await sgMail.send({
     to: pmEmail,
     from: 'no-reply@your-domain.com',
     subject: emailSubject,
     html: emailBody
   });
   ```

---

## 🎨 Step 4: Frontend Integration

### Add Routes to Your App

1. **Update `routes.tsx`**
   ```tsx
   import AffiliateLeadSubmissionForm from '@/components/AffiliateLeadSubmissionForm';
   import AffiliateSignupForm from '@/components/AffiliateSignupForm';
   import AffiliateDashboard from '@/components/AffiliateDashboard';
   import MemberAffiliatesTab from '@/components/MemberAffiliatesTab';
   import PMDashboardPendingLeads from '@/components/PMDashboardPendingLeads';

   // Add these routes:
   {
     path: '/affiliate/submit',
     element: <AffiliateLeadSubmissionForm />
   },
   {
     path: '/affiliate/signup',
     element: <AffiliateSignupForm />
   },
   {
     path: '/affiliate/dashboard',
     element: <AffiliateDashboard />
   },
   {
     path: '/dashboard/pm/pending-leads',
     element: <PMDashboardPendingLeads />,
     // Protect with role check
   },
   {
     path: '/dashboard/member/affiliates',
     element: <MemberAffiliatesTab />,
     // Show as tab in member dashboard
   }
   ```

2. **Add "Recruit Affiliate" Button to Member Dashboard**
   ```tsx
   import RecruitAffiliateButton from '@/components/RecruitAffiliateButton';

   // In your member dashboard component:
   <div className="flex justify-between">
     <h2>My Dashboard</h2>
     <RecruitAffiliateButton />
   </div>
   ```

3. **Add "Pending Leads" Link to PM Dashboard**
   ```tsx
   // In PM navigation:
   <Link to="/dashboard/pm/pending-leads">
     Pending Affiliate Leads
   </Link>
   ```

4. **Add "My Affiliates" Tab to Member Dashboard**
   ```tsx
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import MemberAffiliatesTab from '@/components/MemberAffiliatesTab';

   <Tabs defaultValue="overview">
     <TabsList>
       <TabsTrigger value="overview">Overview</TabsTrigger>
       <TabsTrigger value="jobs">My Jobs</TabsTrigger>
       <TabsTrigger value="affiliates">My Affiliates</TabsTrigger>
     </TabsList>
     
     <TabsContent value="overview">
       {/* Existing dashboard content */}
     </TabsContent>
     
     <TabsContent value="jobs">
       {/* Existing jobs content */}
     </TabsContent>
     
     <TabsContent value="affiliates">
       <MemberAffiliatesTab />
     </TabsContent>
   </Tabs>
   ```

---

## 🧪 Step 5: Testing the Complete Workflow

### Test Case 1: Member Recruits Affiliate

1. **Login as Member**
   - Go to your member dashboard
   - Click "Recruit Affiliate" button

2. **Generate Invitation**
   - Enter affiliate email: `test.affiliate@example.com`
   - Enter notes: "Friend from plumbing trade"
   - Click "Generate Invitation Link"

3. **Copy Invitation Link**
   - Should look like: `https://yourapp.com/affiliate/signup?affiliate_id=af_12345678_yourusername`
   - Click "Copy Link" button

4. **Verify Database Entry**
   ```sql
   SELECT * FROM affiliate_partnerships
   WHERE recruited_by_member_id = 'your_member_id'
   AND status = 'pending';
   ```

### Test Case 2: Affiliate Signup

1. **Open Invitation Link**
   - Paste the invitation URL in a new browser window
   - Should see affiliate signup form

2. **Complete Signup**
   - Fill in business name: "Test Plumbing Co"
   - Fill in email: `test.affiliate@example.com`
   - Fill in phone: "555-1234"
   - Click "Complete Signup"

3. **Verify Activation**
   ```sql
   SELECT * FROM affiliate_partnerships
   WHERE email = 'test.affiliate@example.com'
   AND status = 'active';
   ```

4. **Bookmark Submission Form**
   - After signup, affiliate sees success screen with submission form link
   - Save link for future use

### Test Case 3: Affiliate Submits Lead

1. **Open Submission Form**
   - Go to: `https://yourapp.com/affiliate/submit?affiliate_id=af_12345678_yourusername`

2. **Fill Out Form**
   - **Where:** "Seattle, WA - Bathroom remodel"
   - **When:** "ASAP - Next 2 weeks"
   - **How Long:** "2-3 weeks"
   - **Pay:** "20000"
   - **Notes:** "Full bathroom gut and remodel. Client is ready to start. Contact: John Doe, 555-5678"

3. **Submit Lead**
   - Click "Submit Lead to Network"
   - Should see success message
   - Check email (PM should receive notification)

4. **Verify Database Entry**
   ```sql
   SELECT * FROM sub_opportunities
   WHERE is_affiliate_referral = true
   AND affiliate_id = 'af_12345678_yourusername'
   AND status = 'pending_pm_review';
   ```

### Test Case 4: PM Reviews Lead

1. **Login as Project Manager**
   - Go to PM dashboard
   - Navigate to "Pending Affiliate Leads"

2. **Review Lead**
   - Should see the submitted lead with all details
   - Stats should show: 1 pending lead, $20,000 total value

3. **Approve Lead**
   - Click "Approve" button
   - Lead status changes to "open"
   - Confirm commission record created:
   ```sql
   SELECT * FROM affiliate_commissions
   WHERE affiliate_id = 'af_12345678_yourusername'
   AND status = 'pending';
   ```

### Test Case 5: Track Commission

1. **Assign Job to Contractor**
   - From PM dashboard, assign lead to a contractor
   - Contractor completes the job

2. **Mark Job Complete**
   - Update job status to "completed"
   - Verify commission calculation:
   ```sql
   SELECT 
     job_value,
     affiliate_commission_amount, -- Should be 5% ($1,000)
     override_amount, -- Should be 2% ($400)
     platform_fee -- Should be 3% ($600)
   FROM affiliate_commissions
   WHERE affiliate_id = 'af_12345678_yourusername';
   ```

3. **Check Affiliate Dashboard**
   - Open affiliate dashboard
   - Should show:
     - Total earnings: $1,000
     - Completion rate: 100%
     - Recent lead with "Completed" status

4. **Check Member Override Dashboard**
   - Login as recruiting member
   - Go to "My Affiliates" tab
   - Should show:
     - Override earned: $400
     - 1 active affiliate
     - 1 completed submission

---

## 🔐 Step 6: Security & RLS Policies

### Verify Row Level Security

1. **Check RLS Enabled**
   ```sql
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('affiliate_partnerships', 'affiliate_commissions', 'sub_opportunities');
   ```
   All should show `rowsecurity = true`

2. **Test RLS Policies**
   - Login as different users
   - Confirm they can only see their own data
   - Test affiliate can't see other affiliates' earnings
   - Test members can only see their own recruited affiliates

3. **Test Edge Function Authorization**
   ```powershell
   # Should fail without auth token:
   curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-affiliate-lead" `
     -H "Content-Type: application/json" `
     -d '{"affiliate_id": "test"}'
   ```

---

## 📊 Step 7: Analytics & Monitoring

### Set Up Tracking

1. **Create Analytics Dashboard in Supabase**
   ```sql
   -- Total affiliates recruited
   SELECT COUNT(*) FROM affiliate_partnerships;
   
   -- Active affiliates (submitted in last 30 days)
   SELECT COUNT(DISTINCT affiliate_id)
   FROM sub_opportunities
   WHERE is_affiliate_referral = true
   AND created_at > NOW() - INTERVAL '30 days';
   
   -- Total commission paid
   SELECT SUM(affiliate_commission_amount + override_amount + platform_fee)
   FROM affiliate_commissions
   WHERE status = 'paid';
   
   -- Top performers
   SELECT 
     ap.business_name,
     COUNT(*) as leads_submitted,
     SUM(ac.affiliate_commission_amount) as total_earned
   FROM affiliate_partnerships ap
   JOIN affiliate_commissions ac ON ap.affiliate_id = ac.affiliate_id
   GROUP BY ap.business_name
   ORDER BY total_earned DESC
   LIMIT 10;
   ```

2. **Set Up Email Notifications**
   - Weekly summary to admins
   - Monthly commission statements
   - New affiliate signup alerts

3. **Monitor Edge Function Logs**
   ```powershell
   supabase functions logs submit-affiliate-lead
   ```

---

## 🎉 Step 8: Launch & Marketing

### Launch Checklist

- [ ] All SQL migrations run successfully
- [ ] Edge Function deployed and tested
- [ ] Email service configured and tested
- [ ] All routes added to app
- [ ] RLS policies verified
- [ ] Test workflow completed end-to-end
- [ ] Analytics dashboard created
- [ ] Support email set up (affiliates@constructivedesignsinc.org)

### Initial Rollout Strategy

1. **Phase 1: Soft Launch (Week 1-2)**
   - Invite 5-10 trusted members to recruit affiliates
   - Monitor for bugs/issues
   - Gather feedback on UX
   - Adjust commission rates if needed

2. **Phase 2: Member Announcement (Week 3-4)**
   - Send email to all members explaining system
   - Include earnings calculator
   - Provide recruiting script/template
   - Host Q&A webinar

3. **Phase 3: Scale (Month 2+)**
   - Add "Recruit Affiliate" CTA to member dashboard
   - Create recruiting leaderboard
   - Bonus for first 100 affiliates recruited
   - Share success stories

### Marketing Materials

**Email Template for Members:**
```
Subject: 💰 Earn $4,000/mo Passive Income by Recruiting Affiliates

Hey [Member Name],

We just launched a game-changing feature: Earn 2% override on EVERY lead submitted by contractors you recruit.

Here's how it works:
1. You know a plumber, electrician, landscaper, etc.
2. They get leads they can't take (wrong area, too busy, etc.)
3. They submit those leads in 30 seconds
4. When the lead completes, they earn 5%, you earn 2% override

Real Example:
Recruit 5 active affiliates → Each submits 10 leads/month → $2,000/mo passive income for you!

Click here to generate your first invitation link:
[Link to Recruit Affiliate Button]

Questions? Reply to this email or join our webinar on [Date].

To your success,
[Your Team]
```

**Social Media Post:**
```
🚀 NEW: Turn referrals into passive income!

Know a contractor who gets leads outside their service area? Refer them to our network and earn 2% override on every lead they submit.

They earn 5%, you earn 2%, everyone wins.

5 active affiliates = $2,000/mo passive income 💰

Sign up: [Link]
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Edge Function returns 500 error**
- Check logs: `supabase functions logs submit-affiliate-lead`
- Verify environment variables set correctly
- Test database connection from function

**Issue: Emails not sending**
- Verify API key is correct
- Check email service dashboard for delivery logs
- Ensure "from" email is verified domain

**Issue: Affiliate can't see dashboard**
- Verify `affiliate_id` is in URL: `?affiliate_id=af_12345678_username`
- Check localStorage: `localStorage.getItem('affiliate_id')`
- Verify affiliate partnership status is "active"

**Issue: Commission not calculating correctly**
- Check `affiliate_commission_rate` in `affiliate_partnerships` table
- Verify `create_affiliate_commission()` function logic
- Test manually: `SELECT create_affiliate_commission('job_id', 'affiliate_id', 20000, 5);`

**Issue: RLS policy blocking access**
- Check user auth token
- Verify user ID matches `recruited_by_member_id` or `affiliate_id`
- Test with service role key (bypasses RLS)

---

## 📞 Support

### For Affiliates
- Email: affiliates@constructivedesignsinc.org
- FAQ: https://yourapp.com/affiliate/faq

### For Members
- Email: support@constructivedesignsinc.org
- Recruiting guide: https://yourapp.com/docs/recruiting

### For Project Managers
- Email: pm@constructivedesignsinc.org
- Lead review guide: https://yourapp.com/docs/pm-review

---

## 🎯 Success Metrics

Track these KPIs weekly:

- **Total affiliates recruited**
- **Active affiliates (submitted in last 30 days)**
- **Total leads submitted**
- **Lead completion rate**
- **Total commission paid**
- **Average commission per lead**
- **Top recruiting members**
- **Top performing affiliates**

Goal Targets (90 days):
- 50+ affiliates recruited
- 30+ active affiliates
- 300+ leads submitted
- 70%+ completion rate
- $200,000+ in completed job value
- $20,000+ in total commissions paid

---

## 🚀 Next Steps After Launch

### Feature Enhancements (Optional)

1. **Automated Payout System**
   - Integrate with Stripe Connect or PayPal
   - Automatic commission payouts on 1st of month
   - Payout history and tax documents

2. **Affiliate Leaderboard**
   - Monthly rankings by earnings
   - Badges for milestones (10 leads, 50 leads, 100 leads)
   - Public profile pages

3. **Mobile App**
   - Native iOS/Android apps
   - Push notifications for lead status updates
   - Voice-to-text optimized for mobile

4. **Advanced Analytics**
   - Earnings charts (monthly, quarterly, yearly)
   - Conversion funnel tracking
   - Lead source attribution

5. **Recruiting Tools**
   - Pre-written email templates
   - Social media sharing buttons
   - Referral landing pages
   - Recruiting script generator

---

## ✅ Deployment Complete!

You're ready to launch! 🎉

**Quick Start Command:**
```powershell
# Deploy everything:
supabase functions deploy submit-affiliate-lead
supabase secrets set RESEND_API_KEY="your_key"

# Test it:
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/submit-affiliate-lead" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"affiliate_id":"test","title":"Test Lead","location":"Seattle","duration":"1 week","client_budget":10000,"notes":"Test"}'
```

Good luck with your launch! 🚀

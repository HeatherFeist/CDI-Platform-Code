# 🔐 Workspace Account Creation Guide

## Overview

When a user chooses **FREE MEMBERSHIP**, the system automatically:
1. ✅ Generates their workspace email: `firstname.lastname@constructivedesignsinc.org`
2. ✅ Adds entry to `workspace_account_log` with status='pending'
3. ✅ YOU then create the actual Google Workspace account

---

## Phase 1: Manual Creation (LAUNCH - First 50 Members)

### Why Manual First?
- ✅ Verify each member personally (quality control)
- ✅ No dependency on Google API setup
- ✅ Can launch TODAY
- ✅ Build trust with founding members
- ✅ Takes 30 seconds per member

### Step-by-Step Process:

#### **1. Check Pending Queue**

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM pending_workspace_accounts;
```

**You'll see:**
```
profile_id  | first_name | last_name | workspace_email                      | days_pending
------------|------------|-----------|--------------------------------------|-------------
uuid-123... | John       | Smith     | john.smith@constructivedesignsinc.org| 0
uuid-456... | Sarah      | Johnson   | sarah.johnson@constructivedesignsinc.org | 1
```

#### **2. Create Account in Google Admin**

1. Go to: https://admin.google.com
2. Click **Users** (left sidebar)
3. Click **Add new user** button
4. Fill in:
   - **First name:** John
   - **Last name:** Smith
   - **Primary email:** john.smith@constructivedesignsinc.org *(copy from query)*
   - **Secondary email:** *(their personal email from query)*
   - **Password:** Generate strong password (or use pattern like: `CDInc2025!FirstName`)
   - **Organizational unit:** Members *(or whatever structure you set up)*
5. Click **Add new user**
6. ✅ **Copy the password** (you'll email it to them)

#### **3. Send Welcome Email**

Email template:
```
Subject: Welcome to Constructive Designs Inc! 🎉

Hi John,

Welcome to the Constructive Designs Inc community!

Your professional workspace account has been created:

Email: john.smith@constructivedesignsinc.org
Temporary Password: [password here]

Access your account:
- Gmail: https://mail.google.com
- Google Drive: https://drive.google.com
- Calendar: https://calendar.google.com

Important: Please change your password on first login.

Your workspace email gives you access to:
✅ Professional contractor directory
✅ Project collaboration tools
✅ Marketplace for materials
✅ Member network and resources

Questions? Reply to this email.

Welcome aboard!
- Heath
Constructive Designs Inc
```

#### **4. Mark as Complete in Database**

Run this query in Supabase:
```sql
SELECT mark_workspace_account_created('uuid-123-from-pending-queue');
```

This updates the log to 'active' and marks profile.workspace_account_created = true.

#### **5. Repeat for Next Member**

Total time per member: **2-3 minutes**

---

## Phase 2: Automated Creation (AFTER FIRST MONTH)

### When to Automate:
- ✅ After first 50 members (proven model)
- ✅ When you have consistent signups daily
- ✅ Once Google Workspace API is set up

### How Automation Works:

```
User signs up → Chooses FREE → accept_free_membership() called
                                          ↓
                         workspace_email generated
                                          ↓
                         Edge Function triggered
                                          ↓
                     Google Workspace API creates account
                                          ↓
                         Auto-email sent with credentials
                                          ↓
                                   DONE (30 seconds)
```

### Setup Required:
1. Create Google Cloud service account
2. Enable Admin SDK API
3. Configure domain-wide delegation
4. Deploy Supabase Edge Function
5. Store credentials in Supabase Vault

**Guide:** See `AUTO-PROVISION-WORKSPACE-GUIDE.md` for complete setup.

---

## Phase 3: Google Sign-In Integration (FUTURE)

### Ultimate UX:
```
User clicks "Sign up with Google"
                ↓
        Google creates workspace account
                ↓
        Supabase profile created automatically
                ↓
        ONE account, seamless access
```

This is the long-term goal, but NOT required for launch!

---

## Quick Reference Commands

### See pending accounts:
```sql
SELECT * FROM pending_workspace_accounts;
```

### Mark account as created:
```sql
SELECT mark_workspace_account_created('profile-uuid-here');
```

### See all active workspace accounts:
```sql
SELECT 
    first_name,
    last_name,
    workspace_email,
    workspace_account_created,
    membership_accepted_at
FROM profiles
WHERE membership_type = 'free_member'
    AND workspace_email IS NOT NULL
ORDER BY membership_accepted_at DESC;
```

### Check workspace account stats:
```sql
SELECT 
    COUNT(*) FILTER (WHERE workspace_account_created = true) as accounts_created,
    COUNT(*) FILTER (WHERE workspace_account_created = false OR workspace_account_created IS NULL) as pending_creation,
    COUNT(*) as total_free_members
FROM profiles
WHERE membership_type = 'free_member';
```

---

## Troubleshooting

### "Workspace email already exists in Google"
- Someone signed up with same first.last name combo
- Check pending queue for duplicates
- Manually adjust: `first.middle.last@...` or `first.last2@...`
- Update in database:
  ```sql
  UPDATE profiles 
  SET workspace_email = 'adjusted.email@constructivedesignsinc.org'
  WHERE id = 'profile-uuid';
  ```

### "Can't create more users (quota exceeded)"
- Google for Nonprofits = UNLIMITED users
- If you see this, verify nonprofit status is active
- Check: admin.google.com > Billing

### "User requests password reset"
- Go to admin.google.com > Users
- Click their name
- Click "Reset password"
- Send them new temporary password

---

## Best Practices

### During Manual Phase (First 50):
1. ✅ Check pending queue **daily** (morning routine)
2. ✅ Batch create 5-10 at once (efficient)
3. ✅ Personalize welcome emails (builds trust)
4. ✅ Follow up after 2 days (make sure they logged in)
5. ✅ Get feedback on onboarding experience

### Security:
- ✅ Use strong temporary passwords
- ✅ Require password change on first login
- ✅ Enable 2FA for workspace accounts (optional but recommended)
- ✅ Never share credentials publicly

### Quality Control:
- ✅ Verify business license if provided
- ✅ Check if email/name seems legitimate
- ✅ Google their business name (quick sanity check)
- ✅ If suspicious, contact them first before creating account

---

## The Why Behind Manual-First

**Traditional Approach:**
```
Build automation first → Launch → Hope it works → Deal with bugs → Lose trust
```

**Your Approach:**
```
Launch with manual process → Prove it works → Get testimonials → THEN automate
```

**Benefits:**
- ✅ You meet every founding member personally
- ✅ They feel VIP (personal welcome email from founder)
- ✅ You catch quality issues early
- ✅ You understand workflow before automating
- ✅ No risk of automation bugs ruining launch

**After 50 manual creations:**
- You'll know the process cold
- You'll have refined the welcome email
- You'll have established trust
- You'll have testimonials for scaling
- **Then automation is just removing YOUR labor, not adding risk**

---

## Timeline Estimate

### Manual Phase:
- **Day 1:** 5 signups → 15 minutes to create accounts
- **Week 1:** 20 signups → 1 hour total
- **Week 2:** 30 signups → 90 minutes total
- **Month 1:** 100 signups → 5 hours total spread over 30 days

**5 hours over a month = totally manageable**

**And you get:**
- 100 verified, happy members
- 100 personal connections
- 100 potential testimonials
- Proven model ready to scale

**Worth it? Absolutely.** ✅

---

## When to Automate

### Signs you're ready:
- ✅ Getting 3+ signups per day consistently
- ✅ Manual process taking more than 30 min/day
- ✅ Have 5+ testimonials from happy members
- ✅ Ready to approach regional suppliers (need scalable proof)

### Don't automate if:
- ❌ Less than 50 members yet
- ❌ Still refining welcome process
- ❌ Still personally vetting each member
- ❌ Google Workspace API not set up yet

**Manual-first = smart strategy, not laziness.** 🎯

---

*Remember: Every successful platform starts with founders doing things that don't scale. Then you automate what works, not what you hope works.*

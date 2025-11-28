# 🎯 Progressive Disclosure: Helper → Contractor Journey

## The Self-Leveling System

**Philosophy:** Users unlock features organically by taking actions that REQUIRE those features. The system teaches what's needed through UI, not through documentation.

---

## 🌱 **Stage 1: Helper/Team Member (Bronze Tier)**

### What They See on Signup:
```
┌────────────────────────────────────────┐
│ Welcome to Constructive Designs Inc!   │
│                                        │
│ Full Name: [________________]          │
│ Personal Email: [________________]     │
│ Phone: [________________] (optional)   │
│                                        │
│ ☑ I agree to join as FREE MEMBER      │
│                                        │
│        [Join FREE - Get Started]       │
│                                        │
│ OR                                     │
│                                        │
│        [Pay $29.99/month instead]     │
│ (Stay outside organization)            │
└────────────────────────────────────────┘
```

**What Happens:**
1. They click "Join FREE"
2. System calls `accept_free_membership()`
3. Creates: `heather.feist@constructivedesignsinc.org`
4. Triggers Google Workspace account creation (pending manual/auto)
5. Pre-fills personal email as backup
6. They're logged in

**First Login - Profile Dashboard:**
```
┌────────────────────────────────────────┐
│ 🎉 Welcome, Heather!                   │
│                                        │
│ Your Profile: 🥉 Bronze Helper         │
│ Email: heather.feist@constructivedesignsinc.org │
│                                        │
│ ✅ You Can:                            │
│ • Accept project invitations           │
│ • Track hours                          │
│ • Browse marketplace                   │
│ • View member directory                │
│ • Build your reputation                │
│                                        │
│ 🔓 Unlock Contractor Features:         │
│                                        │
│ EIN Number: [________________] ⓘ       │
│                                        │
│ What's an EIN? [Learn More]            │
│                                        │
│ With contractor status, you can:       │
│ ☐ Create your own estimates            │
│ ☐ Invite team members                  │
│ ☐ Sell on marketplace                  │
│                                        │
└────────────────────────────────────────┘
```

**Key Psychology:**
- They SEE the EIN field (empty, but visible)
- They SEE what they're missing (creates desire)
- They SEE "Learn More" link (education built-in)
- **No pressure, just awareness** ✅

---

## 🔒 **The Trigger Moment**

When helper clicks "Create Estimate":

```
┌────────────────────────────────────────┐
│ 🔒 Contractor Features Required        │
│                                        │
│ To create estimates and manage teams,  │
│ you need an Employer Identification    │
│ Number (EIN) from the IRS.            │
│                                        │
│ ╔════════════════════════════════════╗ │
│ ║ What's an EIN?                     ║ │
│ ║                                    ║ │
│ ║ It's a FREE business tax ID from   ║ │
│ ║ the IRS. Even sole proprietors    ║ │
│ ║ can get one in 10 minutes online.  ║ │
│ ║                                    ║ │
│ ║ You need it to:                    ║ │
│ ║ • Hire employees or contractors    ║ │
│ ║ • Open business bank account       ║ │
│ ║ • Build business credit            ║ │
│ ║ • File business taxes              ║ │
│ ╚════════════════════════════════════╝ │
│                                        │
│ [📚 Learn How to Get EIN (IRS.gov)]  │
│                                        │
│ [✅ I Already Have One - Enter it]    │
│                                        │
│ [Later - Keep Browsing as Helper]     │
└────────────────────────────────────────┘
```

**Result:** They learn what they need EXACTLY when they need it! 🎓

---

## ✅ **The Functions (Already in SQL)**

```sql
-- Unlock contractor features
SELECT unlock_contractor_features(
  'user-uuid',
  '12-3456789'  -- EIN
);

-- Check if can create estimates
SELECT can_create_estimates('user-uuid');
-- Returns: true (if EIN provided) or false (if helper)
```

---

## 📊 **Tracking Progression**

```sql
SELECT * FROM membership_stats;

-- Returns:
free_members: 487
contractors: 89          -- 18% unlocked contractor
helpers: 398             -- 82% still learning
contractor_conversion_rate: 18.27%
```

**This shows the organic apprenticeship working!**

---

**The SQL is updated and ready!** ✅

Want me to proceed with the other scripts or open Supabase?

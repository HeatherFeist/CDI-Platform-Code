# 🎯 GATED ROLE PROGRESSION SYSTEM

**Purpose:** Force healthy growth, prevent premature scaling, ensure quality at every level

---

## **The 3-Tier Role System**

### **🟢 HELPER (Entry Level)**

**Requirements:**
- ✅ Basic profile information completed (bio, phone, location, specialties)
- ❌ No portfolio required
- ❌ No EIN required

**Can Do:**
- Accept helper jobs
- Build experience
- Start earning money immediately
- Upload portfolio photos

**Cannot Do:**
- Post jobs to network
- Manage contractors
- Access contractor dashboard
- Create estimates

**Badge:** 🟢 Helper | Bronze Tier

---

### **🔵 SUB-CONTRACTOR (Proven Worker)**

**Requirements:**
- ✅ 4+ project photos uploaded to portfolio
- ✅ Basic profile complete
- ❌ No EIN required yet

**Can Do:**
- Accept sub-contractor jobs from network
- **Post jobs to EXTERNAL contractors** (like sending form to Nick)
- Build professional reputation
- Earn higher rates
- Advance through tiers (Bronze → Silver → Gold → Platinum)

**Cannot Do:**
- Create estimates
- Post jobs to network (recruiting helpers)
- Access full contractor features

**Badge:** 🔵 Sub-Contractor | [Tier Color]

**💡 Key Insight:** When you send a job form to an external contractor (like Nick), you're MANAGING a contractor, not just working as a helper. System recognizes this and keeps you at Sub-Contractor level until you get EIN.

---

### **🟡 CONTRACTOR (Licensed Business Owner)**

**Requirements:**
- ✅ EIN verified
- ✅ 4+ project photos maintained
- ✅ Basic profile complete

**Can Do:**
- Everything Sub-Contractor can do PLUS:
- Create estimates for clients
- Post jobs to network (recruit helpers/subs)
- Manage multiple projects simultaneously
- Access full contractor dashboard
- Partner with suppliers

**Badge:** 🟡 Contractor | [Tier Color]

---

## **Tier Progression (Applies to ALL Roles)**

Everyone starts at **Bronze** regardless of role. Advance through:

| Tier | Jobs Required | Badge Color | Perks |
|------|---------------|-------------|-------|
| 🟤 **Bronze** | 0-10 jobs | `#CD7F32` | Entry level, building reputation |
| ⚪ **Silver** | 11-25 jobs | `#C0C0C0` | Trusted member, priority in search |
| 🟡 **Gold** | 26-50 jobs | `#FFD700` | Verified expert, featured profiles |
| ⚪ **Platinum** | 51+ jobs | `#E5E4E2` | Elite status, exclusive opportunities |

**Jobs Count Across:**
- Sub jobs completed (worked for others)
- Jobs posted (managed others)
- External contractor jobs (sent forms)

---

## **The Forcing Functions (Why It's Brilliant)**

### **1. Can't Skip Steps**
❌ **No EIN?** → Can't select "Contractor" role even if you try  
✅ **System blocks full contractor features**  
📝 **Message:** *"Contractor role requires EIN verification. Currently limited to Sub-Contractor features."*

**Result:** Forces users to either:
1. Get licensed properly (obtain EIN)
2. OR work as Sub-Contractor first (build track record)

### **2. Quality Gate (4 Photos Minimum)**
❌ **No portfolio?** → Can't unlock Sub-Contractor role  
✅ **Must complete real work and document it**  
📝 **Message:** *"Upload 4+ project photos to unlock Sub-Contractor role."*

**Result:** Forces users to:
1. Complete actual jobs (not just sign up and spam)
2. Document their work professionally
3. Build credible portfolio before managing others

### **3. Profile Completion Requirement**
❌ **Empty profile?** → Stuck at Helper level  
✅ **Must fill bio, phone, location, specialties**  
📝 **Message:** *"Complete your profile to unlock Helper role."*

**Result:** Forces professional presentation:
1. Serious users only (not casual browsers)
2. Enough info for contractors to make decisions
3. Contact details for job coordination

---

## **Real-World Example: Your Journey with Nick**

### **Current Status:**
- **Role Selected:** Helper or Sub (probably Helper currently)
- **Portfolio:** Not documented yet (need to upload photos)
- **EIN:** Not verified yet

### **When You Send Form to Nick (External Contractor):**

**Step 1: Profile Check**
```javascript
{
  "achievable_role": "helper", // Or "sub_contractor" if 4+ photos
  "selected_role": "contractor", // What you WANT to be
  "is_blocked": true,
  "blocked_reason": "Upload 4+ project photos to unlock Sub-Contractor role."
}
```

**What Happens:**
- ✅ You CAN send form to Nick (external contractor feature available)
- ❌ But "Contractor" badge stays grayed out
- 📝 Dashboard shows: "🔓 Unlock Contractor Features: Get EIN verified"

### **After Nick Job Completes + You Upload Photos:**

**Step 2: Portfolio Updated**
```javascript
{
  "achievable_role": "sub_contractor",
  "selected_role": "contractor",
  "is_blocked": true,
  "blocked_reason": "Contractor role requires EIN verification. Currently limited to Sub-Contractor features.",
  "requirements": {
    "portfolio_photos": 4, // ✅ Met!
    "profile_complete": true, // ✅ Met!
    "ein_verified": false, // ❌ Still missing
    "jobs_completed": 1
  },
  "next_milestone": {
    "target_role": "contractor",
    "missing": ["Get EIN verified"],
    "message": "Obtain EIN to unlock full Contractor features"
  }
}
```

**What Happens:**
- ✅ Badge upgrades to 🔵 Sub-Contractor
- ✅ Can now accept network sub jobs
- ✅ Can post jobs to external contractors
- ❌ Still can't create estimates or post to network
- 📊 Tier: Bronze (1 job completed, need 10 more for Silver)

### **After You Get EIN:**

**Step 3: Full Unlock**
```javascript
{
  "achievable_role": "contractor",
  "selected_role": "contractor",
  "is_blocked": false,
  "blocked_reason": null,
  "requirements": {
    "portfolio_photos": 4,
    "profile_complete": true,
    "ein_verified": true, // ✅ All requirements met!
    "jobs_completed": 12
  },
  "tier": "silver", // Advanced to Silver!
  "tier_progress": {
    "current_jobs": 12,
    "next_tier_at": 26,
    "jobs_until_next": 14
  }
}
```

**What Happens:**
- ✅ Badge upgrades to 🟡 Contractor
- ✅ Full contractor dashboard unlocked
- ✅ Can create estimates
- ✅ Can post jobs to network
- ✅ Tier upgraded to Silver (11+ jobs)

---

## **Profile Display Examples**

### **Helper (Blocked from Sub-Contractor)**
```
┌─────────────────────────────────────┐
│ 🟢 Helper | Bronze                  │
│                                     │
│ [!] Upload 4 project photos to      │
│     unlock Sub-Contractor role      │
│                                     │
│ Progress: 0/4 photos                │
│                                     │
│ [ Complete 3 Jobs First ]          │
└─────────────────────────────────────┘
```

### **Sub-Contractor (Blocked from Contractor)**
```
┌─────────────────────────────────────┐
│ 🔵 Sub-Contractor | Silver          │
│                                     │
│ [!] Contractor features locked      │
│     Get EIN verified to unlock      │
│                                     │
│ ✅ 4 photos uploaded                │
│ ✅ 12 jobs completed                │
│ ❌ EIN verification pending         │
│                                     │
│ [ Apply for EIN ] [ Learn More ]   │
└─────────────────────────────────────┘
```

### **Contractor (Fully Unlocked)**
```
┌─────────────────────────────────────┐
│ 🟡 Contractor | Gold ⭐             │
│                                     │
│ ✅ All features unlocked            │
│                                     │
│ 📸 Portfolio: 27 photos             │
│ 💼 Jobs: 28 completed               │
│ ⭐ Rating: 4.8 / 5.0                │
│ 🎯 Tier Progress: 2 jobs to Plat   │
│                                     │
│ [ View Dashboard ]                  │
└─────────────────────────────────────┘
```

---

## **Frontend Implementation**

### **Role Selection Dropdown (Signup/Profile Edit)**

```javascript
const roleOptions = [
  {
    value: 'helper',
    label: 'Helper',
    icon: '🟢',
    description: 'Accept helper jobs, build experience',
    requirements: 'Basic profile only',
    disabled: false // Always available
  },
  {
    value: 'sub_contractor',
    label: 'Sub-Contractor',
    icon: '🔵',
    description: 'Accept sub jobs, manage external contractors',
    requirements: '4+ project photos',
    disabled: !canAccessSubContractor // Grayed out if not qualified
  },
  {
    value: 'contractor',
    label: 'Contractor',
    icon: '🟡',
    description: 'Full access: estimates, network jobs, management',
    requirements: 'EIN + 4+ photos',
    disabled: !canAccessContractor // Grayed out if not qualified
  }
];

// On selection attempt
function handleRoleSelect(selectedRole) {
  const roleInfo = calculateAchievableRole(userId);
  
  if (roleInfo.is_blocked && selectedRole !== roleInfo.achievable_role) {
    showNotification({
      type: 'warning',
      title: 'Role Locked',
      message: roleInfo.blocked_reason,
      actions: [
        { label: 'View Requirements', onClick: showRequirements },
        { label: 'Upload Photos', onClick: redirectToPortfolio }
      ]
    });
    
    // Don't save selection, keep at achievable role
    return;
  }
  
  // Save selection
  updateUserRole(selectedRole);
}
```

### **Dashboard Lock Screen**

```javascript
function DashboardLockScreen({ roleInfo }) {
  if (!roleInfo.is_blocked) return null; // Fully unlocked
  
  return (
    <div className="lock-screen-overlay">
      <div className="lock-card">
        <h2>🔒 {roleInfo.selected_role === 'contractor' ? 'Contractor' : 'Sub-Contractor'} Features Locked</h2>
        <p>{roleInfo.blocked_reason}</p>
        
        <div className="requirements-checklist">
          <h3>Requirements:</h3>
          <ul>
            <li className={roleInfo.requirements.profile_complete ? 'complete' : 'incomplete'}>
              {roleInfo.requirements.profile_complete ? '✅' : '⬜'} Complete profile
            </li>
            <li className={roleInfo.requirements.portfolio_photos >= 4 ? 'complete' : 'incomplete'}>
              {roleInfo.requirements.portfolio_photos >= 4 ? '✅' : '⬜'} Upload 4+ project photos ({roleInfo.requirements.portfolio_photos}/4)
            </li>
            {roleInfo.selected_role === 'contractor' && (
              <li className={roleInfo.requirements.ein_verified ? 'complete' : 'incomplete'}>
                {roleInfo.requirements.ein_verified ? '✅' : '⬜'} Verify EIN
              </li>
            )}
          </ul>
        </div>
        
        <div className="next-steps">
          <h3>Next Steps:</h3>
          {roleInfo.next_milestone?.missing.map(step => (
            <div key={step} className="action-step">
              📋 {step}
            </div>
          ))}
        </div>
        
        <div className="cta-buttons">
          {roleInfo.requirements.portfolio_photos < 4 && (
            <button onClick={() => navigate('/portfolio/upload')}>
              📸 Upload Project Photos
            </button>
          )}
          {roleInfo.selected_role === 'contractor' && !roleInfo.requirements.ein_verified && (
            <button onClick={() => navigate('/settings/ein-verification')}>
              📝 Verify EIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### **Tier Progress Badge**

```javascript
function TierBadge({ roleInfo }) {
  const { tier, tier_display, tier_color, tier_progress } = roleInfo;
  
  return (
    <div className="tier-badge" style={{ borderColor: tier_color }}>
      <div className="tier-label">{tier_display}</div>
      <div className="tier-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${(tier_progress.current_jobs / tier_progress.next_tier_at) * 100}%`,
              backgroundColor: tier_color
            }}
          />
        </div>
        <div className="progress-text">
          {tier_progress.jobs_until_next > 0 ? (
            `${tier_progress.jobs_until_next} jobs until next tier`
          ) : (
            '🏆 Maximum tier reached!'
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## **Database Functions**

### **Check Access Before Action**

```sql
-- Called before showing contractor dashboard
SELECT can_access_contractor_features('user-id-here');
-- Returns: true/false

-- Called before showing sub-contractor job posting
SELECT can_access_sub_contractor_features('user-id-here');
-- Returns: true/false

-- Get complete role info for profile display
SELECT calculate_achievable_role('user-id-here');
-- Returns: Full JSON with requirements, blockers, next steps
```

### **Profile Review (Contractor Vetting Helper)**

```sql
-- When contractor clicks "View Profile" on interested helper
SELECT get_helper_profile_for_review('helper-user-id');

-- Returns:
{
  "achievable_role": "sub_contractor",
  "tier": "silver",
  "tier_display": "SILVER",
  "portfolio_photos": 8,
  "jobs_completed": 12,
  "rating": 4.7,
  "blocked_reason": null,
  "is_blocked": false
}
```

---

## **The Righteous Selfishness in Action**

### **Helper → Sub-Contractor Progression**
- **Selfish:** Want higher rates and better jobs
- **Righteous:** Forced to complete real work and build portfolio first
- **Result:** Network gets quality workers, users get fair advancement

### **Sub-Contractor → Contractor Progression**
- **Selfish:** Want full access to post jobs and create estimates
- **Righteous:** Forced to get licensed (EIN) and maintain portfolio quality
- **Result:** Network gets legitimate businesses, users follow legal requirements

### **External Contractor Jobs (Nick Scenario)**
- **Selfish:** Need income now, can't wait for Nick to join network
- **Righteous:** Job still counts toward progression, portfolio builds, Nick sees value
- **Result:** Network grows organically, users solve immediate problems

---

## **Admin Override (For Testing/Edge Cases)**

```sql
-- Manually unlock contractor features for specific user
UPDATE profiles
SET contractor_features_unlocked = true
WHERE id = 'user-id-here';

-- Manually add portfolio photos count (for migration)
-- (Photos should actually exist in sub_opportunities.portfolio_photos)

-- Check specific user's status
SELECT calculate_achievable_role('user-id-here');
```

---

## **Migration Strategy (Existing Users)**

### **Step 1: Assess Current Users**
```sql
SELECT 
  id,
  full_name,
  role,
  contractor_features_unlocked,
  (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = profiles.id) as jobs_completed,
  (SELECT COALESCE(SUM(array_length(portfolio_photos, 1)), 0) 
   FROM sub_opportunities 
   WHERE assigned_to = profiles.id 
   AND portfolio_photos IS NOT NULL) as portfolio_photos
FROM profiles
WHERE role IN ('contractor', 'sub_contractor');
```

### **Step 2: Grandfather Existing Contractors**
```sql
-- Option A: Auto-verify EIN for existing contractors
UPDATE profiles
SET contractor_features_unlocked = true
WHERE role = 'contractor'
AND created_at < '2025-11-06'; -- Before gating system launched

-- Option B: Notify existing contractors to verify EIN
-- Send email: "Action Required: Verify your EIN to maintain Contractor access"
```

### **Step 3: Prompt for Portfolio Photos**
```sql
-- Identify users with role but no portfolio
SELECT 
  id,
  full_name,
  email,
  role
FROM profiles
WHERE role IN ('contractor', 'sub_contractor')
AND id NOT IN (
  SELECT DISTINCT assigned_to 
  FROM sub_opportunities 
  WHERE portfolio_photos IS NOT NULL 
  AND array_length(portfolio_photos, 1) >= 4
);

-- Send notification: "Upload 4 project photos to maintain your role"
```

---

## **Success Metrics**

### **Track Progression Health**
```sql
-- Distribution of roles
SELECT 
  achievable_role,
  COUNT(*) as user_count
FROM (
  SELECT calculate_achievable_role(id) ->> 'achievable_role' as achievable_role
  FROM profiles
  WHERE role != 'admin'
) subquery
GROUP BY achievable_role;

-- Average time to unlock Sub-Contractor
SELECT AVG(days_to_unlock) as avg_days
FROM (
  SELECT 
    p.id,
    EXTRACT(DAY FROM (
      SELECT MIN(created_at) 
      FROM sub_opportunities 
      WHERE assigned_to = p.id 
      AND (
        SELECT COALESCE(SUM(array_length(portfolio_photos, 1)), 0)
        FROM sub_opportunities so2
        WHERE so2.assigned_to = p.id
        AND so2.created_at <= sub_opportunities.created_at
      ) >= 4
    ) - p.created_at) as days_to_unlock
  FROM profiles p
  WHERE p.role = 'sub_contractor'
) subquery
WHERE days_to_unlock IS NOT NULL;

-- Block rate (users trying to select role they can't access)
-- Track via application logs when roleInfo.is_blocked = true
```

---

## **FAQ**

### **Q: What if I already have photos from past projects?**
**A:** Upload them! As long as they're legitimate work you completed, they count toward your 4-photo requirement.

### **Q: Can I work as Helper while waiting for EIN?**
**A:** Absolutely! That's the whole point. Start earning immediately, build portfolio, then upgrade when EIN comes through.

### **Q: What if I send form to external contractor before I have 4 photos?**
**A:** That's fine! The external contractor feature is available to everyone. But you won't get the "Sub-Contractor" badge until you have 4 photos uploaded.

### **Q: Do photos from external contractor jobs (like Nick) count?**
**A:** Yes! When Nick's job completes and you upload photos, those count toward your portfolio just like network jobs.

### **Q: What if my EIN is pending (applied but not received yet)?**
**A:** Work as Sub-Contractor in the meantime. Once EIN arrives, verify it in settings and instant upgrade to Contractor.

### **Q: Can I lose my tier if I don't work for a while?**
**A:** No. Tiers never decrease. Once you hit Silver, you stay Silver minimum even with gaps.

### **Q: What happens if I upload 4 photos then delete some?**
**A:** If portfolio drops below 4 photos, you get downgraded to Helper until you upload more. Keep your best work showcased!

---

## **Next Steps**

1. ✅ SQL functions implemented (`calculate_achievable_role`, `can_access_contractor_features`, `can_access_sub_contractor_features`)
2. ⏳ Frontend lock screens (block contractor dashboard if not qualified)
3. ⏳ Role selection dropdown with disabled states
4. ⏳ Notification system ("Upload photos to unlock Sub-Contractor!")
5. ⏳ EIN verification flow (upload EIN letter, admin reviews, unlocks contractor)
6. ⏳ Tier badge UI component
7. ⏳ Portfolio upload prompts ("Add 3 more photos to unlock Sub-Contractor!")

---

**🎯 The Bottom Line:**

You can't fake growth. You can't skip steps. You do the work, document it, get licensed properly, and THEN the platform rewards you with more opportunities.

That's righteous selfishness. ✊

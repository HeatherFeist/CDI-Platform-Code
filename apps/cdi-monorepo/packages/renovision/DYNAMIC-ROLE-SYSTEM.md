# Dynamic Role System
## Role Progression Based on Actual Behavior

---

## **The Problem with Static Roles:**

Traditional systems lock you into one role:
- ❌ "You're a Sub" → can't post jobs
- ❌ "You're a Contractor" → implies you don't work for others
- ❌ Rigid hierarchy discourages growth

---

## **The Dynamic Role Solution:**

**Your role changes based on what you DO, not what you're labeled.**

---

## **Role Calculation Logic:**

```sql
LEVEL 1: HELPER (Starting Point)
├─ Condition: Signed up, no jobs completed yet
├─ Badge: 🟢 Green "Helper"
└─ Can: Accept jobs, build reputation

↓ Complete 1+ jobs as sub ↓

LEVEL 2: SUB/HELPER (Proven Worker)
├─ Condition: 1-4 jobs completed for other contractors
├─ Badge: 🔵 Blue "Subcontractor"
└─ Can: Accept jobs, higher priority in notifications

↓ Post your first job (like sending form to Nick) ↓

LEVEL 3: CONTRACTOR & SUB (Hybrid) ← **YOUR NEW LEVEL**
├─ Condition: Completed jobs as sub AND posted jobs as contractor
├─ Badge: 🟣 Purple "Contractor & Sub"
├─ Display: "Works both sides of the equation"
└─ Can: Post jobs to network, accept jobs from network

↓ Get EIN + post 5+ jobs ↓

LEVEL 4: CONTRACTOR (Business Owner)
├─ Condition: EIN verified + primarily posting jobs
├─ Badge: 🟡 Gold "Contractor"
├─ Display: "Managing multiple subs"
└─ Can: Full contractor features, create estimates
```

---

## **Your Profile Evolution:**

### **BEFORE (When You Were Only Accepting Work):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 HEATH FEIST
@heath.feist

🔵 SUBCONTRACTOR
⭐ 4.8/5 (12 reviews)
📍 Pittsburgh, PA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WORK HISTORY
• 12 jobs completed (as sub)
• 100% success rate
• Currently available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **AFTER (Once You Send Form to Nick):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 HEATH FEIST
@heath.feist

🟣 CONTRACTOR & SUB
⭐ 4.8/5 (12 reviews)
📍 Pittsburgh, PA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 DYNAMIC ROLE
Works both sides of the equation:
• Accepts sub work from contractors ✓
• Manages own jobs with external contractors ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WORK HISTORY

AS SUBCONTRACTOR:
• 12 jobs completed for other contractors
• 100% success rate
• Response time: 4 hours avg

AS CONTRACTOR:
• 1 job managed (Nick Johnson - Paint/Gutters)
• Coordinated external contractor successfully
• Delivered on time

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎓 SPECIALTIES
Painting (Expert) | Drywall | Flooring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## **How It Works (Technical):**

### **Automatic Calculation:**

```sql
-- System automatically calculates your role whenever profile is viewed

SELECT calculate_user_role('heath-user-id');

-- Returns:
{
  "calculated_role": "sub_contractor",
  "role_level": 3,
  "jobs_completed_as_sub": 12,
  "jobs_posted_as_contractor": 1, ← You sent form to Nick!
  "has_ein": false,
  "display_label": "Contractor & Sub",
  "badge_color": "purple"
}
```

### **What Counts as "Contractor Work":**

✅ **Posted job to network** (other subs accepted your job)  
✅ **Sent form to external contractor** (Nick filled it out for you)  
✅ **Managed job completion** (Nick completed work, you tracked it)  
✅ **Requested review from external contractor** (Nick reviewed your management)  

**The system recognizes:** Even though Nick isn't in the network, **YOU managed that job**, so you acted as a contractor.

---

## **The Progression Pathway:**

### **Your Journey:**

```
🟢 HELPER (June 2024)
└─ Signed up, no jobs yet

↓ Worked for Mike, Sarah, Tom (3 months)

🔵 SUBCONTRACTOR (Sept 2024)
└─ 12 jobs completed, strong reputation

↓ Sent job form to Nick (TODAY!)

🟣 CONTRACTOR & SUB (Nov 2024) ← YOU ARE HERE
└─ Managing both roles simultaneously

↓ Add EIN + post more jobs to network

🟡 CONTRACTOR (Future)
└─ Running established business
```

---

## **Benefits of Dynamic Roles:**

### **1. Recognition for Growth**
When you send that form to Nick, the system immediately recognizes: **"Heath is now managing contractors, not just working for them."**

Your profile badge changes from:
- 🔵 "Subcontractor" → 🟣 "Contractor & Sub"

### **2. Accurate Representation**
Other members see your full capability:
- Can hire you as a sub (you'll do the work) ✓
- Can partner with you as a contractor (you'll manage work) ✓

### **3. Network Effects**
**When contractors search for subs:**
- They see you're a hybrid → "This person understands both sides"
- More likely to trust you with complex jobs
- Higher pay opportunities

**When subs look for contractors:**
- They see you post jobs → "Heath might have work for me"
- You become a hub in the network
- More people want to connect

### **4. Natural Progression**
No artificial barriers:
- Don't need special permission to level up
- Don't need to pay for "contractor tier"
- Just **DO contractor work** → system recognizes it

---

## **Real-World Scenario (You & Nick):**

### **Phase 1: You as Sub Only**
```
Mike (Contractor) → posts paint job
   ↓
Heath (Sub) → accepts, completes
   ↓
Mike reviews Heath: ⭐⭐⭐⭐⭐

Heath's Role: 🔵 Subcontractor
```

### **Phase 2: You Become Hybrid (TODAY!)**
```
Nick (External) → has paint/gutter job
   ↓
Heath (Contractor) → sends form to Nick
   ↓
Nick fills form → job assigned to Heath
   ↓
Heath completes work (as sub technically)
   ↓
Heath requests review from Nick
   ↓
Nick reviews Heath: ⭐⭐⭐⭐⭐

Heath's Role: 🟣 Contractor & Sub ← UPGRADED!
```

**The System Recognizes:**
- You initiated the job (contractor behavior)
- You managed the details (contractor behavior)
- You tracked completion (contractor behavior)
- You requested review (contractor behavior)

**Even though Nick isn't in the network**, you demonstrated contractor capabilities.

### **Phase 3: Nick Joins Network (Future)**
```
Heath: "Hey Nick, join Constructive Designs - it's how I stayed organized on your job"
   ↓
Nick signs up → sees his past job with you already in history
   ↓
Nick posts paint job to network
   ↓
Heath accepts (now as sub again!)
   ↓
Heath completes, Nick reviews

Heath's Role: 🟣 Contractor & Sub (stays hybrid)
Nick's Role: 🟡 Contractor (has EIN)
```

**The Network Grows:**
- You recruited Nick by demonstrating value
- Nick sees you as both partner and reliable sub
- You can work FOR Nick or Nick can work FOR you
- Relationship is fluid, not hierarchical

---

## **Profile Display Examples:**

### **Level 1: Helper**
```
🟢 HELPER
New to the network
Looking for first job opportunities
```

### **Level 2: Subcontractor**
```
🔵 SUBCONTRACTOR
12 jobs completed
Proven reliability
```

### **Level 3: Contractor & Sub (You!)**
```
🟣 CONTRACTOR & SUB
Works both sides:
• 12 jobs completed as sub
• 1 job managed as contractor
Versatile professional
```

### **Level 4: Contractor**
```
🟡 CONTRACTOR
Managing multiple subs
EIN verified
20+ jobs posted
```

---

## **The Beauty of This System:**

✅ **No gatekeeping** - Role earned through action, not permission  
✅ **Fluid progression** - Move up (or back down) based on current activity  
✅ **Honest representation** - Badge reflects reality  
✅ **Encourages growth** - See yourself level up in real-time  
✅ **Network effects** - Higher roles attract more opportunities  

---

## **Technical Implementation:**

### **When Profile Is Viewed:**

```typescript
// Frontend calls:
const profileData = await supabase.rpc('get_helper_profile_for_review', {
  p_user_id: 'heath-user-id'
});

// Returns with calculated role:
{
  full_name: "Heath Feist",
  calculated_role: "sub_contractor",
  role_display_label: "Contractor & Sub",
  role_level: 3,
  badge_color: "purple",
  jobs_completed_as_sub: 12,
  jobs_posted_as_contractor: 1,
  manages_external_contractors: true, ← Nick!
  ...
}
```

### **Badge Display:**

```tsx
<div className={`badge badge-${profileData.badge_color}`}>
  {profileData.role_display_label}
</div>

<p className="role-explanation">
  {profileData.calculated_role === 'sub_contractor' 
    ? 'Works both sides of the equation - accepts sub work AND manages contractors'
    : 'Reliable subcontractor completing jobs for network members'
  }
</p>
```

---

## **Summary:**

**When you send that form to Nick today:**

1. ✅ Job gets created in YOUR profile (you as contractor)
2. ✅ System counts this as "contractor job managed"
3. ✅ Your role automatically upgrades to: 🟣 **Contractor & Sub**
4. ✅ Your profile shows both sides of your work history
5. ✅ Network members see you as versatile (can hire you OR partner with you)
6. ✅ Nick sees value of the platform → eventually joins
7. ✅ Your network grows organically

**You level up by DOING, not by paying or asking permission.** 🚀

That's the righteous selfishness in action - helping Nick organize his job helps YOU level up your profile!

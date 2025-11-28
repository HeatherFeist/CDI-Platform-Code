# 🗑️ Recycle Bin System - Member-Driven Affiliate Recruitment

## 🎯 Core Innovation

**Your members recruit external contractors as affiliates, not the other way around.**

This creates a viral growth loop:
- Member meets external contractor → recruits them as affiliate
- Member earns **2% override commission** on ALL affiliate's referrals (forever)
- Affiliate earns **5% direct commission** on completed jobs
- Platform keeps **3% net** from standard 10% platform fee

---

## 💡 The "Recycle Bin" Metaphor

External contractors don't "refer leads" or "send overflow work" — they **"empty their recycle bin"**.

**Why This Works Psychologically:**
- ♻️ "Recycle" feels eco-friendly, waste-conscious
- 🗑️ "Trash" = leads they were losing anyway (zero opportunity cost)
- 📦 Batch submission = collect all week, empty once (low friction)
- 💰 Commission = turning trash into cash

---

## 🔄 Complete Workflow

### Step 1: Member Initiates Recruitment

**Sarah (Silver tier member)** meets Nick (established contractor):

**Dashboard Action:** Sarah logs in → "Recruit Affiliate" button

**Form Fields:**
1. Affiliate's email address
2. Optional notes (how you know them, why they're a good fit)

**System Action:**
- Generates unique affiliate ID: `af_a7f8d9e2_sarah_jones`
- Creates invitation link: `constructivedesigns.com/affiliate/signup/af_a7f8d9e2_sarah_jones`
- Sends Sarah the link to forward to Nick

**Sarah's Message to Nick:**
```
Hey Nick! 

Remember you mentioned turning down those small Spokane jobs? 

I signed you up for something that might help — you can earn 5% commission 
on leads you don't want. Takes 2 mins to set up:

[Invitation Link]

Let me know if you have questions!
— Sarah
```

---

### Step 2: Affiliate Completes Signup

**Nick clicks link** → Lands on simple signup form:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AFFILIATE PARTNERSHIP SIGNUP
  Referred by: Sarah Jones
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Business Info:
→ Business Name: [Thompson Construction     ]
→ Your Name:     [Nick Thompson              ]
→ Email:         [nick@thompsonconstruction.c]
→ Phone:         [206-555-0123               ]

Tax Info (for commission payments):
→ EIN or SSN:    [12-3456789                 ]
→ Address:       [123 Main St, Seattle, WA   ]

Choose Your Recycle Bin Template:
◉ Google Sheets (easiest - we'll share a template)
○ Excel Download (if you prefer offline)
○ Web Form (simple online form)
○ Email Forwarding (just forward emails to us)

[ Submit & Get My Recycle Bin Template ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**System Action:**
1. Creates affiliate partnership record
2. Generates unique recycle bin email: `nick.thompson.af_a7f8d9e2@intake.constructivedesigns.com`
3. Creates custom template (based on preference)
4. Sends welcome email with instructions

---

### Step 3: Nick Gets His Recycle Bin Template

**Welcome Email:**
```
Subject: Welcome to Constructive Designs Affiliate Program!

Hi Nick,

You're all set! Here's how to start earning 5% commission on leads you don't want:

YOUR RECYCLE BIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Google Sheet: [Open Template]
📧 Email Address: nick.thompson.af_a7f8d9e2@intake.constructivedesigns.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW IT WORKS:
1. When you get a lead you don't want, add it to your Recycle Bin sheet
2. Fill out just 5 fields (takes 30 seconds):
   • Where (location)
   • When (timeline)
   • Duration (estimated)
   • Pay (budget)
   • Notes (client details, scope)
3. Once you have 5-10 leads collected, click "Empty Recycle Bin" button
4. We handle everything else (client communication, contractor matching)
5. You get 5% commission when the job completes

EXAMPLE:
Lead: $8,000 bathroom remodel in Spokane
Your Commission: $400 (5% of $8,000)

Thanks for partnering with us!
— Constructive Designs Team

P.S. Sarah Jones will earn 2% override commission for referring you. 
Help her out by sending quality leads! 🎉
```

---

### Step 4: Nick's Daily Workflow

**Nick's HouseCall Pro:** (or Jobber, ServiceTitan, Excel, whatever he uses)
- Lead comes in: "Bathroom remodel, Spokane, $8k"
- Nick thinks: ❌ Too small for my crew, wrong city

**Nick's Recycle Bin (Google Sheet):**

| Where | When | Duration | Pay | Notes |
|-------|------|----------|-----|-------|
| Spokane, WA | ASAP | 2-3 weeks | $8,000 | Bathroom remodel, master bath, tile shower, new vanity. Client: Sarah J, 509-555-0199 |
| Tacoma, WA | Next month | 1 week | $3,500 | Kitchen backsplash, subway tile. Client wants white/gray. Contact: Mike R, 253-555-0177 |
| Bellingham, WA | Flexible | 4-5 days | $2,200 | Small deck repair, replace 3 boards. Client: Janet K, 360-555-0144 |

**Throughout the week:** Nick adds 5-7 leads to his sheet (takes 30 seconds per lead)

**Friday afternoon:** Nick clicks **"Empty Recycle Bin"** button at bottom of sheet

---

### Step 5: "Empty Recycle Bin" Triggers Batch Submission

**What Happens Behind the Scenes:**

1. **Google Sheets Script** (or web form submit) sends data to API:
```json
POST /api/recycle-bin/submit
{
  "affiliate_id": "af_a7f8d9e2_sarah_jones",
  "submission_method": "google_sheets",
  "leads": [
    {
      "location": "Spokane, WA",
      "timeline": "ASAP",
      "duration": "2-3 weeks",
      "budget": 8000,
      "notes": "Bathroom remodel, master bath, tile shower..."
    },
    {
      "location": "Tacoma, WA",
      "timeline": "Next month",
      "duration": "1 week",
      "budget": 3500,
      "notes": "Kitchen backsplash, subway tile..."
    }
    // ... 5-7 more leads
  ]
}
```

2. **Supabase Edge Function** processes submission:
   - Validates affiliate ID
   - Creates `recycle_bin_submissions` record
   - Assigns available Project Manager
   - Creates individual job records for each lead
   - Sends notification email to PM

3. **Email to Project Manager:**
```
To: project.manager@constructivedesignsinc.org
From: Recycle Bin System <recyclebin@constructivedesigns.com>
Subject: New Batch Submission - Nick Thompson (7 leads)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECYCLE BIN SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Affiliate: Nick Thompson (Thompson Construction)
Affiliate ID: af_a7f8d9e2_sarah_jones
Recruited By: Sarah Jones
Submission Date: November 6, 2025, 3:47 PM
Total Leads: 7
Status: Pending Your Review

[View in Dashboard]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: Spokane, WA
Timeline: ASAP
Duration: 2-3 weeks
Budget: $8,000
Notes: Bathroom remodel, master bath, tile shower, new vanity. 
       Client: Sarah J, 509-555-0199

[ Approve Lead ] [ Reject Lead ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: Tacoma, WA
Timeline: Next month
Duration: 1 week
Budget: $3,500
Notes: Kitchen backsplash, subway tile. Client wants white/gray.
       Contact: Mike R, 253-555-0177

[ Approve Lead ] [ Reject Lead ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
... (5 more leads)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ Approve All ] [ Review in Dashboard ]
```

---

### Step 6: Project Manager Reviews & Distributes

**PM Jessica logs into dashboard** → "Pending Recycle Bin Submissions" tab

**For Each Lead, PM Has Options:**

**Option A: Assign to Specific Contractor**
- Lead #1 (Spokane bathroom) → Assign to **Marcus** (Gold tier, Spokane-based)
- System sends Marcus notification: "New job opportunity assigned to you!"

**Option B: Create Competition**
- Lead #2 (Tacoma kitchen) → Create **Sealed Bid Competition**
- 3 Tacoma contractors receive notification, submit proposals
- Client picks winner

**Option C: Contact Client First**
- PM calls Sarah J (Spokane bathroom client)
- Qualifies the lead: "Hi Sarah, I understand you're looking for a bathroom remodel?"
- Confirms scope, budget, timeline
- Then assigns to contractor

**Option D: Reject Lead**
- Lead is outside service area / budget too low / scope unclear
- PM marks "Rejected" with reason
- System tracks rejection rate per affiliate (quality scoring)

---

### Step 7: Job Completes → Commissions Created

**Marcus completes Spokane bathroom job:**
- Final cost: $7,800 (slightly under original $8k estimate)
- Client releases payment via platform
- System automatically calculates commissions:

```
Job Value: $7,800

Platform Fee (10%): $780
├─ Affiliate Commission (5%): $390 → Nick Thompson
├─ Override Commission (2%): $156 → Sarah Jones
└─ Platform Net (3%): $234 → Constructive Designs

Marcus Receives: $7,020 ($7,800 - $780 fee)
```

**Nick's Dashboard Updates:**
- Total Earnings: $390 + previous earnings
- Completed Jobs: 1 of 7 submitted leads
- Pending Commissions: $390 (awaiting payout approval)

**Sarah's Dashboard Updates:**
- Override Earnings: $156
- Affiliates Recruited: 1 (Nick Thompson)
- Nick's Performance: 1 completed, 6 pending

---

## 📊 Template Options

### Option 1: Google Sheets Template (Most Popular)

**Template Structure:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONSTRUCTIVE DESIGNS - RECYCLE BIN
  Affiliate: Nick Thompson | ID: af_a7f8d9e2_sarah_jones
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Where | When | Duration | Pay | Notes |
|---|-------|------|----------|-----|-------|
| 1 | [Type location] | [Type timeline] | [Type duration] | [Type budget] | [Type notes] |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[        EMPTY RECYCLE BIN (Submit All Leads)              ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instructions:
1. Add leads throughout the week (30 seconds per lead)
2. When you have 5-10 leads, click "Empty Recycle Bin"
3. We'll handle everything else and pay you 5% when completed

Your Stats:
• Total Submitted: 42 leads
• Completed: 28 jobs
• Pending: 14 jobs
• Total Earnings: $3,240
```

**Google Apps Script Button:**
```javascript
function emptyRecycleBin() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Get affiliate ID from sheet
  const affiliateId = sheet.getRange('B2').getValue();
  
  // Collect all filled rows
  const leads = [];
  for (let i = 4; i < data.length; i++) { // Start after header
    if (data[i][1]) { // If "Where" column has value
      leads.push({
        location: data[i][1],
        timeline: data[i][2],
        duration: data[i][3],
        budget: data[i][4],
        notes: data[i][5]
      });
    }
  }
  
  if (leads.length === 0) {
    SpreadsheetApp.getUi().alert('No leads to submit!');
    return;
  }
  
  // Send to API
  const url = 'https://gjbrjysuqdvvqlxklvos.supabase.co/functions/v1/process-recycle-bin';
  const payload = {
    affiliate_id: affiliateId,
    submission_method: 'google_sheets',
    leads: leads
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    // Clear the sheet
    sheet.getRange('A5:F100').clearContent();
    
    SpreadsheetApp.getUi().alert(
      'Success! ' + leads.length + ' leads submitted.\n\n' +
      'Submission ID: ' + result.submission_id + '\n' +
      'You will receive an email confirmation shortly.'
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}
```

---

### Option 2: Excel Template (Offline Option)

Same structure as Google Sheets, but with:
- **VBA Macro** for "Empty Recycle Bin" button
- Saves locally as backup
- Uploads to API when online
- Good for contractors without internet at job sites

---

### Option 3: Simple Web Form

**URL:** `constructivedesigns.com/recycle-bin/af_a7f8d9e2_sarah_jones`

**Interface:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YOUR RECYCLE BIN
  Nick Thompson | Thompson Construction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Batch: 3 leads

[+] ADD NEW LEAD

Lead #1
→ Where: Spokane, WA
→ When: ASAP
→ Duration: 2-3 weeks
→ Pay: $8,000
→ Notes: Bathroom remodel...
[Edit] [Remove]

Lead #2
→ Where: Tacoma, WA
→ When: Next month
→ Duration: 1 week
→ Pay: $3,500
→ Notes: Kitchen backsplash...
[Edit] [Remove]

Lead #3
→ Where: Bellingham, WA
→ When: Flexible
→ Duration: 4-5 days
→ Pay: $2,200
→ Notes: Deck repair...
[Edit] [Remove]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[       EMPTY RECYCLE BIN (Submit 3 Leads)              ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Option 4: Email Forwarding (Simplest)

**Nick's unique email:** `nick.thompson.af_a7f8d9e2@intake.constructivedesigns.com`

**Workflow:**
1. Lead comes into Nick's inbox
2. Nick forwards email to his recycle bin address
3. System parses email with AI (extract location, budget, notes)
4. Auto-creates job opportunity
5. PM reviews for accuracy before distributing

**Example:**
```
From: client@email.com
To: nick@thompsonconstruction.com
Subject: Bathroom Remodel Quote Request

Hi Nick,

I'm looking for someone to remodel my master bathroom in Spokane. 
Budget is around $8,000. Need to start ASAP, should take 2-3 weeks.

Looking for tile shower, new vanity, toilet, fixtures.

Let me know if you're available!
Sarah Johnson
509-555-0199
```

**Nick forwards to:** `nick.thompson.af_a7f8d9e2@intake.constructivedesigns.com`

**System extracts:**
- Location: Spokane
- Budget: $8,000
- Timeline: ASAP
- Duration: 2-3 weeks
- Notes: Tile shower, vanity, toilet, fixtures. Client: Sarah Johnson, 509-555-0199

---

## 💰 Commission Structure Summary

### For Each $3,500 Job:

**Platform collects from winning contractor:**
- Platform fee: 10% = **$350**

**Platform distributes:**
- Affiliate (Nick): 5% = **$175**
- Override (Sarah): 2% = **$70**
- Platform keeps: 3% = **$105**

### Why This Works:

1. **Nick wins:** Earns $175 on lead he was losing anyway (100% profit)
2. **Sarah wins:** Earns $70 passive income for recruiting Nick (forever)
3. **Platform wins:** Keeps $105 + gets high-quality pre-screened leads
4. **Members win:** Get access to leads from established contractors
5. **Clients win:** Get matched with right contractor faster

---

## 📈 Viral Growth Mechanics

### Incentive Stack:

**For Members (Like Sarah):**
- Recruit 1 affiliate → earn 2% on all their referrals forever
- If that affiliate sends 10 jobs/month × $3,500 avg = $35,000/mo volume
- Sarah earns: $35,000 × 2% = **$700/month passive income**
- Recruit 5 affiliates = **$3,500/month** extra income

**Result:** Members actively recruit contractors they meet on job sites

---

### Network Effects:

**Month 1:** 10 founding members each recruit 1 affiliate = 10 affiliates
**Month 2:** Those 10 affiliates send 5 leads each = 50 new opportunities
**Month 3:** 50 completed jobs → platform reputation grows → 20 new members join
**Month 4:** 30 total members recruit 2 affiliates each = 60 affiliates
**Month 6:** 60 affiliates × 10 leads/month = 600 opportunities/month

---

## 🎯 Next Steps to Build

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Google Sheets template with Apps Script button
- [ ] Supabase Edge Function: `process-recycle-bin`
- [ ] Email notification to PMs
- [ ] PM dashboard: "Pending Submissions" tab

### Phase 2: Affiliate Portal (Week 3-4)
- [ ] Affiliate signup form (public link)
- [ ] Welcome email with template
- [ ] Affiliate dashboard (view earnings, active leads)
- [ ] Commission payout approval flow

### Phase 3: Member Recruiting Tools (Week 5-6)
- [ ] "Recruit Affiliate" button in member dashboard
- [ ] Generate invitation link function
- [ ] Track override commissions per member
- [ ] Member dashboard: "My Affiliates" tab

### Phase 4: Alternative Templates (Week 7+)
- [ ] Excel template with VBA macro
- [ ] Web form for batch entry
- [ ] Email forwarding with AI parsing
- [ ] Mobile app (future)

---

## 🚀 Launch Strategy

### Beta Test (Month 1):
- Select 5 high-performing members (Silver/Gold tier)
- Each recruits 2 affiliates they personally know
- Goal: 10 affiliates, 50 leads submitted, 20 completed jobs

### Expansion (Month 2-3):
- Open "Recruit Affiliate" feature to all Bronze+ members
- Target: 100 affiliates recruited
- Launch member leaderboard: "Top Affiliate Recruiters"

### Scale (Month 4+):
- Premium affiliate subscriptions (analytics dashboard, custom branding)
- Automated affiliate recruiting (members get suggested affiliates based on location)
- Integration with CRM systems (Salesforce, HubSpot for enterprise affiliates)

---

## 🎉 Why This Is Genius

1. **Members do your marketing** - They recruit affiliates (warm intros, not cold ads)
2. **Zero acquisition cost** - No ad spend, no sales team
3. **High-quality leads** - Pre-screened by experienced contractors
4. **Triple win** - Affiliate gets paid, member gets override, platform gets leads
5. **Viral loop** - More members = more affiliates = more leads = more members
6. **Batch submission** - Low friction (collect all week, submit once)
7. **Software-agnostic** - Works with ANY system they already use
8. **Tax deductible** - Affiliates can write off commissions as marketing expense

This is THE model. Let's build it. 🔥

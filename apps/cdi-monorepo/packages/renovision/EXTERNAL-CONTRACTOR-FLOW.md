# External Contractor Job Flow
## For contractors NOT in the network (like Nick)

---

## **The Problem You're Solving:**

❌ **Current State:** "I'm waiting on Nick and don't know when the job is starting. Should I take other work? Will I miss it?"

✅ **New State:** "I send Nick a form link. He fills 5 fields. Job auto-adds to my calendar with reminders. I know exactly when to plan."

---

## **The Complete Flow:**

### **1️⃣ You Create Job Request Form**

**In Your App:**
1. Click **"Request Job Details"** (new button)
2. Pre-fill what you know:
   - **Contractor Name:** Nick Johnson
   - **Contractor Phone:** (412) 555-9999
   - **Expected Trades:** Painting, Gutters
3. Click **"Generate Form Link"**

**System Creates:**
```
✅ Shareable link created!

Send this to Nick via text:

"Hey Nick! Can you fill this out quick so I can plan my schedule? Takes 30 seconds:

https://yourapp.com/job-form/abc123

Thanks!"

[Copy Link] [Send via SMS]
```

---

### **2️⃣ Nick Receives & Fills Form (External)**

**Nick Gets Text Message:**
```
Heath sent you a quick form to fill out:

📋 Job Details Request

https://yourapp.com/job-form/abc123

Takes 30 seconds - use voice-to-text!
```

**Nick Clicks Link → Sees Simple Form:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 JOB DETAILS FOR HEATH

Hi Nick! Heath needs these details to plan his schedule.
Use the 🎤 button for voice-to-text!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 WHERE?
[                                    ] 🎤
(Job location/address)

📅 WHEN?
[                                    ] 🎤
(Start date or "TBD - waiting on...")

⏱️ HOW LONG?
[                                    ] 🎤
(Days/hours estimate)

💰 PAY?
[                                    ] 🎤
($2,500 flat or $35/hour)

📝 ANY OTHER DETAILS?
[                                    ] 🎤
(Materials, tools, special requirements)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Submit to Heath]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Nick Voice-to-Texts Each Field (30 seconds):**
- **Where:** "123 Oak Street Pittsburgh"
- **When:** "November 20th or ASAP"
- **How long:** "2 to 3 days"
- **Pay:** "$2,500 flat rate"
- **Details:** "Exterior paint and gutter install, I'll provide materials"

**Nick Clicks "Submit to Heath"**

---

### **3️⃣ System Auto-Processes (Magic Happens)**

**When Nick Submits:**

**A. Creates Job in YOUR Profile**
```sql
INSERT INTO sub_opportunities (
  assigned_to, -- YOUR user ID (not contractor_id since Nick isn't in system)
  is_external_contractor, -- true
  external_contractor_name, -- "Nick Johnson"
  external_contractor_phone, -- "(412) 555-9999"
  job_location, -- "123 Oak St, Pittsburgh PA"
  start_date, -- "November 20 or ASAP"
  estimated_duration, -- "2-3 days"
  pay_details, -- "$2,500 flat rate"
  trade_types, -- ['painting', 'gutters']
  status -- 'assigned' (already yours!)
)
```

**B. Adds to YOUR Google Calendar (Automatic)**
```javascript
// Google Calendar API integration via workspace email
POST https://www.googleapis.com/calendar/v3/calendars/primary/events

{
  "summary": "🔨 Paint + Gutter Job - Nick Johnson",
  "description": `
    Contractor: Nick Johnson (412) 555-9999
    Location: 123 Oak St, Pittsburgh PA
    Duration: 2-3 days
    Pay: $2,500 flat rate
    
    Details: Exterior paint and gutter install, materials provided
    
    View in app: https://yourapp.com/jobs/abc123
  `,
  "location": "123 Oak St, Pittsburgh PA",
  "start": {
    "date": "2025-11-20" // Parsed from "November 20 or ASAP"
  },
  "end": {
    "date": "2025-11-22" // Start + duration
  },
  "colorId": "10", // Green for work
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "popup", "minutes": 10080}, // 7 days before
      {"method": "popup", "minutes": 1440},  // 1 day before
      {"method": "popup", "minutes": 60}     // 1 hour before
    ]
  }
}
```

**C. Sends YOU Confirmation**
```
✅ Job Details Received from Nick!

📍 123 Oak St, Pittsburgh PA
📅 Start: November 20 (ASAP)
⏱️ Duration: 2-3 days
💰 Pay: $2,500 flat rate

✅ Added to your Google Calendar
✅ Added to your portfolio (in progress)
✅ Reminders set (7 days, 1 day, 1 hour before)

[View Job] [Contact Nick] [Edit Details]
```

---

### **4️⃣ Automatic Reminders (Google Calendar)**

**7 Days Before (Nov 13):**
```
📅 Upcoming Job Reminder

Paint + Gutter job with Nick Johnson starts in 7 days (Nov 20)

Prepare:
☐ Confirm exact start time with Nick
☐ Check materials will be on-site
☐ Clear your schedule (2-3 days)

[View Job Details] [Snooze] [Dismiss]
```

**1 Day Before (Nov 19):**
```
📅 Job Starts Tomorrow!

Nick Johnson - Paint + Gutter
📍 123 Oak St, Pittsburgh PA
💰 $2,500 flat rate

Action items:
☐ Text Nick to confirm time: (412) 555-9999
☐ Prepare tools
☐ Set alarm

[View Job Details] [Snooze] [Dismiss]
```

**1 Hour Before (Nov 20, 7am):**
```
🔔 Job Starting Soon!

Paint + Gutter job - Nick Johnson
📍 123 Oak St, Pittsburgh PA
⏰ Starting in 1 hour

[Get Directions] [Call Nick] [Mark Started]
```

---

### **5️⃣ During Job (Your Tracking)**

**In Your App:**
```
🔨 ACTIVE JOB

Paint + Gutter - Nick Johnson
Status: ⏳ In Progress (Day 1 of 3)

📍 123 Oak St, Pittsburgh PA
📅 Started: Nov 20, 2025
💰 Pay: $2,500 flat rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTACT
Nick Johnson: (412) 555-9999
[Call] [Text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 PROGRESS PHOTOS
[Upload Photo] (0 uploaded)

📝 NOTES
[Add Note] (Track what you're doing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[✅ Mark Complete] [⏸️ Pause] [❌ Cancel]
```

---

### **6️⃣ Job Completion (Portfolio Building)**

**When You Finish:**

**Step 1: Upload Completion Photos**
```
✅ JOB COMPLETE!

Upload before/after photos for your portfolio:

📸 BEFORE PHOTOS
[Upload] [Take Photo]

📸 AFTER PHOTOS
[Upload] [Take Photo]

These photos will appear in your public portfolio
and help you get more work!
```

**Step 2: Add Your Notes (Private)**
```
📝 JOB NOTES (for your records)

What went well:
[Finished 1 day early, client happy]

Challenges:
[Had to replace 2 gutter sections]

Materials used:
[2 gallons Benjamin Moore Aura, gutter brackets]

[Save Notes]
```

**Step 3: Request Review from Nick**
```
✅ Job Marked Complete!

Would you like to request a review from Nick?

We'll send him a text with a simple form to rate your work.
Reviews help you get more jobs!

[Yes, Send Review Request] [Skip for Now]
```

**If You Click "Yes":**

**Nick Gets Text:**
```
Hey Nick! Heath finished the paint + gutter job.

Can you rate his work? Takes 30 seconds:

https://yourapp.com/review/abc123

Thanks!
```

**Nick Opens Review Form (No Account Needed):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ REVIEW HEATH'S WORK

Job: Paint + Gutter Install
123 Oak St, Pittsburgh PA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RATE THE WORK
[⭐] [⭐] [⭐] [⭐] [⭐] (Tap stars)

QUALITY
☐ Excellent  ☐ Good  ☐ Fair  ☐ Poor

ON TIME
☐ Early  ☐ On time  ☐ Late

WOULD YOU HIRE HEATH AGAIN?
☐ Definitely  ☐ Probably  ☐ Maybe  ☐ No

COMMENTS (optional)
[                                    ] 🎤

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Submit Review]

No account needed - won't take long!
```

**Nick Submits → YOU Get Notification:**
```
⭐ New Review from Nick Johnson!

5/5 stars - "Great work, finished early!"

Your rating is now 4.9/5 (13 reviews) 📈

This review is now visible on your profile.

[View Review] [Thank Nick]
```

---

### **7️⃣ Portfolio Display (Public Profile)**

**On Your Public Profile:**
```
👤 HEATH FEIST
@heath.feist
⭐ 4.9/5 (13 reviews)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 COMPLETED JOBS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 Exterior Paint + Gutter Install
Nick Johnson | Nov 20-22, 2025
⭐ 5/5 - "Great work, finished early!"

📸 [BEFORE] →  → [AFTER]
   (Click to view photos)

Trades: Painting, Gutters
Location: Pittsburgh, PA
Duration: 2 days (completed early!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 Kitchen Remodel - Drywall
Sarah Williams | Oct 15-18, 2025
⭐ 5/5 - "Professional and clean!"

📸 [BEFORE] → [AFTER]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[View All Jobs]
```

---

## **Technical Implementation:**

### **Google Calendar Integration (Workspace Account)**

```typescript
// Supabase Edge Function: sync-to-google-calendar.ts

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const calendar = google.calendar('v3');

export async function syncJobToCalendar(jobId: string, userId: string) {
  const supabase = createClient(/* ... */);
  
  // Get job details
  const { data: job } = await supabase
    .from('sub_opportunities')
    .select('*, profiles(*)')
    .eq('id', jobId)
    .single();
  
  // Get user's workspace email (OAuth credentials stored securely)
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_email, google_refresh_token')
    .eq('id', userId)
    .single();
  
  // Authenticate with Google using stored refresh token
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: profile.google_refresh_token });
  
  // Parse start date (handle "Nov 20" or "TBD")
  const startDate = parseJobDate(job.start_date);
  const endDate = calculateEndDate(startDate, job.estimated_duration);
  
  // Create calendar event
  const event = {
    summary: `🔨 ${job.trade_types.join('/')} - ${job.external_contractor_name || 'Network Job'}`,
    description: `
Contractor: ${job.external_contractor_name || 'Network Member'}
${job.external_contractor_phone ? `Phone: ${job.external_contractor_phone}` : ''}
Location: ${job.job_location}
Duration: ${job.estimated_duration}
Pay: ${job.pay_details}

Details: ${job.additional_notes || 'N/A'}

View in app: ${process.env.APP_URL}/jobs/${jobId}
    `,
    location: job.job_location,
    start: { date: startDate },
    end: { date: endDate },
    colorId: '10', // Green
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10080 }, // 7 days
        { method: 'popup', minutes: 1440 },  // 1 day
        { method: 'popup', minutes: 60 }     // 1 hour
      ]
    }
  };
  
  const response = await calendar.events.insert({
    auth,
    calendarId: 'primary',
    requestBody: event
  });
  
  // Store calendar event ID for updates/deletion
  await supabase
    .from('sub_opportunities')
    .update({ google_calendar_event_id: response.data.id })
    .eq('id', jobId);
  
  return response.data;
}

// Helper: Parse flexible date formats
function parseJobDate(dateStr: string): string {
  // "Nov 20" → "2025-11-20"
  // "November 20" → "2025-11-20"
  // "11/20" → "2025-11-20"
  // "TBD" → 7 days from now (placeholder)
  
  if (dateStr.toLowerCase().includes('tbd') || dateStr.toLowerCase().includes('asap')) {
    const placeholder = new Date();
    placeholder.setDate(placeholder.getDate() + 7);
    return placeholder.toISOString().split('T')[0];
  }
  
  // Use date parsing library (chrono-node) for natural language
  const parsed = chrono.parseDate(dateStr);
  return parsed.toISOString().split('T')[0];
}

// Helper: Calculate end date from duration
function calculateEndDate(startDate: string, duration: string): string {
  // "2-3 days" → add 3 days
  // "20 hours" → add 3 days (assume 8hr days)
  
  const daysMatch = duration.match(/(\d+)[\s-]*(?:to[\s-]*)?(\d+)?[\s]*(?:day|days)/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[2] || daysMatch[1]); // Use high estimate
    const end = new Date(startDate);
    end.setDate(end.getDate() + days);
    return end.toISOString().split('T')[0];
  }
  
  // Default: 3 days
  const end = new Date(startDate);
  end.setDate(end.getDate() + 3);
  return end.toISOString().split('T')[0];
}
```

---

## **Database Schema Update Needed:**

```sql
-- Add Google Calendar integration field
ALTER TABLE sub_opportunities
ADD COLUMN google_calendar_event_id TEXT; -- Store event ID for updates/deletion

-- Add OAuth token storage to profiles
ALTER TABLE profiles
ADD COLUMN google_refresh_token TEXT, -- Encrypted OAuth refresh token
ADD COLUMN google_calendar_synced BOOLEAN DEFAULT false;
```

---

## **The Onboarding Hook (For Nick):**

**After Job Completes:**

**Nick Gets Final Text:**
```
Thanks for the review, Nick!

By the way, Heath uses Constructive Designs to manage his work - it's how he stayed organized on your job.

Want to try it for your business? It's free to start:

https://yourapp.com/signup?ref=heath

- Auto-schedule jobs
- Find reliable subs (like Heath!)
- Track payments
- Build your portfolio

Free for contractors, always.
```

**When Nick Signs Up:**
- All past jobs with Heath show in his contractor history
- He can now post jobs to the network
- He sees value immediately (already has work history)

---

## **Summary:**

✅ **Zero setup for Nick** - just fills 5-field form  
✅ **Auto-adds to YOUR calendar** - Google Workspace integration  
✅ **Automatic reminders** - 7 days, 1 day, 1 hour before  
✅ **Portfolio building** - photos + reviews on YOUR profile  
✅ **Soft onboarding** - Nick sees value, eventually joins  
✅ **Works today** - no need to wait for network growth  

**You solve your immediate problem AND validate the product!** 🚀

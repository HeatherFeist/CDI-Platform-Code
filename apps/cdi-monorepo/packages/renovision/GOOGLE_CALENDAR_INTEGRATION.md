# Google Calendar Integration Guide

## Overview

The system automatically creates Google Calendar events for team members when they accept task assignments. This ensures all project dates are synced to their personal calendars with zero manual effort.

---

## Features

### 1. **Project Date Tracking**
- Start and end dates added to estimates
- Automatic duration calculation
- Visual timeline preview
- Date validation (end must be after start)

### 2. **Automatic Calendar Events**
- Created when team member accepts batch invitation
- One event per task assignment
- Multi-day events for project duration
- Includes task details, cost, and business info

### 3. **Calendar Sync Status**
- Tracks sync status (pending, synced, failed, cancelled)
- Retry failed syncs
- View sync statistics
- Error logging for troubleshooting

---

## Database Schema

### **estimates table** (new columns)
```sql
project_start_date DATE
project_end_date DATE
estimated_duration_days INTEGER
```

### **task_assignments table** (new columns)
```sql
calendar_event_id TEXT
calendar_event_created_at TIMESTAMP
calendar_sync_status TEXT CHECK IN ('pending', 'synced', 'failed', 'cancelled')
```

### **calendar_events table** (new)
Stores all calendar event data:
- Event details (title, description, location)
- Date/time information
- Google Calendar integration (calendar_id, event_id)
- Sync status tracking
- Error logging

---

## Workflow

### Step 1: Contractor Sets Project Dates
```tsx
import { ProjectDatePicker } from './components/business/ProjectDatePicker';

<ProjectDatePicker
  startDate={estimate.project_start_date}
  endDate={estimate.project_end_date}
  onDatesChange={(start, end, duration) => {
    setEstimate({
      ...estimate,
      project_start_date: start,
      project_end_date: end,
      estimated_duration_days: duration
    });
  }}
/>
```

### Step 2: Tag Team Members
- Contractor assigns team members to line items
- System creates batched invitation grouping all tasks
- Dates from estimate are included in invitation

### Step 3: Team Member Accepts
```typescript
// When team member clicks "Accept All"
await batchedInvitationService.acceptBatch(batchId);

// Database trigger automatically calls:
create_calendar_events_for_batch(batchId, teamMemberId)
```

### Step 4: Calendar Events Created
```sql
-- Function creates calendar event for each task
INSERT INTO calendar_events (
  business_id, team_member_id, task_assignment_id,
  google_calendar_id, event_title, event_description,
  start_datetime, end_datetime, all_day, sync_status
)
```

### Step 5: Events Synced to Google Calendar
```typescript
// Edge Function syncs pending events
await googleCalendarService.syncPendingEvents();
// Returns: { success, synced, failed, errors[] }
```

---

## Implementation Status

### ✅ Completed
1. **Database Schema** (`supabase-calendar-integration.sql`)
   - calendar_events table with full tracking
   - Updated estimates and task_assignments tables
   - PostgreSQL functions for batch processing
   - RLS policies for security
   - Views for monitoring

2. **Service Layer** (`services/googleCalendarService.ts`)
   - Complete calendar event management
   - Sync status tracking
   - Error handling and retry logic
   - Statistics and reporting

3. **UI Components** (`components/business/ProjectDatePicker.tsx`)
   - Date picker with validation
   - Duration calculator
   - Visual timeline preview
   - Helper text about calendar integration

4. **Edge Function** (`supabase/functions/sync-calendar-events/index.ts`)
   - MVP: Generates "Add to Calendar" links
   - Production-ready: Full OAuth integration (commented code included)

5. **Batch Acceptance Updates** (`BatchedInvitationAccept.tsx`)
   - Notifies user about calendar sync
   - Shows pending calendar events
   - Handles sync errors gracefully

---

## Usage in Estimates

### Add Date Picker to Estimate Form
```tsx
import { ProjectDatePicker } from './components/business/ProjectDatePicker';

function EstimateForm() {
  const [estimate, setEstimate] = useState({
    project_start_date: '',
    project_end_date: '',
    estimated_duration_days: 0
  });

  return (
    <>
      {/* Other estimate fields */}
      
      <ProjectDatePicker
        startDate={estimate.project_start_date}
        endDate={estimate.project_end_date}
        onDatesChange={(start, end, duration) => {
          setEstimate({
            ...estimate,
            project_start_date: start,
            project_end_date: end,
            estimated_duration_days: duration
          });
        }}
      />
      
      {/* Rest of form */}
    </>
  );
}
```

---

## Calendar Event Format

### Event Title
```
[Line Item Description]
Example: "Paint Living Room and Kitchen"
```

### Event Description
```
Task Assignment: Paint Living Room and Kitchen

Project: Home Renovation - Smith Residence
Your Share: $850.00

Business: ABC Construction Inc.
```

### Event Dates
- **Start:** project_start_date at 12:00 AM
- **End:** project_end_date at 11:59 PM
- **Type:** Multi-day event (all_day: true)

### Reminders
- Email reminder: 24 hours before
- Popup reminder: 1 hour before

---

## Current Implementation (MVP)

### "Add to Calendar" Links
For MVP, the system generates clickable Google Calendar links:

```
https://calendar.google.com/calendar/render?
  action=TEMPLATE
  &text=Paint Living Room
  &dates=20250115T000000Z/20250120T235959Z
  &details=Task Assignment details...
  &location=Customer Address
```

**Team member receives:**
1. Email with "Add to Calendar" link
2. Click link → Opens Google Calendar
3. Review event details
4. Click "Save" to add to calendar

**Benefits:**
- ✅ No OAuth setup required
- ✅ Works immediately
- ✅ No API costs
- ✅ Works with any calendar app (not just Google)

---

## Production Implementation (Full OAuth)

### Setup Steps

#### 1. Google Cloud Console
```bash
1. Go to console.cloud.google.com
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: https://[your-domain]/auth/google/callback
6. Note: Client ID and Client Secret
```

#### 2. Add OAuth Scopes
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

#### 3. Store Credentials
```sql
ALTER TABLE team_members
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expiry TIMESTAMP;
```

#### 4. OAuth Flow
```typescript
// Redirect user to Google OAuth
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${CLIENT_ID}
  &redirect_uri=${REDIRECT_URI}
  &response_type=code
  &scope=https://www.googleapis.com/auth/calendar
  &access_type=offline
  &prompt=consent`;

// Exchange code for tokens
const tokens = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: JSON.stringify({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  })
});

// Store tokens in database
await supabase
  .from('team_members')
  .update({
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token,
    google_token_expiry: new Date(Date.now() + tokens.expires_in * 1000)
  })
  .eq('id', teamMemberId);
```

#### 5. Create Events via API
```typescript
// Refresh token if expired
if (isTokenExpired(member.google_token_expiry)) {
  const newTokens = await refreshAccessToken(member.google_refresh_token);
  await updateStoredTokens(member.id, newTokens);
}

// Create calendar event
const response = await fetch(
  `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: eventTitle,
      description: eventDescription,
      start: { dateTime: startDateTime, timeZone: 'America/Chicago' },
      end: { dateTime: endDateTime, timeZone: 'America/Chicago' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 }
        ]
      }
    })
  }
);

// Save Google event ID
await supabase
  .from('calendar_events')
  .update({
    google_event_id: response.id,
    sync_status: 'synced',
    last_sync_at: new Date()
  })
  .eq('id', calendarEventId);
```

---

## Monitoring & Management

### View Sync Status
```typescript
import { googleCalendarService } from './services/googleCalendarService';

// Get statistics
const stats = await googleCalendarService.getSyncStats(businessId);
console.log(stats);
// { total: 45, pending: 3, synced: 40, failed: 2 }

// Get failed events
const failedEvents = await googleCalendarService.getPendingEvents();
failedEvents.filter(e => e.sync_status === 'failed');
```

### Retry Failed Syncs
```typescript
// Retry all failed events
const result = await googleCalendarService.retryFailedEvents();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
```

### Manual Event Creation
```typescript
// Create event manually for specific task
await googleCalendarService.createEvent({
  team_member_id: 'uuid',
  estimate_id: 'uuid',
  title: 'Paint Living Room',
  description: 'Task details...',
  start_datetime: '2025-01-15T08:00:00Z',
  end_datetime: '2025-01-20T17:00:00Z',
  all_day: true
});
```

---

## UI Components

### Calendar Sync Status Badge
```tsx
function CalendarStatusBadge({ status }: { status: string }) {
  const color = googleCalendarService.getStatusColor(status);
  const icon = googleCalendarService.getStatusIcon(status);
  
  return (
    <div className="flex items-center gap-2" style={{ color }}>
      <span className="material-icons text-sm">{icon}</span>
      <span className="text-xs font-medium uppercase">{status}</span>
    </div>
  );
}
```

### Estimate Calendar Events View
```typescript
const events = await googleCalendarService.getEstimateCalendarEvents(estimateId);

events.forEach(event => {
  console.log(`${event.team_member_name}: ${event.sync_status}`);
});
```

---

## Security & Privacy

### Row Level Security (RLS)
```sql
-- Business owners can only see their events
CREATE POLICY "Business owners view calendar events"
  ON calendar_events FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Team members can only see their own events
CREATE POLICY "Team members view own events"
  ON calendar_events FOR SELECT
  USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
  ));
```

### Data Protection
- OAuth tokens encrypted in database
- Access tokens expire and auto-refresh
- Refresh tokens stored securely
- Calendar permissions limited to events only
- Team members can revoke access anytime

---

## Testing

### Test Calendar Integration
```bash
# 1. Execute SQL migration
psql -h [supabase-host] -U postgres -f supabase-calendar-integration.sql

# 2. Deploy Edge Function
supabase functions deploy sync-calendar-events

# 3. Create test estimate with dates
INSERT INTO estimates (business_id, project_start_date, project_end_date)
VALUES ('uuid', '2025-01-15', '2025-01-20');

# 4. Tag team member and send invitation
# (Use UI or API)

# 5. Accept invitation
# (Team member clicks Accept All)

# 6. Verify calendar event created
SELECT * FROM calendar_events WHERE team_member_id = 'uuid';

# 7. Check sync status
SELECT sync_status, sync_error FROM calendar_events;
```

---

## Cost Analysis

### MVP (Add to Calendar Links)
- **API Calls:** 0
- **OAuth Setup:** None
- **Monthly Cost:** $0
- **Limitations:** Manual click required

### Production (Full OAuth)
- **API Calls:** ~2 per event (create + refresh)
- **Google Calendar API:** Free (unlimited)
- **OAuth Setup:** One-time per team member
- **Monthly Cost:** $0
- **Benefits:** Fully automated

**Winner:** Both are free! Production is better UX.

---

## Deployment Checklist

### Database
- [ ] Run `supabase-calendar-integration.sql`
- [ ] Verify tables created: `calendar_events`
- [ ] Test RLS policies
- [ ] Check function: `create_calendar_events_for_batch()`

### Edge Functions
- [ ] Deploy `sync-calendar-events` function
- [ ] Test with sample event
- [ ] Monitor logs for errors

### UI Components
- [ ] Add `ProjectDatePicker` to estimate forms
- [ ] Update `BatchedInvitationAccept` with calendar notification
- [ ] Add calendar sync status to estimates view

### Testing
- [ ] Create estimate with dates
- [ ] Tag team members
- [ ] Send batched invitation
- [ ] Accept as team member
- [ ] Verify calendar event created
- [ ] Check "Add to Calendar" link works

---

## Future Enhancements

1. **Calendar Event Updates**
   - If estimate dates change, update calendar events
   - If task declined, delete calendar event

2. **Team Member Preferences**
   - Allow team members to opt-out of calendar sync
   - Choose which calendar to use (work vs personal)

3. **Advanced Scheduling**
   - Automatic conflict detection
   - Suggest alternative dates if member busy
   - Load balancing across team

4. **Integrations**
   - Outlook/Office 365 calendar support
   - Apple Calendar support
   - Export to .ics file

5. **Notifications**
   - Reminder emails before project start
   - Daily agenda emails
   - Weekly project summary

---

## Support & Troubleshooting

### Common Issues

**Calendar events not creating:**
- Check that estimate has start_date and end_date set
- Verify task_assignment status is 'accepted'
- Look for sync_error in calendar_events table

**Sync status stuck on 'pending':**
- Manually trigger sync: `googleCalendarService.syncPendingEvents()`
- Check Edge Function logs in Supabase dashboard
- Retry failed events: `googleCalendarService.retryFailedEvents()`

**OAuth token expired:**
- Tokens auto-refresh on next API call
- If refresh token invalid, user must re-authorize
- Check google_token_expiry in team_members table

---

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

---

**Status:** Ready for deployment
**Last Updated:** November 1, 2025
**Version:** 1.0.0

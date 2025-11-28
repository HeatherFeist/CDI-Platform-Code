# Complete Implementation Guide: Team Assignment Tracking & Phone Integration

## Overview
This guide implements three major features:
1. **Team Member Assignment Tracking** - See who accepted/declined tasks on estimates
2. **SMS Notifications** - Automatically send SMS to team members with phone numbers
3. **Business Phone Integration** - Connect your phone to track calls and create leads

---

## Part 1: Database Setup

### Step 1: Run SQL Migrations

Run these SQL files in your Supabase SQL Editor in this order:

1. **`add-task-assignments-and-phone-integration.sql`** - Creates all necessary tables:
   - `task_assignments` - Tracks team member assignments to line items
   - `phone_integrations` - Stores business phone configuration
   - `phone_call_logs` - Logs all incoming/outgoing calls
   - `sms_message_logs` - Tracks all SMS messages

---

## Part 2: Team Assignment Tracking

### What's New:
- **EstimateTaskAssignments Component**: Shows all team members assigned to an estimate with their accept/decline status
- **Task Assignment Database**: Saves who's assigned to what with timestamps
- **Status Tracking**: Monitors invited/accepted/declined/completed states

### How to Use:

#### 1. Add to Estimate View
Import and use the component in your estimate detail view:

```typescript
import EstimateTaskAssignments from './business/EstimateTaskAssignments';

// In your estimate detail view:
<EstimateTaskAssignments estimateId={estimate.id} />
```

#### 2. What You'll See:
- **Line Item Breakdown**: Each line item shows assigned team members
- **Status Badges**: Color-coded status (yellow=invited, green=accepted, red=declined)
- **Member Details**: Name, role, assigned cost, contact info
- **Overall Summary**: Total assignments, acceptance rate, pending invitations

---

## Part 3: SMS Notifications

### Setup Requirements:

#### 1. Sign Up for Twilio
1. Go to [twilio.com](https://www.twilio.com)
2. Create an account (free trial available)
3. Get a phone number ($1-2/month)
4. Note your Account SID, Auth Token, and Phone Number

#### 2. Configure Supabase Edge Function
1. Deploy the SMS function:
```bash
supabase functions deploy send-sms-notification --project-ref YOUR_PROJECT_REF
```

2. Set environment variables:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

#### 3. How SMS Works:
When you tag a team member:
- ✅ **Has phone number**: Receives SMS with task details + Accept/Decline links
- ✅ **In-app member**: Also receives in-app notification
- ✅ **Email**: Always receives email notification
- ✅ **SMS Log**: All messages logged to database

#### 4. SMS Message Format:
```
Hi John! Constructive Designs Inc has assigned you to: 
Kitchen Flooring Installation ($1,200.00)

Accept: https://yourapp.com/accept-task/abc123
Decline: https://yourapp.com/decline-task/abc123

Reply ACCEPT or DECLINE to respond.
```

---

## Part 4: Business Phone Integration

### Setup Phone Integration:

#### 1. Configure in App
Go to **Settings** → **Phone Integration** (or add route to `PhoneIntegrationSettings` component)

#### 2. Enter Your Business Phone
- Format: +1 (555) 123-4567
- Choose provider (Twilio recommended)
- Enable features:
  - ✅ SMS Notifications
  - ✅ Voice Calls
  - ✅ Call Recording
  - ✅ Auto-Create Leads

#### 3. Twilio Webhook Setup
Configure Twilio webhooks to point to your app:

**For Incoming Calls:**
- URL: `https://yourapp.com/api/webhooks/twilio/voice`
- Method: POST

**For Incoming SMS:**
- URL: `https://yourapp.com/api/webhooks/twilio/sms`
- Method: POST

### Features:

#### Call Logging
- All calls automatically logged to `phone_call_logs`
- Links calls to customers/projects/estimates
- Stores duration, recording URL, transcript
- Tags calls (estimate-request, follow-up, urgent)

#### Auto-Lead Creation
When someone calls your business phone:
1. System checks if number exists in customers
2. If not found → Creates new lead automatically
3. Logs call with customer record
4. Notifies you of new potential customer

#### Call Integration with Estimates
When customer calls about a project:
- System can link call to existing estimate
- Add notes directly to estimate
- Track all communication history
- Create follow-up reminders

---

## Part 5: Testing

### Test SMS Notifications:
1. Add team member with phone number
2. Tag them on a line item
3. Check `sms_message_logs` table to verify SMS sent
4. Team member should receive text message

### Test Phone Integration:
1. Configure phone settings
2. Call your business number
3. Check `phone_call_logs` for logged call
4. Verify lead auto-creation if enabled

### Test Task Assignments:
1. Go to Estimates → Select estimate → Tag Team Members
2. Tag multiple members to different line items
3. View estimate with EstimateTaskAssignments component
4. See all assignments with status

---

## Part 6: Edge Function Deployment

Deploy all necessary Edge Functions:

```bash
# SMS notifications
supabase functions deploy send-sms-notification

# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=+15551234567
```

---

## Features Summary

### ✅ Team Assignment Tracking
- Save assignments to database
- Track accept/decline status
- Show on estimates
- Calculate cost per member
- Response timestamps

### ✅ SMS Notifications
- Auto-send to team members with phone numbers
- Include accept/decline links
- Reply with ACCEPT or DECLINE
- Log all messages
- Fallback to email if SMS fails

### ✅ Phone Integration
- Connect business phone number
- Log all calls automatically
- Record conversations
- Create leads from incoming calls
- Link calls to projects/estimates
- SMS customer updates

---

## Database Schema Overview

### task_assignments
- Links team members to estimate line items
- Tracks status (invited/accepted/declined/completed)
- Stores assigned cost
- Records notification delivery (SMS/email/in-app)

### phone_integrations
- Stores business phone configuration
- Provider settings (Twilio, Vonage, etc.)
- Feature flags (SMS, voice, recording)

### phone_call_logs
- Complete call history
- Links to customers/projects
- Duration, recording URLs
- Call transcripts

### sms_message_logs
- All SMS messages sent/received
- Links to team members/customers
- Delivery status tracking

---

## Next Steps

1. **Run SQL migrations** to create tables
2. **Sign up for Twilio** and configure credentials
3. **Deploy SMS Edge Function** to Supabase
4. **Add EstimateTaskAssignments** component to estimate views
5. **Configure phone integration** in app settings
6. **Test with real phone number** and team member

Your team members will now receive SMS notifications, you can track who accepts/declines tasks, and all phone calls will be automatically logged and linked to your projects!

# Google Workspace Integration Setup Guide

## Overview
This guide walks through setting up the complete Google Workspace integration for Constructive Designs Inc, including automatic account creation, onboarding workflows, and org email generation.

## Prerequisites

### 1. Google Workspace Admin Setup
- Google Workspace Admin account for constructivedesignsinc.org
- Google Cloud Console project with Admin SDK enabled
- Service account with domain-wide delegation

### 2. Required Google APIs
Enable these APIs in Google Cloud Console:
- Admin SDK API
- Gmail API  
- Google Calendar API
- Google Drive API

### 3. Environment Variables
Add these to your Supabase project settings:

```bash
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret  
GOOGLE_ADMIN_EMAIL=admin@constructivedesignsinc.org
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Database Setup

Run the Google Workspace integration SQL file:

```sql
-- File: supabase-google-workspace-integration.sql
-- This creates the necessary tables for workspace accounts, onboarding workflows, and calendar integrations
```

## Supabase Edge Functions Deployment

### 1. Deploy Google Workspace Account Creation Function

```bash
# Navigate to your project directory
cd "c:\Users\heath\Downloads\home-reno-vision-pro (2)"

# Deploy the function
supabase functions deploy create-google-workspace-account --project-ref YOUR_PROJECT_REF
```

### 2. Deploy Welcome Email Function

```bash
supabase functions deploy send-google-workspace-welcome --project-ref YOUR_PROJECT_REF
```

### 3. Set Environment Variables

```bash
# Set required environment variables for Edge Functions
supabase secrets set GOOGLE_CLIENT_ID=your_client_id --project-ref YOUR_PROJECT_REF
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret --project-ref YOUR_PROJECT_REF
supabase secrets set GOOGLE_ADMIN_EMAIL=admin@constructivedesignsinc.org --project-ref YOUR_PROJECT_REF
supabase secrets set SENDGRID_API_KEY=your_sendgrid_key --project-ref YOUR_PROJECT_REF
```

## Google Service Account Setup

### 1. Create Service Account

1. Go to Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Create new service account: `constructive-designs-workspace`
4. Download JSON key file

### 2. Enable Domain-wide Delegation

1. In Service Account details, click "Enable Google Workspace Domain-wide Delegation"
2. Note the Client ID
3. Go to Google Admin Console
4. Navigate to Security > API Controls > Domain-wide Delegation
5. Add the Client ID with these scopes:

```
https://www.googleapis.com/auth/admin.directory.user
https://www.googleapis.com/auth/admin.directory.group
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/gmail.settings.basic
```

## SendGrid Email Setup

### 1. Create SendGrid Account
- Sign up for SendGrid account
- Get API key from Settings > API Keys

### 2. Configure Sender Authentication
- Add `constructivedesignsinc.org` as verified domain
- Set up DNS records for domain authentication
- Create verified sender: `noreply@constructivedesignsinc.org`

## Feature Integration

### 1. Automatic Account Creation
When a new team member is added:
- Generates org email: `firstname.lastinitial@constructivedesignsinc.org`
- Creates Google Workspace account via Admin SDK
- Sets temporary password with forced reset
- Adds to appropriate groups (team@, admins@)

### 2. Onboarding Workflow
The `GoogleWorkspaceOnboardingFlow` component provides:
- Visual step-by-step onboarding process
- Real-time status updates
- Error handling and retry capabilities
- Welcome email with credentials and instructions

### 3. Calendar Integration
- Creates default work calendar
- Sets up availability sharing
- Enables team scheduling

## Usage

### Adding Team Members with Google Workspace

1. **In TeamMembersView**: Click "Add Team Member"
2. **Fill Details**: Enter first name, last name, email, role
3. **Automatic Email**: Preview shows generated org email
4. **Save Member**: Triggers onboarding flow automatically
5. **Onboarding Steps**:
   - Creates Google Workspace account
   - Sends welcome email with credentials
   - Sets up Google Calendar
   - Grants app access
   - Completes onboarding

### Manual Workspace Setup

For existing team members:
1. Go to Team Members view
2. Click "Workspace" button next to member name
3. Follow the onboarding flow

## Testing

### 1. Test Account Creation

```javascript
// Test the Edge Function directly
const { data, error } = await supabase.functions.invoke('create-google-workspace-account', {
  body: {
    teamMemberId: 'test-id',
    firstName: 'Test',
    lastName: 'User',
    orgEmail: 'test.u@constructivedesignsinc.org',
    personalEmail: 'test@example.com',
    role: 'member'
  }
});
```

### 2. Test Welcome Email

```javascript
const { data, error } = await supabase.functions.invoke('send-google-workspace-welcome', {
  body: {
    orgEmail: 'test.u@constructivedesignsinc.org',
    firstName: 'Test',
    lastName: 'User',
    tempPassword: 'TempPass123!',
    onboardingUrl: 'https://yourapp.com/onboarding/test-id'
  }
});
```

## Security Considerations

### 1. Temporary Passwords
- Generated with high entropy (16 characters, mixed case, numbers, symbols)
- Forced password reset on first login
- Hashed before storage in database

### 2. Service Account Security
- Store JSON key securely (not in code)
- Use least privilege principle
- Rotate keys regularly

### 3. API Rate Limits
- Google Admin SDK has daily quotas
- Implement retry logic for rate limit errors
- Consider batch operations for bulk operations

## Troubleshooting

### Common Issues

1. **"Domain not found" Error**
   - Verify Google Workspace domain ownership
   - Check domain-wide delegation setup

2. **"Insufficient Permissions" Error**
   - Verify service account scopes
   - Check admin console delegation settings

3. **Email Delivery Issues**
   - Verify SendGrid domain authentication
   - Check sender reputation
   - Ensure DKIM/SPF records are set

4. **Edge Function Errors**
   - Check Supabase logs in dashboard
   - Verify environment variables are set
   - Test with minimal payload first

### Debugging

Enable detailed logging in Edge Functions:

```javascript
console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('Google API response:', JSON.stringify(response, null, 2));
```

## Next Steps

### Future Enhancements

1. **Single Sign-On (SSO)**
   - Implement SAML/OAuth integration
   - Connect platform login with Google accounts

2. **Advanced Calendar Features**
   - Team availability dashboard
   - Automatic meeting scheduling
   - Project milestone integration

3. **Drive Integration**
   - Automatic project folder creation
   - Shared document templates
   - File access management

4. **Analytics Dashboard**
   - Onboarding completion rates
   - Account usage metrics
   - Team collaboration stats

This completes the Google Workspace integration setup. The system now automatically creates organizational accounts, manages onboarding workflows, and provides a seamless experience for bringing new team members into the Constructive Designs Inc ecosystem.
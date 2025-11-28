# Google Workspace Integration Setup Guide
## Connecting Your Nonprofit's Google Workspace to the Marketplace Platform

### Overview
This guide will help you connect your Google Workspace account to automatically sync member applications, create user accounts, and manage the nonprofit member onboarding process.

## Phase 1: Google Cloud Platform Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Constructive Designs Marketplace"
3. Enable billing (required for API access)

### 2. Enable Required APIs
Enable these APIs in your Google Cloud project:
- **Google Forms API** - For member application forms
- **Google Sheets API** - For member database management
- **Google Drive API** - For document storage
- **Gmail API** - For automated email communications
- **Google Directory API** - For user management
- **Google Calendar API** - For mentorship scheduling

### 3. Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: "Marketplace Integration Service"
4. Grant these roles:
   - Google Workspace Domain-wide Delegation
   - Service Account Token Creator
5. Download the JSON key file (keep this secure!)

### 4. Enable Domain-wide Delegation
1. In Service Account details, click "Domain-wide Delegation"
2. Enable "Google Workspace Domain-wide Delegation"
3. Note the Client ID (you'll need this for Workspace admin setup)

## Phase 2: Google Workspace Admin Setup

### 1. Configure Domain-wide Delegation
1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to Security → API Controls → Domain-wide Delegation
3. Click "Add new" and enter the Client ID from your service account
4. Add these OAuth scopes:
   ```
   https://www.googleapis.com/auth/forms
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/admin.directory.user
   https://www.googleapis.com/auth/calendar
   ```

### 2. Create Member Application Form
1. Create a Google Form for member applications
2. Include fields matching our registration form:
   - Personal Information (Name, Email, Phone, Address)
   - Store Information (Store Name, Description, Business Type)
   - Membership Tier Requested
   - Referral Code (optional)
   - Mentor Preference (optional)
3. Set up response destination to a Google Sheet
4. Note the Form ID and Sheet ID

### 3. Set Up Response Processing
1. In the response sheet, go to Extensions → Apps Script
2. Create a trigger for form submissions
3. The script will call your marketplace API webhook

## Phase 3: Environment Configuration

### Required Environment Variables
Add these to your `.env` file:

```env
# Google Workspace Integration
GOOGLE_WORKSPACE_DOMAIN=constructivedesigns.org
GOOGLE_SERVICE_ACCOUNT_EMAIL=marketplace-integration@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_FORMS_API_KEY=your_forms_api_key
GOOGLE_MEMBER_FORM_ID=your_member_application_form_id
GOOGLE_MEMBER_SHEET_ID=your_member_database_sheet_id
GOOGLE_DRIVE_FOLDER_ID=your_member_documents_folder_id

# Webhook URLs
GOOGLE_FORM_WEBHOOK_URL=https://your-domain.com/api/webhooks/google-form
MEMBER_APPROVAL_WEBHOOK_URL=https://your-domain.com/api/webhooks/member-approval

# Email Configuration
GMAIL_SENDER_EMAIL=membership@constructivedesigns.org
WELCOME_EMAIL_TEMPLATE_ID=your_welcome_email_template
```

## Phase 4: API Integration Setup

### Webhook Endpoints Needed
Your platform needs these webhook endpoints to receive data from Google:

1. **Form Submission Webhook** (`/api/webhooks/google-form`)
   - Receives new member applications
   - Creates pending application record
   - Triggers approval process

2. **Member Approval Webhook** (`/api/webhooks/member-approval`)
   - Processes approved applications
   - Creates marketplace accounts
   - Sets up member stores
   - Sends welcome emails

3. **Sync Status Webhook** (`/api/webhooks/sync-status`)
   - Monitors sync success/failures
   - Handles retry logic
   - Logs integration issues

## Phase 5: Google Apps Script Setup

### Member Application Form Script
This script runs when someone submits the member application form:

```javascript
function onFormSubmit(e) {
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  
  // Extract form data
  const memberData = {
    timestamp: new Date().toISOString(),
    email: formResponse.getRespondentEmail(),
    firstName: getResponseByTitle(itemResponses, 'First Name'),
    lastName: getResponseByTitle(itemResponses, 'Last Name'),
    phone: getResponseByTitle(itemResponses, 'Phone Number'),
    address: getResponseByTitle(itemResponses, 'Street Address'),
    city: getResponseByTitle(itemResponses, 'City'),
    state: getResponseByTitle(itemResponses, 'State'),
    zipCode: getResponseByTitle(itemResponses, 'ZIP Code'),
    storeName: getResponseByTitle(itemResponses, 'Store Name'),
    storeDescription: getResponseByTitle(itemResponses, 'Store Description'),
    businessType: getResponseByTitle(itemResponses, 'Business Type'),
    tierRequested: getResponseByTitle(itemResponses, 'Membership Tier'),
    referralCode: getResponseByTitle(itemResponses, 'Referral Code'),
    mentorUsername: getResponseByTitle(itemResponses, 'Preferred Mentor')
  };
  
  // Send to marketplace webhook
  const webhookUrl = 'https://your-domain.com/api/webhooks/google-form';
  
  const payload = {
    source: 'google_form',
    form_id: 'YOUR_FORM_ID',
    response_id: formResponse.getId(),
    member_data: memberData
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_WEBHOOK_SECRET'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    console.log('Webhook sent successfully:', response.getResponseCode());
  } catch (error) {
    console.error('Webhook failed:', error);
    // Log to error sheet for manual processing
    logError(memberData, error.toString());
  }
}

function getResponseByTitle(itemResponses, title) {
  for (let i = 0; i < itemResponses.length; i++) {
    if (itemResponses[i].getItem().getTitle() === title) {
      return itemResponses[i].getResponse();
    }
  }
  return '';
}

function logError(memberData, error) {
  const errorSheet = SpreadsheetApp.openById('YOUR_ERROR_LOG_SHEET_ID').getActiveSheet();
  errorSheet.appendRow([
    new Date(),
    memberData.email,
    memberData.firstName + ' ' + memberData.lastName,
    error,
    'PENDING_MANUAL_REVIEW'
  ]);
}
```

## Phase 6: Security Considerations

### API Security
1. **Webhook Authentication**: Use signed requests or API keys
2. **Rate Limiting**: Implement rate limits on webhook endpoints
3. **Data Validation**: Validate all incoming form data
4. **Error Handling**: Graceful error handling with retry logic

### Data Privacy
1. **GDPR Compliance**: Handle member data according to privacy laws
2. **Data Retention**: Set up automatic data cleanup policies
3. **Access Logging**: Log all API access and data modifications
4. **Encryption**: Encrypt sensitive data in transit and at rest

## Phase 7: Testing and Deployment

### Testing Checklist
- [ ] Form submission creates application record
- [ ] Free tier applications auto-approve and create stores
- [ ] Higher tier applications queue for manual review
- [ ] Welcome emails send successfully
- [ ] Store directories update with new members
- [ ] Error handling works for failed submissions
- [ ] Duplicate prevention works correctly

### Monitoring Setup
1. **Application Logs**: Monitor webhook success/failure rates
2. **Form Analytics**: Track form submission and completion rates
3. **Member Onboarding**: Monitor time from application to store creation
4. **Error Alerts**: Set up alerts for failed integrations

## Phase 8: Member Communication Flow

### Automated Email Sequence
1. **Application Received** (Immediate)
   - Confirmation email with application details
   - Expected timeline for review
   - Next steps information

2. **Free Tier Auto-Approval** (Immediate)
   - Welcome email with store login details
   - Getting started guide
   - Mentor assignment notification

3. **Higher Tier Review** (2-3 business days)
   - Review in progress notification
   - Additional information requests (if needed)
   - Approval/rejection notification

4. **Welcome Package** (Post-approval)
   - Store setup tutorial
   - Community guidelines
   - Marketing resources
   - Mentor introduction

## Required Accounts and Credentials

### What You Need to Provide:
1. **Google Workspace Admin Access** - To configure domain-wide delegation
2. **Google Cloud Project** - For API access and service accounts
3. **Domain Ownership** - Your nonprofit's verified domain
4. **Service Account JSON Key** - For API authentication
5. **Form/Sheet IDs** - From your member application system

### Monthly Costs Estimate:
- Google Workspace: $6-18/user/month (if not already using)
- Google Cloud API usage: ~$10-50/month (depending on volume)
- Additional storage: ~$5-20/month

## Next Steps

1. **Review this setup guide** with your team
2. **Gather required Google accounts and permissions**
3. **Set up the Google Cloud project and APIs**
4. **Create the member application form**
5. **Configure the webhook endpoints**
6. **Test the integration with sample data**
7. **Launch with a small pilot group**

Would you like me to help you with any specific part of this setup process?
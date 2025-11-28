# 🤖 Auto-Provision Google Workspace Accounts

## Overview

When you approve a contractor's verification in RenovVision, the system **automatically**:
1. ✅ Creates Google Workspace account (@constructivedesignsinc.org)
2. ✅ Generates secure temporary password
3. ✅ Updates member status to verified
4. ✅ Makes them visible in member directory
5. ✅ Grants marketplace access
6. 📧 Provides credentials to send to contractor

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD (RenovVision)                         │
│  Verification Queue View                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Admin clicks "Approve & Create Account"
                   ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Database Approval                             │
│  • Call approve_business_verification()                │
│  • Set verification_status = 'approved'                │
│  • Set is_verified_member = true                       │
│  • Generate workspace_email                            │
│  • Log approval in verification_documents              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Trigger fires automatically
                   ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Call Google Workspace API                     │
│  • Supabase Edge Function                              │
│  • Creates JWT with service account                    │
│  • POST to admin.googleapis.com/admin/directory/v1/users│
│  • Generate 16-char secure password                    │
│  • Set changePasswordAtNextLogin = true                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ On success
                   ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Update Profile                                │
│  • Set workspace_account_created = true                │
│  • Store workspace_email                               │
│  • Log in workspace_account_log                        │
│  • Trigger notification                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Return credentials
                   ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Admin Sends Credentials                       │
│  • Copy credentials to clipboard                       │
│  • OR send welcome email (TODO)                        │
│  • Contractor receives @constructivedesignsinc.org     │
│  • Can login and change password                       │
└─────────────────────────────────────────────────────────┘
```

## User Experience

### For Contractor:
1. **Signs up** in RenovVision
2. **Uploads documents:**
   - Business license
   - Insurance certificate
   - EIN letter
3. **Status:** "Pending Verification"
4. **Admin approves** 🎉
5. **Receives email** with credentials:
   ```
   Welcome to Constructive Designs Inc!
   
   Your professional email: john.smith@constructivedesignsinc.org
   Temporary Password: Xy9$mK2p@Qr5vN8w
   
   Login: https://mail.google.com
   You'll be prompted to change your password.
   ```
6. **Logs in to Gmail**
7. **Changes password**
8. **Now has:**
   - ✅ Professional email
   - ✅ Member directory access
   - ✅ Marketplace listing privileges
   - ✅ Estimate creation in RenovVision
   - ✅ Time tracking in Quantum Wallet

### For You (Admin):
1. **Go to:** Verification Queue in admin dashboard
2. **See:** List of contractors awaiting approval
3. **Review:** Uploaded documents (license, insurance, EIN)
4. **Click:** "Approve & Create Account" button
5. **Wait:** 2-3 seconds (API calls Google)
6. **Get:** Success message with credentials
7. **Copy:** Credentials to clipboard
8. **Send:** Credentials to contractor via email
9. **Done!** Contractor is now a verified member

## Google Workspace Configuration

### User Permissions (Individual Users):
Each contractor gets:
- ✅ **Gmail:** Professional email @constructivedesignsinc.org
- ✅ **Drive:** 15GB free storage (standard Google account)
- ✅ **Calendar:** Scheduling for jobs
- ✅ **Meet:** Video calls with customers
- ✅ **Docs/Sheets/Slides:** Basic productivity tools
- ❌ **Admin Console:** NO access (only you have this)
- ❌ **Manage Users:** Cannot create/delete accounts
- ❌ **Domain Settings:** Cannot change organization settings

### Security:
- 🔐 **2-Factor Authentication:** Can be enforced org-wide
- 🔐 **Password Policy:** Minimum 8 characters, complexity rules
- 🔐 **Session Timeout:** Auto-logout after inactivity
- 🔐 **Password Change:** Required on first login
- 🔐 **Account Recovery:** Uses their personal email

### Quotas (Google for Nonprofits):
- **User Accounts:** UNLIMITED ✨
- **Storage per user:** 15GB (standard)
- **Gmail sending:** 500 emails/day per user
- **API calls:** 3,000 requests/second
- **Cost:** $0 (100% free for nonprofits!)

## SQL Files to Run

### 1. Unified Profiles Schema
**File:** `unified-profiles-schema.sql`
**Purpose:** Merges RenovVision + Marketplace profiles
**Run:** First (before marketplace tables)
```sql
-- Adds marketplace fields to profiles:
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN rating NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
-- Auto-syncs names between formats
```

### 2. Marketplace Tables Schema
**File:** `marketplace-tables-schema.sql`
**Purpose:** Creates marketplace tables
**Run:** Second (after unified profiles)
```sql
-- Creates: listings, bids, reviews, transactions, notifications, categories
-- Adds integration fields for cross-app linking
```

### 3. Business Verification System
**File:** `add-business-verification-system.sql`
**Purpose:** Document upload and verification workflow
**Run:** Third
```sql
-- Creates: business_verification_documents table
-- Creates: verification_queue view
-- Functions: request_verification(), approve_verification()
```

### 4. Google Workspace Provisioning
**File:** `add-google-workspace-provisioning.sql`
**Purpose:** Workspace account tables and functions
**Run:** Fourth
```sql
-- Adds: workspace_email, workspace_account_created to profiles
-- Creates: google_workspace_config table
-- Creates: workspace_account_log table
-- Function: generate_workspace_email()
```

### 5. Auto-Provision on Approval ⭐ NEW
**File:** `auto-provision-workspace-on-approval.sql`
**Purpose:** Automatically create workspace accounts on approval
**Run:** Fifth (this is what you need!)
```sql
-- Enhances approve_business_verification() to auto-create workspace
-- Adds trigger to call Edge Function
-- Creates pending_workspace_accounts view
-- Creates bulk_create_workspace_accounts() function
```

## React Components

### AutoApproveVerificationButton.tsx ⭐ NEW
**Purpose:** One-click approval + workspace creation
**Features:**
- Approves contractor verification
- Calls Google Workspace API automatically
- Shows credentials in success screen
- Copy credentials to clipboard
- Send welcome email (TODO)

**Usage:**
```tsx
import AutoApproveVerificationButton from './AutoApproveVerificationButton';

<AutoApproveVerificationButton
  profileId={contractor.id}
  firstName={contractor.first_name}
  lastName={contractor.last_name}
  email={contractor.email}
  businessName={contractor.business_name}
  onSuccess={() => {
    // Refresh verification queue
    fetchPendingVerifications();
  }}
/>
```

### CreateWorkspaceAccountButton.tsx
**Purpose:** Manual workspace account creation (fallback)
**Use case:** If auto-provisioning fails, admin can retry manually

## Edge Function

**File:** `supabase/functions/create-workspace-account/index.ts`
**Endpoint:** `https://gjbrjysuqdvvqlxklvos.supabase.co/functions/v1/create-workspace-account`

**Request:**
```json
{
  "profileId": "uuid",
  "firstName": "John",
  "lastName": "Smith",
  "recoveryEmail": "john@gmail.com"
}
```

**Response:**
```json
{
  "success": true,
  "workspaceEmail": "john.smith@constructivedesignsinc.org",
  "tempPassword": "Xy9$mK2p@Qr5vN8w",
  "message": "Account created successfully"
}
```

## Testing Workflow

### 1. Test Database Functions (Supabase SQL Editor)
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%workspace%';

-- Expected: generate_workspace_email, approve_business_verification

-- Test email generation
SELECT generate_workspace_email('John', 'Smith');
-- Expected: john.smith@constructivedesignsinc.org

-- View pending verifications
SELECT * FROM verification_queue;
```

### 2. Test Approval Flow (RenovVision UI)
1. Create test contractor account
2. Upload dummy documents
3. Go to admin verification queue
4. Click "Approve & Create Account"
5. Verify credentials shown
6. Check Supabase profiles table
7. Check Google Workspace Admin Console

### 3. Test Workspace Login
1. Go to https://mail.google.com
2. Enter generated @constructivedesignsinc.org email
3. Enter temporary password
4. Should prompt to change password
5. Change password
6. Access Gmail, Drive, Calendar

## Google Cloud Setup (One-Time)

### Prerequisites:
1. **Google Workspace for Nonprofits** account
2. **Admin access** to admin.google.com
3. **Google Cloud project** with Admin SDK API enabled
4. **Service account** with domain-wide delegation

### Setup Steps:
See `GOOGLE_WORKSPACE_SETUP_GUIDE.md` for complete instructions.

**Quick checklist:**
- [ ] Enable Admin SDK API in Google Cloud Console
- [ ] Create service account
- [ ] Download JSON key
- [ ] Enable domain-wide delegation
- [ ] Add scopes in admin.google.com
- [ ] Store credentials in Supabase Vault
- [ ] Deploy Edge Function
- [ ] Test with sample profile

## Cost Analysis

### With Auto-Provisioning:
- **Google Workspace:** $0/month (nonprofit plan = unlimited users)
- **Supabase:** $0/month (free tier covers our usage)
- **Firebase Hosting:** $0/month (free tier)
- **Edge Function calls:** $0/month (free tier = 500k requests)
- **Google Admin API:** $0/month (no quota charges)

**Total Operating Cost:** **$0/month** 🎉

### Without Auto-Provisioning:
- Your time: 5 minutes per contractor manually creating accounts
- 100 contractors = 500 minutes = 8+ hours of manual work
- Auto-provisioning saves you 8+ hours! ⏰

## Security Considerations

### API Key Storage:
✅ **DO:** Store service account JSON in Supabase Vault
❌ **DON'T:** Commit service account JSON to Git
❌ **DON'T:** Store in .env files (gets committed)

### Password Security:
✅ **DO:** Generate cryptographically random passwords (16+ chars)
✅ **DO:** Require password change on first login
✅ **DO:** Enforce strong password policy
❌ **DON'T:** Send passwords in plain text email (use secure delivery)

### Access Control:
✅ **DO:** Require admin authentication for approval
✅ **DO:** Log all workspace account operations
✅ **DO:** Audit log regularly
❌ **DON'T:** Allow contractors to approve themselves

### Data Privacy:
✅ **DO:** Use RLS policies to protect profile data
✅ **DO:** Only expose necessary fields in views
✅ **DO:** Encrypt sensitive data
❌ **DON'T:** Store passwords in database (only Google has them)

## Troubleshooting

### "Service account does not have permission"
- Check domain-wide delegation is enabled
- Verify scopes in admin.google.com match Edge Function
- Ensure service account email is correct

### "User already exists"
- Username might be taken
- Check existing users in Admin Console
- Modify username generation logic if needed

### "Edge Function timeout"
- Google API might be slow
- Increase function timeout in Supabase dashboard
- Add retry logic with exponential backoff

### "Invalid JWT"
- Check service account private key format
- Ensure newlines are preserved in key
- Verify key is not expired

## Future Enhancements

### Phase 1: Email Automation
- [ ] Send welcome email automatically via SendGrid
- [ ] Include credentials in encrypted link
- [ ] Track email opens

### Phase 2: Onboarding
- [ ] Step-by-step setup wizard
- [ ] Video tutorial on first login
- [ ] Checklist of member benefits

### Phase 3: Bulk Operations
- [ ] Approve multiple contractors at once
- [ ] Bulk create workspace accounts
- [ ] CSV import for existing members

### Phase 4: Advanced Features
- [ ] Auto-suspend inactive accounts (>90 days)
- [ ] Auto-renew based on verification expiry
- [ ] Integration with Google Calendar for job scheduling

## Success Metrics

Track these in your admin dashboard:
- ⏱️ **Avg approval time:** Target <2 minutes
- 📧 **Workspace accounts created:** Track growth
- ✅ **Success rate:** Target >95%
- 🔄 **Retry rate:** If high, investigate API issues
- 📊 **Member growth:** Month-over-month

## Next Steps

1. ✅ **Run SQL files** (all 5 in order)
2. ✅ **Set up Google Cloud** service account
3. ✅ **Deploy Edge Function** to Supabase
4. ✅ **Test approval workflow** with dummy contractor
5. ✅ **Verify workspace account** created in Admin Console
6. 🎉 **Start approving real contractors!**

---

**This is exactly what you wanted:** One click approves contractor + creates @constructivedesignsinc.org email automatically! 🚀

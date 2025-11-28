# Google Workspace Integration Status

## Current Implementation Status

### ✅ What's Built (Framework Ready)

The Google Workspace integration **service layer is built** but **NOT connected** to the team member creation workflow. Here's what exists:

#### 1. **GoogleWorkspaceService** (`services/googleWorkspaceService.ts`)
Complete service class with methods for:
- ✅ Generating org email addresses (format: `firstname.l@constructivedesignsinc.org`)
- ✅ Initiating onboarding workflows
- ✅ Creating Workspace accounts via Admin SDK
- ✅ Completing onboarding steps
- ✅ Google Calendar OAuth integration
- ✅ Calendar event syncing
- ✅ Team member availability checking
- ✅ Welcome email sending
- ✅ Project calendar event creation

#### 2. **Database Tables** (Expected)
The service references these tables that need to exist:
- `google_workspace_accounts` - Stores Workspace account info
- `onboarding_workflows` - Tracks onboarding progress
- `google_calendar_integrations` - Calendar sync status

#### 3. **Supabase Edge Functions** (Expected)
The service calls these functions that need to be created:
- `create-google-workspace-account` - Uses Google Admin SDK
- `send-welcome-email` - Sends credentials to new member
- `google-calendar-auth` - OAuth callback handler
- `sync-google-calendar` - Syncs events
- `get-calendar-availability` - Gets free/busy times
- `create-calendar-event` - Creates events in Google Calendar

---

## ❌ What's NOT Connected

### Current Team Member Creation Flow
When you add a team member in `TeamMembersView.tsx`:
1. ✅ Creates record in `team_members` table
2. ✅ Sends invite via email/SMS (if implemented)
3. ❌ **DOES NOT** create Google Workspace account
4. ❌ **DOES NOT** initiate onboarding workflow
5. ❌ **DOES NOT** send welcome email with credentials

### Why It's Not Connected
- `TeamMembersView.tsx` does **NOT import** `GoogleWorkspaceService`
- No call to `GoogleWorkspaceService.createWorkspaceAccount()` in `handleAddTeamMember()`
- No database tables for Workspace accounts
- No Supabase Edge Functions deployed

---

## 🔧 How to Connect It

### Step 1: Create Database Tables

Run this SQL in Supabase:

```sql
-- Google Workspace Accounts table
CREATE TABLE IF NOT EXISTS google_workspace_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    org_email TEXT NOT NULL UNIQUE,
    google_user_id TEXT UNIQUE,
    workspace_account_created BOOLEAN DEFAULT false,
    calendar_connected BOOLEAN DEFAULT false,
    drive_access_granted BOOLEAN DEFAULT false,
    account_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_team_member FOREIGN KEY (team_member_id) REFERENCES team_members(id)
);

-- Onboarding Workflows table
CREATE TABLE IF NOT EXISTS onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL DEFAULT 'google_workspace',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    steps_completed JSONB DEFAULT '[]'::jsonb,
    current_step TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Calendar Integrations table
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    google_calendar_id TEXT NOT NULL,
    calendar_sync_enabled BOOLEAN DEFAULT true,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('active', 'error', 'disabled')) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    google_access_token TEXT,
    google_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE google_workspace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Business users can manage their team's Workspace accounts
CREATE POLICY "Business users can manage workspace accounts"
ON google_workspace_accounts
FOR ALL
TO authenticated
USING (
    team_member_id IN (
        SELECT id FROM team_members 
        WHERE business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Similar policies for other tables
CREATE POLICY "Business users can manage onboarding workflows"
ON onboarding_workflows
FOR ALL
TO authenticated
USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Business users can manage calendar integrations"
ON google_calendar_integrations
FOR ALL
TO authenticated
USING (
    team_member_id IN (
        SELECT id FROM team_members 
        WHERE business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Indexes for performance
CREATE INDEX idx_workspace_accounts_team_member ON google_workspace_accounts(team_member_id);
CREATE INDEX idx_onboarding_workflows_team_member ON onboarding_workflows(team_member_id);
CREATE INDEX idx_onboarding_workflows_business ON onboarding_workflows(business_id);
CREATE INDEX idx_calendar_integrations_team_member ON google_calendar_integrations(team_member_id);
```

### Step 2: Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Constructive Designs Workspace"
3. Enable these APIs:
   - **Admin SDK API** (for user management)
   - **Google Calendar API** (for calendar integration)
   - **Gmail API** (optional, for email)
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-app.com/auth/google/calendar/callback`
   - Copy Client ID and Client Secret
5. Create Service Account (for Admin SDK):
   - Grant domain-wide delegation
   - Download JSON key file
6. In Google Workspace Admin:
   - Go to Security > API Controls > Domain-wide Delegation
   - Add your service account client ID
   - Scopes: `https://www.googleapis.com/auth/admin.directory.user`, `https://www.googleapis.com/auth/calendar`

### Step 3: Add Environment Variables

Add to your `.env` file:

```bash
# Google OAuth (for calendar integration)
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here

# Google Service Account (for Admin SDK)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----
GOOGLE_WORKSPACE_DOMAIN=constructivedesignsinc.org
GOOGLE_WORKSPACE_CUSTOMER_ID=your_customer_id
```

### Step 4: Create Supabase Edge Function

Create `supabase/functions/create-google-workspace-account/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { JWT } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { teamMemberId, firstName, lastName, orgEmail, personalEmail, role } = await req.json();

    // Create JWT for Google Admin SDK
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!;
    const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')!;
    const domain = Deno.env.get('GOOGLE_WORKSPACE_DOMAIN')!;

    const now = Math.floor(Date.now() / 1000);
    const jwt = await JWT.sign({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/admin.directory.user',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
      sub: `admin@${domain}`, // Must be a super admin
    }, privateKey, { algorithm: 'RS256' });

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const { access_token } = await tokenResponse.json();

    // Generate temporary password
    const tempPassword = generateSecurePassword();

    // Create user in Google Workspace
    const createUserResponse = await fetch('https://admin.googleapis.com/admin/directory/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryEmail: orgEmail,
        name: {
          givenName: firstName,
          familyName: lastName,
        },
        password: tempPassword,
        changePasswordAtNextLogin: true,
        recoveryEmail: personalEmail,
        orgUnitPath: `/Team Members/${role}`, // Organize by role
      }),
    });

    const userData = await createUserResponse.json();

    if (!createUserResponse.ok) {
      throw new Error(`Google API error: ${JSON.stringify(userData)}`);
    }

    // Update Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('google_workspace_accounts').insert({
      team_member_id: teamMemberId,
      org_email: orgEmail,
      google_user_id: userData.id,
      workspace_account_created: true,
    });

    // Send welcome email with credentials (call another function or use SendGrid)
    // await sendWelcomeEmail({ orgEmail, tempPassword, firstName, lastName });

    return new Response(
      JSON.stringify({
        success: true,
        userId: userData.id,
        orgEmail: orgEmail,
        tempPassword: tempPassword, // In production, send via email only!
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}
```

Deploy it:
```bash
supabase functions deploy create-google-workspace-account
```

### Step 5: Update TeamMembersView.tsx

Modify the `handleAddTeamMember` function:

```typescript
import GoogleWorkspaceService from '../../services/googleWorkspaceService';

const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.business_id) {
        alert('Business not found');
        return;
    }

    setIsSubmitting(true);

    try {
        // Generate org email
        const orgEmail = GoogleWorkspaceService.generateOrgEmail(
            formData.first_name, 
            formData.last_name
        );

        // 1. Create team member in database
        const { data: newMember, error } = await supabase
            .from('team_members')
            .insert([{
                business_id: userProfile.business_id,
                ...formData,
                org_email: orgEmail, // Make sure team_members table has this column
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. Create Google Workspace account
        try {
            const workspaceResult = await GoogleWorkspaceService.createWorkspaceAccount({
                teamMemberId: newMember.id,
                firstName: formData.first_name,
                lastName: formData.last_name,
                orgEmail: orgEmail,
                personalEmail: formData.email,
                role: formData.role,
            });

            console.log('✅ Google Workspace account created:', workspaceResult);

            // 3. Initiate onboarding workflow
            await GoogleWorkspaceService.initiateOnboarding(
                newMember.id, 
                userProfile.business_id
            );

            alert(`✅ Team member added successfully!\n\nOrg Email: ${orgEmail}\nTemp Password: ${workspaceResult.tempPassword}\n\n(Password will be sent via email)`);
        } catch (workspaceError) {
            console.error('⚠️ Team member created but Workspace setup failed:', workspaceError);
            alert(`✅ Team member added to database\n⚠️ Google Workspace account creation pending\n\nError: ${workspaceError.message}`);
        }

        // Refresh list
        await loadTeamMembers();
        setShowAddModal(false);
        resetForm();
    } catch (error: any) {
        console.error('Error adding team member:', error);
        alert('❌ Error: ' + error.message);
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## 📊 Summary

| Component | Status | Location |
|-----------|--------|----------|
| **Service Layer** | ✅ Built | `services/googleWorkspaceService.ts` |
| **Database Tables** | ❌ Not Created | Need SQL script above |
| **Edge Functions** | ❌ Not Created | Need to create and deploy |
| **Google Cloud Setup** | ❌ Not Configured | Need OAuth credentials + Service Account |
| **UI Integration** | ❌ Not Connected | `TeamMembersView.tsx` doesn't call service |
| **Team Member Table** | ⚠️ Needs Column | Add `org_email` column to `team_members` |

---

## 🎯 To Answer Your Questions

### 1. "Is it connected to Google Workspace account creation?"

**NO** - The service exists but is **not connected** to the team member creation workflow. When you add a team member, it only creates a database record. It does NOT:
- Create a Google Workspace account
- Generate org email credentials
- Send welcome emails
- Set up calendar access

### 2. "When a user creates an account in the app, does it simultaneously create a Workspace account?"

**NO** - Currently it only creates:
- ✅ Record in `team_members` table
- ✅ Optional invitation to the team member

It does **NOT** create a Google Workspace account automatically.

---

## ⚡ Quick Start (If You Want This Feature)

**Minimal setup to test:**

1. **Add org_email column to team_members:**
```sql
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS org_email TEXT UNIQUE;
```

2. **Import and call in TeamMembersView.tsx:**
```typescript
// At top of file
import GoogleWorkspaceService from '../../services/googleWorkspaceService';

// In handleAddTeamMember, after successful insert:
const orgEmail = GoogleWorkspaceService.generateOrgEmail(
    formData.first_name, 
    formData.last_name
);
console.log('Generated org email:', orgEmail);
// For now, just log it. Full integration needs Google Cloud setup.
```

3. **Test without full Google integration:**
   - Team members will get org email generated
   - Store it in database
   - Manual account creation for now
   - Full automation comes after Google Cloud Console setup

---

## 💡 Recommendation

**For production use**, you need to:
1. Set up Google Workspace Admin (costs ~$6-12/user/month)
2. Configure Google Cloud Console with service account
3. Create and deploy Supabase Edge Functions
4. Update team member creation workflow
5. Add onboarding UI to track progress

**For now**, the service exists as a **framework** ready to be activated when you're ready to connect to Google Workspace.

---

## 📞 Need Help?

The infrastructure is 80% ready. The remaining 20% requires:
- Google Workspace admin access
- Google Cloud Console configuration
- Supabase Edge Function deployment
- UI integration in TeamMembersView

Let me know if you want to proceed with full integration!

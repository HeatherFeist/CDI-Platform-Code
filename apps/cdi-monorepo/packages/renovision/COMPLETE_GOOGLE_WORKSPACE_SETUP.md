# 🚀 Google Workspace Integration - Complete Setup Guide

## Overview

This guide walks you through connecting your app to Google Workspace so that when you add a team member, it automatically:
- ✅ Creates a Google Workspace account
- ✅ Generates organization email (firstname.l@constructivedesignsinc.org)
- ✅ Sets up Google Calendar access
- ✅ Grants Google Drive permissions
- ✅ Sends welcome email with credentials

---

## Prerequisites

Before starting, you need:
1. **Google Workspace Account** ($6-12/user/month)
   - Go to [workspace.google.com](https://workspace.google.com)
   - Sign up for Business Starter ($6/user) or Business Standard ($12/user)
   - Verify your domain: `constructivedesignsinc.org`
   
2. **Super Admin Access** to your Google Workspace
   - Must be able to create users and manage APIs

3. **Google Cloud Console Access**
   - Free to set up, pay only for API usage (minimal)

---

## Step 1: Database Setup (5 minutes)

### 1.1 Run the SQL Migration

1. Open **Supabase Dashboard** → Your Project → **SQL Editor**
2. Open the file: `SQL Files/add-google-workspace-integration.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run**
6. Wait for success message

**What this does:**
- Adds `org_email` column to `team_members` table
- Creates 3 new tables:
  - `google_workspace_accounts` - Stores Google account info
  - `onboarding_workflows` - Tracks setup progress
  - `google_calendar_integrations` - Manages calendar sync
- Creates RLS policies for security
- Adds database functions for onboarding automation

### 1.2 Verify Installation

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('google_workspace_accounts', 'onboarding_workflows', 'google_calendar_integrations');
```

You should see 3 rows returned.

---

## Step 2: Google Cloud Console Setup (15 minutes)

### 2.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name: `Constructive Designs Workspace Integration`
4. Click **Create**
5. Select your new project from the dropdown

### 2.2 Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Admin SDK API** (for creating users)
   - **Google Calendar API** (for calendar integration)
   - **Gmail API** (optional, for email integration)

Click **Enable** for each.

### 2.3 Create Service Account (for creating users)

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `workspace-admin-automation`
4. Description: `Automates Google Workspace user creation`
5. Click **Create and Continue**
6. Grant role: **Service Account Token Creator**
7. Click **Continue** → **Done**

### 2.4 Generate Service Account Key

1. Click on your new service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON**
5. Click **Create**
6. **Save the downloaded JSON file securely** (you'll need it later)

### 2.5 Enable Domain-Wide Delegation

1. Still in Service Account details, scroll to **Advanced settings**
2. Check **Enable G Suite Domain-wide Delegation**
3. Product name: `Team Member Automation`
4. Click **Save**
5. Copy the **Client ID** (you'll need it next)

### 2.6 Authorize Service Account in Google Workspace Admin

1. Go to [admin.google.com](https://admin.google.com)
2. Go to **Security** → **API Controls** → **Domain-wide Delegation**
3. Click **Add new**
4. Paste the **Client ID** from step 2.5
5. Add these OAuth scopes (comma-separated):
   ```
   https://www.googleapis.com/auth/admin.directory.user,https://www.googleapis.com/auth/admin.directory.group,https://www.googleapis.com/auth/calendar
   ```
6. Click **Authorize**

### 2.7 Create OAuth 2.0 Credentials (for calendar sync)

1. Back in Google Cloud Console
2. Go to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Name: `Constructive Designs Calendar Sync`
6. Authorized redirect URIs:
   - `http://localhost:5173/auth/google/calendar/callback` (for testing)
   - `https://your-production-domain.com/auth/google/calendar/callback`
7. Click **Create**
8. **Copy Client ID and Client Secret** - save them securely

---

## Step 3: Configure Supabase Environment Variables (5 minutes)

### 3.1 Add to Supabase Dashboard

1. Open Supabase Dashboard → Your Project → **Settings** → **Edge Functions**
2. Scroll to **Secrets**
3. Add these secrets (click **Add new secret** for each):

```bash
# Service Account (from JSON file in Step 2.4)
GOOGLE_SERVICE_ACCOUNT_EMAIL=workspace-admin-automation@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----

# OAuth Credentials (from Step 2.7)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Workspace Settings
GOOGLE_WORKSPACE_DOMAIN=constructivedesignsinc.org
GOOGLE_WORKSPACE_ADMIN_EMAIL=your-admin-email@constructivedesignsinc.org
```

**How to get values from JSON file:**
- Open the JSON file from Step 2.4
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email` field
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` = `private_key` field (include BEGIN/END lines)

### 3.2 Add to Local .env (for development)

Create or update `.env` file in your project root:

```bash
# Google OAuth (for calendar integration)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret

# These are server-side only (don't expose to client)
GOOGLE_SERVICE_ACCOUNT_EMAIL=workspace-admin-automation@your-project.iam.gserviceaccount.com
GOOGLE_WORKSPACE_DOMAIN=constructivedesignsinc.org
GOOGLE_WORKSPACE_ADMIN_EMAIL=your-admin-email@constructivedesignsinc.org
```

---

## Step 4: Deploy Supabase Edge Function (5 minutes)

### 4.1 Install Supabase CLI (if not already installed)

```bash
# Windows (PowerShell) - using Scoop
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

### 4.2 Login to Supabase

```bash
supabase login
```

Follow the prompts to authenticate.

### 4.3 Link Your Project

```bash
supabase link --project-ref your-project-ref
```

Find your project ref in Supabase Dashboard → Settings → General → Reference ID

### 4.4 Deploy the Edge Function

```bash
cd "c:\Users\heath\Downloads\home-reno-vision-pro (2)"
supabase functions deploy create-google-workspace-account
```

Wait for deployment to complete. You should see:
```
✓ Deployed create-google-workspace-account
```

### 4.5 Test the Function

Go to Supabase Dashboard → Edge Functions → `create-google-workspace-account` → **Invocations**

You should see it listed. You can test it by adding a team member in your app.

---

## Step 5: Set Up Google Workspace Organization (10 minutes)

### 5.1 Create Organizational Units

1. Go to [admin.google.com](https://admin.google.com)
2. Go to **Directory** → **Organizational units**
3. Click **Create organizational unit**
4. Create these OUs:
   - `/Team Members` (parent)
     - `/Team Members/admin`
     - `/Team Members/manager`
     - `/Team Members/technician`
     - `/Team Members/helper`

**Why?** When creating users, they'll be automatically placed in the correct OU based on their role.

### 5.2 Create Google Groups (Optional but Recommended)

1. Go to **Directory** → **Groups**
2. Create these groups:
   - `team@constructivedesignsinc.org` - All team members
   - `admins@constructivedesignsinc.org` - Admin users only
3. Set group permissions as needed

---

## Step 6: Test the Integration (5 minutes)

### 6.1 Add a Test Team Member

1. Open your app
2. Go to **Team Members** page
3. Click **Add Team Member**
4. Fill in the form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `your-personal-email@gmail.com` (for recovery)
   - Role: `helper`
5. Click **Add**

### 6.2 Expected Behavior

You should see an alert showing:
```
✅ Team Member Added Successfully!

Name: Test User
Organization Email: test.u@constructivedesignsinc.org
Temporary Password: [random password]

⚠️ IMPORTANT:
• Send these credentials to the team member securely
• They must change password on first login
• Access to Google Calendar, Drive, and email is now active

(In production, this will be sent automatically via email)
```

### 6.3 Verify in Google Workspace Admin

1. Go to [admin.google.com](https://admin.google.com)
2. Go to **Directory** → **Users**
3. You should see `test.u@constructivedesignsinc.org` in the list
4. Click on the user to see details
5. Check that:
   - ✅ User is in correct OU (`/Team Members/helper`)
   - ✅ Recovery email is set
   - ✅ User must change password on first login

### 6.4 Test Login

1. Open an incognito/private window
2. Go to [gmail.com](https://gmail.com)
3. Sign in with:
   - Email: `test.u@constructivedesignsinc.org`
   - Password: [the temporary password from the alert]
4. You'll be prompted to change the password
5. After changing, you should have access to Gmail, Calendar, and Drive

---

## Troubleshooting

### "Missing required environment variables"

**Solution:** 
- Check Supabase Dashboard → Settings → Edge Functions → Secrets
- Ensure all 5 variables are set correctly
- Redeploy the function after adding secrets

### "Google API error: Insufficient permissions"

**Solution:**
- Verify service account has domain-wide delegation enabled
- Check OAuth scopes in Google Workspace Admin
- Ensure your admin email has super admin privileges

### "Failed to create user: Domain does not exist"

**Solution:**
- Verify your domain in Google Workspace Admin
- Confirm `GOOGLE_WORKSPACE_DOMAIN` environment variable matches your verified domain

### "org_email column does not exist"

**Solution:**
- Run the SQL migration: `SQL Files/add-google-workspace-integration.sql`
- Refresh your browser

### Service account can't create users

**Solution:**
- In Google Workspace Admin, verify the service account client ID is authorized
- Check that the OAuth scopes include `admin.directory.user`
- Ensure your Google Workspace subscription allows API access

---

## Summary Checklist

Before going live, verify:

- [ ] SQL migration run successfully
- [ ] Google Cloud project created with Admin SDK enabled
- [ ] Service account created with domain-wide delegation
- [ ] OAuth scopes authorized in Google Workspace Admin
- [ ] Environment variables set in Supabase
- [ ] Edge function deployed successfully
- [ ] Organizational units created in Google Workspace
- [ ] Test team member created successfully
- [ ] Test user can log in to Gmail/Calendar/Drive
- [ ] Monitoring set up for errors

---

**🎉 Congratulations!** Your Google Workspace integration is now live. Every new team member will automatically get their organization email and access to Google services.

Need help? Check the troubleshooting section or review the logs in Supabase Dashboard → Edge Functions.

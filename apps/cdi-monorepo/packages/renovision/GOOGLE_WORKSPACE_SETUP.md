# Google Workspace Integration Setup Guide

## ✅ What You Have
- Service Account JSON: `home-reno-vision-pro-8b9ae42defb2.json`
- Client ID: `109937947222319386673`
- Service Account Email: `home-reno-vision-pro@appspot.gserviceaccount.com`

## 🔧 Required Setup Steps

### Step 1: Enable Admin SDK API
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/admin.googleapis.com?project=home-reno-vision-pro)
2. Click **"ENABLE"** on the Admin SDK API
3. Wait for it to enable (takes ~30 seconds)

### Step 2: Set Up Domain-Wide Delegation
This allows your service account to create users in your Workspace.

1. Go to [Google Workspace Admin Console](https://admin.google.com/)
2. Navigate to: **Security** → **Access and data control** → **API Controls**
3. Click **"MANAGE DOMAIN-WIDE DELEGATION"**
4. Click **"Add new"**
5. Fill in:
   - **Client ID**: `109937947222319386673`
   - **OAuth Scopes**: Copy and paste these exactly:
     ```
     https://www.googleapis.com/auth/admin.directory.user,https://www.googleapis.com/auth/admin.directory.orgunit.readonly
     ```
6. Click **"Authorize"**

### Step 3: Verify Your Admin Email
What is your Google Workspace admin email? (The one with super admin privileges)
Example: `heather.feist@constructivedesignsinc.org`

## 🎯 What This Integration Will Do

When a new user signs up on your app:
1. ✅ User enters: First Name, Last Name, Email (any email)
2. ✅ App creates Firebase account
3. ✅ App automatically creates: `firstname.lastname@constructivedesignsinc.org`
4. ✅ Google Workspace account is provisioned
5. ✅ User profile linked to both Firebase + Workspace
6. ✅ User can access both app + Google Workspace services

## 📝 Next Steps
After completing Steps 1-3 above, I'll:
- Install Google Admin SDK package
- Create workspace provisioning service
- Integrate with signup flow
- Test the complete flow

# 🔧 Database Setup Instructions

Your project isn't saving because the **Supabase database isn't configured**. Here's how to fix it:

## Step 1: Set Up Supabase Project

1. **Go to Supabase**: Visit [https://app.supabase.com/](https://app.supabase.com/)
2. **Sign In/Create Account**: Use your GitHub, Google, or email
3. **Create New Project** (or select existing):
   - Choose organization
   - Enter project name: "Home Reno Vision Pro"
   - Database password: Generate a strong password
   - Region: Choose closest to you
   - Click "Create new project"

⏱️ **Wait 2-3 minutes** for project to be ready.

## Step 2: Get Your API Credentials

1. **Go to Settings**: Click "Settings" in the left sidebar
2. **API Section**: Click "API" 
3. **Copy These Values**:
   - **Project URL**: `https://abcdefghijklmnop.supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`

## Step 3: Update Environment Variables

1. **Open `.env` file** in your project root
2. **Replace the placeholder values**:
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

## Step 4: Create Database Schema

1. **Go to SQL Editor**: In Supabase dashboard, click "SQL Editor"
2. **Copy Schema**: Open `supabase-schema.sql` file in your project
3. **Paste & Run**: Copy ALL content and paste in SQL Editor, then click "Run"

This creates all the tables, security policies, and functions needed.

## Step 5: Verify Setup

1. **Restart Dev Server**: Stop and restart your development server
2. **Check Dashboard**: You should see "✅ Database connected and ready"
3. **Test Project Creation**: Try creating a new project - it should save properly!

## Step 6: Create Your Business Profile

After database is set up:
1. **Sign Up**: Create an account in your app
2. **Complete Profile**: Fill in your business information
3. **Add Customers**: Create customer records
4. **Create Projects**: Projects will now save to the database!

## Troubleshooting

### "Projects not saving"
- Check `.env` file has correct values
- Restart development server after changing `.env`
- Verify schema was run successfully in Supabase

### "Getting kicked off"
- This happens when authentication fails due to missing config
- Follow steps above to configure Supabase properly

### "Can't connect to database"
- Check your internet connection
- Verify Supabase project is active (not paused)
- Confirm API keys are correct (no extra spaces)

### "Table doesn't exist"
- Run the `supabase-schema.sql` file in Supabase SQL Editor
- Check for any error messages in the SQL Editor

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Make sure the Supabase project is active and not paused
4. Try the verification script: `node verify-setup.js`

---

**Once configured, your projects will save properly and you won't get kicked off!** 🎉
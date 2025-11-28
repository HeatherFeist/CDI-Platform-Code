# 🏠 Home Renovation Pro - Supabase Setup Guide

## 📋 Complete Setup Instructions

### 1. Create Supabase Project

1. **Go to Supabase**: Visit [https://app.supabase.com/](https://app.supabase.com/)
2. **Sign up/Login**: Create an account or log in
3. **Create New Project**: 
   - Click "New Project"
   - Choose organization
   - Enter project name (e.g., "home-reno-pro")
   - Enter secure database password
   - Choose region closest to you
   - Click "Create new project"

### 2. Run Database Schema

1. **Open SQL Editor**: In your Supabase dashboard, go to **SQL Editor**
2. **Execute Schema**: Copy and paste the entire contents of `supabase-schema.sql` into the SQL editor
3. **Run Query**: Click the "Run" button to execute the SQL
4. **Verify Tables**: Check the **Table Editor** to ensure all tables were created:
   - `businesses`
   - `profiles`
   - `customers`
   - `projects`
   - `estimates`
   - `invoices`
   - `team_members`

### 3. Configure Environment Variables

1. **Get API Keys**: In Supabase dashboard, go to **Settings > API**
2. **Copy Values**:
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon public key: `eyJhbGc...` (long string starting with eyJ)

3. **Create Environment File**: 
   ```bash
   # Copy the example file
   cp .env.example .env.local
   ```

4. **Update `.env.local`**:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
   ```

### 4. Configure Authentication

1. **Enable Email Auth**: In Supabase dashboard, go to **Authentication > Settings**
2. **Configure Site URL**: Set to `http://localhost:3000` for development
3. **Email Templates**: Customize signup/login email templates if needed

### 5. Test the Application

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Signup**:
   - Go to `http://localhost:3000`
   - Click "Business Portal" 
   - Try to sign up with a new account
   - Fill in required fields:
     - Email
     - Password
     - First Name
     - Last Name
     - Role (admin, manager, technician, sales)

3. **Verify Database**:
   - Check Supabase **Authentication > Users** for new user
   - Check **Table Editor > profiles** for user profile
   - Check **Table Editor > businesses** for auto-created business

## 🗄️ Database Structure

### Tables Created:
- **businesses**: Company information
- **profiles**: User profiles (extends auth.users)
- **customers**: Customer management
- **projects**: Project tracking
- **estimates**: Quote generation
- **invoices**: Billing system
- **team_members**: Staff management

### Security Features:
- **Row Level Security (RLS)**: Users can only access their business data
- **Auto Profile Creation**: New users automatically get profiles
- **Business Isolation**: Data is segregated by business_id

## 🔧 Features Available

### ✅ Authentication System
- User registration/login
- Password reset
- Role-based access
- Automatic profile creation

### ✅ Business Management
- Customer database
- Project tracking
- Team management
- Estimates & invoicing
- Analytics dashboard

### ✅ Design Tool
- Image upload
- AI processing (requires Gemini API)
- Canvas interface
- API key management

## 🚨 Troubleshooting

### Common Issues:

1. **"Supabase not configured" warning**:
   - Ensure `.env.local` file exists with correct values
   - Restart development server after adding env vars

2. **Signup fails**:
   - Check Supabase logs in dashboard
   - Verify email confirmation settings
   - Ensure RLS policies are set correctly

3. **Database errors**:
   - Verify all SQL schema was executed successfully
   - Check for any SQL errors in Supabase logs

4. **Can't access business features**:
   - Ensure user is logged in
   - Check that profile was created with business_id
   - Verify RLS policies allow access

### Debug Commands:
```bash
# Check environment variables
echo $REACT_APP_SUPABASE_URL

# View browser console for detailed errors
# Open browser dev tools > Console

# Check Supabase logs
# Go to Supabase dashboard > Logs
```

## 🎯 Next Steps

1. **Production Deployment**:
   - Update Site URL in Supabase for your domain
   - Set production environment variables
   - Configure custom email templates

2. **Add Sample Data**:
   - Create test customers
   - Add sample projects
   - Test all business features

3. **AI Integration**:
   - Get Gemini API key from Google AI Studio
   - Add to environment variables
   - Test image processing features

## 📞 Support

Your application is now fully configured with Supabase! The signup functionality should work correctly once you've completed these setup steps.

**Important**: Make sure to update your Supabase URL and keys in the environment file - this is the most common reason signup doesn't work.
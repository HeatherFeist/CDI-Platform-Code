-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR CONSTRUCTIVE HOME RENO
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create all necessary tables
-- Go to: https://app.supabase.com/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BUSINESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    gemini_api_key TEXT, -- Google Gemini API key for AI features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'technician', 'sales')) DEFAULT 'technician',
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address JSONB NOT NULL, -- {street, city, state, zipCode, country}
    communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "phone": false}',
    source VARCHAR(100) DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    last_contact_date TIMESTAMP WITH TIME ZONE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('inquiry', 'estimated', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'inquiry',
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category VARCHAR(100) NOT NULL,
    estimate_id UUID,
    design_id UUID,
    location JSONB NOT NULL, -- Address object
    scheduled_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER NOT NULL, -- in days
    completed_date TIMESTAMP WITH TIME ZONE,
    photos JSONB DEFAULT '[]', -- Array of photo objects
    notes JSONB DEFAULT '[]', -- Array of note objects
    tasks JSONB DEFAULT '[]', -- Array of task objects
    payments JSONB DEFAULT '[]', -- Array of payment objects
    assigned_team UUID[] DEFAULT '{}', -- Array of team member IDs
    materials JSONB DEFAULT '[]', -- Array of material objects
    permits JSONB DEFAULT '[]', -- Array of permit objects
    inspections JSONB DEFAULT '[]', -- Array of inspection objects
    warranties JSONB DEFAULT '[]', -- Array of warranty objects
    milestones JSONB DEFAULT '[]', -- Array of milestone objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ESTIMATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS estimates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]', -- Array of estimate items
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')) DEFAULT 'draft',
    valid_until TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    estimate_id UUID REFERENCES estimates(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]', -- Array of invoice items
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TEAM_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'employee', 'subcontractor', 'helper'
    specialties TEXT[] DEFAULT '{}', -- Skills: plumbing, electrical, painting, etc.
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    invite_status VARCHAR(20) CHECK (invite_status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. PAYMENT SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    paypal_email VARCHAR(255), -- Business PayPal email for receiving payments
    paypal_client_id VARCHAR(255), -- PayPal client ID (optional for API integration)
    cashapp_cashtag VARCHAR(100), -- Cash App $cashtag
    payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}',
    platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00, -- Platform fee (default 5% - competitive and fair)
    platform_paypal_email VARCHAR(255) DEFAULT 'constructivedesignsinc@mail.com', -- Your org's PayPal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL, -- Amount going to platform
    business_amount DECIMAL(10,2) NOT NULL, -- Amount going to business
    payment_method VARCHAR(50) NOT NULL, -- 'paypal' or 'cashapp'
    payment_id VARCHAR(255), -- External payment ID from PayPal/CashApp
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_metadata JSONB, -- Store additional payment details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_estimates_business_id ON estimates(business_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_id ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_settings_business_id ON payment_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own business" ON businesses;
DROP POLICY IF EXISTS "Users can update own business" ON businesses;
DROP POLICY IF EXISTS "Users can view business data" ON customers;
DROP POLICY IF EXISTS "Users can insert business data" ON customers;
DROP POLICY IF EXISTS "Users can update business data" ON customers;
DROP POLICY IF EXISTS "Users can delete business data" ON customers;
DROP POLICY IF EXISTS "Users can view business projects" ON projects;
DROP POLICY IF EXISTS "Users can insert business projects" ON projects;
DROP POLICY IF EXISTS "Users can update business projects" ON projects;
DROP POLICY IF EXISTS "Users can delete business projects" ON projects;
DROP POLICY IF EXISTS "Users can view business estimates" ON estimates;
DROP POLICY IF EXISTS "Users can insert business estimates" ON estimates;
DROP POLICY IF EXISTS "Users can update business estimates" ON estimates;
DROP POLICY IF EXISTS "Users can delete business estimates" ON estimates;
DROP POLICY IF EXISTS "Users can view business invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert business invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update business invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete business invoices" ON invoices;
DROP POLICY IF EXISTS "Users can view business team" ON team_members;
DROP POLICY IF EXISTS "Users can insert business team" ON team_members;
DROP POLICY IF EXISTS "Users can update business team" ON team_members;
DROP POLICY IF EXISTS "Users can delete business team" ON team_members;
DROP POLICY IF EXISTS "Users can view payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can insert payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can update payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses: Users can view and update their own business
CREATE POLICY "Users can view own business" ON businesses FOR SELECT USING (
    id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update own business" ON businesses FOR UPDATE USING (
    id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Business data: Users can only access data from their business
CREATE POLICY "Users can view business data" ON customers FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert business data" ON customers FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update business data" ON customers FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete business data" ON customers FOR DELETE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Apply similar policies to other business tables
CREATE POLICY "Users can view business projects" ON projects FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert business projects" ON projects FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update business projects" ON projects FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete business projects" ON projects FOR DELETE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view business estimates" ON estimates FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert business estimates" ON estimates FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update business estimates" ON estimates FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete business estimates" ON estimates FOR DELETE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view business invoices" ON invoices FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert business invoices" ON invoices FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update business invoices" ON invoices FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete business invoices" ON invoices FOR DELETE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view business team" ON team_members FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert business team" ON team_members FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update business team" ON team_members FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete business team" ON team_members FOR DELETE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Payment Settings: Users can manage their own business payment settings
CREATE POLICY "Users can view payment settings" ON payment_settings FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert payment settings" ON payment_settings FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update payment settings" ON payment_settings FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Transactions: Users can view their business transactions
CREATE POLICY "Users can view transactions" ON transactions FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_payment_settings_updated_at BEFORE UPDATE ON payment_settings FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_estimates_updated_at BEFORE UPDATE ON estimates FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_business_id UUID;
BEGIN
    -- Check if business_id is provided in metadata
    IF NEW.raw_user_meta_data->>'business_id' IS NOT NULL THEN
        new_business_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    ELSE
        -- Create a new business for this user
        INSERT INTO businesses (name, description)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'New') || '''s Business',
            'Personal business account'
        )
        RETURNING id INTO new_business_id;
    END IF;
    
    -- Create the profile
    INSERT INTO profiles (id, email, first_name, last_name, business_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        new_business_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =====================================================
-- 11. APPOINTMENTS TABLE (Google Calendar Integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    google_calendar_event_id VARCHAR(255), -- Google Calendar event ID for syncing
    reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT, -- Internal notes
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. CALENDAR SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    google_calendar_enabled BOOLEAN DEFAULT FALSE,
    google_access_token TEXT, -- Encrypted OAuth token
    google_refresh_token TEXT, -- Encrypted OAuth refresh token
    google_calendar_id VARCHAR(255), -- Calendar ID (usually 'primary')
    sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES FOR APPOINTMENTS
-- =====================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_select_policy ON appointments
FOR SELECT USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY appointments_insert_policy ON appointments
FOR INSERT WITH CHECK (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY appointments_update_policy ON appointments
FOR UPDATE USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY appointments_delete_policy ON appointments
FOR DELETE USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

-- =====================================================
-- RLS POLICIES FOR CALENDAR SETTINGS
-- =====================================================
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_settings_select_policy ON calendar_settings
FOR SELECT USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY calendar_settings_update_policy ON calendar_settings
FOR UPDATE USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON calendar_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a sample business
INSERT INTO businesses (id, name, description) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Renovation Company',
    'A sample business for testing the application'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. TEAM_MEMBERS TABLE (updated for employee/subcontractor management)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- If they have an account
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'employee', 'subcontractor', 'helper'
    specialties TEXT[] DEFAULT '{}', -- Skills: plumbing, electrical, painting, etc.
    hourly_rate DECIMAL(10,2), -- Optional: for employees
    is_active BOOLEAN DEFAULT true,
    invite_status VARCHAR(20) CHECK (invite_status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. PROJECT_TEAM_MEMBERS TABLE (assign team to projects with tasks & pay)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE, -- Link to estimate
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    tasks TEXT[] NOT NULL, -- Array of task descriptions
    pay_amount DECIMAL(10,2) NOT NULL, -- What they'll be paid for this project
    pay_type VARCHAR(20) CHECK (pay_type IN ('fixed', 'hourly', 'milestone')) DEFAULT 'fixed',
    estimated_hours DECIMAL(5,2), -- If hourly
    milestones JSONB DEFAULT '[]', -- Array of: {name, description, amount, due_date, completed, paid}
    status VARCHAR(20) CHECK (status IN ('invited', 'accepted', 'declined', 'in_progress', 'completed')) DEFAULT 'invited',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 14. PROJECT_PHOTOS TABLE (before/after photos with AI editing)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
    photo_type VARCHAR(20) CHECK (photo_type IN ('before', 'after', 'progress', 'ai_generated')) NOT NULL,
    original_url TEXT NOT NULL, -- Supabase Storage URL
    edited_url TEXT, -- AI-edited version
    ai_prompt TEXT, -- What was used to generate/edit
    caption TEXT,
    metadata JSONB DEFAULT '{}', -- Camera info, GPS, timestamp, etc.
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT false, -- Main photo for estimate
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 15. PROJECT_MILESTONES TABLE (detailed milestone tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL, -- Payment amount for this milestone
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    is_paid BOOLEAN DEFAULT false,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_transaction_id UUID, -- Link to transactions table
    assigned_to UUID[] DEFAULT '{}', -- Array of project_team_members.id
    dependencies UUID[] DEFAULT '{}', -- Other milestone IDs that must complete first
    photos UUID[] DEFAULT '{}', -- project_photos.id array for documentation
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 16. PROJECT_COMMUNICATIONS TABLE (in-app messaging)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_communications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) CHECK (sender_type IN ('contractor', 'team_member', 'customer')) NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]', -- Array of file URLs
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 17. PROJECT_NOTIFICATIONS TABLE (system notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'invite', 'acceptance', 'milestone_complete', 'payment', 'message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Deep link to relevant page
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_project_team_members_project ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member ON project_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_estimate ON project_team_members(estimate_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_estimate ON project_photos(estimate_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_communications_project ON project_communications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_user ON project_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_unread ON project_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_team_members_business ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Team Members policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members in their business"
    ON team_members FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can manage team members"
    ON team_members FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Project Team Members policies
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project team assignments in their business"
    ON project_team_members FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR team_member_id IN (
            SELECT id FROM team_members WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can manage project team assignments"
    ON project_team_members FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        )
    );

CREATE POLICY "Team members can accept/decline assignments"
    ON project_team_members FOR UPDATE
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE profile_id = auth.uid()
        )
    );

-- Project Photos policies
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project photos in their business"
    ON project_photos FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload photos to their projects"
    ON project_photos FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Project Milestones policies
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project milestones in their business"
    ON project_milestones FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Contractors can manage project milestones"
    ON project_milestones FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        )
    );

-- Project Communications policies
ALTER TABLE project_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communications for their projects"
    ON project_communications FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR sender_id = auth.uid()
    );

CREATE POLICY "Users can send messages to their projects"
    ON project_communications FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Project Notifications policies
ALTER TABLE project_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON project_notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON project_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
    ON project_notifications FOR UPDATE
    USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS for automatic updates
-- =====================================================

-- Update project when team member accepts
CREATE OR REPLACE FUNCTION update_project_on_team_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'invited' THEN
        NEW.accepted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_member_acceptance_trigger
    BEFORE UPDATE ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_project_on_team_acceptance();

-- Create notification on team member invite
CREATE OR REPLACE FUNCTION notify_team_member_invite()
RETURNS TRIGGER AS $$
DECLARE
    team_profile_id UUID;
    project_name VARCHAR(255);
BEGIN
    SELECT profile_id INTO team_profile_id FROM team_members WHERE id = NEW.team_member_id;
    SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
    
    IF team_profile_id IS NOT NULL THEN
        INSERT INTO project_notifications (
            user_id, project_id, notification_type, title, message, action_url
        ) VALUES (
            team_profile_id,
            NEW.project_id,
            'invite',
            'New Project Invitation',
            'You have been invited to work on: ' || project_name,
            '/projects/' || NEW.project_id::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_invite_notification_trigger
    AFTER INSERT ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_member_invite();

-- =====================================================
-- COMPLETE! 
-- =====================================================
-- Your database is now ready with full team collaboration features!
-- 
-- NEW FEATURES:
-- - Team member management (employees & subcontractors)
-- - Project team assignments with tasks and pay
-- - Before/after photo management with AI editing
-- - Detailed milestone tracking with payments
-- - In-app project communications
-- - Notification system for all project events
--
-- WORKFLOW:
-- 1. Contractor captures project photos
-- 2. Uses AI to create "after" visualizations
-- 3. Invites team members with tasks and pay details
-- 4. Team members accept/decline invitations
-- 5. Customer approves estimate with full transparency
-- 6. Project scheduled with milestones
-- 7. Team tracks progress and gets paid per milestone
--
-- For more help, visit: https://supabase.com/docs
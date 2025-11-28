-- ==========================================
-- MASTER SETUP SCRIPT
-- ==========================================
-- This script will set up your entire database for the business and affiliate system
-- Run this ONCE in Supabase SQL Editor
-- It checks what exists and only creates what's missing

-- ==========================================
-- STEP 1: DIAGNOSTIC - See Current State
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 1: CHECKING CURRENT DATABASE STATE';
    RAISE NOTICE '========================================';
END $$;

-- Check if core tables exist
SELECT 
    'TABLE CHECK' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'businesses', 'payment_settings', 'api_keys', 'customers', 'projects', 'team_members', 'affiliate_partnerships', 'affiliate_commissions', 'sub_opportunities')
ORDER BY table_name;

-- Check your user profile
SELECT 
    'YOUR PROFILE' as check_type,
    id,
    email,
    first_name,
    last_name,
    role,
    business_id,
    CASE 
        WHEN business_id IS NULL THEN '⚠️ MISSING business_id'
        ELSE '✅ Has business_id'
    END as status
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- ==========================================
-- STEP 2: CREATE CORE TABLES (if missing)
-- ==========================================

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    gemini_api_key TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'free',
    subscription_tier TEXT DEFAULT 'free',
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (add business_id if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_id UUID REFERENCES businesses(id);
        RAISE NOTICE '✅ Added business_id column to profiles';
    END IF;
END $$;

-- Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    paypal_email TEXT,
    cashapp_cashtag TEXT,
    venmo_username TEXT,
    zelle_email TEXT,
    stripe_account_id TEXT,
    stripe_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    communication_preferences JSONB DEFAULT '{"email": true, "sms": true, "phone": true}'::jsonb,
    source TEXT,
    tags TEXT[],
    notes TEXT,
    last_contact_date TIMESTAMPTZ,
    total_spent NUMERIC DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    category TEXT,
    estimate_id UUID,
    design_id UUID,
    location TEXT,
    scheduled_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    completed_date TIMESTAMPTZ,
    photos TEXT[],
    notes JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    assigned_team TEXT[],
    materials JSONB DEFAULT '[]'::jsonb,
    permits JSONB DEFAULT '[]'::jsonb,
    inspections JSONB DEFAULT '[]'::jsonb,
    warranties JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    skills TEXT[],
    hourly_rate NUMERIC,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Partnerships Table
CREATE TABLE IF NOT EXISTS affiliate_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_user_id UUID,
    recruiting_member_id UUID REFERENCES profiles(id),
    business_id UUID REFERENCES businesses(id),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    commission_rate NUMERIC DEFAULT 15.00,
    override_rate NUMERIC DEFAULT 3.00,
    total_leads_submitted INTEGER DEFAULT 0,
    total_leads_approved INTEGER DEFAULT 0,
    total_commissions_earned NUMERIC DEFAULT 0,
    total_commissions_paid NUMERIC DEFAULT 0,
    invitation_token TEXT UNIQUE,
    invitation_sent_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub Opportunities Table (Affiliate Leads)
CREATE TABLE IF NOT EXISTS sub_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id),
    recruiting_member_id UUID REFERENCES profiles(id),
    business_id UUID REFERENCES businesses(id),
    location TEXT NOT NULL,
    start_timeframe TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    pay_amount NUMERIC NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES team_members(id),
    assigned_at TIMESTAMPTZ,
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Commissions Table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_opportunity_id UUID REFERENCES sub_opportunities(id),
    affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id),
    recruiting_member_id UUID REFERENCES profiles(id),
    business_id UUID REFERENCES businesses(id),
    project_id UUID REFERENCES projects(id),
    commission_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_business_id ON affiliate_partnerships(business_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_recruiting_member ON affiliate_partnerships(recruiting_member_id);
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_affiliate_id ON sub_opportunities(affiliate_partnership_id);
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_business_id ON sub_opportunities(business_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_partnership_id);

DO $$
BEGIN
    RAISE NOTICE '✅ All tables created/verified';
END $$;

-- ==========================================
-- STEP 3: SET UP YOUR PROFILE & BUSINESS
-- ==========================================

DO $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
    v_profile_exists BOOLEAN;
    v_business_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: SETTING UP YOUR PROFILE & BUSINESS';
    RAISE NOTICE '========================================';
    
    -- Check if profile exists
    SELECT id, business_id INTO v_user_id, v_business_id
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com';
    
    v_profile_exists := v_user_id IS NOT NULL;
    
    IF NOT v_profile_exists THEN
        -- Create profile if it doesn't exist
        INSERT INTO profiles (
            email,
            first_name,
            last_name,
            role,
            created_at
        ) VALUES (
            'heatherfeist0@gmail.com',
            'Heather',
            'Feist',
            'owner',
            NOW()
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE '✅ Profile created for heatherfeist0@gmail.com';
    ELSE
        RAISE NOTICE '✅ Profile already exists: %', v_user_id;
    END IF;
    
    -- Check if business exists
    IF v_business_id IS NOT NULL THEN
        v_business_exists := TRUE;
        RAISE NOTICE '✅ Business already linked: %', v_business_id;
    ELSE
        -- Create business
        INSERT INTO businesses (
            company_name,
            created_at,
            updated_at
        ) VALUES (
            'Constructive Design LLC',
            NOW(),
            NOW()
        ) RETURNING id INTO v_business_id;
        
        RAISE NOTICE '✅ Business created: %', v_business_id;
        
        -- Link business to profile
        UPDATE profiles
        SET business_id = v_business_id
        WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Business linked to profile';
    END IF;
    
    -- Create payment settings if missing
    IF NOT EXISTS (SELECT 1 FROM payment_settings WHERE business_id = v_business_id) THEN
        INSERT INTO payment_settings (
            business_id,
            created_at,
            updated_at
        ) VALUES (
            v_business_id,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Payment settings record created';
    ELSE
        RAISE NOTICE '✅ Payment settings already exist';
    END IF;
    
END $$;

-- ==========================================
-- STEP 4: VERIFICATION - Check Everything
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 4: VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
END $$;

-- Verify profile and business setup
SELECT 
    '🎯 YOUR SETUP STATUS' as section,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.business_id,
    b.company_name,
    CASE 
        WHEN p.business_id IS NOT NULL AND b.id IS NOT NULL THEN '🎉 COMPLETE! Ready to use!'
        WHEN p.business_id IS NOT NULL AND b.id IS NULL THEN '❌ ERROR: business_id exists but business not found'
        WHEN p.business_id IS NULL THEN '❌ ERROR: business_id is still NULL'
        ELSE '❓ Unknown state'
    END as status
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

-- Check payment settings
SELECT 
    '💳 PAYMENT SETTINGS' as section,
    ps.id,
    ps.business_id,
    COALESCE(ps.paypal_email, 'Not set') as paypal,
    COALESCE(ps.cashapp_cashtag, 'Not set') as cashapp,
    CASE 
        WHEN ps.id IS NOT NULL THEN '✅ Record exists (fill in setup wizard)'
        ELSE '❌ Missing'
    END as status
FROM payment_settings ps
WHERE ps.business_id IN (SELECT business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com');

-- Summary counts
SELECT 
    '📊 DATABASE SUMMARY' as section,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM businesses) as total_businesses,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM team_members) as total_team_members,
    (SELECT COUNT(*) FROM affiliate_partnerships) as total_affiliates,
    (SELECT COUNT(*) FROM sub_opportunities) as total_leads;

-- ==========================================
-- FINAL INSTRUCTIONS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '1. Go to your browser';
    RAISE NOTICE '2. Press Ctrl + Shift + R (hard refresh)';
    RAISE NOTICE '3. You should see the orange setup banner!';
    RAISE NOTICE '4. Click "Complete Setup" and fill in:';
    RAISE NOTICE '   - Business details (phone, address)';
    RAISE NOTICE '   - Payment settings (PayPal/CashApp)';
    RAISE NOTICE '   - AI settings (Gemini API key - optional)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your app is ready to use!';
    RAISE NOTICE '========================================';
END $$;

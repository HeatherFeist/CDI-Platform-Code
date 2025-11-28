-- =====================================================
-- COMPLETE MEMBER-ONLY ACCESS & TEAM INVITATIONS
-- =====================================================
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Member Verification & Visibility
-- =====================================================

-- Add verification and visibility columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'contractor'
    CHECK (user_type IN ('contractor', 'team_member', 'admin')),
ADD COLUMN IF NOT EXISTS workspace_email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_verified_member BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visible_in_directory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;

-- Create member verification tracking table
CREATE TABLE IF NOT EXISTS member_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'payment', 'admin_approval', 'workspace_account')),
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    UNIQUE(profile_id, verification_type)
);

CREATE INDEX IF NOT EXISTS idx_member_verification_profile ON member_verification(profile_id);

-- =====================================================
-- PART 2: Team Member Invitations
-- =====================================================

-- Create team member invitations table
CREATE TABLE IF NOT EXISTS team_member_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invitation_code TEXT UNIQUE NOT NULL,
    
    -- Invitation details
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'technician', 'sales')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON team_member_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_member_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON team_member_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_business ON team_member_invitations(business_id);

-- Create team member permissions table
CREATE TABLE IF NOT EXISTS team_member_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Permission flags
    can_view_estimates BOOLEAN DEFAULT true,
    can_create_estimates BOOLEAN DEFAULT false,
    can_edit_estimates BOOLEAN DEFAULT false,
    can_delete_estimates BOOLEAN DEFAULT false,
    can_view_customers BOOLEAN DEFAULT true,
    can_create_customers BOOLEAN DEFAULT false,
    can_edit_customers BOOLEAN DEFAULT false,
    can_view_team BOOLEAN DEFAULT true,
    can_manage_team BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_team_permissions_profile ON team_member_permissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_permissions_business ON team_member_permissions(business_id);

-- =====================================================
-- PART 3: Access Logging
-- =====================================================

CREATE TABLE IF NOT EXISTS member_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('profile_view', 'contact_info', 'quote_request')),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_log_viewer ON member_access_log(viewer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_viewed ON member_access_log(viewed_id, viewed_at DESC);

-- =====================================================
-- PART 4: Auto-Verification Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION auto_verify_contractor()
RETURNS TRIGGER AS $$
BEGIN
    -- If they have a workspace email, they're verified
    IF NEW.workspace_email IS NOT NULL AND NEW.user_type = 'contractor' THEN
        NEW.is_verified_member := true;
        NEW.visible_in_directory := true;
        NEW.member_since := COALESCE(NEW.member_since, NOW());
        
        -- Log verification
        INSERT INTO member_verification (profile_id, verification_type, notes)
        VALUES (NEW.id, 'workspace_account', 'Auto-verified via Google Workspace account creation')
        ON CONFLICT (profile_id, verification_type) DO NOTHING;
    END IF;
    
    -- Team members are NEVER visible in directory
    IF NEW.user_type = 'team_member' THEN
        NEW.visible_in_directory := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_verify_contractor ON profiles;
CREATE TRIGGER trigger_auto_verify_contractor
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_contractor();

-- =====================================================
-- PART 5: Member Directory View
-- =====================================================

CREATE OR REPLACE VIEW member_directory AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.workspace_email as email,
    p.phone,
    p.member_since,
    b.id as business_id,
    b.name as business_name,
    b.address as business_address,
    b.city as business_city,
    b.state as business_state,
    b.zip as business_zip,
    b.website,
    b.logo_url,
    -- Recently active
    p.updated_at as last_active
FROM profiles p
INNER JOIN businesses b ON p.business_id = b.id
WHERE 
    p.user_type = 'contractor'
    AND p.is_verified_member = true
    AND p.visible_in_directory = true;

-- =====================================================
-- PART 6: Helper Functions
-- =====================================================

-- Function to log member access
CREATE OR REPLACE FUNCTION log_member_access(
    p_viewer_id UUID,
    p_viewed_id UUID,
    p_access_type TEXT,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO member_access_log (viewer_id, viewed_id, access_type, ip_address)
    VALUES (p_viewer_id, p_viewed_id, p_access_type, p_ip_address::INET);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    attempts INT := 0;
BEGIN
    LOOP
        -- Generate code: CONSTR-XXXXXX (6 random alphanumeric)
        code := 'CONSTR-' || upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if unique
        IF NOT EXISTS (SELECT 1 FROM team_member_invitations WHERE invitation_code = code) THEN
            RETURN code;
        END IF;
        
        attempts := attempts + 1;
        IF attempts > 10 THEN
            RAISE EXCEPTION 'Could not generate unique invitation code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get default permissions by role
CREATE OR REPLACE FUNCTION get_default_permissions(p_role TEXT)
RETURNS team_member_permissions AS $$
DECLARE
    perms team_member_permissions;
BEGIN
    CASE p_role
        WHEN 'manager' THEN
            perms.can_view_estimates := true;
            perms.can_create_estimates := true;
            perms.can_edit_estimates := true;
            perms.can_delete_estimates := false;
            perms.can_view_customers := true;
            perms.can_create_customers := true;
            perms.can_edit_customers := true;
            perms.can_view_team := true;
            perms.can_manage_team := true;
        WHEN 'sales' THEN
            perms.can_view_estimates := true;
            perms.can_create_estimates := true;
            perms.can_edit_estimates := true;
            perms.can_delete_estimates := false;
            perms.can_view_customers := true;
            perms.can_create_customers := true;
            perms.can_edit_customers := true;
            perms.can_view_team := true;
            perms.can_manage_team := false;
        WHEN 'technician' THEN
            perms.can_view_estimates := true;
            perms.can_create_estimates := false;
            perms.can_edit_estimates := false;
            perms.can_delete_estimates := false;
            perms.can_view_customers := true;
            perms.can_create_customers := false;
            perms.can_edit_customers := false;
            perms.can_view_team := true;
            perms.can_manage_team := false;
    END CASE;
    
    RETURN perms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: Row Level Security (RLS)
-- =====================================================

-- Enable RLS on profiles (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Members can view member directory" ON profiles;
DROP POLICY IF EXISTS "Team members can view business colleagues" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Verified members can view other verified members in directory
CREATE POLICY "Members can view member directory"
    ON profiles FOR SELECT
    USING (
        -- Requester must be verified member
        EXISTS (
            SELECT 1 FROM profiles requester
            WHERE requester.id = auth.uid()
            AND requester.is_verified_member = true
        )
        -- Target must be visible in directory
        AND is_verified_member = true
        AND visible_in_directory = true
    );

-- Policy: Team members can view colleagues in same business
CREATE POLICY "Team members can view business colleagues"
    ON profiles FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Enable RLS on invitations
ALTER TABLE team_member_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Contractors can view invitations for their business
CREATE POLICY "Contractors can view own business invitations"
    ON team_member_invitations FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations to their email"
    ON team_member_invitations FOR SELECT
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- PART 8: Update Existing Data
-- =====================================================

-- Mark existing contractors as verified members
UPDATE profiles
SET 
    user_type = 'contractor',
    is_verified_member = true,
    visible_in_directory = true,
    member_since = COALESCE(member_since, created_at, NOW())
WHERE 
    business_id IS NOT NULL
    AND (user_type IS NULL OR user_type = 'contractor')
    AND email LIKE '%@%';

-- If you have existing team members, mark them
-- UPDATE profiles SET user_type = 'team_member', visible_in_directory = false WHERE ...;

-- =====================================================
-- PART 9: Verification Queries
-- =====================================================

-- Check profile types and visibility
SELECT 
    email,
    user_type,
    is_verified_member,
    visible_in_directory,
    member_since,
    workspace_email
FROM profiles
ORDER BY user_type, email;

-- Check member directory view
SELECT 
    business_name,
    first_name || ' ' || last_name as full_name,
    email,
    business_city || ', ' || business_state as location
FROM member_directory
ORDER BY business_name;

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('member_verification', 'team_member_invitations', 'team_member_permissions', 'member_access_log')
ORDER BY table_name;

-- =====================================================
-- EXPECTED RESULTS:
-- ✅ All new tables created
-- ✅ Existing contractors marked as verified
-- ✅ member_directory view returns data
-- ✅ RLS policies in place
-- =====================================================

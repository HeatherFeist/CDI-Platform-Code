-- =====================================================
-- MEMBER-ONLY ACCESS: Security Implementation
-- =====================================================
-- Ensures only verified members can see each other
-- Team members stay private to their business
-- =====================================================

-- Add visibility flags to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified_member BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visible_in_directory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;

-- Add member verification tracking
CREATE TABLE IF NOT EXISTS member_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'payment', 'admin_approval', 'workspace_account')),
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    UNIQUE(profile_id, verification_type)
);

-- Auto-verify contractors who complete signup
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
        VALUES (NEW.id, 'workspace_account', 'Auto-verified via Google Workspace account creation');
    END IF;
    
    -- Team members are NEVER visible in directory
    IF NEW.user_type = 'team_member' THEN
        NEW.visible_in_directory := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-verify
DROP TRIGGER IF EXISTS trigger_auto_verify_contractor ON profiles;
CREATE TRIGGER trigger_auto_verify_contractor
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_contractor();

-- Create member directory view (only verified contractors)
CREATE OR REPLACE VIEW member_directory AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.workspace_email as email,
    p.phone,
    p.member_since,
    b.business_name,
    b.business_address,
    b.business_city,
    b.business_state,
    b.business_zip,
    b.website,
    b.specialties,
    b.service_area_radius,
    -- Aggregate ratings from reviews
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM profiles p
INNER JOIN businesses b ON p.business_id = b.id
LEFT JOIN reviews r ON b.id = r.business_id AND r.is_approved = true
WHERE 
    p.user_type = 'contractor'
    AND p.is_verified_member = true
    AND p.visible_in_directory = true
    AND b.is_active = true
GROUP BY 
    p.id, p.first_name, p.last_name, p.workspace_email, p.phone, p.member_since,
    b.business_name, b.business_address, b.business_city, b.business_state, 
    b.business_zip, b.website, b.specialties, b.service_area_radius;

-- Row Level Security: Only members can see member directory
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Verified members can view other verified members
CREATE POLICY "Members can view member directory"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles requester
            WHERE requester.id = auth.uid()
            AND requester.is_verified_member = true
        )
        AND is_verified_member = true
        AND visible_in_directory = true
    );

-- Policy: Team members can only see profiles in their business
CREATE POLICY "Team members can view business colleagues"
    ON profiles FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Create access log table (track who views what)
CREATE TABLE IF NOT EXISTS member_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('profile_view', 'contact_info', 'quote_request')),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Index for access logs
CREATE INDEX idx_access_log_viewer ON member_access_log(viewer_id, viewed_at DESC);
CREATE INDEX idx_access_log_viewed ON member_access_log(viewed_id, viewed_at DESC);

-- Function to log member access (call from app)
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

-- =====================================================
-- VERIFICATION PROCESS FOR NEW CONTRACTORS
-- =====================================================

-- When contractor signs up and gets Workspace email:
-- 1. workspace_email is set
-- 2. Trigger auto-verifies them
-- 3. is_verified_member = true
-- 4. visible_in_directory = true
-- 5. member_since = NOW()

-- Update existing contractors to be verified
UPDATE profiles
SET 
    is_verified_member = true,
    visible_in_directory = true,
    member_since = COALESCE(created_at, NOW())
WHERE 
    user_type = 'contractor'
    AND business_id IS NOT NULL;

-- Team members stay invisible
UPDATE profiles
SET 
    visible_in_directory = false
WHERE 
    user_type = 'team_member';

-- =====================================================
-- VERIFY CHANGES
-- =====================================================

-- Check verified members
SELECT 
    email,
    user_type,
    is_verified_member,
    visible_in_directory,
    member_since
FROM profiles
ORDER BY user_type, email;

-- Check member directory view
SELECT * FROM member_directory;

-- =====================================================
-- EXPECTED RESULTS:
-- ✅ Contractors: is_verified_member = true, visible_in_directory = true
-- ✅ Team Members: is_verified_member = false, visible_in_directory = false
-- ✅ Member directory only shows verified contractors
-- =====================================================

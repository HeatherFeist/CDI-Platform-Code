-- =====================================================
-- SIMPLE MEMBERSHIP MODEL (FINAL VERSION)
-- =====================================================
-- Two options at signup:
-- 1. FREE MEMBER: Join organization, get all features
-- 2. PAID GUEST: Decline membership, pay $29.99/month
-- That's it. No invitations, no complexity.

-- =====================================================
-- PROFILES TABLE MEMBERSHIP FIELDS
-- =====================================================
-- These are the ONLY fields we need for membership

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_type TEXT CHECK (membership_type IN ('free_member', 'paid_guest')) DEFAULT 'paid_guest',
ADD COLUMN IF NOT EXISTS membership_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS ein_number TEXT, -- Employer Identification Number (required for contractor role)
ADD COLUMN IF NOT EXISTS ein_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ein_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contractor_features_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_business_manager_connected BOOLEAN DEFAULT false;

-- NOTE: NO 'role' COLUMN!
-- All members have equal access to all features.
-- Role is determined PER PROJECT, not per account.
-- A member can be 'contractor' on their own estimates
-- and 'team_member' on someone else's project simultaneously.

-- HOWEVER: Contractor features (create estimates, invite teams) require EIN.
-- This is not about hierarchy - it's about legal/tax compliance.
-- Helpers can become contractors anytime by providing EIN.

CREATE INDEX IF NOT EXISTS idx_profiles_ein ON profiles(ein_number) WHERE ein_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_contractor_unlocked ON profiles(contractor_features_unlocked) WHERE contractor_features_unlocked = true;

COMMENT ON COLUMN profiles.ein_number IS 
'Employer Identification Number from IRS. Required to unlock contractor features (create estimates, invite teams, sell on marketplace). Helpers see this field and learn what they need to become contractors.';

COMMENT ON COLUMN profiles.contractor_features_unlocked IS 
'True once EIN is provided and validated. Unlocks: create estimates, invite team members, list items on marketplace, access Google Business Manager.';

-- Update your profile to free member
UPDATE profiles 
SET 
    membership_type = 'free_member',
    is_verified_member = true,
    membership_accepted_at = created_at,
    terms_accepted = true
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- MEMBERSHIP TERMS (Simple Version)
-- =====================================================

CREATE TABLE IF NOT EXISTS membership_terms (
    version TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO membership_terms (version, title, content) VALUES
('1.0', 'Constructive Designs Inc - Free Membership', 
'# Welcome to Constructive Designs Inc
## The Contractor Community Platform

By joining as a **FREE MEMBER**, you receive:

## ✅ BENEFITS (100% FREE FOREVER):
- **Professional Email**: Your own @constructivedesignsinc.org address
- **RenovVision**: Create estimates, manage projects, track customers
- **Marketplace**: Buy/sell leftover materials, save money on supplies
- **Quantum Wallet**: Track your hours, manage payments, build work history
- **Member Directory**: Connect with contractors, find opportunities
- **Community Network**: Learn from experienced pros, grow your career
- **Career Growth**: Build your professional brand, path to your own business
- **All Features, Zero Subscription Fees** - Forever

## 📋 YOUR RESPONSIBILITIES:
- Conduct business professionally and ethically
- Respect other members and customers
- Provide accurate information
- Honor transactions and agreements
- Follow community standards

## ⭐ RATINGS & REVIEWS:
- Your work will be rated by customers and peers
- Ratings are public and affect your visibility
- Professional behavior is expected

## 🚫 GROUNDS FOR SUSPENSION:
- Fraudulent activity
- Harassment or abuse
- Repeated violations of community standards
- Illegal activity

## 🔒 DATA & PRIVACY:
- Profile information visible to other members
- Marketplace activity is public
- We never sell your data
- You can export or delete your data anytime

## 💰 OPTIONAL SUPPORT:
- Membership is 100% free, always
- Optional donations support our nonprofit (tax-deductible)
- Never required, always appreciated

By clicking "Accept & Join Free", you become a member immediately with full access.

---

## 💵 ALTERNATIVE: PAID GUEST ($29.99/month)
If you prefer NOT to join our organization, you can use the platform as a paid guest:
- Monthly subscription fee: $29.99
- Limited features
- No professional email
- No member directory access
- No verified badge

Most users choose FREE membership. The choice is yours!')
ON CONFLICT (version) DO UPDATE SET content = EXCLUDED.content;

-- =====================================================
-- PAID SUBSCRIPTIONS TABLE
-- =====================================================
-- For the rare users who choose to pay instead of join

CREATE TABLE IF NOT EXISTS paid_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')) DEFAULT 'active',
    plan TEXT DEFAULT 'guest_monthly',
    amount_cents INTEGER DEFAULT 2999, -- $29.99
    currency TEXT DEFAULT 'usd',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WORKSPACE ACCOUNT LOG TABLE
-- =====================================================
-- Tracks workspace account creation status
-- For Phase 1: Manual creation (you create in Google Admin)
-- For Phase 2: Automated creation (Edge Function)

CREATE TABLE IF NOT EXISTS workspace_account_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'suspend', 'delete')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'creating', 'active', 'failed', 'suspended')),
    details JSONB,
    error_message TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_log_profile ON workspace_account_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_log_status ON workspace_account_log(status) WHERE status = 'pending';

COMMENT ON TABLE workspace_account_log IS 
'Tracks Google Workspace account creation. Status=pending means you need to manually create in Google Admin (Phase 1), or automated via Edge Function (Phase 2).';

-- =====================================================
-- FUNCTION: ACCEPT FREE MEMBERSHIP
-- =====================================================

CREATE OR REPLACE FUNCTION accept_free_membership(
    p_profile_id UUID,
    p_business_name TEXT DEFAULT NULL,
    p_business_license TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_email TEXT;
    v_workspace_email TEXT;
    v_business_id UUID;
BEGIN
    -- Get user info
    SELECT first_name, last_name, email, business_id
    INTO v_first_name, v_last_name, v_email, v_business_id
    FROM profiles
    WHERE id = p_profile_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- Update to free member
    UPDATE profiles
    SET 
        membership_type = 'free_member',
        is_verified_member = true,
        terms_accepted = true,
        terms_version = '1.0',
        membership_accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_profile_id;

    -- Create/update business if provided
    IF p_business_name IS NOT NULL THEN
        IF v_business_id IS NULL THEN
            INSERT INTO businesses (name, license_number)
            VALUES (p_business_name, p_business_license)
            RETURNING id INTO v_business_id;
            
            UPDATE profiles SET business_id = v_business_id WHERE id = p_profile_id;
        ELSE
            UPDATE businesses
            SET 
                name = COALESCE(p_business_name, name),
                license_number = COALESCE(p_business_license, license_number),
                updated_at = NOW()
            WHERE id = v_business_id;
        END IF;
    END IF;

    -- Generate workspace email
    v_workspace_email := generate_workspace_email(v_first_name, v_last_name);
    UPDATE profiles SET workspace_email = v_workspace_email WHERE id = p_profile_id;

    -- Queue workspace account creation
    INSERT INTO workspace_account_log (
        profile_id,
        action,
        status,
        details,
        performed_at
    ) VALUES (
        p_profile_id,
        'create',
        'pending',
        jsonb_build_object(
            'email', v_workspace_email,
            'triggered_by', 'free_membership_signup'
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'membership_type', 'free_member',
        'workspace_email', v_workspace_email,
        'message', '🎉 Welcome to Constructive Designs Inc!'
    );
END;
$$;

-- =====================================================
-- FUNCTION: CHECK MEMBER ACCESS
-- =====================================================

CREATE OR REPLACE FUNCTION has_member_access(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_membership_type TEXT;
    v_is_verified BOOLEAN;
    v_has_active_subscription BOOLEAN := false;
BEGIN
    SELECT membership_type, is_verified_member
    INTO v_membership_type, v_is_verified
    FROM profiles
    WHERE id = p_profile_id;

    -- Free members always have access
    IF v_membership_type = 'free_member' AND v_is_verified = true THEN
        RETURN true;
    END IF;

    -- Paid guests need active subscription
    IF v_membership_type = 'paid_guest' THEN
        SELECT EXISTS (
            SELECT 1 FROM paid_subscriptions
            WHERE profile_id = p_profile_id
            AND status = 'active'
            AND current_period_end > NOW()
        ) INTO v_has_active_subscription;
        
        RETURN v_has_active_subscription;
    END IF;

    RETURN false;
END;
$$;

-- =====================================================
-- FUNCTION: UNLOCK CONTRACTOR FEATURES (Add EIN)
-- =====================================================
-- Called when helper/team member wants to become contractor
-- Validates EIN format and unlocks contractor-specific features

CREATE OR REPLACE FUNCTION unlock_contractor_features(
    p_profile_id UUID,
    p_ein_number TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_formatted_ein TEXT;
    v_membership_type TEXT;
BEGIN
    -- Check if user is a free member
    SELECT membership_type INTO v_membership_type
    FROM profiles WHERE id = p_profile_id;
    
    IF v_membership_type != 'free_member' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only free members can unlock contractor features. Join as free member first.'
        );
    END IF;

    -- Validate and format EIN (XX-XXXXXXX)
    v_formatted_ein := REGEXP_REPLACE(p_ein_number, '[^0-9]', '', 'g');
    
    IF LENGTH(v_formatted_ein) != 9 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'EIN must be 9 digits. Format: XX-XXXXXXX'
        );
    END IF;
    
    v_formatted_ein := SUBSTRING(v_formatted_ein, 1, 2) || '-' || SUBSTRING(v_formatted_ein, 3, 7);
    
    -- Check if EIN already exists (prevent duplicates)
    IF EXISTS (SELECT 1 FROM profiles WHERE ein_number = v_formatted_ein AND id != p_profile_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This EIN is already registered to another member. Contact support if this is an error.'
        );
    END IF;
    
    -- Update profile
    UPDATE profiles
    SET 
        ein_number = v_formatted_ein,
        ein_verified = true,
        ein_verified_at = NOW(),
        contractor_features_unlocked = true,
        updated_at = NOW()
    WHERE id = p_profile_id;
    
    -- Log the unlock
    INSERT INTO notifications (
        profile_id,
        type,
        title,
        message
    ) VALUES (
        p_profile_id,
        'contractor_unlocked',
        '🎉 Contractor Features Unlocked!',
        'You can now create estimates, invite team members, and sell on the marketplace. Welcome to the contractor community!'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'ein_number', v_formatted_ein,
        'contractor_features_unlocked', true,
        'message', '🎉 Contractor features unlocked! You can now create estimates and manage teams.'
    );
END;
$$;

COMMENT ON FUNCTION unlock_contractor_features IS 
'Validates EIN and unlocks contractor features. Called when helper clicks "Contractor" tab or "Create Estimate" button. Shows modal if EIN not provided yet, educates user on what they need.';

-- =====================================================
-- FUNCTION: CHECK IF USER CAN CREATE ESTIMATES
-- =====================================================

CREATE OR REPLACE FUNCTION can_create_estimates(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_contractor_unlocked BOOLEAN;
    v_membership_type TEXT;
BEGIN
    SELECT contractor_features_unlocked, membership_type
    INTO v_contractor_unlocked, v_membership_type
    FROM profiles
    WHERE id = p_profile_id;
    
    -- Free members with EIN can create estimates
    IF v_membership_type = 'free_member' AND v_contractor_unlocked = true THEN
        RETURN true;
    END IF;
    
    -- Paid guests cannot create estimates (encourage free membership)
    RETURN false;
END;
$$;

COMMENT ON FUNCTION can_create_estimates IS 
'Returns true if user can create estimates. Requires: (1) Free member, (2) EIN provided. Helpers see this returns false and learn what they need.';

-- =====================================================
-- FUNCTION: CALCULATE PROFILE COMPLETION PERCENTAGE
-- =====================================================
-- Shows users how complete their profile is
-- Creates natural drive to fill in missing fields

CREATE OR REPLACE FUNCTION calculate_profile_completion(p_profile_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_business businesses%ROWTYPE;
    v_completion_score INTEGER := 0;
    v_max_score INTEGER := 100;
    v_missing_fields TEXT[] := '{}';
    v_completed_sections JSONB;
BEGIN
    -- Get profile data
    SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
    
    IF v_profile.business_id IS NOT NULL THEN
        SELECT * INTO v_business FROM businesses WHERE id = v_profile.business_id;
    END IF;
    
    -- Basic Information (Required - 20 points)
    IF v_profile.first_name IS NOT NULL AND v_profile.last_name IS NOT NULL THEN
        v_completion_score := v_completion_score + 10;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Full name');
    END IF;
    
    IF v_profile.email IS NOT NULL THEN
        v_completion_score := v_completion_score + 10;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Email');
    END IF;
    
    -- Contact Information (10 points)
    IF v_profile.phone IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Phone number');
    END IF;
    
    IF v_profile.city IS NOT NULL AND v_profile.state IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Location (city/state)');
    END IF;
    
    -- Business Information (20 points)
    IF v_business.name IS NOT NULL THEN
        v_completion_score := v_completion_score + 10;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Business name');
    END IF;
    
    IF v_business.license_number IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Business license number');
    END IF;
    
    IF v_business.address IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Business address');
    END IF;
    
    -- Professional Details (20 points)
    IF v_profile.specialties IS NOT NULL AND array_length(v_profile.specialties, 1) > 0 THEN
        v_completion_score := v_completion_score + 10;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Skills & specialties');
    END IF;
    
    IF v_profile.bio IS NOT NULL AND length(v_profile.bio) > 50 THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Professional bio');
    END IF;
    
    IF v_profile.avatar_url IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Profile photo');
    END IF;
    
    -- Contractor Unlock (15 points - BIG motivator!)
    IF v_profile.ein_number IS NOT NULL THEN
        v_completion_score := v_completion_score + 15;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'EIN number (unlock contractor features!)');
    END IF;
    
    -- Insurance & Bonding (10 points)
    IF v_business.insurance_provider IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Insurance information');
    END IF;
    
    IF v_business.bonding_company IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Bonding information');
    END IF;
    
    -- Social & Web Presence (5 points)
    IF v_business.website IS NOT NULL OR v_profile.linkedin_url IS NOT NULL THEN
        v_completion_score := v_completion_score + 5;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'Website or LinkedIn profile');
    END IF;
    
    -- Build completion sections breakdown
    v_completed_sections := jsonb_build_object(
        'basic_info', CASE 
            WHEN v_profile.first_name IS NOT NULL AND v_profile.last_name IS NOT NULL AND v_profile.email IS NOT NULL 
            THEN 100 ELSE 50 END,
        'contact_info', CASE 
            WHEN v_profile.phone IS NOT NULL AND v_profile.city IS NOT NULL 
            THEN 100 ELSE 0 END,
        'business_info', CASE 
            WHEN v_business.name IS NOT NULL AND v_business.license_number IS NOT NULL AND v_business.address IS NOT NULL 
            THEN 100 
            WHEN v_business.name IS NOT NULL 
            THEN 50 
            ELSE 0 END,
        'professional_details', CASE 
            WHEN v_profile.specialties IS NOT NULL AND v_profile.bio IS NOT NULL AND v_profile.avatar_url IS NOT NULL 
            THEN 100 
            WHEN v_profile.specialties IS NOT NULL 
            THEN 50 
            ELSE 0 END,
        'contractor_unlock', CASE 
            WHEN v_profile.ein_number IS NOT NULL 
            THEN 100 ELSE 0 END,
        'insurance_bonding', CASE 
            WHEN v_business.insurance_provider IS NOT NULL AND v_business.bonding_company IS NOT NULL 
            THEN 100 
            WHEN v_business.insurance_provider IS NOT NULL 
            THEN 50 
            ELSE 0 END
    );
    
    RETURN jsonb_build_object(
        'completion_percentage', v_completion_score,
        'missing_fields', v_missing_fields,
        'section_completion', v_completed_sections,
        'is_complete', v_completion_score >= 90,
        'next_step', CASE 
            WHEN v_profile.ein_number IS NULL THEN 'Add EIN to unlock contractor features'
            WHEN v_profile.specialties IS NULL OR array_length(v_profile.specialties, 1) = 0 THEN 'Add your skills and specialties'
            WHEN v_business.name IS NULL THEN 'Add your business information'
            WHEN v_profile.avatar_url IS NULL THEN 'Upload a profile photo'
            ELSE 'Complete remaining fields to reach 100%'
        END
    );
END;
$$;

COMMENT ON FUNCTION calculate_profile_completion IS 
'Calculates profile completion percentage. Shows users what they''re missing and creates natural drive to complete profile. Used in dashboard and profile pages.';

-- =====================================================
-- VIEW: MEMBERSHIP STATISTICS
-- =====================================================

CREATE OR REPLACE VIEW membership_stats AS
SELECT 
    COUNT(*) FILTER (WHERE membership_type = 'free_member') as free_members,
    COUNT(*) FILTER (WHERE membership_type = 'paid_guest') as paid_guests,
    COUNT(*) FILTER (WHERE workspace_account_created = true) as workspace_accounts,
    COUNT(*) FILTER (WHERE contractor_features_unlocked = true) as contractors,
    COUNT(*) FILTER (WHERE membership_type = 'free_member' AND contractor_features_unlocked = false) as helpers,
    ROUND(100.0 * COUNT(*) FILTER (WHERE membership_type = 'free_member') / COUNT(*), 2) as free_percentage,
    ROUND(100.0 * COUNT(*) FILTER (WHERE contractor_features_unlocked = true) / 
          NULLIF(COUNT(*) FILTER (WHERE membership_type = 'free_member'), 0), 2) as contractor_conversion_rate,
    COUNT(*) as total_users
FROM profiles;

COMMENT ON VIEW membership_stats IS 
'Shows progression: free_members → helpers (no EIN) → contractors (EIN provided). 
contractor_conversion_rate shows % of members who leveled up to contractor status.';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Member directory only for free members
DROP POLICY IF EXISTS "Members can view directory" ON profiles;
CREATE POLICY "Members can view directory"
ON profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id -- Own profile
    OR 
    has_member_access(auth.uid()) -- Has access
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check membership stats
-- SELECT * FROM membership_stats;

-- View all members
-- SELECT id, first_name, last_name, email, workspace_email, membership_type, is_verified_member
-- FROM profiles
-- WHERE membership_type = 'free_member'
-- ORDER BY created_at DESC;

-- Check paid guests (should be very few!)
-- SELECT id, first_name, last_name, email, membership_type
-- FROM profiles  
-- WHERE membership_type = 'paid_guest';

-- =====================================================
-- WORKSPACE ACCOUNT MANAGEMENT
-- =====================================================

-- View: See who needs workspace accounts created
CREATE OR REPLACE VIEW pending_workspace_accounts AS
SELECT 
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.email as personal_email,
    wal.workspace_email,
    p.phone,
    p.membership_accepted_at,
    wal.performed_at as requested_at,
    EXTRACT(DAY FROM NOW() - wal.performed_at) as days_pending
FROM workspace_account_log wal
JOIN profiles p ON wal.profile_id = p.id
WHERE wal.status = 'pending'
    AND wal.action = 'create'
ORDER BY wal.performed_at ASC;

COMMENT ON VIEW pending_workspace_accounts IS 
'Shows free members waiting for Google Workspace accounts. 
TO CREATE MANUALLY (Phase 1):
1. SELECT * FROM pending_workspace_accounts;
2. Go to admin.google.com
3. Users > Add new user
4. Use workspace_email from query
5. Set temporary password  
6. Send welcome email
7. Call: SELECT mark_workspace_account_created(profile_id);';

GRANT SELECT ON pending_workspace_accounts TO authenticated;

-- Function: Mark workspace account as created
CREATE OR REPLACE FUNCTION mark_workspace_account_created(
    p_profile_id UUID,
    p_google_user_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE workspace_account_log
    SET 
        status = 'active',
        completed_at = NOW(),
        details = jsonb_build_object(
            'google_user_id', p_google_user_id,
            'manually_created', true,
            'created_by_admin', auth.uid()
        )
    WHERE profile_id = p_profile_id
        AND status = 'pending'
        AND action = 'create';
    
    UPDATE profiles
    SET 
        workspace_account_created = true,
        updated_at = NOW()
    WHERE id = p_profile_id;
END;
$$;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Simple two-option signup
-- ✅ FREE MEMBER (99% will choose this)
-- ✅ PAID GUEST (1% who want to stay outside)
-- ✅ Workspace email generated automatically
-- ✅ Pending queue for manual creation (Phase 1)
-- ✅ Ready for automated creation later (Phase 2)
-- ✅ No invitation system needed
-- ✅ Word-of-mouth growth is natural
-- ✅ Self-sustaining, self-regulating community
--
-- USAGE:
-- When user accepts free membership:
-- SELECT accept_free_membership(
--     'profile-uuid',
--     'Optional Business Name',
--     'Optional License #'
-- );
--
-- To see pending workspace accounts:
-- SELECT * FROM pending_workspace_accounts;
--
-- After creating in Google Admin:
-- SELECT mark_workspace_account_created('profile-uuid');
-- =====================================================

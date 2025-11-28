-- =====================================================
-- INVITATION-ONLY MEMBERSHIP SYSTEM
-- =====================================================
-- Members can invite other trusted contractors
-- Public users must pay $29.99/month OR get invited
-- Self-sustaining growth through trusted network
-- Quality control through invitation accountability

-- =====================================================
-- STEP 1: ADD INVITATION FIELDS TO PROFILES
-- =====================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitations_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitations_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitations_accepted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitation_reputation NUMERIC DEFAULT 5.0 CHECK (invitation_reputation >= 0 AND invitation_reputation <= 5);

-- Founder/admin gets unlimited invites
UPDATE profiles 
SET invitations_remaining = 999999
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- STEP 2: CREATE INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS member_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    personal_message TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate invites to same email
    UNIQUE(inviter_id, invitee_email)
);

-- =====================================================
-- STEP 3: INVITATION REPUTATION TRACKING
-- =====================================================
-- Track quality of inviter's referrals

CREATE TABLE IF NOT EXISTS invitation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_id UUID REFERENCES member_invitations(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Track invitee's behavior
    invitee_rating NUMERIC CHECK (invitee_rating >= 0 AND invitee_rating <= 5),
    invitee_active BOOLEAN DEFAULT true, -- Still using platform?
    invitee_good_standing BOOLEAN DEFAULT true, -- No violations?
    
    -- Impact on inviter
    reputation_impact NUMERIC, -- +0.5 for good invite, -1.0 for bad
    
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- =====================================================
-- STEP 4: FUNCTION - GENERATE INVITATION CODE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 8-character code (uppercase letters + numbers)
        v_code := upper(substring(md5(random()::text), 1, 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM member_invitations WHERE code = v_code) INTO v_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_code;
END;
$$;

-- =====================================================
-- STEP 5: FUNCTION - CREATE INVITATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_member_invitation(
    p_inviter_id UUID,
    p_invitee_email TEXT,
    p_invitee_name TEXT DEFAULT NULL,
    p_personal_message TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitations_remaining INTEGER;
    v_inviter_name TEXT;
    v_invitation_code TEXT;
    v_invitation_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check inviter's remaining invitations
    SELECT invitations_remaining, first_name || ' ' || last_name
    INTO v_invitations_remaining, v_inviter_name
    FROM profiles
    WHERE id = p_inviter_id;

    IF v_invitations_remaining IS NULL OR v_invitations_remaining <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No invitations remaining. Earn more by having successful referrals!'
        );
    END IF;

    -- Check if already invited
    IF EXISTS (
        SELECT 1 FROM member_invitations 
        WHERE inviter_id = p_inviter_id 
        AND invitee_email = p_invitee_email 
        AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You have already invited this email address'
        );
    END IF;

    -- Check if email is already a member
    IF EXISTS (SELECT 1 FROM profiles WHERE email = p_invitee_email) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This person is already a member!'
        );
    END IF;

    -- Generate unique code
    v_invitation_code := generate_invitation_code();
    
    -- Set expiration (30 days from now)
    v_expires_at := NOW() + INTERVAL '30 days';

    -- Create invitation
    INSERT INTO member_invitations (
        code,
        inviter_id,
        invitee_email,
        invitee_name,
        personal_message,
        expires_at
    ) VALUES (
        v_invitation_code,
        p_inviter_id,
        p_invitee_email,
        p_invitee_name,
        p_personal_message,
        v_expires_at
    ) RETURNING id INTO v_invitation_id;

    -- Decrement inviter's remaining invitations
    UPDATE profiles
    SET 
        invitations_remaining = invitations_remaining - 1,
        invitations_sent = invitations_sent + 1,
        updated_at = NOW()
    WHERE id = p_inviter_id;

    -- Return success with invitation details
    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation_id,
        'code', v_invitation_code,
        'inviter_name', v_inviter_name,
        'invitee_email', p_invitee_email,
        'expires_at', v_expires_at,
        'invitation_url', 'https://renovision.web.app/join/' || v_invitation_code,
        'message', 'Invitation created! Share the code or link with ' || p_invitee_email
    );
END;
$$;

-- =====================================================
-- STEP 6: FUNCTION - ACCEPT INVITATION
-- =====================================================

CREATE OR REPLACE FUNCTION accept_invitation(
    p_invitation_code TEXT,
    p_new_profile_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_workspace_email TEXT;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM member_invitations
    WHERE code = p_invitation_code;

    -- Check if invitation exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid invitation code'
        );
    END IF;

    -- Check if already accepted
    IF v_invitation.status = 'accepted' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invitation has already been used'
        );
    END IF;

    -- Check if expired
    IF v_invitation.expires_at < NOW() THEN
        UPDATE member_invitations SET status = 'expired' WHERE id = v_invitation.id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invitation has expired'
        );
    END IF;

    -- Check if revoked
    IF v_invitation.status = 'revoked' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invitation has been revoked'
        );
    END IF;

    -- Update invitation status
    UPDATE member_invitations
    SET 
        status = 'accepted',
        accepted_by = p_new_profile_id,
        accepted_at = NOW()
    WHERE id = v_invitation.id;

    -- Update new member's profile
    UPDATE profiles
    SET 
        membership_type = 'free_member',
        is_verified_member = true,
        auto_verified = false, -- Verified through invitation, not auto
        invited_by = v_invitation.inviter_id,
        invitation_code = p_invitation_code,
        invitation_used_at = NOW(),
        invitations_remaining = 3, -- New members start with 3 invites
        updated_at = NOW()
    WHERE id = p_new_profile_id;

    -- Update inviter's stats
    UPDATE profiles
    SET 
        invitations_accepted = invitations_accepted + 1,
        -- Give inviter 1 bonus invitation for successful referral
        invitations_remaining = invitations_remaining + 1,
        updated_at = NOW()
    WHERE id = v_invitation.inviter_id;

    -- Generate workspace email for new member
    SELECT workspace_email INTO v_workspace_email
    FROM profiles
    WHERE id = p_new_profile_id;

    -- Queue workspace account creation
    INSERT INTO workspace_account_log (
        profile_id,
        action,
        status,
        details,
        performed_at
    ) VALUES (
        p_new_profile_id,
        'create',
        'pending',
        jsonb_build_object(
            'email', v_workspace_email,
            'triggered_by', 'invitation_acceptance',
            'invitation_code', p_invitation_code,
            'invited_by', v_invitation.inviter_id
        ),
        NOW()
    );

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'profile_id', p_new_profile_id,
        'workspace_email', v_workspace_email,
        'inviter_id', v_invitation.inviter_id,
        'invitations_remaining', 3,
        'message', 'Welcome to Constructive Designs Inc! 🎉'
    );
END;
$$;

-- =====================================================
-- STEP 7: FUNCTION - AWARD BONUS INVITATIONS
-- =====================================================
-- Give extra invites to high-quality inviters

CREATE OR REPLACE FUNCTION award_invitation_bonuses()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Award 5 bonus invites to members who:
    -- - Have invited 5+ people
    -- - All invitees are in good standing
    -- - Inviter has 4.5+ rating
    UPDATE profiles
    SET 
        invitations_remaining = invitations_remaining + 5,
        updated_at = NOW()
    WHERE id IN (
        SELECT p.id
        FROM profiles p
        WHERE p.invitations_accepted >= 5
        AND p.rating >= 4.5
        AND p.invitation_reputation >= 4.5
        AND NOT EXISTS (
            SELECT 1 FROM profiles p2
            WHERE p2.invited_by = p.id
            AND p2.is_verified_member = false
        )
    );

    -- Award 10 bonus invites to top 10% of inviters
    UPDATE profiles
    SET 
        invitations_remaining = invitations_remaining + 10,
        updated_at = NOW()
    WHERE id IN (
        SELECT id FROM profiles
        WHERE invitations_accepted >= 10
        ORDER BY invitation_reputation DESC, invitations_accepted DESC
        LIMIT (SELECT CEIL(COUNT(*) * 0.1)::INTEGER FROM profiles WHERE membership_type = 'free_member')
    );
END;
$$;

-- =====================================================
-- STEP 8: VIEWS FOR INVITATION MANAGEMENT
-- =====================================================

-- View: My Invitations (for members)
CREATE OR REPLACE VIEW my_invitations AS
SELECT 
    mi.id,
    mi.code,
    mi.invitee_email,
    mi.invitee_name,
    mi.personal_message,
    mi.status,
    mi.created_at,
    mi.expires_at,
    mi.accepted_at,
    p.first_name || ' ' || p.last_name as accepted_by_name,
    p.rating as invitee_rating,
    CASE 
        WHEN mi.status = 'accepted' THEN '✅ Accepted'
        WHEN mi.status = 'expired' THEN '⏰ Expired'
        WHEN mi.status = 'revoked' THEN '🚫 Revoked'
        WHEN mi.expires_at < NOW() THEN '⏰ Expired'
        ELSE '⏳ Pending'
    END as status_display
FROM member_invitations mi
LEFT JOIN profiles p ON p.id = mi.accepted_by;

-- View: Invitation Statistics (for admins)
CREATE OR REPLACE VIEW invitation_statistics AS
SELECT 
    COUNT(*) as total_invitations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
    COUNT(*) FILTER (WHERE status = 'expired') as expired,
    COUNT(*) FILTER (WHERE status = 'revoked') as revoked,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / NULLIF(COUNT(*), 0), 2) as acceptance_rate,
    COUNT(DISTINCT inviter_id) as unique_inviters,
    ROUND(AVG(CASE WHEN status = 'accepted' THEN EXTRACT(EPOCH FROM (accepted_at - created_at))/86400 END), 1) as avg_days_to_accept
FROM member_invitations;

-- View: Top Inviters Leaderboard
CREATE OR REPLACE VIEW top_inviters AS
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name as name,
    p.workspace_email,
    p.invitations_sent,
    p.invitations_accepted,
    p.invitations_remaining,
    p.invitation_reputation,
    p.rating as overall_rating,
    ROUND(100.0 * p.invitations_accepted / NULLIF(p.invitations_sent, 0), 1) as acceptance_rate,
    COUNT(p2.id) as active_invitees
FROM profiles p
LEFT JOIN profiles p2 ON p2.invited_by = p.id AND p2.is_verified_member = true
WHERE p.membership_type = 'free_member'
GROUP BY p.id
ORDER BY p.invitations_accepted DESC, p.invitation_reputation DESC
LIMIT 100;

-- =====================================================
-- STEP 9: SIGNUP FLOW RESTRICTIONS
-- =====================================================

-- Function to check if signup requires invitation or payment
CREATE OR REPLACE FUNCTION check_signup_requirements(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_has_invitation BOOLEAN;
    v_invitation_code TEXT;
BEGIN
    -- Check if email has a pending invitation
    SELECT EXISTS(
        SELECT 1 FROM member_invitations
        WHERE invitee_email = p_email
        AND status = 'pending'
        AND expires_at > NOW()
    ), code
    INTO v_has_invitation, v_invitation_code
    FROM member_invitations
    WHERE invitee_email = p_email
    AND status = 'pending'
    AND expires_at > NOW()
    LIMIT 1;

    IF v_has_invitation THEN
        -- Has invitation = FREE membership available
        RETURN jsonb_build_object(
            'can_join_free', true,
            'requires_invitation', false,
            'invitation_code', v_invitation_code,
            'message', 'You''ve been invited! Join for FREE as a verified member.'
        );
    ELSE
        -- No invitation = Must pay $29.99/month
        RETURN jsonb_build_object(
            'can_join_free', false,
            'requires_invitation', true,
            'requires_payment', true,
            'monthly_cost', 29.99,
            'message', 'Constructive Designs Inc is invitation-only. Members join FREE, but without an invitation you can subscribe for $29.99/month with limited features.'
        );
    END IF;
END;
$$;

-- =====================================================
-- STEP 10: RLS POLICIES FOR INVITATIONS
-- =====================================================

ALTER TABLE member_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent invitations
CREATE POLICY "Users can view own invitations"
ON member_invitations FOR SELECT
TO authenticated
USING (inviter_id = auth.uid());

-- Users can create invitations if they have invites remaining
CREATE POLICY "Users can create invitations"
ON member_invitations FOR INSERT
TO authenticated
WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND invitations_remaining > 0
    )
);

-- Users can update their own invitations (revoke)
CREATE POLICY "Users can revoke own invitations"
ON member_invitations FOR UPDATE
TO authenticated
USING (inviter_id = auth.uid())
WITH CHECK (inviter_id = auth.uid());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check your invitation stats
-- SELECT * FROM profiles WHERE email = 'heatherfeist0@gmail.com';

-- View all pending invitations
-- SELECT * FROM my_invitations WHERE status = 'pending';

-- See invitation statistics
-- SELECT * FROM invitation_statistics;

-- View top inviters
-- SELECT * FROM top_inviters LIMIT 10;

-- Check if email can sign up for free
-- SELECT check_signup_requirements('someone@example.com');

-- =====================================================
-- INITIAL SETUP
-- =====================================================

-- Give founder unlimited invitations
UPDATE profiles 
SET 
    invitations_remaining = 999999,
    invitation_reputation = 5.0
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Invitation-only membership system
-- ✅ Members can invite trusted contractors
-- ✅ Quality control through invitation accountability
-- ✅ Bonus invitations for good referrals
-- ✅ Self-sustaining growth network
-- ✅ Public users must pay without invitation
-- ✅ Founder has unlimited invites to kickstart
--
-- USAGE:
-- 1. Member invites someone:
--    SELECT create_member_invitation(
--        'inviter-uuid',
--        'newperson@email.com',
--        'John Smith',
--        'Hey John, you should join our contractor community!'
--    );
--
-- 2. New user signs up with code:
--    SELECT accept_invitation('ABC12345', 'new-profile-uuid');
--
-- 3. Check if email needs invitation:
--    SELECT check_signup_requirements('someone@email.com');
-- =====================================================

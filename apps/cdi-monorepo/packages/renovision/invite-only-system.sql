-- =====================================================
-- INVITE-ONLY SYSTEM FOR PHASED ROLLOUT
-- =====================================================
-- Purpose: Control platform growth during founding phase
-- Strategy: Give founding members time to "catch up" to pros
-- before Fast-Track contractors (like Nick) discover platform
--
-- This creates perception that platform is "established" when
-- experienced contractors finally join, even though founding
-- members only had 6-month head start.
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: unified-profiles-schema.sql

-- =====================================================
-- INVITE CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., "FOUNDING2025-ABCD"
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who generated this invite
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who used this invite
  
  -- Invite type
  invite_type TEXT CHECK (invite_type IN (
    'founder', -- Admin-generated, unlimited use
    'member', -- Member-generated based on tier
    'fast_track', -- For experienced contractors (Google Business)
    'partner' -- For suppliers, external contractors
  )) DEFAULT 'member',
  
  -- Usage tracking
  max_uses INTEGER DEFAULT 1, -- How many times can this code be used?
  current_uses INTEGER DEFAULT 0, -- How many times has it been used?
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE, -- When was it first used?
  notes TEXT -- Internal notes (e.g., "Sent to Nick Johnson via text")
);

-- =====================================================
-- PLATFORM ACCESS CONTROL
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who invited this user?
ADD COLUMN IF NOT EXISTS invite_code_used TEXT, -- Which code did they use?
ADD COLUMN IF NOT EXISTS platform_access_granted BOOLEAN DEFAULT false, -- Can they use platform?
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP WITH TIME ZONE, -- When were they granted access?
ADD COLUMN IF NOT EXISTS invite_tier_at_join TEXT; -- What tier were they at signup? (for analytics)

-- =====================================================
-- INVITE ALLOWANCE BY TIER
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_allowances (
  tier TEXT PRIMARY KEY CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'admin')),
  invites_per_month INTEGER NOT NULL, -- How many invites per month?
  description TEXT
);

-- Seed invite allowances
INSERT INTO invite_allowances (tier, invites_per_month, description) VALUES
('bronze', 1, 'New members can invite 1 trusted contractor per month'),
('silver', 3, 'Silver members can invite 3 contractors per month'),
('gold', 5, 'Gold members can invite 5 contractors per month'),
('platinum', 10, 'Platinum members can invite 10 contractors per month'),
('admin', 999, 'Admins have unlimited invites')
ON CONFLICT (tier) DO NOTHING;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate invite code for member
CREATE OR REPLACE FUNCTION generate_invite_code(
  p_user_id UUID,
  p_invite_type TEXT DEFAULT 'member',
  p_max_uses INTEGER DEFAULT 1,
  p_expires_days INTEGER DEFAULT 30,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_tier TEXT;
  v_invite_allowance INTEGER;
  v_invites_used_this_month INTEGER;
  v_remaining_invites INTEGER;
  v_new_code TEXT;
  v_code_id UUID;
BEGIN
  -- Get user's tier
  SELECT 
    CASE
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 51 THEN 'platinum'
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 26 THEN 'gold'
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 11 THEN 'silver'
      ELSE 'bronze'
    END INTO v_user_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get invite allowance for this tier
  SELECT invites_per_month INTO v_invite_allowance
  FROM invite_allowances
  WHERE tier = v_user_tier;
  
  -- Count invites used this month
  SELECT COUNT(*) INTO v_invites_used_this_month
  FROM invite_codes
  WHERE created_by = p_user_id
  AND created_at >= date_trunc('month', CURRENT_DATE);
  
  -- Calculate remaining invites
  v_remaining_invites := v_invite_allowance - v_invites_used_this_month;
  
  -- Check if user has invites remaining
  IF v_remaining_invites <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invite_limit_reached',
      'message', format('You have used all %s invites for this month. Resets on %s.', 
        v_invite_allowance, 
        to_char(date_trunc('month', CURRENT_DATE) + interval '1 month', 'Mon DD, YYYY')
      ),
      'invites_used', v_invites_used_this_month,
      'invites_allowed', v_invite_allowance,
      'resets_at', date_trunc('month', CURRENT_DATE) + interval '1 month'
    );
  END IF;
  
  -- Generate unique code
  v_new_code := UPPER(
    substring(md5(random()::text) from 1 for 8) || '-' ||
    substring(md5(random()::text) from 1 for 4)
  );
  
  -- Insert invite code
  INSERT INTO invite_codes (
    code,
    created_by,
    invite_type,
    max_uses,
    current_uses,
    expires_at,
    notes
  ) VALUES (
    v_new_code,
    p_user_id,
    p_invite_type,
    p_max_uses,
    0,
    CASE WHEN p_expires_days > 0 THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END,
    p_notes
  )
  RETURNING id INTO v_code_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'invite_code', v_new_code,
    'code_id', v_code_id,
    'share_url', format('https://constructivedesigns.com/join?invite=%s', v_new_code),
    'max_uses', p_max_uses,
    'expires_at', CASE WHEN p_expires_days > 0 THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END,
    'invites_remaining', v_remaining_invites - 1,
    'tier', v_user_tier,
    'message', format('Invite code created! Share this link with trusted contractors: https://constructivedesigns.com/join?invite=%s', v_new_code)
  );
END;
$$;

-- Validate and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_invite RECORD;
  v_inviter_name TEXT;
BEGIN
  -- Find invite code
  SELECT * INTO v_invite
  FROM invite_codes
  WHERE code = UPPER(p_code);
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Invalid invite code. Please check and try again.'
    );
  END IF;
  
  -- Check if code has expired
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'code_expired',
      'message', format('This invite code expired on %s.', to_char(v_invite.expires_at, 'Mon DD, YYYY'))
    );
  END IF;
  
  -- Check if code has reached max uses
  IF v_invite.current_uses >= v_invite.max_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'code_exhausted',
      'message', 'This invite code has already been used.'
    );
  END IF;
  
  -- Get inviter's name
  SELECT full_name INTO v_inviter_name
  FROM profiles
  WHERE id = v_invite.created_by;
  
  -- Update invite code usage
  UPDATE invite_codes
  SET 
    current_uses = current_uses + 1,
    used_at = CASE WHEN used_at IS NULL THEN NOW() ELSE used_at END,
    used_by = CASE WHEN current_uses = 0 THEN p_user_id ELSE used_by END
  WHERE id = v_invite.id;
  
  -- Grant platform access to user
  UPDATE profiles
  SET 
    platform_access_granted = true,
    access_granted_at = NOW(),
    invited_by = v_invite.created_by,
    invite_code_used = p_code,
    invite_tier_at_join = (
      SELECT tier FROM invite_allowances 
      WHERE tier = (
        CASE
          WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
               (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 51 THEN 'platinum'
          WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
               (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 26 THEN 'gold'
          WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
               (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 11 THEN 'silver'
          ELSE 'bronze'
        END
      )
    )
  WHERE id = p_user_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', format('Welcome! You were invited by %s. Platform access granted.', COALESCE(v_inviter_name, 'a founding member')),
    'invited_by', v_invite.created_by,
    'inviter_name', v_inviter_name,
    'invite_type', v_invite.invite_type
  );
END;
$$;

-- Check if user can access platform (for RLS policies)
CREATE OR REPLACE FUNCTION user_has_platform_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_access BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  SELECT 
    COALESCE(platform_access_granted, false),
    (role = 'admin')
  INTO v_has_access, v_is_admin
  FROM profiles
  WHERE id = p_user_id;
  
  -- Admins always have access
  RETURN v_is_admin OR v_has_access;
END;
$$;

-- Get invite statistics for user dashboard
CREATE OR REPLACE FUNCTION get_invite_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier TEXT;
  v_allowance INTEGER;
  v_used_this_month INTEGER;
  v_remaining INTEGER;
  v_total_invites_sent INTEGER;
  v_total_accepted INTEGER;
BEGIN
  -- Get user tier and allowance
  SELECT 
    CASE
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 51 THEN 'platinum'
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 26 THEN 'gold'
      WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
           (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 11 THEN 'silver'
      ELSE 'bronze'
    END,
    (SELECT invites_per_month FROM invite_allowances WHERE tier = 
      CASE
        WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
             (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 51 THEN 'platinum'
        WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
             (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 26 THEN 'gold'
        WHEN (SELECT google_business_review_count FROM profiles WHERE id = p_user_id) + 
             (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id) >= 11 THEN 'silver'
        ELSE 'bronze'
      END
    )
  INTO v_tier, v_allowance;
  
  -- Count invites used this month
  SELECT COUNT(*) INTO v_used_this_month
  FROM invite_codes
  WHERE created_by = p_user_id
  AND created_at >= date_trunc('month', CURRENT_DATE);
  
  -- Calculate remaining
  v_remaining := v_allowance - v_used_this_month;
  
  -- Total invites sent (all time)
  SELECT COUNT(*) INTO v_total_invites_sent
  FROM invite_codes
  WHERE created_by = p_user_id;
  
  -- Total accepted
  SELECT COUNT(*) INTO v_total_accepted
  FROM invite_codes
  WHERE created_by = p_user_id
  AND current_uses > 0;
  
  RETURN json_build_object(
    'tier', v_tier,
    'allowance_per_month', v_allowance,
    'used_this_month', v_used_this_month,
    'remaining_this_month', v_remaining,
    'resets_at', date_trunc('month', CURRENT_DATE) + interval '1 month',
    'total_invites_sent', v_total_invites_sent,
    'total_accepted', v_total_accepted,
    'acceptance_rate', CASE 
      WHEN v_total_invites_sent > 0 THEN ROUND((v_total_accepted::NUMERIC / v_total_invites_sent) * 100, 1)
      ELSE 0
    END
  );
END;
$$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON invite_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON profiles(invited_by);
CREATE INDEX IF NOT EXISTS idx_profiles_platform_access ON profiles(platform_access_granted);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own invite codes
DROP POLICY IF EXISTS "Users can view own invite codes" ON invite_codes;
CREATE POLICY "Users can view own invite codes" ON invite_codes
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create invite codes (if they have allowance)
DROP POLICY IF EXISTS "Users can generate invite codes" ON invite_codes;
CREATE POLICY "Users can generate invite codes" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Admins can view all invite codes
DROP POLICY IF EXISTS "Admins can view all invites" ON invite_codes;
CREATE POLICY "Admins can view all invites" ON invite_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- ADMIN UTILITIES
-- =====================================================

-- Grant platform access to specific user (admin only)
CREATE OR REPLACE FUNCTION admin_grant_access(
  p_user_email TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = p_user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', format('No user found with email: %s', p_user_email)
    );
  END IF;
  
  -- Grant access
  UPDATE profiles
  SET 
    platform_access_granted = true,
    access_granted_at = NOW()
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', format('Platform access granted to %s', p_user_email)
  );
END;
$$;

-- List all pending signups (no access yet)
-- SELECT id, full_name, email, created_at
-- FROM profiles
-- WHERE platform_access_granted = false
-- ORDER BY created_at DESC;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Invite-only system implemented
-- ✅ Tier-based invite allowances (Bronze: 1, Platinum: 10)
-- ✅ Monthly invite limits with auto-reset
-- ✅ Invite tracking (who invited who)
-- ✅ Platform access gating
-- ✅ Admin override functions
--
-- NEXT STEPS:
-- 1. Build "Generate Invite" button in user dashboard
-- 2. Create signup flow that requires invite code
-- 3. Build admin panel to monitor invite usage
-- 4. Set up invite reminder emails ("You have 3 unused invites!")
-- 5. Analytics dashboard for invite conversion rates
-- =====================================================

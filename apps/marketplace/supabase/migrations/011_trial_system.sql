-- =====================================================================================
-- 7-DAY FREE TRIAL SYSTEM
-- =====================================================================================
-- All new users get 7 days free access before requiring payment
-- After trial: Members (free + donations) vs Non-members ($25/month)
--
-- Migration: 011_trial_system.sql
-- =====================================================================================

-- Add trial tracking to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS membership_choice_made BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS membership_choice_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');

COMMENT ON COLUMN profiles.trial_started_at IS 'When the user started their 7-day free trial';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the trial expires (7 days from signup)';
COMMENT ON COLUMN profiles.trial_active IS 'Whether user is still in trial period';
COMMENT ON COLUMN profiles.membership_choice_made IS 'Whether user has chosen member vs non-member path';
COMMENT ON COLUMN profiles.membership_choice_deadline IS 'Deadline to make membership choice (trial end)';

-- =====================================================================================
-- FUNCTION: Check if user is in trial period
-- =====================================================================================

CREATE OR REPLACE FUNCTION is_user_in_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial_active BOOLEAN;
  v_trial_ends_at TIMESTAMPTZ;
BEGIN
  SELECT trial_active, trial_ends_at
  INTO v_trial_active, v_trial_ends_at
  FROM profiles
  WHERE id = p_user_id;

  -- User is in trial if trial is active and hasn't expired
  RETURN COALESCE(v_trial_active, FALSE) AND v_trial_ends_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Process membership choice (called when user decides)
-- =====================================================================================

CREATE OR REPLACE FUNCTION process_membership_choice(
  p_user_id UUID,
  p_chose_membership BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update user's choice
  UPDATE profiles
  SET
    membership_choice_made = TRUE,
    is_organization_member = p_chose_membership,
    trial_active = FALSE
  WHERE id = p_user_id;

  IF p_chose_membership THEN
    -- Member path: Free access, enable donations
    UPDATE profiles
    SET
      non_member_subscription_active = FALSE,
      platform_donation_percentage = 10.00 -- Suggested 10% donation
    WHERE id = p_user_id;

    v_result := json_build_object(
      'success', true,
      'path', 'member',
      'message', 'Welcome to the organization! You now have free access and can make optional donations to support the platform.',
      'next_step', 'google_workspace_setup'
    );
  ELSE
    -- Non-member path: Start $25/month subscription
    UPDATE profiles
    SET
      non_member_subscription_active = TRUE,
      platform_donation_percentage = 0 -- No donations for non-members
    WHERE id = p_user_id;

    v_result := json_build_object(
      'success', true,
      'path', 'non_member',
      'message', 'You will now be charged $25/month for continued access. You can cancel anytime.',
      'next_step', 'subscription_setup'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Check trial status and auto-expire if needed
-- =====================================================================================

CREATE OR REPLACE FUNCTION check_and_expire_trials()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Find users whose trial has expired but haven't made a choice
  UPDATE profiles
  SET
    trial_active = FALSE,
    membership_choice_made = TRUE,
    is_organization_member = FALSE, -- Default to non-member
    non_member_subscription_active = TRUE,
    platform_donation_percentage = 0
  WHERE
    trial_active = TRUE
    AND trial_ends_at <= NOW()
    AND membership_choice_made = FALSE;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get trial status for user
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_trial_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_status JSON;
BEGIN
  SELECT json_build_object(
    'in_trial', is_user_in_trial(p_user_id),
    'trial_started_at', trial_started_at,
    'trial_ends_at', trial_ends_at,
    'trial_active', trial_active,
    'choice_made', membership_choice_made,
    'is_member', is_organization_member,
    'days_remaining', GREATEST(0, EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400)::INTEGER,
    'hours_remaining', GREATEST(0, EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 3600)::INTEGER
  ) INTO v_status
  FROM profiles
  WHERE id = p_user_id;

  RETURN v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
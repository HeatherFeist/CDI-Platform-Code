-- =====================================================================================
-- HELPER FUNCTION: Increment Affiliate Submission Count
-- =====================================================================================
-- Called by Edge Function after successful lead submission
-- Updates affiliate stats in real-time
-- =====================================================================================

CREATE OR REPLACE FUNCTION increment_affiliate_submission_count(
  p_affiliate_partnership_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_partnerships
  SET 
    total_leads_submitted = total_leads_submitted + 1,
    last_submission_at = NOW(),
    updated_at = NOW()
  WHERE id = p_affiliate_partnership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- MODIFIED: Submit External Lead (Single Instant Submit Version)
-- =====================================================================================
-- Simplified for one-click instant submission (no batch queue)
-- =====================================================================================

CREATE OR REPLACE FUNCTION submit_affiliate_lead_instant(
  p_affiliate_id TEXT,
  p_location TEXT,
  p_timeline TEXT,
  p_duration TEXT,
  p_budget NUMERIC(10,2),
  p_notes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_job_id UUID;
  v_partnership_id UUID;
  v_recruiting_member_id UUID;
  v_tier_max_leads INTEGER;
  v_current_active_leads INTEGER;
  v_available_pm_id UUID;
BEGIN
  -- Get partnership details
  SELECT 
    id,
    recruiting_member_id
  INTO 
    v_partnership_id,
    v_recruiting_member_id
  FROM affiliate_partnerships
  WHERE affiliate_id = p_affiliate_id
    AND partnership_status = 'active';

  IF v_partnership_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or inactive affiliate ID'
    );
  END IF;

  -- Check monthly submission limit (if applicable)
  SELECT max_active_referrals INTO v_tier_max_leads
  FROM subscription_tiers st
  JOIN affiliate_partnerships ap ON ap.subscription_tier = st.tier_id
  WHERE ap.id = v_partnership_id;

  IF v_tier_max_leads IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_active_leads
    FROM sub_opportunities
    WHERE affiliate_partnership_id = v_partnership_id
      AND is_affiliate_referral = true
      AND status NOT IN ('completed', 'canceled')
      AND created_at >= date_trunc('month', CURRENT_DATE);

    IF v_current_active_leads >= v_tier_max_leads THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Monthly submission limit reached. Upgrade your tier for more capacity.'
      );
    END IF;
  END IF;

  -- Find available project manager (simple round-robin)
  SELECT id INTO v_available_pm_id
  FROM profiles
  WHERE role = 'project_manager'
    AND is_active = true
  ORDER BY RANDOM()
  LIMIT 1;

  -- Create job opportunity
  INSERT INTO sub_opportunities (
    id,
    title,
    description,
    location,
    estimated_budget,
    timeline,
    estimated_duration,
    status,
    is_affiliate_referral,
    affiliate_partnership_id,
    recruiting_member_id,
    affiliate_attribution_expires_at,
    project_manager_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'Affiliate Referral: ' || p_location,
    p_notes || E'\n\nTimeline: ' || p_timeline || E'\nDuration: ' || p_duration,
    p_location,
    p_budget,
    p_timeline,
    p_duration,
    'pending_pm_review',
    true,
    v_partnership_id,
    v_recruiting_member_id,
    NOW() + INTERVAL '90 days', -- 90-day cookie
    v_available_pm_id,
    NOW()
  )
  RETURNING id INTO v_job_id;

  -- Update affiliate stats
  UPDATE affiliate_partnerships
  SET 
    total_leads_submitted = total_leads_submitted + 1,
    last_submission_at = NOW()
  WHERE id = v_partnership_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'job_id', v_job_id,
    'affiliate_commission', p_budget * 0.05,
    'message', 'Lead submitted successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- GRANT PERMISSIONS
-- =====================================================================================

GRANT EXECUTE ON FUNCTION increment_affiliate_submission_count TO service_role;
GRANT EXECUTE ON FUNCTION submit_affiliate_lead_instant TO service_role;
GRANT EXECUTE ON FUNCTION submit_affiliate_lead_instant TO authenticated;

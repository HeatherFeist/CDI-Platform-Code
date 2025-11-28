-- =====================================================================================
-- MEMBER-DRIVEN AFFILIATE RECRUITMENT SYSTEM
-- =====================================================================================
-- Purpose: Enable members to recruit external contractors as affiliates
-- 
-- Business Model Innovation:
-- - Members recruit external contractors (warm introductions, not cold outreach)
-- - Member becomes affiliate's "sponsor" and earns 2% override commission forever
-- - External contractor gets 5% direct commission on completed referrals
-- - Platform keeps 3% net from the standard 10% platform fee
--
-- Key Differences from Previous Model:
-- ❌ OLD: External contractors find us and sign up directly
-- ✅ NEW: Our members recruit them (viral growth loop)
-- 
-- ❌ OLD: External contractor pays subscription to submit leads
-- ✅ NEW: Free to join (subscription optional for premium features)
--
-- ❌ OLD: One-by-one mobile form submission
-- ✅ NEW: Batch "Recycle Bin" submission (collect all week, empty once)
--
-- Revenue Streams:
-- 1. Platform fees: 10% of job value from winning member (standard)
-- 2. Commission split: 5% to affiliate, 2% to recruiting member, 3% platform keeps
-- 3. Optional premium subscriptions: Analytics dashboard, custom branding ($29-$99/mo)
--
-- The Viral Loop:
-- 1. Member recruits external contractor → member gets override commission forever
-- 2. More members = more affiliates recruited
-- 3. More affiliates = more leads for members
-- 4. More leads = faster member progression
-- 5. Faster progression = more contractors join as members
-- 6. Loop repeats 🔄
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: unified-profiles-schema.sql, simple-membership-final.sql
-- =====================================================================================

-- =====================================================================================
-- AFFILIATE PARTNERSHIPS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS affiliate_partnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partnership Structure
  affiliate_id TEXT UNIQUE NOT NULL, -- af_12345_sarah_jones (unique tracking code)
  recruiting_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Sarah (who recruited Nick)
  
  -- External Contractor Info
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Tax Info (for 1099 commission payments)
  tax_id_ein TEXT, -- Business EIN or SSN (encrypted)
  business_address TEXT,
  w9_submitted BOOLEAN DEFAULT false,
  w9_file_url TEXT,
  
  -- Recycle Bin Configuration
  recycle_bin_template_type TEXT DEFAULT 'google_sheets' CHECK (recycle_bin_template_type IN (
    'google_sheets',  -- Pre-made Google Sheets template
    'excel',          -- Downloadable Excel template
    'web_form',       -- Simple web form (batch entry)
    'email_forward'   -- Just forward emails to their unique address
  )),
  recycle_bin_email TEXT UNIQUE, -- nick.thompson.af12345@intake.constructivedesigns.com
  recycle_bin_template_url TEXT, -- Link to their custom template
  
  -- Commission Structure
  affiliate_commission_rate NUMERIC(5,2) DEFAULT 5.00, -- 5% to affiliate (Nick)
  override_commission_rate NUMERIC(5,2) DEFAULT 2.00, -- 2% to recruiting member (Sarah)
  platform_net_rate NUMERIC(5,2) DEFAULT 3.00, -- 3% platform keeps (from 10% fee)
  
  -- Tracking Cookies & Attribution
  affiliate_cookie_duration_days INTEGER DEFAULT 90, -- Lead attributed to affiliate for 90 days
  total_leads_submitted INTEGER DEFAULT 0,
  total_leads_completed INTEGER DEFAULT 0,
  total_affiliate_earnings NUMERIC(10,2) DEFAULT 0.00,
  total_override_earnings NUMERIC(10,2) DEFAULT 0.00, -- Earnings for recruiting member
  
  -- Optional Premium Subscription (for analytics dashboard, custom branding)
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled')),
  stripe_subscription_id TEXT,
  
  -- Software Integration Notes (informational only)
  primary_software TEXT, -- What they currently use (HouseCall Pro, Jobber, etc.)
  software_notes TEXT,
  
  -- Status & Metadata
  partnership_status TEXT DEFAULT 'active' CHECK (partnership_status IN ('pending', 'active', 'paused', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_submission_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_recruiting_member ON affiliate_partnerships(recruiting_member_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_affiliate_id ON affiliate_partnerships(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_email ON affiliate_partnerships(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_partnerships_status ON affiliate_partnerships(partnership_status);

-- =====================================================================================
-- AFFILIATE COMMISSIONS TABLE (Replaces referral_commissions)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partnership & Job Reference
  affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id) ON DELETE CASCADE,
  recruiting_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES sub_opportunities(id) ON DELETE CASCADE,
  
  -- Financial Details
  job_value NUMERIC(10,2) NOT NULL,
  platform_fee_amount NUMERIC(10,2) NOT NULL, -- Standard 10% platform fee
  
  -- Commission Split (from the 10% platform fee)
  affiliate_commission_rate NUMERIC(5,2) NOT NULL, -- 5.0 = 5%
  affiliate_commission_amount NUMERIC(10,2) NOT NULL, -- $175 on $3,500 job
  
  override_commission_rate NUMERIC(5,2) NOT NULL, -- 2.0 = 2%
  override_commission_amount NUMERIC(10,2) NOT NULL, -- $70 on $3,500 job
  
  platform_net_amount NUMERIC(10,2) NOT NULL, -- $105 on $3,500 job (3%)
  
  -- Payout Tracking (Affiliate)
  affiliate_payout_status TEXT DEFAULT 'pending' CHECK (affiliate_payout_status IN ('pending', 'approved', 'paid', 'disputed')),
  affiliate_payout_method TEXT CHECK (affiliate_payout_method IN ('ach', 'check', 'paypal', 'stripe_connect')),
  affiliate_payout_reference TEXT,
  affiliate_paid_at TIMESTAMPTZ,
  
  -- Payout Tracking (Override to Recruiting Member)
  override_payout_status TEXT DEFAULT 'pending' CHECK (override_payout_status IN ('pending', 'approved', 'paid')),
  override_paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_partnership ON affiliate_commissions(affiliate_partnership_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_recruiting_member ON affiliate_commissions(recruiting_member_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_job ON affiliate_commissions(job_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_status ON affiliate_commissions(affiliate_payout_status);

-- =====================================================================================
-- RECYCLE BIN SUBMISSIONS TABLE
-- =====================================================================================
-- Tracks batch submissions from affiliates' "empty recycle bin" action

CREATE TABLE IF NOT EXISTS recycle_bin_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Affiliate Info
  affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL,
  
  -- Submission Details
  submission_method TEXT CHECK (submission_method IN ('email', 'web_form', 'api', 'spreadsheet_upload')),
  total_leads_in_batch INTEGER NOT NULL,
  raw_submission_data JSONB, -- Store original email/form data
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  leads_created_count INTEGER DEFAULT 0,
  leads_failed_count INTEGER DEFAULT 0,
  error_messages TEXT[],
  
  -- Project Manager Assignment
  assigned_pm_id UUID REFERENCES profiles(id), -- Auto-assigned to available PM
  pm_review_status TEXT DEFAULT 'pending' CHECK (pm_review_status IN ('pending', 'reviewed', 'approved', 'rejected')),
  pm_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recycle_bin_submissions_affiliate ON recycle_bin_submissions(affiliate_partnership_id);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_submissions_status ON recycle_bin_submissions(processing_status);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_submissions_pm ON recycle_bin_submissions(assigned_pm_id);

-- =====================================================================================
-- UPDATE sub_opportunities TABLE (Add Affiliate Tracking)
-- =====================================================================================

ALTER TABLE sub_opportunities 
  ADD COLUMN IF NOT EXISTS is_affiliate_referral BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id),
  ADD COLUMN IF NOT EXISTS recycle_bin_submission_id UUID REFERENCES recycle_bin_submissions(id),
  ADD COLUMN IF NOT EXISTS recruiting_member_id UUID REFERENCES profiles(id), -- Sarah gets override
  ADD COLUMN IF NOT EXISTS affiliate_attribution_expires_at TIMESTAMPTZ; -- Cookie expiration

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_affiliate_referral ON sub_opportunities(is_affiliate_referral) WHERE is_affiliate_referral = true;
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_affiliate_partnership ON sub_opportunities(affiliate_partnership_id);

-- =====================================================================================
-- TRIGGER: Update affiliate_partnerships.updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_affiliate_partnerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_partnerships_updated_at
  BEFORE UPDATE ON affiliate_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_partnerships_updated_at();

-- =====================================================================================
-- FUNCTION: Member Recruits Affiliate (Step 1: Generate Affiliate Link)
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_affiliate_invitation(
  p_recruiting_member_id UUID,
  p_affiliate_email TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_affiliate_id TEXT;
  v_member_username TEXT;
  v_invitation_link TEXT;
BEGIN
  -- Get recruiting member's username for affiliate ID
  SELECT username INTO v_member_username
  FROM profiles
  WHERE id = p_recruiting_member_id;

  -- Generate unique affiliate ID: af_12345_sarah_jones
  v_affiliate_id := 'af_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8) || '_' || REPLACE(LOWER(v_member_username), ' ', '_');

  -- Generate invitation link
  v_invitation_link := 'https://constructivedesigns.com/affiliate/signup/' || v_affiliate_id;

  -- Return invitation details (actual affiliate record created when they sign up)
  RETURN json_build_object(
    'affiliate_id', v_affiliate_id,
    'invitation_link', v_invitation_link,
    'recruiting_member_id', p_recruiting_member_id,
    'recruiting_member_username', v_member_username,
    'expires_at', NOW() + INTERVAL '30 days',
    'instructions', 'Send this link to the external contractor. They will fill out a 2-minute form to activate their affiliate partnership.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: External Contractor Completes Signup (Step 2: Activate Partnership)
-- =====================================================================================

CREATE OR REPLACE FUNCTION activate_affiliate_partnership(
  p_affiliate_id TEXT,
  p_business_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_tax_id_ein TEXT,
  p_business_address TEXT,
  p_template_preference TEXT DEFAULT 'google_sheets'
)
RETURNS UUID AS $$
DECLARE
  v_partnership_id UUID;
  v_recruiting_member_id UUID;
  v_recycle_bin_email TEXT;
  v_template_url TEXT;
BEGIN
  -- Extract recruiting member ID from affiliate_id pattern
  -- (In production, you'd store this in a pending_invitations table)
  -- For now, we'll just create the partnership
  
  -- Generate unique recycle bin email
  v_recycle_bin_email := REPLACE(LOWER(p_business_name), ' ', '.') || '.' || SUBSTRING(p_affiliate_id FROM 4 FOR 8) || '@intake.constructivedesigns.com';

  -- Generate template URL based on preference
  CASE p_template_preference
    WHEN 'google_sheets' THEN
      v_template_url := 'https://docs.google.com/spreadsheets/d/TEMPLATE_' || p_affiliate_id || '/edit';
    WHEN 'excel' THEN
      v_template_url := 'https://constructivedesigns.com/downloads/recycle-bin-template.xlsx?affiliate=' || p_affiliate_id;
    WHEN 'web_form' THEN
      v_template_url := 'https://constructivedesigns.com/recycle-bin/' || p_affiliate_id;
    ELSE
      v_template_url := 'mailto:' || v_recycle_bin_email;
  END CASE;

  -- Create affiliate partnership
  INSERT INTO affiliate_partnerships (
    id, affiliate_id, business_name, contact_name, email, phone,
    tax_id_ein, business_address, w9_submitted,
    recycle_bin_template_type, recycle_bin_email, recycle_bin_template_url,
    partnership_status, activated_at
  ) VALUES (
    gen_random_uuid(), p_affiliate_id, p_business_name, p_contact_name, p_email, p_phone,
    p_tax_id_ein, p_business_address, (p_tax_id_ein IS NOT NULL),
    p_template_preference, v_recycle_bin_email, v_template_url,
    'active', NOW()
  )
  RETURNING id INTO v_partnership_id;

  RETURN v_partnership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Process Recycle Bin Submission (Step 3: Batch Email Parsed)
-- =====================================================================================

CREATE OR REPLACE FUNCTION process_recycle_bin_submission(
  p_affiliate_id TEXT,
  p_submission_method TEXT,
  p_leads_data JSONB -- Array of lead objects: [{location, timeline, duration, budget, notes}, ...]
)
RETURNS UUID AS $$
DECLARE
  v_submission_id UUID;
  v_partnership_id UUID;
  v_recruiting_member_id UUID;
  v_available_pm_id UUID;
  v_lead_data JSONB;
  v_job_id UUID;
  v_leads_created INTEGER := 0;
  v_leads_failed INTEGER := 0;
  v_error_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get partnership details
  SELECT id, recruiting_member_id INTO v_partnership_id, v_recruiting_member_id
  FROM affiliate_partnerships
  WHERE affiliate_id = p_affiliate_id
    AND partnership_status = 'active';

  IF v_partnership_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive affiliate ID: %', p_affiliate_id;
  END IF;

  -- Find available project manager (round-robin or least busy)
  -- For now, just get any PM (you'll implement proper PM assignment logic later)
  SELECT id INTO v_available_pm_id
  FROM profiles
  WHERE role = 'project_manager'
    AND is_active = true
  ORDER BY RANDOM()
  LIMIT 1;

  -- Create submission record
  INSERT INTO recycle_bin_submissions (
    id, affiliate_partnership_id, affiliate_id,
    submission_method, total_leads_in_batch, raw_submission_data,
    assigned_pm_id, processing_status
  ) VALUES (
    gen_random_uuid(), v_partnership_id, p_affiliate_id,
    p_submission_method, jsonb_array_length(p_leads_data), p_leads_data,
    v_available_pm_id, 'processing'
  )
  RETURNING id INTO v_submission_id;

  -- Process each lead in the batch
  FOR v_lead_data IN SELECT * FROM jsonb_array_elements(p_leads_data)
  LOOP
    BEGIN
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
        recycle_bin_submission_id,
        recruiting_member_id,
        affiliate_attribution_expires_at,
        project_manager_id,
        created_at
      ) VALUES (
        gen_random_uuid(),
        'Affiliate Referral: ' || (v_lead_data->>'location'),
        v_lead_data->>'notes',
        v_lead_data->>'location',
        (v_lead_data->>'budget')::NUMERIC,
        v_lead_data->>'timeline',
        v_lead_data->>'duration',
        'pending_pm_review',
        true,
        v_partnership_id,
        v_submission_id,
        v_recruiting_member_id,
        NOW() + INTERVAL '90 days', -- Cookie duration
        v_available_pm_id,
        NOW()
      )
      RETURNING id INTO v_job_id;

      v_leads_created := v_leads_created + 1;

    EXCEPTION WHEN OTHERS THEN
      v_leads_failed := v_leads_failed + 1;
      v_error_messages := array_append(v_error_messages, SQLERRM);
    END;
  END LOOP;

  -- Update submission record with results
  UPDATE recycle_bin_submissions
  SET 
    processing_status = CASE WHEN v_leads_failed = 0 THEN 'completed' ELSE 'failed' END,
    leads_created_count = v_leads_created,
    leads_failed_count = v_leads_failed,
    error_messages = v_error_messages,
    processed_at = NOW()
  WHERE id = v_submission_id;

  -- Update affiliate partnership stats
  UPDATE affiliate_partnerships
  SET 
    total_leads_submitted = total_leads_submitted + v_leads_created,
    last_submission_at = NOW()
  WHERE id = v_partnership_id;

  RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Create Affiliate Commission (Step 4: Job Completes)
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_affiliate_commission(
  p_job_id UUID,
  p_final_job_value NUMERIC(10,2)
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_partnership_id UUID;
  v_recruiting_member_id UUID;
  v_affiliate_rate NUMERIC(5,2);
  v_override_rate NUMERIC(5,2);
  v_platform_fee NUMERIC(10,2);
  v_affiliate_amount NUMERIC(10,2);
  v_override_amount NUMERIC(10,2);
  v_platform_net NUMERIC(10,2);
BEGIN
  -- Get affiliate partnership details from job
  SELECT 
    affiliate_partnership_id,
    recruiting_member_id
  INTO 
    v_partnership_id,
    v_recruiting_member_id
  FROM sub_opportunities
  WHERE id = p_job_id
    AND is_affiliate_referral = true;

  IF v_partnership_id IS NULL THEN
    RETURN NULL; -- Not an affiliate referral
  END IF;

  -- Get commission rates
  SELECT 
    affiliate_commission_rate,
    override_commission_rate
  INTO 
    v_affiliate_rate,
    v_override_rate
  FROM affiliate_partnerships
  WHERE id = v_partnership_id;

  -- Calculate amounts
  v_platform_fee := p_final_job_value * 10 / 100; -- Standard 10%
  v_affiliate_amount := p_final_job_value * v_affiliate_rate / 100; -- 5%
  v_override_amount := p_final_job_value * v_override_rate / 100; -- 2%
  v_platform_net := v_platform_fee - v_affiliate_amount - v_override_amount; -- 3%

  -- Create commission record
  INSERT INTO affiliate_commissions (
    id,
    affiliate_partnership_id,
    recruiting_member_id,
    job_id,
    job_value,
    platform_fee_amount,
    affiliate_commission_rate,
    affiliate_commission_amount,
    override_commission_rate,
    override_commission_amount,
    platform_net_amount,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_partnership_id,
    v_recruiting_member_id,
    p_job_id,
    p_final_job_value,
    v_platform_fee,
    v_affiliate_rate,
    v_affiliate_amount,
    v_override_rate,
    v_override_amount,
    v_platform_net,
    NOW()
  )
  RETURNING id INTO v_commission_id;

  -- Update affiliate partnership stats
  UPDATE affiliate_partnerships
  SET 
    total_leads_completed = total_leads_completed + 1,
    total_affiliate_earnings = total_affiliate_earnings + v_affiliate_amount,
    total_override_earnings = total_override_earnings + v_override_amount
  WHERE id = v_partnership_id;

  -- Update recruiting member stats (override earnings tracked separately)
  UPDATE profiles
  SET 
    total_affiliate_override_earnings = COALESCE(total_affiliate_override_earnings, 0) + v_override_amount
  WHERE id = v_recruiting_member_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get Affiliate Dashboard Stats
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_affiliate_dashboard_stats(p_affiliate_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'affiliate_id', ap.affiliate_id,
    'business_name', ap.business_name,
    'recruiting_member', p.username,
    'partnership_status', ap.partnership_status,
    'recycle_bin_email', ap.recycle_bin_email,
    'recycle_bin_template_url', ap.recycle_bin_template_url,
    'commission_rate', ap.affiliate_commission_rate || '%',
    'total_leads_submitted', ap.total_leads_submitted,
    'total_leads_completed', ap.total_leads_completed,
    'completion_rate', ROUND((ap.total_leads_completed::NUMERIC / NULLIF(ap.total_leads_submitted, 0) * 100), 2) || '%',
    'total_earnings', '$' || TO_CHAR(ap.total_affiliate_earnings, 'FM999,999.00'),
    'pending_commissions', (
      SELECT COALESCE(SUM(affiliate_commission_amount), 0)
      FROM affiliate_commissions
      WHERE affiliate_partnership_id = ap.id
        AND affiliate_payout_status = 'pending'
    ),
    'active_leads', (
      SELECT COUNT(*)
      FROM sub_opportunities
      WHERE affiliate_partnership_id = ap.id
        AND status NOT IN ('completed', 'canceled')
    ),
    'recent_submissions', (
      SELECT json_agg(
        json_build_object(
          'id', rbs.id,
          'submitted_at', rbs.created_at,
          'total_leads', rbs.total_leads_in_batch,
          'leads_created', rbs.leads_created_count,
          'status', rbs.processing_status
        )
      )
      FROM recycle_bin_submissions rbs
      WHERE rbs.affiliate_partnership_id = ap.id
      ORDER BY rbs.created_at DESC
      LIMIT 5
    )
  ) INTO v_stats
  FROM affiliate_partnerships ap
  LEFT JOIN profiles p ON p.id = ap.recruiting_member_id
  WHERE ap.affiliate_id = p_affiliate_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get Member's Affiliate Recruiting Stats (Override Earnings)
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_member_affiliate_recruiting_stats(p_member_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_affiliates_recruited', COUNT(ap.id),
      'active_affiliates', COUNT(ap.id) FILTER (WHERE ap.partnership_status = 'active'),
      'total_override_earnings', COALESCE(SUM(ap.total_override_earnings), 0),
      'pending_override_commissions', (
        SELECT COALESCE(SUM(override_commission_amount), 0)
        FROM affiliate_commissions
        WHERE recruiting_member_id = p_member_id
          AND override_payout_status = 'pending'
      ),
      'affiliates', (
        SELECT json_agg(
          json_build_object(
            'affiliate_id', ap.affiliate_id,
            'business_name', ap.business_name,
            'status', ap.partnership_status,
            'leads_submitted', ap.total_leads_submitted,
            'leads_completed', ap.total_leads_completed,
            'override_earnings', ap.total_override_earnings,
            'joined_at', ap.activated_at
          )
        )
        FROM affiliate_partnerships ap
        WHERE ap.recruiting_member_id = p_member_id
        ORDER BY ap.activated_at DESC
      )
    )
    FROM affiliate_partnerships ap
    WHERE ap.recruiting_member_id = p_member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- RLS POLICIES
-- =====================================================================================

-- Affiliates can view their own partnership data
ALTER TABLE affiliate_partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own partnership"
  ON affiliate_partnerships FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Members can view affiliates they recruited
CREATE POLICY "Members can view recruited affiliates"
  ON affiliate_partnerships FOR SELECT
  USING (recruiting_member_id = auth.uid()::UUID);

-- Affiliate commissions visibility
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions"
  ON affiliate_commissions FOR SELECT
  USING (
    affiliate_partnership_id IN (
      SELECT id FROM affiliate_partnerships WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Members can view override commissions"
  ON affiliate_commissions FOR SELECT
  USING (recruiting_member_id = auth.uid()::UUID);

-- =====================================================================================
-- ADD COLUMN TO profiles TABLE (Track Override Earnings)
-- =====================================================================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS total_affiliate_override_earnings NUMERIC(10,2) DEFAULT 0.00;

-- =====================================================================================
-- EXAMPLE USAGE
-- =====================================================================================

/*
-- Step 1: Sarah recruits Nick
SELECT create_affiliate_invitation(
  '550e8400-e29b-41d4-a716-446655440000', -- Sarah's member ID
  'nick@thompsonconstruction.com',
  'Met Nick at job site, he said he turns down 5+ small jobs per month'
);
-- Returns: { affiliate_id: 'af_a7f8d9e2_sarah_jones', invitation_link: 'https://...' }

-- Step 2: Nick completes signup form
SELECT activate_affiliate_partnership(
  'af_a7f8d9e2_sarah_jones',
  'Thompson Construction',
  'Nick Thompson',
  'nick@thompsonconstruction.com',
  '206-555-0123',
  '12-3456789', -- EIN
  '123 Main St, Seattle, WA 98101',
  'google_sheets'
);
-- Returns partnership_id, sends welcome email with recycle bin template

-- Step 3: Nick empties recycle bin (7 leads)
SELECT process_recycle_bin_submission(
  'af_a7f8d9e2_sarah_jones',
  'email',
  '[
    {"location": "Spokane, WA", "timeline": "ASAP", "duration": "2-3 weeks", "budget": 8000, "notes": "Bathroom remodel..."},
    {"location": "Tacoma, WA", "timeline": "Next month", "duration": "1 week", "budget": 3500, "notes": "Kitchen tile..."},
    ...
  ]'::jsonb
);
-- Creates 7 job opportunities, assigns to PM, sends notification

-- Step 4: Job completes, create commission
SELECT create_affiliate_commission(
  '660e8400-e29b-41d4-a716-446655440000', -- job_id
  7800.00 -- final_job_value
);
-- Nick gets $390 (5%), Sarah gets $156 (2%), platform keeps $234 (3%)

-- View affiliate dashboard
SELECT get_affiliate_dashboard_stats('af_a7f8d9e2_sarah_jones');

-- View Sarah's override earnings
SELECT get_member_affiliate_recruiting_stats('550e8400-e29b-41d4-a716-446655440000');
*/

-- =====================================================================================
-- END OF SCHEMA
-- =====================================================================================

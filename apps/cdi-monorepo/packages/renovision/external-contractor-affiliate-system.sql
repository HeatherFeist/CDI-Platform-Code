-- =====================================================================================
-- EXTERNAL CONTRACTOR AFFILIATE PROGRAM (SOFTWARE-AGNOSTIC)
-- =====================================================================================
-- Purpose: Enable ANY external contractor to monetize unwanted leads
-- 
-- Business Model:
-- - External contractors pay monthly subscription ($29-$99) for affiliate dashboard access
-- - They forward unwanted leads via simple 30-second mobile form
-- - Works with ANY job management software (HouseCall Pro, Jobber, ServiceTitan, Excel, etc.)
-- - Project managers handle all client communication (external contractor stays hands-off)
-- - Leads enter competition system where members compete to win contracts
-- - External contractor earns 5-7.5% referral commission when job completes
-- - Platform earns subscription revenue + standard 10% platform fees from winning contractor
--
-- Why Software-Agnostic Works Better:
-- ✓ No partnership negotiations needed
-- ✓ External contractor manually forwards leads = they ARE the integration
-- ✓ Works with ANY system (even Excel spreadsheets or handwritten notes)
-- ✓ Project managers handle ALL client communication (removes external contractor liability)
-- ✓ Faster to market - no API integrations needed
-- ✓ Infinite scalability - one form works for 10 or 10,000 external contractors
--
-- Revenue Model:
-- 1. Subscription fees: $29-$99/month per external contractor (pure profit)
-- 2. Platform fee: 10% of job value from winning contractor (standard)
-- 3. Commission split: External contractor gets 5-7.5%, platform keeps 2.5-5%
--
-- Lead Flow:
-- 1. External contractor gets lead in their existing software (any software)
-- 2. They decide "I don't want this job" and open mobile form via bookmarked link
-- 3. Fill out 5 fields (Where, When, Duration, Pay, Notes) in 30 seconds
-- 4. Lead enters platform "recycle bin" → project manager follows up with client
-- 5. Lead becomes competition opportunity for members to win contract
-- 6. Winning member completes job → external contractor gets commission automatically
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: unified-profiles-schema.sql, simple-membership-final.sql
-- =====================================================================================

-- =====================================================================================
-- SUBSCRIPTION TIERS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_id TEXT PRIMARY KEY,
  tier_name TEXT NOT NULL,
  monthly_price NUMERIC(6,2) NOT NULL,
  referral_commission_rate NUMERIC(5,2) NOT NULL, -- Percentage of job value (5.0 = 5%)
  max_active_referrals INTEGER, -- NULL = unlimited
  priority_support BOOLEAN DEFAULT false,
  dashboard_analytics BOOLEAN DEFAULT false,
  custom_branded_link BOOLEAN DEFAULT false, -- yourcompany.constructivedesigns.com/refer
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed subscription tiers (SOFTWARE-AGNOSTIC)
INSERT INTO subscription_tiers (tier_id, tier_name, monthly_price, referral_commission_rate, max_active_referrals, priority_support, dashboard_analytics, custom_branded_link, description) VALUES
('overflow_partner', 'Overflow Partner', 29.00, 5.00, 10, false, false, false, 'Perfect for contractors who occasionally have overflow work. Submit up to 10 leads per month via mobile form, earn 5% commission when completed. Works with ANY job management software.'),
('lead_salvage', 'Lead Salvage Pro', 49.00, 6.00, 25, true, true, false, 'For busy contractors with regular overflow. Submit up to 25 leads per month, earn 6% commission. Includes dashboard analytics and priority support. Works with ANY software.'),
('premium_partner', 'Premium Partner', 99.00, 7.50, NULL, true, true, true, 'Unlimited lead submissions, highest 7.5% commission rate. Custom-branded referral link for your business. Perfect for high-volume contractors wanting to fully monetize cold leads.')
ON CONFLICT (tier_id) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  monthly_price = EXCLUDED.monthly_price,
  referral_commission_rate = EXCLUDED.referral_commission_rate,
  max_active_referrals = EXCLUDED.max_active_referrals,
  priority_support = EXCLUDED.priority_support,
  dashboard_analytics = EXCLUDED.dashboard_analytics,
  custom_branded_link = EXCLUDED.custom_branded_link,
  description = EXCLUDED.description;

-- =====================================================================================
-- EXTERNAL CONTRACTORS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS external_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info (No full profile needed - they're not members)
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Subscription Info
  subscription_tier TEXT REFERENCES subscription_tiers(tier_id) DEFAULT 'overflow_partner',
  referral_commission_rate NUMERIC(5,2) DEFAULT 5.00, -- Copied from tier at signup
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- External Software Info (Optional - just for our internal tracking)
  primary_job_management_software TEXT, -- 'HouseCall Pro', 'Jobber', 'ServiceTitan', 'Buildertrend', 'Excel', 'Other'
  software_notes TEXT, -- Free-form field for notes about their setup
  
  -- Stats and Performance
  total_leads_submitted INTEGER DEFAULT 0,
  total_leads_completed INTEGER DEFAULT 0,
  total_referral_earnings NUMERIC(10,2) DEFAULT 0.00,
  avg_lead_value NUMERIC(10,2) DEFAULT 0.00,
  completion_rate NUMERIC(5,2) DEFAULT 0.00, -- Percentage of submitted leads that complete
  
  -- Custom Branding (Premium Partner feature)
  custom_referral_slug TEXT UNIQUE, -- e.g., 'nick-thompson' → nick-thompson.constructivedesigns.com/refer
  custom_business_logo_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_lead_submitted_at TIMESTAMPTZ,
  last_commission_earned_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_contractors_email ON external_contractors(email);
CREATE INDEX IF NOT EXISTS idx_external_contractors_subscription_status ON external_contractors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_external_contractors_stripe_customer ON external_contractors(stripe_customer_id);

-- =====================================================================================
-- REFERRAL COMMISSIONS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referral Details
  external_contractor_id UUID REFERENCES external_contractors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES sub_opportunities(id) ON DELETE CASCADE,
  
  -- Financial Details
  job_value NUMERIC(10,2) NOT NULL, -- Total job cost
  commission_rate NUMERIC(5,2) NOT NULL, -- Rate at time of job (5.0 = 5%)
  commission_amount NUMERIC(10,2) NOT NULL, -- Calculated: job_value * commission_rate / 100
  platform_fee_amount NUMERIC(10,2), -- Standard 10% platform fee from member
  platform_net_amount NUMERIC(10,2), -- What platform keeps after commission
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed', 'canceled')),
  
  -- Payment Tracking
  payout_method TEXT CHECK (payout_method IN ('stripe_connect', 'ach_transfer', 'check', 'platform_credit')),
  payout_reference TEXT, -- Stripe transfer ID, check number, etc.
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_external_contractor ON referral_commissions(external_contractor_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_job ON referral_commissions(job_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);

-- =====================================================================================
-- UPDATE sub_opportunities TABLE (Add External Referral Tracking)
-- =====================================================================================

-- Add columns to track external referrals
ALTER TABLE sub_opportunities 
  ADD COLUMN IF NOT EXISTS is_external_referral BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_contractor_id UUID REFERENCES external_contractors(id),
  ADD COLUMN IF NOT EXISTS referral_source_notes TEXT, -- "Submitted via mobile form on 2025-11-06"
  ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES profiles(id); -- PM assigned to handle client liaison

-- Add index for external referrals
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_external_referral ON sub_opportunities(is_external_referral) WHERE is_external_referral = true;
CREATE INDEX IF NOT EXISTS idx_sub_opportunities_external_contractor ON sub_opportunities(external_contractor_id);

-- =====================================================================================
-- TRIGGER: Update external_contractors.updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_external_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_external_contractors_updated_at
  BEFORE UPDATE ON external_contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_external_contractors_updated_at();

-- =====================================================================================
-- TRIGGER: Update referral_commissions.updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_referral_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_commissions_updated_at
  BEFORE UPDATE ON referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_commissions_updated_at();

-- =====================================================================================
-- FUNCTION: Create External Contractor Account
-- =====================================================================================
-- Called during signup process (Stripe webhook after successful subscription)
-- No software integration required - they just need form access
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_external_contractor_account(
  p_email TEXT,
  p_business_name TEXT,
  p_contact_name TEXT,
  p_phone TEXT,
  p_subscription_tier TEXT,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_primary_software TEXT DEFAULT NULL, -- Optional: track what they currently use
  p_custom_slug TEXT DEFAULT NULL -- Optional: for Premium Partners
)
RETURNS UUID AS $$
DECLARE
  v_contractor_id UUID;
  v_commission_rate NUMERIC(5,2);
BEGIN
  -- Get commission rate for this tier
  SELECT referral_commission_rate INTO v_commission_rate
  FROM subscription_tiers
  WHERE tier_id = p_subscription_tier;

  -- Create external contractor record (NO software integration needed)
  INSERT INTO external_contractors (
    id, email, business_name, contact_name, phone,
    subscription_tier, referral_commission_rate,
    stripe_customer_id, stripe_subscription_id,
    primary_job_management_software, custom_referral_slug
  ) VALUES (
    gen_random_uuid(), p_email, p_business_name, p_contact_name, p_phone,
    p_subscription_tier, v_commission_rate,
    p_stripe_customer_id, p_stripe_subscription_id,
    p_primary_software, -- Just for our internal tracking, doesn't affect functionality
    p_custom_slug -- For Premium Partners: nick-thompson → nick-thompson.constructivedesigns.com/refer
  )
  RETURNING id INTO v_contractor_id;

  RETURN v_contractor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Submit External Lead (Called from Mobile Form)
-- =====================================================================================

CREATE OR REPLACE FUNCTION submit_external_lead(
  p_external_contractor_id UUID,
  p_project_location TEXT,
  p_project_timeline TEXT,
  p_estimated_duration TEXT,
  p_estimated_pay NUMERIC(10,2),
  p_project_notes TEXT,
  p_client_name TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_tier_max_leads INTEGER;
  v_current_active_leads INTEGER;
BEGIN
  -- Check if external contractor has reached their monthly limit
  SELECT max_active_referrals INTO v_tier_max_leads
  FROM subscription_tiers st
  JOIN external_contractors ec ON ec.subscription_tier = st.tier_id
  WHERE ec.id = p_external_contractor_id;

  -- Count current active referrals (not completed/canceled)
  SELECT COUNT(*) INTO v_current_active_leads
  FROM sub_opportunities
  WHERE external_contractor_id = p_external_contractor_id
    AND is_external_referral = true
    AND status NOT IN ('completed', 'canceled');

  -- If tier has limit and they've reached it, reject submission
  IF v_tier_max_leads IS NOT NULL AND v_current_active_leads >= v_tier_max_leads THEN
    RAISE EXCEPTION 'Monthly lead submission limit reached (% leads). Upgrade your tier for more capacity.', v_tier_max_leads;
  END IF;

  -- Create job opportunity (enters "recycle bin" for PM review)
  INSERT INTO sub_opportunities (
    id,
    title,
    description,
    location,
    estimated_budget,
    timeline,
    status,
    is_external_referral,
    external_contractor_id,
    referral_source_notes,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'External Referral: ' || p_project_location,
    p_project_notes || E'\n\nTimeline: ' || p_project_timeline || E'\nDuration: ' || p_estimated_duration,
    p_project_location,
    p_estimated_pay,
    p_project_timeline,
    'pending_pm_review', -- PM must review before making available to members
    true,
    p_external_contractor_id,
    'Submitted via mobile form on ' || NOW()::DATE,
    NOW()
  )
  RETURNING id INTO v_job_id;

  -- Update external contractor stats
  UPDATE external_contractors
  SET 
    total_leads_submitted = total_leads_submitted + 1,
    last_lead_submitted_at = NOW()
  WHERE id = p_external_contractor_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Create Referral Commission (Called when job completes)
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_referral_commission(
  p_job_id UUID,
  p_final_job_value NUMERIC(10,2)
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_external_contractor_id UUID;
  v_commission_rate NUMERIC(5,2);
  v_commission_amount NUMERIC(10,2);
  v_platform_fee NUMERIC(10,2);
  v_platform_net NUMERIC(10,2);
BEGIN
  -- Get external contractor and commission rate from job
  SELECT 
    external_contractor_id,
    ec.referral_commission_rate
  INTO 
    v_external_contractor_id,
    v_commission_rate
  FROM sub_opportunities so
  JOIN external_contractors ec ON ec.id = so.external_contractor_id
  WHERE so.id = p_job_id
    AND so.is_external_referral = true;

  -- If not an external referral, exit
  IF v_external_contractor_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate amounts
  v_commission_amount := p_final_job_value * v_commission_rate / 100;
  v_platform_fee := p_final_job_value * 10 / 100; -- Standard 10% platform fee
  v_platform_net := v_platform_fee - v_commission_amount; -- What platform keeps after paying commission

  -- Create commission record
  INSERT INTO referral_commissions (
    id,
    external_contractor_id,
    job_id,
    job_value,
    commission_rate,
    commission_amount,
    platform_fee_amount,
    platform_net_amount,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_external_contractor_id,
    p_job_id,
    p_final_job_value,
    v_commission_rate,
    v_commission_amount,
    v_platform_fee,
    v_platform_net,
    'pending', -- Requires approval before payout
    NOW()
  )
  RETURNING id INTO v_commission_id;

  -- Update external contractor stats
  UPDATE external_contractors
  SET 
    total_leads_completed = total_leads_completed + 1,
    total_referral_earnings = total_referral_earnings + v_commission_amount,
    avg_lead_value = (total_referral_earnings + v_commission_amount) / (total_leads_completed + 1),
    completion_rate = ((total_leads_completed + 1)::NUMERIC / total_leads_submitted::NUMERIC) * 100,
    last_commission_earned_at = NOW()
  WHERE id = v_external_contractor_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Approve and Pay Commission
-- =====================================================================================

CREATE OR REPLACE FUNCTION approve_and_pay_commission(
  p_commission_id UUID,
  p_payout_method TEXT,
  p_payout_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE referral_commissions
  SET 
    status = 'paid',
    payout_method = p_payout_method,
    payout_reference = p_payout_reference,
    paid_at = NOW()
  WHERE id = p_commission_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get External Contractor Dashboard Stats
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_external_contractor_stats(p_contractor_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'business_name', ec.business_name,
    'subscription_tier', st.tier_name,
    'monthly_price', st.monthly_price,
    'commission_rate', ec.referral_commission_rate,
    'total_leads_submitted', ec.total_leads_submitted,
    'total_leads_completed', ec.total_leads_completed,
    'total_earnings', ec.total_referral_earnings,
    'avg_lead_value', ec.avg_lead_value,
    'completion_rate', ec.completion_rate,
    'active_leads', (
      SELECT COUNT(*)
      FROM sub_opportunities
      WHERE external_contractor_id = p_contractor_id
        AND is_external_referral = true
        AND status NOT IN ('completed', 'canceled')
    ),
    'pending_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM referral_commissions
      WHERE external_contractor_id = p_contractor_id
        AND status = 'pending'
    ),
    'paid_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM referral_commissions
      WHERE external_contractor_id = p_contractor_id
        AND status = 'paid'
    ),
    'recent_leads', (
      SELECT json_agg(
        json_build_object(
          'id', so.id,
          'title', so.title,
          'location', so.location,
          'budget', so.estimated_budget,
          'status', so.status,
          'submitted_at', so.created_at
        )
      )
      FROM sub_opportunities so
      WHERE so.external_contractor_id = p_contractor_id
        AND so.is_external_referral = true
      ORDER BY so.created_at DESC
      LIMIT 10
    ),
    'recent_commissions', (
      SELECT json_agg(
        json_build_object(
          'id', rc.id,
          'job_value', rc.job_value,
          'commission_amount', rc.commission_amount,
          'status', rc.status,
          'earned_at', rc.created_at,
          'paid_at', rc.paid_at
        )
      )
      FROM referral_commissions rc
      WHERE rc.external_contractor_id = p_contractor_id
      ORDER BY rc.created_at DESC
      LIMIT 10
    )
  ) INTO v_stats
  FROM external_contractors ec
  JOIN subscription_tiers st ON st.tier_id = ec.subscription_tier
  WHERE ec.id = p_contractor_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- RLS POLICIES
-- =====================================================================================

-- External contractors can only see their own data
ALTER TABLE external_contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External contractors can view own profile"
  ON external_contractors FOR SELECT
  USING (id = auth.uid()::UUID); -- Assumes external contractors have Supabase auth accounts

CREATE POLICY "External contractors can update own profile"
  ON external_contractors FOR UPDATE
  USING (id = auth.uid()::UUID)
  WITH CHECK (id = auth.uid()::UUID);

-- Referral commissions visibility
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External contractors can view own commissions"
  ON referral_commissions FOR SELECT
  USING (external_contractor_id = auth.uid()::UUID);

-- External referral jobs visibility
CREATE POLICY "External contractors can view own referrals"
  ON sub_opportunities FOR SELECT
  USING (is_external_referral = true AND external_contractor_id = auth.uid()::UUID);

-- =====================================================================================
-- EXAMPLE USAGE
-- =====================================================================================

-- Example 1: Create external contractor account (called from Stripe webhook)
/*
SELECT create_external_contractor_account(
  'nick@thompsonconstruction.com',
  'Thompson Construction',
  'Nick Thompson',
  '206-555-0123',
  'overflow_partner',
  'cus_stripe123',
  'sub_stripe456',
  'HouseCall Pro'
);
*/

-- Example 2: Submit lead via mobile form
/*
SELECT submit_external_lead(
  '550e8400-e29b-41d4-a716-446655440000', -- external_contractor_id
  'Spokane, WA',
  'ASAP - ideally start next week',
  '2-3 weeks estimated',
  8000.00,
  'Full bathroom remodel. Master bath. Wants tile shower, new vanity, toilet, and fixtures. Client name is Sarah, she is ready to go.',
  'Sarah Johnson',
  '509-555-0199',
  'sarah.j@email.com'
);
*/

-- Example 3: Job completes, create commission
/*
SELECT create_referral_commission(
  '660e8400-e29b-41d4-a716-446655440000', -- job_id
  7800.00 -- final_job_value
);
*/

-- Example 4: Get dashboard stats
/*
SELECT get_external_contractor_stats('550e8400-e29b-41d4-a716-446655440000');
*/

-- =====================================================================================
-- END OF SCHEMA
-- =====================================================================================

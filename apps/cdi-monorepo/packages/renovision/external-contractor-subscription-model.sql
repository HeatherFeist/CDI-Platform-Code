-- =====================================================
-- EXTERNAL CONTRACTOR SUBSCRIPTION MODEL
-- =====================================================
-- Purpose: Allow non-member contractors (like Nick) to pay subscription
-- to submit overflow jobs to network WITHOUT full member access
--
-- Strategy: Keep them as PAYING CUSTOMERS instead of converting to members
-- - They get problem solved (overflow handled)
-- - Our members get work without competing with pros
-- - We get recurring revenue
-- - They can upgrade to full member anytime
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: unified-profiles-schema.sql

-- =====================================================
-- EXTERNAL CONTRACTOR ACCOUNTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS external_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info (No full profile needed)
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Subscription Status
  subscription_tier TEXT CHECK (subscription_tier IN (
    'overflow_partner', -- $29/mo - submit overflow jobs
    'lead_salvage',     -- $49/mo - overflow + HouseCall Pro integration
    'premium_partner'   -- $99/mo - overflow + lead salvage + priority routing
  )) DEFAULT 'overflow_partner',
  
  subscription_status TEXT CHECK (subscription_status IN (
    'active', 'paused', 'cancelled', 'past_due'
  )) DEFAULT 'active',
  
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Usage Tracking
  jobs_submitted_count INTEGER DEFAULT 0,
  jobs_completed_count INTEGER DEFAULT 0,
  total_referral_earnings NUMERIC(10,2) DEFAULT 0.00,
  
  -- Integration Keys (for HouseCall Pro, JobNimbus, etc.)
  housecall_pro_id TEXT UNIQUE,
  housecall_pro_webhook_secret TEXT,
  jobnimbus_api_key TEXT,
  
  -- Referral Settings
  referral_commission_rate NUMERIC(5,2) DEFAULT 10.00, -- 10% default
  auto_send_cold_leads BOOLEAN DEFAULT false, -- HC Pro integration
  
  -- Access Control
  can_view_member_profiles BOOLEAN DEFAULT false, -- Restricted by default
  can_post_to_job_board BOOLEAN DEFAULT true,
  can_receive_applications BOOLEAN DEFAULT true,
  
  -- Account Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  last_job_submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Upgrade Path
  invited_to_full_membership BOOLEAN DEFAULT false,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_code TEXT,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- REFERRAL COMMISSIONS TABLE
-- =====================================================
-- Track commission earnings from referred jobs

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  external_contractor_id UUID REFERENCES external_contractors(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES sub_opportunities(id) ON DELETE CASCADE NOT NULL,
  
  -- Commission Details
  job_value NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL, -- Percentage (10.00 = 10%)
  commission_amount NUMERIC(10,2) NOT NULL,
  
  -- Payment Status
  status TEXT CHECK (status IN (
    'pending',    -- Job completed, commission calculated
    'approved',   -- Ready for payout
    'paid',       -- Paid to contractor
    'disputed'    -- Issue with commission
  )) DEFAULT 'pending',
  
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- 'stripe', 'check', 'direct_deposit'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT positive_amounts CHECK (job_value > 0 AND commission_amount > 0)
);

-- =====================================================
-- SUBSCRIPTION TIER PRICING
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_name TEXT PRIMARY KEY,
  monthly_price NUMERIC(10,2) NOT NULL,
  annual_price NUMERIC(10,2),
  
  -- Features
  jobs_per_month INTEGER, -- NULL = unlimited
  can_receive_cold_leads BOOLEAN DEFAULT false,
  priority_routing BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  
  -- Referral Benefits
  referral_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed subscription tiers
INSERT INTO subscription_tiers (
  tier_name, monthly_price, annual_price,
  jobs_per_month, can_receive_cold_leads, priority_routing,
  referral_commission_rate, description
) VALUES
(
  'overflow_partner',
  29.00,
  290.00, -- Save $58/year
  NULL, -- Unlimited
  false,
  false,
  10.00,
  'Submit unlimited overflow jobs to verified network members. Earn 10% commission on completed jobs.'
),
(
  'lead_salvage',
  49.00,
  490.00,
  NULL,
  true, -- HouseCall Pro integration
  false,
  12.00, -- Higher commission
  'Everything in Overflow Partner PLUS automatic cold lead routing from HouseCall Pro. Earn 12% commission.'
),
(
  'premium_partner',
  99.00,
  990.00,
  NULL,
  true,
  true, -- Priority routing (your jobs filled faster)
  15.00, -- Highest commission
  'Everything in Lead Salvage PLUS priority job routing, analytics dashboard, and API access. Earn 15% commission.'
)
ON CONFLICT (tier_name) DO NOTHING;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Create external contractor account (signup flow)
CREATE OR REPLACE FUNCTION create_external_contractor_account(
  p_business_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_subscription_tier TEXT DEFAULT 'overflow_partner'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_contractor_id UUID;
  v_tier_price NUMERIC;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM external_contractors WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'email_exists',
      'message', 'An account with this email already exists'
    );
  END IF;
  
  -- Get tier price
  SELECT monthly_price INTO v_tier_price
  FROM subscription_tiers
  WHERE tier_name = p_subscription_tier;
  
  -- Create account
  INSERT INTO external_contractors (
    business_name,
    contact_name,
    email,
    phone,
    subscription_tier,
    subscription_started_at
  ) VALUES (
    p_business_name,
    p_contact_name,
    p_email,
    p_phone,
    p_subscription_tier,
    NOW()
  )
  RETURNING id INTO v_contractor_id;
  
  RETURN json_build_object(
    'success', true,
    'contractor_id', v_contractor_id,
    'subscription_tier', p_subscription_tier,
    'monthly_price', v_tier_price,
    'message', format('Welcome! Your %s subscription is active.', 
      REPLACE(p_subscription_tier, '_', ' ')
    ),
    'next_steps', json_build_array(
      'Submit your first overflow job',
      'Connect HouseCall Pro (optional)',
      'Review commission structure'
    )
  );
END;
$$;

-- Calculate and create referral commission when job completes
CREATE OR REPLACE FUNCTION create_referral_commission(
  p_job_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_job RECORD;
  v_contractor RECORD;
  v_commission_amount NUMERIC;
  v_commission_id UUID;
BEGIN
  -- Get job details
  SELECT 
    so.*,
    COALESCE(so.pay_amount, 0) as job_value
  INTO v_job
  FROM sub_opportunities so
  WHERE id = p_job_id;
  
  -- Check if job is from external contractor
  IF v_job.is_external_contractor = false OR v_job.external_contractor_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_external_job',
      'message', 'This job is not from an external contractor'
    );
  END IF;
  
  -- Get external contractor
  SELECT * INTO v_contractor
  FROM external_contractors
  WHERE email = v_job.external_contractor_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'contractor_not_found',
      'message', 'External contractor account not found'
    );
  END IF;
  
  -- Calculate commission
  v_commission_amount := v_job.job_value * (v_contractor.referral_commission_rate / 100);
  
  -- Create commission record
  INSERT INTO referral_commissions (
    external_contractor_id,
    job_id,
    job_value,
    commission_rate,
    commission_amount,
    status
  ) VALUES (
    v_contractor.id,
    p_job_id,
    v_job.job_value,
    v_contractor.referral_commission_rate,
    v_commission_amount,
    'pending'
  )
  RETURNING id INTO v_commission_id;
  
  -- Update contractor's total earnings
  UPDATE external_contractors
  SET total_referral_earnings = total_referral_earnings + v_commission_amount
  WHERE id = v_contractor.id;
  
  RETURN json_build_object(
    'success', true,
    'commission_id', v_commission_id,
    'job_value', v_job.job_value,
    'commission_rate', v_contractor.referral_commission_rate,
    'commission_amount', v_commission_amount,
    'status', 'pending',
    'message', format('Commission of $%.2f calculated and pending approval', v_commission_amount)
  );
END;
$$;

-- Get contractor dashboard stats
CREATE OR REPLACE FUNCTION get_external_contractor_stats(
  p_contractor_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'subscription', json_build_object(
      'tier', ec.subscription_tier,
      'status', ec.subscription_status,
      'started_at', ec.subscription_started_at
    ),
    'usage', json_build_object(
      'jobs_submitted', ec.jobs_submitted_count,
      'jobs_completed', ec.jobs_completed_count,
      'completion_rate', CASE 
        WHEN ec.jobs_submitted_count > 0 
        THEN ROUND((ec.jobs_completed_count::NUMERIC / ec.jobs_submitted_count) * 100, 1)
        ELSE 0
      END
    ),
    'earnings', json_build_object(
      'total_earned', ec.total_referral_earnings,
      'pending_commissions', (
        SELECT COALESCE(SUM(commission_amount), 0)
        FROM referral_commissions
        WHERE external_contractor_id = ec.id
        AND status = 'pending'
      ),
      'paid_commissions', (
        SELECT COALESCE(SUM(commission_amount), 0)
        FROM referral_commissions
        WHERE external_contractor_id = ec.id
        AND status = 'paid'
      ),
      'commission_rate', ec.referral_commission_rate
    ),
    'recent_jobs', (
      SELECT json_agg(
        json_build_object(
          'job_id', so.id,
          'location', so.job_location,
          'pay', so.pay_amount,
          'status', so.status,
          'submitted_at', so.created_at
        )
        ORDER BY so.created_at DESC
      )
      FROM sub_opportunities so
      WHERE so.external_contractor_email = ec.email
      LIMIT 5
    )
  )
  INTO v_stats
  FROM external_contractors ec
  WHERE ec.id = p_contractor_id;
  
  RETURN v_stats;
END;
$$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_contractors_email ON external_contractors(email);
CREATE INDEX IF NOT EXISTS idx_external_contractors_subscription_status ON external_contractors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_external_contractors_stripe_customer ON external_contractors(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_contractor ON referral_commissions(external_contractor_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE external_contractors ENABLE ROW LEVEL SECURITY;

-- External contractors can view their own account
DROP POLICY IF EXISTS "Contractors can view own account" ON external_contractors;
CREATE POLICY "Contractors can view own account" ON external_contractors
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can view all external contractors
DROP POLICY IF EXISTS "Admins can view all external contractors" ON external_contractors;
CREATE POLICY "Admins can view all external contractors" ON external_contractors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own commissions
DROP POLICY IF EXISTS "Contractors can view own commissions" ON referral_commissions;
CREATE POLICY "Contractors can view own commissions" ON referral_commissions
  FOR SELECT USING (
    external_contractor_id IN (
      SELECT id FROM external_contractors
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ External contractor subscription model created
-- ✅ Three subscription tiers with increasing benefits
-- ✅ Referral commission tracking
-- ✅ Upgrade path to full membership available
-- ✅ HouseCall Pro integration ready
-- ✅ Revenue stream #1 activated ($29-99/mo per external contractor)
--
-- NEXT STEPS:
-- 1. Build external contractor signup flow
-- 2. Stripe subscription integration
-- 3. HouseCall Pro webhook receiver
-- 4. Commission payout dashboard
-- 5. Upgrade-to-member flow
-- =====================================================

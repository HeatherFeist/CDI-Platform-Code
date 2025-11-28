-- =====================================================================================
-- MARKETPLACE MENTOR COMMISSION SYSTEM
-- =====================================================================================
-- Enables members to recruit new sellers/buyers and earn 2% commission override
-- Commission paid from donations (members) or subscriptions (non-members)
--
-- Business Model:
-- - Members recruit external sellers/buyers to join the marketplace
-- - Mentor earns 2% lifetime commission from all their recruits' revenue
-- - Revenue sources: member donations (15% default) or non-member subscriptions ($29.99/mo)
-- - Commission paid monthly to mentors
--
-- Project: Marketplace App
-- Run AFTER: add-platform-gratuity-system.sql
-- =====================================================================================

-- =====================================================================================
-- AFFILIATE PARTNERSHIPS TABLE (Mentor-Recruit Relationship)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS affiliate_partnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Partnership Structure
  affiliate_id TEXT UNIQUE NOT NULL, -- af_12345_john_doe (unique tracking code)
  recruiting_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Mentor who recruited them

  -- Recruit Info (can be seller or buyer)
  recruit_type TEXT NOT NULL CHECK (recruit_type IN ('seller', 'buyer')), -- Type of recruit
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,

  -- Tax Info (for 1099 commission payments to mentors)
  mentor_tax_id TEXT, -- Mentor's tax ID for commission payments
  mentor_w9_submitted BOOLEAN DEFAULT false,

  -- Commission Structure (2% lifetime override)
  mentor_commission_rate NUMERIC(5,2) DEFAULT 2.00, -- Always 2%
  commission_source TEXT CHECK (commission_source IN ('donations', 'subscriptions', 'both')), -- Revenue source

  -- Tracking & Attribution
  attribution_cookie_duration_days INTEGER DEFAULT 365, -- 1 year attribution
  total_recruits INTEGER DEFAULT 0,
  total_mentor_earnings NUMERIC(10,2) DEFAULT 0.00,

  -- Status & Metadata
  partnership_status TEXT DEFAULT 'active' CHECK (partnership_status IN ('pending', 'active', 'paused', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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
-- MENTOR COMMISSIONS TABLE (Commission Payments)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS mentor_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationship References
  affiliate_partnership_id UUID REFERENCES affiliate_partnerships(id) ON DELETE CASCADE,
  recruiting_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recruit_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- The recruit's profile

  -- Revenue Source (what generated the commission)
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('donation', 'subscription')),
  revenue_id UUID NOT NULL, -- order_fees.id for donations, subscription record ID for subscriptions
  revenue_amount NUMERIC(10,2) NOT NULL, -- Total revenue amount

  -- Commission Calculation
  commission_rate NUMERIC(5,2) NOT NULL, -- 2.0 = 2%
  commission_amount NUMERIC(10,2) NOT NULL, -- Calculated commission

  -- Payout Tracking
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'paid', 'failed')),
  payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'check', 'stripe')),
  payout_reference TEXT,
  paid_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_commissions_partnership ON mentor_commissions(affiliate_partnership_id);
CREATE INDEX IF NOT EXISTS idx_mentor_commissions_recruiting_member ON mentor_commissions(recruiting_member_id);
CREATE INDEX IF NOT EXISTS idx_mentor_commissions_revenue_type ON mentor_commissions(revenue_type);
CREATE INDEX IF NOT EXISTS idx_mentor_commissions_payout_status ON mentor_commissions(payout_status);

-- =====================================================================================
-- UPDATE profiles TABLE (Add Mentor Tracking)
-- =====================================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES profiles(id), -- Who recruited this member
  ADD COLUMN IF NOT EXISTS mentor_affiliate_id TEXT, -- Link to affiliate_partnerships.affiliate_id
  ADD COLUMN IF NOT EXISTS total_mentor_earnings NUMERIC(10,2) DEFAULT 0.00, -- Lifetime mentor commissions
  ADD COLUMN IF NOT EXISTS mentor_recruits_count INTEGER DEFAULT 0, -- Number of people recruited
  ADD COLUMN IF NOT EXISTS mentor_join_date TIMESTAMPTZ; -- When they became a mentor

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
-- TRIGGER: Update mentor_commissions.updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_mentor_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_commissions_updated_at
  BEFORE UPDATE ON mentor_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_commissions_updated_at();

-- =====================================================================================
-- FUNCTION: Create Mentor Recruitment Invitation
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_mentor_recruitment_invitation(
  p_mentor_id UUID,
  p_recruit_email TEXT,
  p_recruit_type TEXT DEFAULT 'seller',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_affiliate_id TEXT;
  v_mentor_username TEXT;
  v_invitation_link TEXT;
BEGIN
  -- Get mentor's username for affiliate ID
  SELECT username INTO v_mentor_username
  FROM profiles
  WHERE id = p_mentor_id;

  -- Generate unique affiliate ID: af_12345_john_doe
  v_affiliate_id := 'af_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8) || '_' || REPLACE(LOWER(v_mentor_username), ' ', '_');

  -- Generate invitation link
  v_invitation_link := 'https://constructivedesignsmarketplace.com/join/' || v_affiliate_id;

  -- Return invitation details
  RETURN json_build_object(
    'affiliate_id', v_affiliate_id,
    'invitation_link', v_invitation_link,
    'mentor_id', p_mentor_id,
    'mentor_username', v_mentor_username,
    'recruit_type', p_recruit_type,
    'expires_at', NOW() + INTERVAL '30 days',
    'instructions', 'Send this link to potential ' || p_recruit_type || 's. When they sign up, you''ll earn 2% commission from their revenue forever.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Process New Member Signup (Activate Mentor Partnership)
-- =====================================================================================

CREATE OR REPLACE FUNCTION process_mentor_recruitment_signup(
  p_affiliate_id TEXT,
  p_new_member_id UUID,
  p_recruit_type TEXT DEFAULT 'seller'
)
RETURNS UUID AS $$
DECLARE
  v_partnership_id UUID;
  v_mentor_id UUID;
  v_mentor_username TEXT;
BEGIN
  -- Find the mentor from affiliate_id pattern (in production, store this properly)
  -- For now, we'll extract from the affiliate_id format
  SELECT recruiting_member_id INTO v_mentor_id
  FROM affiliate_partnerships
  WHERE affiliate_id = p_affiliate_id
    AND partnership_status = 'pending';

  -- If no pending partnership, this might be a direct signup (no mentor)
  IF v_mentor_id IS NULL THEN
    -- Direct signup - no mentor commission
    UPDATE profiles
    SET mentor_join_date = NOW()
    WHERE id = p_new_member_id;

    RETURN NULL;
  END IF;

  -- Get mentor info
  SELECT username INTO v_mentor_username
  FROM profiles
  WHERE id = v_mentor_id;

  -- Create affiliate partnership record
  INSERT INTO affiliate_partnerships (
    affiliate_id, recruiting_member_id, recruit_type,
    full_name, email, partnership_status, activated_at
  )
  SELECT
    p_affiliate_id, v_mentor_id, p_recruit_type,
    p.full_name, p.email, 'active', NOW()
  FROM profiles p
  WHERE p.id = p_new_member_id
  RETURNING id INTO v_partnership_id;

  -- Update new member's profile
  UPDATE profiles
  SET
    mentor_id = v_mentor_id,
    mentor_affiliate_id = p_affiliate_id,
    mentor_join_date = NOW()
  WHERE id = p_new_member_id;

  -- Update mentor's recruit count
  UPDATE profiles
  SET mentor_recruits_count = mentor_recruits_count + 1
  WHERE id = v_mentor_id;

  -- Update partnership stats
  UPDATE affiliate_partnerships
  SET total_recruits = 1
  WHERE id = v_partnership_id;

  RETURN v_partnership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Calculate Mentor Commission from Donation
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_mentor_commission_from_donation(
  p_order_fee_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_seller_id UUID;
  v_mentor_id UUID;
  v_donation_amount NUMERIC(10,2);
  v_commission_amount NUMERIC(10,2);
BEGIN
  -- Get order fee details
  SELECT
    seller_id,
    platform_donation_amount
  INTO
    v_seller_id,
    v_donation_amount
  FROM order_fees
  WHERE id = p_order_fee_id
    AND payment_status = 'completed'
    AND platform_donation_received = true;

  -- Check if seller has a mentor
  SELECT mentor_id INTO v_mentor_id
  FROM profiles
  WHERE id = v_seller_id
    AND mentor_id IS NOT NULL;

  -- If no mentor, no commission
  IF v_mentor_id IS NULL OR v_donation_amount <= 0 THEN
    RETURN NULL;
  END IF;

  -- Calculate 2% commission
  v_commission_amount := ROUND(v_donation_amount * 2.0 / 100, 2);

  -- Create commission record
  INSERT INTO mentor_commissions (
    affiliate_partnership_id,
    recruiting_member_id,
    recruit_profile_id,
    revenue_type,
    revenue_id,
    revenue_amount,
    commission_rate,
    commission_amount
  )
  SELECT
    ap.id,
    v_mentor_id,
    v_seller_id,
    'donation',
    p_order_fee_id,
    v_donation_amount,
    2.0,
    v_commission_amount
  FROM affiliate_partnerships ap
  WHERE ap.recruiting_member_id = v_mentor_id
    AND ap.recruit_type = 'seller'
    AND ap.partnership_status = 'active'
  RETURNING id INTO v_commission_id;

  -- Update mentor earnings
  UPDATE profiles
  SET total_mentor_earnings = total_mentor_earnings + v_commission_amount
  WHERE id = v_mentor_id;

  -- Update partnership earnings
  UPDATE affiliate_partnerships
  SET total_mentor_earnings = total_mentor_earnings + v_commission_amount
  WHERE recruiting_member_id = v_mentor_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Calculate Mentor Commission from Subscription
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_mentor_commission_from_subscription(
  p_subscription_id TEXT,
  p_amount NUMERIC(10,2),
  p_subscriber_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_mentor_id UUID;
  v_commission_amount NUMERIC(10,2);
BEGIN
  -- Check if subscriber has a mentor
  SELECT mentor_id INTO v_mentor_id
  FROM profiles
  WHERE id = p_subscriber_id
    AND mentor_id IS NOT NULL;

  -- If no mentor, no commission
  IF v_mentor_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate 2% commission from subscription amount
  v_commission_amount := ROUND(p_amount * 2.0 / 100, 2);

  -- Create commission record
  INSERT INTO mentor_commissions (
    affiliate_partnership_id,
    recruiting_member_id,
    recruit_profile_id,
    revenue_type,
    revenue_id,
    revenue_amount,
    commission_rate,
    commission_amount,
    notes
  )
  SELECT
    ap.id,
    v_mentor_id,
    p_subscriber_id,
    'subscription',
    p_subscription_id::UUID,
    p_amount,
    2.0,
    v_commission_amount,
    'Monthly subscription commission'
  FROM affiliate_partnerships ap
  WHERE ap.recruiting_member_id = v_mentor_id
    AND ap.partnership_status = 'active'
  RETURNING id INTO v_commission_id;

  -- Update mentor earnings
  UPDATE profiles
  SET total_mentor_earnings = total_mentor_earnings + v_commission_amount
  WHERE id = v_mentor_id;

  -- Update partnership earnings
  UPDATE affiliate_partnerships
  SET total_mentor_earnings = total_mentor_earnings + v_commission_amount
  WHERE recruiting_member_id = v_mentor_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get Mentor Dashboard Stats
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_mentor_dashboard_stats(p_mentor_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'mentor_id', p_mentor_id,
    'total_recruits', COUNT(ap.id),
    'active_recruits', COUNT(ap.id) FILTER (WHERE ap.partnership_status = 'active'),
    'total_earnings', COALESCE(SUM(ap.total_mentor_earnings), 0),
    'pending_commissions', (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM mentor_commissions
      WHERE recruiting_member_id = p_mentor_id
        AND payout_status = 'pending'
    ),
    'monthly_earnings', (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM mentor_commissions
      WHERE recruiting_member_id = p_mentor_id
        AND created_at >= DATE_TRUNC('month', NOW())
    ),
    'recruits', (
      SELECT json_agg(
        json_build_object(
          'recruit_name', p.full_name,
          'recruit_type', ap.recruit_type,
          'status', ap.partnership_status,
          'earnings_generated', ap.total_mentor_earnings,
          'joined_at', ap.activated_at
        )
      )
      FROM affiliate_partnerships ap
      JOIN profiles p ON p.id = (
        SELECT recruit_profile_id
        FROM mentor_commissions
        WHERE affiliate_partnership_id = ap.id
        LIMIT 1
      )
      WHERE ap.recruiting_member_id = p_mentor_id
      ORDER BY ap.activated_at DESC
    )
  ) INTO v_stats
  FROM affiliate_partnerships ap
  WHERE ap.recruiting_member_id = p_mentor_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- RLS POLICIES FOR MENTOR COMMISSION SYSTEM
-- =====================================================================================

-- Affiliate partnerships policies
ALTER TABLE affiliate_partnerships ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own partnerships
CREATE POLICY "Mentors can view their partnerships"
  ON affiliate_partnerships FOR SELECT
  USING (recruiting_member_id = auth.uid()::UUID);

-- System can manage partnerships (for signup processing)
CREATE POLICY "System can manage partnerships"
  ON affiliate_partnerships FOR ALL
  USING (true); -- Restrict this in production to service role only

-- Mentor commissions policies
ALTER TABLE mentor_commissions ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own commission records
CREATE POLICY "Mentors can view their commissions"
  ON mentor_commissions FOR SELECT
  USING (recruiting_member_id = auth.uid()::UUID);

-- System can manage commissions
CREATE POLICY "System can manage commissions"
  ON mentor_commissions FOR ALL
  USING (true); -- Restrict this in production to service role only

-- Profiles policies (mentor fields)
-- Add to existing profiles RLS policies
CREATE POLICY "Users can view mentor info"
  ON profiles FOR SELECT
  USING (
    -- Users can see their own mentor info
    id = auth.uid()::UUID OR
    -- Mentors can see their recruits
    id IN (
      SELECT recruit_profile_id
      FROM mentor_commissions
      WHERE recruiting_member_id = auth.uid()::UUID
    )
  );

CREATE POLICY "Users can update their own mentor fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid()::UUID)
  WITH CHECK (
    -- Only allow updating mentor-related fields if they're being set by the system
    -- (actual validation happens in functions)
    id = auth.uid()::UUID
  );

-- =====================================================================================
-- EXAMPLE USAGE
-- =====================================================================================

/*
-- Step 1: John recruits Sarah as a seller
SELECT create_mentor_recruitment_invitation(
  '550e8400-e29b-41d4-a716-446655440000', -- John's member ID
  'sarah@handmadesoaps.com',
  'seller',
  'Sarah makes beautiful handmade soaps'
);
-- Returns: { affiliate_id: 'af_a7f8d9e2_john_doe', invitation_link: 'https://...' }

-- Step 2: Sarah signs up using the link
SELECT process_mentor_recruitment_signup(
  'af_a7f8d9e2_john_doe',
  '660e8400-e29b-41d4-a716-446655440001', -- Sarah's new profile ID
  'seller'
);
-- Links Sarah to John as mentor

-- Step 3: Sarah makes a sale with donation
-- (This would be called automatically when order_fees.platform_donation_received = true)
SELECT create_mentor_commission_from_donation(
  '770e8400-e29b-41d4-a716-446655440002' -- order_fee_id
);
-- John gets 2% of the donation amount

-- Step 4: Non-member buyer pays subscription
-- (This would be called when subscription payment succeeds)
SELECT create_mentor_commission_from_subscription(
  'sub_1234567890', -- Stripe subscription ID
  29.99, -- Monthly amount
  '880e8400-e29b-41d4-a716-446655440003' -- Buyer profile ID
);
-- Mentor's commission calculated if buyer was recruited

-- View mentor dashboard
SELECT get_mentor_dashboard_stats('550e8400-e29b-41d4-a716-446655440000');
*/

-- =====================================================================================
-- END OF SCHEMA
-- =====================================================================================
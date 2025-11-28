-- =====================================================================================
-- MARKETPLACE SUBSCRIPTION SYSTEM WITH MENTOR COMMISSIONS
-- =====================================================================================
-- Handles non-member subscriptions ($29.99/month) with mentor commission overrides
-- Integrates with mentor commission system for 2% override payments
--
-- Business Model:
-- - Non-members pay $29.99/month subscription instead of per-transaction donations
-- - Mentors earn 2% commission from their recruits' subscriptions
-- - Uses Stripe for payment processing
--
-- Project: Marketplace App
-- Migration: 010_subscription_system.sql
-- =====================================================================================

-- =====================================================================================
-- SUBSCRIPTIONS TABLE (Non-member Monthly Payments)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS marketplace_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Subscriber Info
  subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscriber_email TEXT NOT NULL,

  -- Subscription Details
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),

  -- Pricing (current $25/month for non-members)
  price_per_month NUMERIC(10,2) DEFAULT 25.00,
  currency TEXT DEFAULT 'usd',

  -- Billing Cycle
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial Period (if applicable)
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_subscriptions_subscriber ON marketplace_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_subscriptions_stripe ON marketplace_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_subscriptions_status ON marketplace_subscriptions(status);

-- =====================================================================================
-- SUBSCRIPTION PAYMENTS TABLE (Payment History)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Subscription Reference
  subscription_id UUID REFERENCES marketplace_subscriptions(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Payment Details
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),

  -- Billing Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failure_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscriber ON subscription_payments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- =====================================================================================
-- TRIGGER: Update subscription updated_at
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_marketplace_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_subscriptions_updated_at
  BEFORE UPDATE ON marketplace_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_subscriptions_updated_at();

-- =====================================================================================
-- FUNCTION: Process Successful Subscription Payment
-- =====================================================================================

CREATE OR REPLACE FUNCTION process_subscription_payment_success(
  p_stripe_subscription_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_amount NUMERIC(10,2),
  p_currency TEXT DEFAULT 'usd',
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_subscription_id UUID;
  v_subscriber_id UUID;
BEGIN
  -- Get subscription details
  SELECT id, subscriber_id INTO v_subscription_id, v_subscriber_id
  FROM marketplace_subscriptions
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found: %', p_stripe_subscription_id;
  END IF;

  -- Record the payment
  INSERT INTO subscription_payments (
    subscription_id,
    subscriber_id,
    stripe_payment_intent_id,
    amount,
    currency,
    status,
    period_start,
    period_end,
    processed_at
  ) VALUES (
    v_subscription_id,
    v_subscriber_id,
    p_stripe_payment_intent_id,
    p_amount,
    p_currency,
    'succeeded',
    p_period_start,
    p_period_end,
    NOW()
  )
  RETURNING id INTO v_payment_id;

  -- Update subscription last payment
  UPDATE marketplace_subscriptions
  SET last_payment_at = NOW()
  WHERE id = v_subscription_id;

  -- Process mentor commission (2% of subscription amount)
  PERFORM create_mentor_commission_from_subscription(
    p_stripe_payment_intent_id,
    p_amount,
    v_subscriber_id
  );

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Create/Update Subscription from Stripe Webhook
-- =====================================================================================

CREATE OR REPLACE FUNCTION sync_subscription_from_stripe(
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_subscriber_email TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN DEFAULT false,
  p_canceled_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_start TIMESTAMPTZ DEFAULT NULL,
  p_trial_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_subscriber_id UUID;
BEGIN
  -- Find subscriber by email
  SELECT id INTO v_subscriber_id
  FROM profiles
  WHERE email = p_subscriber_email;

  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'Subscriber not found: %', p_subscriber_email;
  END IF;

  -- Insert or update subscription
  INSERT INTO marketplace_subscriptions (
    subscriber_id,
    subscriber_email,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    trial_start,
    trial_end
  ) VALUES (
    v_subscriber_id,
    p_subscriber_email,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_canceled_at,
    p_trial_start,
    p_trial_end
  )
  ON CONFLICT (stripe_subscription_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at = EXCLUDED.canceled_at,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  -- Update profile subscription status
  UPDATE profiles
  SET
    non_member_subscription_active = (p_status = 'active'),
    non_member_subscription_id = p_stripe_subscription_id,
    non_member_subscription_started_at = CASE WHEN p_status = 'active' THEN COALESCE(non_member_subscription_started_at, NOW()) ELSE non_member_subscription_started_at END,
    non_member_subscription_expires_at = p_current_period_end
  WHERE id = v_subscriber_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: Get Subscription Dashboard for Non-member
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_subscription_dashboard(p_subscriber_id UUID)
RETURNS JSON AS $$
DECLARE
  v_dashboard JSON;
BEGIN
  SELECT json_build_object(
    'subscription_active', ms.status = 'active',
    'current_period_end', ms.current_period_end,
    'next_payment', ms.next_payment_at,
    'price_per_month', ms.price_per_month,
    'status', ms.status,
    'cancel_at_period_end', ms.cancel_at_period_end,
    'payment_history', (
      SELECT json_agg(
        json_build_object(
          'amount', sp.amount,
          'status', sp.status,
          'period_start', sp.period_start,
          'period_end', sp.period_end,
          'processed_at', sp.processed_at
        )
      )
      FROM subscription_payments sp
      WHERE sp.subscription_id = ms.id
      ORDER BY sp.processed_at DESC
      LIMIT 12
    )
  ) INTO v_dashboard
  FROM marketplace_subscriptions ms
  WHERE ms.subscriber_id = p_subscriber_id
    AND ms.status IN ('active', 'trialing', 'past_due');

  RETURN v_dashboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- RLS POLICIES
-- =====================================================================================

-- Subscribers can view their own subscriptions
ALTER TABLE marketplace_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view their subscriptions"
  ON marketplace_subscriptions FOR SELECT
  USING (subscriber_id = auth.uid()::UUID);

-- System can manage subscriptions
CREATE POLICY "System can manage subscriptions"
  ON marketplace_subscriptions FOR ALL
  USING (true); -- Restrict this in production to service role only

-- Subscribers can view their payment history
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view their payments"
  ON subscription_payments FOR SELECT
  USING (subscriber_id = auth.uid()::UUID);

-- System can manage payments
CREATE POLICY "System can manage payments"
  ON subscription_payments FOR ALL
  USING (true); -- Restrict this in production to service role only
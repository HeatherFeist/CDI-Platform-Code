-- ====================================================================
-- TAX-EXEMPT NONPROFIT VOLUNTARY DONATION SYSTEM
-- ====================================================================
-- CRITICAL: All fees for MEMBERS are 100% VOLUNTARY donations/tips
-- Outside users have option to join (making their fees voluntary too)
-- This ensures strict compliance with 501(c)(3) tax-exempt status
-- ====================================================================

-- User membership tiers
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- 'Member', 'Outside User'
    description TEXT,
    
    -- Pricing structure
    monthly_fee DECIMAL(10,2) DEFAULT 0, -- $0 for members, market rate for outside users
    annual_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Features
    features JSONB DEFAULT '[]', -- Array of feature descriptions
    
    -- Voluntary donation settings
    is_nonprofit_member BOOLEAN DEFAULT false, -- TRUE = all fees are voluntary
    default_tip_percentage DECIMAL(5,2) DEFAULT 15.00, -- Default 15% suggested tip
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User membership status
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    tier_id UUID REFERENCES membership_tiers(id),
    
    -- Membership status
    status TEXT DEFAULT 'active', -- 'active', 'pending', 'cancelled'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Voluntary donation preferences
    has_acknowledged_voluntary BOOLEAN DEFAULT false, -- Acknowledged donations are voluntary
    custom_tip_percentage DECIMAL(5,2), -- User can override default 15%
    
    -- Outside user conversion tracking
    was_outside_user BOOLEAN DEFAULT false,
    converted_to_member_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction records with voluntary donation tracking
CREATE TABLE IF NOT EXISTS donation_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Transaction details
    transaction_type TEXT NOT NULL, -- 'service_payment', 'marketplace_purchase', 'subscription', 'direct_donation'
    related_id UUID, -- Project ID, product ID, etc.
    
    -- Base amounts
    base_amount DECIMAL(10,2) NOT NULL, -- Service/product cost
    tip_percentage DECIMAL(5,2) DEFAULT 15.00,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Voluntary status
    is_member BOOLEAN DEFAULT false, -- Was user a member at time of transaction?
    is_voluntary BOOLEAN DEFAULT false, -- TRUE for member transactions
    user_acknowledged_voluntary BOOLEAN DEFAULT false, -- User confirmed understanding
    
    -- Payment details
    payment_method TEXT, -- 'paypal', 'cashapp', 'check', 'cash'
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_reference TEXT, -- PayPal transaction ID, etc.
    
    -- Tax documentation
    is_tax_deductible BOOLEAN DEFAULT false, -- Members can deduct as charitable donation
    tax_receipt_sent BOOLEAN DEFAULT false,
    tax_receipt_sent_at TIMESTAMPTZ,
    
    -- Metadata
    description TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Voluntary acknowledgment log (for audit trail)
CREATE TABLE IF NOT EXISTS voluntary_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- What they acknowledged
    acknowledgment_type TEXT NOT NULL, -- 'initial_signup', 'first_payment', 'annual_renewal', 'outside_to_member'
    acknowledgment_text TEXT NOT NULL, -- Exact text they agreed to
    
    -- Legal compliance
    ip_address TEXT,
    user_agent TEXT,
    
    acknowledged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tier ON user_memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_user ON donation_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_type ON donation_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_status ON donation_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_voluntary ON donation_transactions(is_voluntary);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_created ON donation_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_acknowledgments_user ON voluntary_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_type ON voluntary_acknowledgments(acknowledgment_type);

-- ====================================================================
-- SEED MEMBERSHIP TIERS
-- ====================================================================

INSERT INTO membership_tiers (name, description, monthly_fee, annual_fee, is_nonprofit_member, default_tip_percentage, features) VALUES
(
    'Nonprofit Member',
    'Join our mission! All contributions are 100% voluntary donations to support our nonprofit work.',
    0.00, -- No mandatory fees
    0.00,
    true, -- Nonprofit member = voluntary
    15.00, -- Default 15% suggested tip
    '[
        "100% voluntary contributions",
        "Tax-deductible donations",
        "Full platform access",
        "AI design tools",
        "Marketplace access",
        "Project management",
        "Community directory",
        "Priority support",
        "Supporting our mission"
    ]'::jsonb
),
(
    'Outside User',
    'Use our platform with standard service fees. Join as a member anytime to make all fees voluntary!',
    29.99, -- Standard monthly rate
    299.99, -- Standard annual rate (2 months free)
    false, -- Not a nonprofit member
    15.00, -- Same 15% default
    '[
        "Full platform access",
        "AI design tools",
        "Marketplace access",
        "Project management",
        "Standard support",
        "Option to join as member (fees become voluntary!)"
    ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- HELPER FUNCTIONS
-- ====================================================================

-- Calculate total with voluntary tip
CREATE OR REPLACE FUNCTION calculate_transaction_total(
    p_base_amount DECIMAL,
    p_tip_percentage DECIMAL
) RETURNS TABLE (
    base_amount DECIMAL,
    tip_percentage DECIMAL,
    tip_amount DECIMAL,
    total_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_base_amount,
        p_tip_percentage,
        ROUND(p_base_amount * (p_tip_percentage / 100), 2) as calculated_tip,
        ROUND(p_base_amount + (p_base_amount * (p_tip_percentage / 100)), 2) as calculated_total;
END;
$$ LANGUAGE plpgsql;

-- Check if user is a member (voluntary donation status)
CREATE OR REPLACE FUNCTION is_user_nonprofit_member(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_member BOOLEAN;
BEGIN
    SELECT mt.is_nonprofit_member INTO v_is_member
    FROM user_memberships um
    JOIN membership_tiers mt ON um.tier_id = mt.id
    WHERE um.user_id = p_user_id
      AND um.status = 'active';
    
    RETURN COALESCE(v_is_member, false);
END;
$$ LANGUAGE plpgsql;

-- Get user's current tip percentage (custom or default)
CREATE OR REPLACE FUNCTION get_user_tip_percentage(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_tip_percentage DECIMAL;
BEGIN
    SELECT 
        COALESCE(um.custom_tip_percentage, mt.default_tip_percentage, 15.00)
    INTO v_tip_percentage
    FROM user_memberships um
    JOIN membership_tiers mt ON um.tier_id = mt.id
    WHERE um.user_id = p_user_id
      AND um.status = 'active';
    
    RETURN COALESCE(v_tip_percentage, 15.00);
END;
$$ LANGUAGE plpgsql;

-- Log voluntary acknowledgment
CREATE OR REPLACE FUNCTION log_voluntary_acknowledgment(
    p_user_id UUID,
    p_type TEXT,
    p_text TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_ack_id UUID;
BEGIN
    INSERT INTO voluntary_acknowledgments (
        user_id,
        acknowledgment_type,
        acknowledgment_text,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_type,
        p_text,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_ack_id;
    
    -- Update user membership to mark as acknowledged
    UPDATE user_memberships
    SET has_acknowledged_voluntary = true
    WHERE user_id = p_user_id;
    
    RETURN v_ack_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- DISABLE RLS (Nonprofit Security Approach)
-- ====================================================================

ALTER TABLE membership_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE voluntary_acknowledgments DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

SELECT 
    '✅ Membership System Created' as status,
    COUNT(*) as tier_count
FROM membership_tiers;

SELECT 
    '✅ Tiers' as info,
    name,
    monthly_fee,
    is_nonprofit_member,
    default_tip_percentage
FROM membership_tiers
ORDER BY is_nonprofit_member DESC;

-- ====================================================================
-- COMPLIANCE NOTES
-- ====================================================================

COMMENT ON TABLE donation_transactions IS 'All transactions with clear voluntary status for tax-exempt compliance. Member transactions are 100% voluntary donations.';
COMMENT ON COLUMN donation_transactions.is_voluntary IS 'TRUE for nonprofit members - ensures IRS compliance that all contributions are voluntary';
COMMENT ON COLUMN donation_transactions.is_tax_deductible IS 'Voluntary donations from members are tax-deductible charitable contributions';
COMMENT ON TABLE voluntary_acknowledgments IS 'Audit trail proving users acknowledged voluntary nature of contributions (IRS requirement)';

-- ====================================================================
-- READY! 🎉
-- ====================================================================

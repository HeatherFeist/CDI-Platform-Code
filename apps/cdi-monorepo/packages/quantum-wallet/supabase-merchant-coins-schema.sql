-- =====================================================
-- ENHANCED MERCHANT COINS SYSTEM
-- Supports: Marketplace Loyalty + Turnkey Business Crowdfunding
-- =====================================================

-- =====================================================
-- MERCHANT COINS CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_coins_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Branding
    coin_name TEXT DEFAULT 'Coins', -- e.g., "HeatherCoins", "BakeryBucks"
    coin_symbol TEXT DEFAULT '🪙', -- Custom emoji or icon
    brand_color TEXT DEFAULT '#6366f1', -- Hex color for UI
    logo_url TEXT,
    
    -- Business Info
    business_name TEXT,
    business_type TEXT, -- 'marketplace_seller', 'turnkey_business', 'crowdfunding'
    business_status TEXT DEFAULT 'active' CHECK (business_status IN ('planning', 'fundraising', 'active', 'suspended')),
    
    -- Earning Rules
    earn_rate DECIMAL(10,4) DEFAULT 1.0, -- Coins per dollar spent (e.g., 1 coin per $1)
    earn_rate_multipliers JSONB DEFAULT '{}', -- Special events, VIP tiers
    
    -- Redemption Rules
    redemption_rate DECIMAL(10,4) DEFAULT 0.01, -- Dollar value per coin (e.g., 100 coins = $1)
    min_redemption INTEGER DEFAULT 100, -- Minimum coins to redeem
    max_redemption_pct DECIMAL(5,2) DEFAULT 50.00, -- Max % of order (25-50% for turnkey businesses)
    max_redemption_per_visit DECIMAL(10,2), -- Optional: Cap dollar amount per transaction
    
    -- Expiration
    coins_expire_days INTEGER DEFAULT 365, -- Coins expire after X days
    auto_expire_enabled BOOLEAN DEFAULT true,
    
    -- Fundraising Settings (for Turnkey Businesses)
    fundraising_goal DECIMAL(10,2), -- e.g., $2000-$5000
    current_funding DECIMAL(10,2) DEFAULT 0,
    fundraising_start_date TIMESTAMPTZ,
    fundraising_end_date TIMESTAMPTZ,
    fundraising_deadline TIMESTAMPTZ, -- Hard deadline for reaching goal
    auction_trigger_enabled BOOLEAN DEFAULT false, -- Auto-trigger auction when goal reached
    
    -- Business Documentation
    business_plan_url TEXT, -- Link to 5-year business plan PDF
    ein TEXT, -- Employer Identification Number (encrypted in production)
    ein_verified BOOLEAN DEFAULT false,
    llc_registration_date DATE,
    
    -- Funding Breakdown (What the money will be used for)
    funding_breakdown JSONB DEFAULT '{}', -- e.g., {"equipment": 800, "inventory": 600, "licenses": 300}
    equipment_checklist JSONB DEFAULT '[]', -- Detailed list of items to purchase
    
    -- Savings Account Info
    savings_account_type TEXT, -- 'paypal', 'bank', 'stripe'
    savings_account_id TEXT, -- Account identifier
    paypal_donate_button_id TEXT, -- PayPal donate button for public donations
    
    -- Transparency Settings
    show_donor_names BOOLEAN DEFAULT true, -- Show public donor list
    show_transaction_history BOOLEAN DEFAULT true, -- Show all donations publicly
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false, -- Platform verification
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Either seller_id OR project_id must be set (not both)
    CONSTRAINT merchant_or_project CHECK (
        (seller_id IS NOT NULL AND project_id IS NULL) OR
        (seller_id IS NULL AND project_id IS NOT NULL)
    )
);

-- =====================================================
-- MERCHANT COIN BALANCES (Per User, Per Merchant)
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_coins_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    merchant_config_id UUID REFERENCES merchant_coins_config(id) ON DELETE CASCADE NOT NULL,
    
    -- Balance Tracking
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_expired DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Tier Status
    current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    tier_progress INTEGER DEFAULT 0, -- Points toward next tier
    
    -- Lifetime Stats
    lifetime_purchases INTEGER DEFAULT 0,
    lifetime_spent_usd DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    first_earned_at TIMESTAMPTZ,
    last_earned_at TIMESTAMPTZ,
    last_spent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(holder_id, merchant_config_id)
);

-- =====================================================
-- MERCHANT COIN TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_coins_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_id UUID REFERENCES merchant_coins_balances(id) ON DELETE CASCADE NOT NULL,
    holder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    merchant_config_id UUID REFERENCES merchant_coins_config(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction Details
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'expired', 'bonus', 'refund', 'donation_reward', 'crowdfund')),
    amount DECIMAL(10,2) NOT NULL,
    
    -- Context
    order_id UUID, -- References marketplace order
    listing_id UUID, -- References marketplace listing
    donation_id UUID, -- References crowdfunding donation
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Balance Snapshot
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    
    -- Expiration (for earned coins)
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT false,
    
    -- Processing
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MERCHANT COIN TIERS (Achievement Levels)
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_coins_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_config_id UUID REFERENCES merchant_coins_config(id) ON DELETE CASCADE NOT NULL,
    
    -- Tier Definition
    tier_name TEXT NOT NULL, -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    tier_level INTEGER NOT NULL, -- 1, 2, 3, 4
    
    -- Requirements
    min_coins_earned INTEGER DEFAULT 0,
    min_purchases INTEGER DEFAULT 0,
    min_total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Benefits
    earn_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 1.5x coins for gold tier
    redemption_bonus_pct DECIMAL(5,2) DEFAULT 0, -- Extra % value on redemption
    exclusive_discounts BOOLEAN DEFAULT false,
    early_access BOOLEAN DEFAULT false,
    free_shipping BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    benefits_description TEXT,
    
    -- Display
    badge_icon TEXT DEFAULT '⭐',
    badge_color TEXT DEFAULT '#cbd5e1',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(merchant_config_id, tier_level),
    UNIQUE(merchant_config_id, tier_name)
);

-- =====================================================
-- MERCHANT COIN ACHIEVEMENTS/BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_coins_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_id UUID REFERENCES merchant_coins_balances(id) ON DELETE CASCADE NOT NULL,
    
    -- Achievement Details
    achievement_type TEXT NOT NULL, -- 'first_purchase', 'tier_upgrade', 'streak', 'milestone'
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    badge_icon TEXT,
    
    -- Progress
    progress INTEGER DEFAULT 0,
    goal INTEGER,
    completed BOOLEAN DEFAULT false,
    
    -- Rewards
    bonus_coins DECIMAL(10,2) DEFAULT 0,
    
    earned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CROWDFUNDING DONATIONS (Turnkey Business Support)
-- =====================================================
CREATE TABLE IF NOT EXISTS crowdfunding_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    merchant_config_id UUID REFERENCES merchant_coins_config(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Donation Details
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT, -- 'cash_app', 'paypal', 'stripe'
    payment_reference TEXT,
    
    -- Coin Issuance (100% return as coins)
    coins_issued DECIMAL(10,2) NOT NULL, -- Same as amount (1:1 ratio)
    coins_status TEXT DEFAULT 'pending' CHECK (coins_status IN ('pending', 'issued', 'cancelled')),
    
    -- Status
    donation_status TEXT DEFAULT 'completed' CHECK (donation_status IN ('pending', 'completed', 'refunded')),
    
    -- Notes
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BUSINESS AUCTION RECORDS (Turnkey Business Sales)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    merchant_config_id UUID REFERENCES merchant_coins_config(id) ON DELETE CASCADE,
    
    -- Auction Details
    starting_bid DECIMAL(10,2) NOT NULL, -- Equal to fundraising_goal
    current_bid DECIMAL(10,2),
    winning_bid DECIMAL(10,2),
    winner_id UUID REFERENCES auth.users(id),
    
    -- Timing
    auction_start TIMESTAMPTZ NOT NULL,
    auction_end TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    
    -- Transfer Details
    business_transferred BOOLEAN DEFAULT false,
    transfer_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_coins_config_seller ON merchant_coins_config(seller_id);
CREATE INDEX idx_coins_config_project ON merchant_coins_config(project_id);
CREATE INDEX idx_coins_config_status ON merchant_coins_config(business_status);

CREATE INDEX idx_coins_balances_holder ON merchant_coins_balances(holder_id);
CREATE INDEX idx_coins_balances_merchant ON merchant_coins_balances(merchant_config_id);
CREATE INDEX idx_coins_balances_tier ON merchant_coins_balances(current_tier);

CREATE INDEX idx_coins_transactions_balance ON merchant_coins_transactions(balance_id);
CREATE INDEX idx_coins_transactions_holder ON merchant_coins_transactions(holder_id);
CREATE INDEX idx_coins_transactions_merchant ON merchant_coins_transactions(merchant_config_id);
CREATE INDEX idx_coins_transactions_type ON merchant_coins_transactions(type);
CREATE INDEX idx_coins_transactions_expires ON merchant_coins_transactions(expires_at) WHERE type = 'earned' AND is_expired = false;

CREATE INDEX idx_coins_tiers_merchant ON merchant_coins_tiers(merchant_config_id);
CREATE INDEX idx_coins_tiers_level ON merchant_coins_tiers(tier_level);

CREATE INDEX idx_coins_achievements_balance ON merchant_coins_achievements(balance_id);

CREATE INDEX idx_crowdfunding_donations_project ON crowdfunding_donations(project_id);
CREATE INDEX idx_crowdfunding_donations_donor ON crowdfunding_donations(donor_id);
CREATE INDEX idx_crowdfunding_donations_merchant ON crowdfunding_donations(merchant_config_id);

CREATE INDEX idx_business_auctions_project ON business_auctions(project_id);
CREATE INDEX idx_business_auctions_status ON business_auctions(status);
CREATE INDEX idx_business_auctions_winner ON business_auctions(winner_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE merchant_coins_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdfunding_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_auctions ENABLE ROW LEVEL SECURITY;

-- Merchant Coins Config: Public read, sellers can manage own
CREATE POLICY "Coin configs are viewable by everyone"
    ON merchant_coins_config FOR SELECT
    USING (true);

CREATE POLICY "Sellers can manage own coin config"
    ON merchant_coins_config FOR ALL
    USING (seller_id = auth.uid());

-- Balances: Users can view own balances
CREATE POLICY "Users can view own coin balances"
    ON merchant_coins_balances FOR SELECT
    USING (holder_id = auth.uid());

-- Transactions: Users can view own transactions
CREATE POLICY "Users can view own transactions"
    ON merchant_coins_transactions FOR SELECT
    USING (holder_id = auth.uid());

-- Tiers: Public read
CREATE POLICY "Coin tiers are viewable by everyone"
    ON merchant_coins_tiers FOR SELECT
    USING (true);

-- Achievements: Users can view own achievements
CREATE POLICY "Users can view own achievements"
    ON merchant_coins_achievements FOR SELECT
    USING (balance_id IN (SELECT id FROM merchant_coins_balances WHERE holder_id = auth.uid()));

-- Donations: Users can view own donations, public can see anonymous stats
CREATE POLICY "Users can view own donations"
    ON crowdfunding_donations FOR SELECT
    USING (donor_id = auth.uid() OR is_anonymous = false);

CREATE POLICY "Users can make donations"
    ON crowdfunding_donations FOR INSERT
    WITH CHECK (donor_id = auth.uid());

-- Auctions: Public read
CREATE POLICY "Auctions are viewable by everyone"
    ON business_auctions FOR SELECT
    USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_merchant_coins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchant_coins_config_updated_at
    BEFORE UPDATE ON merchant_coins_config
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_coins_updated_at();

CREATE TRIGGER update_merchant_coins_balances_updated_at
    BEFORE UPDATE ON merchant_coins_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_coins_updated_at();

CREATE TRIGGER update_crowdfunding_donations_updated_at
    BEFORE UPDATE ON crowdfunding_donations
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_coins_updated_at();

-- Auto-calculate current balance
CREATE OR REPLACE FUNCTION calculate_coin_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_balance = NEW.total_earned - NEW.total_spent - NEW.total_expired;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_balance_on_update
    BEFORE UPDATE ON merchant_coins_balances
    FOR EACH ROW
    EXECUTE FUNCTION calculate_coin_balance();

-- Auto-update fundraising progress
CREATE OR REPLACE FUNCTION update_fundraising_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the merchant config current_funding when donation is completed
    IF NEW.donation_status = 'completed' THEN
        UPDATE merchant_coins_config
        SET current_funding = current_funding + NEW.amount
        WHERE id = NEW.merchant_config_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_funding_on_donation
    AFTER INSERT ON crowdfunding_donations
    FOR EACH ROW
    EXECUTE FUNCTION update_fundraising_progress();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Active Fundraising Projects
CREATE OR REPLACE VIEW active_fundraising_projects AS
SELECT 
    mcc.*,
    p.name as project_name,
    p.slug as project_slug,
    p.description as project_description,
    p.image_url as project_image,
    p.tagline as project_tagline,
    (mcc.current_funding / NULLIF(mcc.fundraising_goal, 0) * 100) as funding_percentage,
    (SELECT COUNT(*) FROM crowdfunding_donations WHERE merchant_config_id = mcc.id) as donor_count,
    (SELECT SUM(amount) FROM crowdfunding_donations WHERE merchant_config_id = mcc.id AND donation_status = 'completed') as total_raised,
    CASE 
        WHEN mcc.fundraising_deadline IS NOT NULL THEN 
            EXTRACT(DAY FROM (mcc.fundraising_deadline - NOW()))::INTEGER
        ELSE NULL
    END as days_remaining
FROM merchant_coins_config mcc
LEFT JOIN projects p ON mcc.project_id = p.id
WHERE mcc.business_status = 'fundraising'
    AND mcc.is_active = true
ORDER BY mcc.created_at DESC;

-- View: User Coin Portfolio
CREATE OR REPLACE VIEW user_coin_portfolio AS
SELECT 
    mcb.holder_id,
    mcb.merchant_config_id,
    mcc.coin_name,
    mcc.coin_symbol,
    mcc.business_name,
    mcc.brand_color,
    mcb.current_balance,
    mcb.current_tier,
    (mcb.current_balance * mcc.redemption_rate) as usd_value,
    mcb.lifetime_purchases,
    mcb.lifetime_spent_usd
FROM merchant_coins_balances mcb
JOIN merchant_coins_config mcc ON mcb.merchant_config_id = mcc.id
WHERE mcb.current_balance > 0
ORDER BY mcb.current_balance DESC;

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE merchant_coins_config IS 'Configuration for merchant-specific loyalty coins. Supports both marketplace sellers and turnkey crowdfunded businesses.';
COMMENT ON TABLE merchant_coins_balances IS 'User balances for each merchant coin. Tracks lifetime stats and tier status.';
COMMENT ON TABLE merchant_coins_transactions IS 'Transaction history for earning, spending, and expiring coins.';
COMMENT ON TABLE merchant_coins_tiers IS 'Tier definitions (Bronze/Silver/Gold/Platinum) with benefits and requirements.';
COMMENT ON TABLE crowdfunding_donations IS 'Donations to turnkey business projects. Donors receive 100% back in merchant coins.';
COMMENT ON TABLE business_auctions IS 'Auction records for turnkey businesses when fundraising goal is reached.';

COMMENT ON COLUMN merchant_coins_config.max_redemption_pct IS 'Maximum percentage of order total that can be paid with coins (typically 25-50% for turnkey businesses to ensure cash flow).';
COMMENT ON COLUMN crowdfunding_donations.coins_issued IS 'Coins issued to donor (1:1 ratio with donation amount). Can be redeemed when business launches.';

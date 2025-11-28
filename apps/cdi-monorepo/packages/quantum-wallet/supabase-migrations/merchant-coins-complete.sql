-- Merchant Coins Complete Schema Migration
-- Combines Smart Hub and Quantum Wallet requirements
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROJECTS TABLE (Smart Hub - Crowdfunding/Incubation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    tagline VARCHAR(255),
    
    -- Financials
    funding_goal DECIMAL(10,2) NOT NULL,
    funds_raised DECIMAL(10,2) DEFAULT 0,
    
    -- Payment Integrations
    payment_cashtag VARCHAR(50),
    payment_paypal_url TEXT,
    
    -- Redemption Rules
    redemption_policy TEXT,
    
    -- Status Workflow
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Content
    business_plan_url TEXT,
    image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auction_start_at TIMESTAMP WITH TIME ZONE,
    auction_end_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- DONATIONS TABLE (Crowdfunding Contributions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Transaction Info
    status VARCHAR(50) DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    
    -- Coin Issuance Tracking
    coins_issued BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MERCHANT COINS TABLE (User Holdings - Smart Hub Schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS merchant_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    holder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'locked',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- AUCTION BIDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'valid',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FIAT ACCOUNTS (Quantum Wallet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fiat_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('checking', 'savings', 'credit')),
    external_id TEXT,
    current_balance NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiat_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES fiat_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL,
    merchant_name TEXT,
    category TEXT,
    is_constructive_ecosystem BOOLEAN DEFAULT FALSE,
    transaction_date DATE NOT NULL,
    description TEXT
);

-- ============================================================================
-- CRYPTO WALLETS (Quantum Wallet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crypto_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES crypto_wallets(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    amount NUMERIC(20,8) NOT NULL,
    usd_value NUMERIC(14,2),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Users can view own donations" ON donations;
DROP POLICY IF EXISTS "Users can view own coins" ON merchant_coins;
DROP POLICY IF EXISTS "Bids are public" ON bids;
DROP POLICY IF EXISTS "Users can place bids" ON bids;
DROP POLICY IF EXISTS "Users can insert donations" ON donations;

-- Projects: Public read
CREATE POLICY "Public projects are viewable by everyone" 
ON projects FOR SELECT USING (true);

-- Donations: Users see their own
CREATE POLICY "Users can view own donations" 
ON donations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert donations" 
ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Merchant Coins: Users see their own
CREATE POLICY "Users can view own coins" 
ON merchant_coins FOR SELECT USING (auth.uid() = holder_id);

-- Bids: Public read, Users create own
CREATE POLICY "Bids are public" 
ON bids FOR SELECT USING (true);

CREATE POLICY "Users can place bids" 
ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Fiat Accounts: Users see their own
CREATE POLICY "Users can view own fiat accounts" 
ON fiat_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own fiat accounts" 
ON fiat_accounts FOR ALL USING (auth.uid() = user_id);

-- Fiat Transactions: Users see their own
CREATE POLICY "Users can view own fiat transactions" 
ON fiat_transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM fiat_accounts 
        WHERE fiat_accounts.id = fiat_transactions.account_id 
        AND fiat_accounts.user_id = auth.uid()
    )
);

-- Crypto Wallets: Users see their own
CREATE POLICY "Users can view own crypto wallets" 
ON crypto_wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own crypto wallets" 
ON crypto_wallets FOR ALL USING (auth.uid() = user_id);

-- Crypto Balances: Users see their own
CREATE POLICY "Users can view own crypto balances" 
ON crypto_balances FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM crypto_wallets 
        WHERE crypto_wallets.id = crypto_balances.wallet_id 
        AND crypto_wallets.user_id = auth.uid()
    )
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger: Update funds_raised on new donation
CREATE OR REPLACE FUNCTION update_project_funds()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE projects 
        SET funds_raised = funds_raised + NEW.amount
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_donation_completed ON donations;
CREATE TRIGGER on_donation_completed
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_project_funds();

-- Trigger: Issue Coins on Donation Complete
CREATE OR REPLACE FUNCTION issue_coins_on_donation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') AND NEW.coins_issued = FALSE THEN
        INSERT INTO merchant_coins (project_id, holder_id, amount, status)
        VALUES (NEW.project_id, NEW.user_id, NEW.amount, 'locked');
        
        UPDATE donations SET coins_issued = TRUE WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_donation_coin_issuance ON donations;
CREATE TRIGGER on_donation_coin_issuance
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION issue_coins_on_donation();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_holder_id ON merchant_coins(holder_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_project_id ON merchant_coins(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

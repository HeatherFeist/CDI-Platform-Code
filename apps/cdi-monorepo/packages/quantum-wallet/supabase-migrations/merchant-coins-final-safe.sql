-- Merchant Coins - Complete Safe Migration
-- Checks for existence of tables before creating them
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROJECTS TABLE (Smart Hub - Crowdfunding/Incubation)
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

-- Enable RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid error on recreation
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
CREATE POLICY "Public projects are viewable by everyone" ON projects FOR SELECT USING (true);


-- ============================================================================
-- 2. DONATIONS TABLE (Crowdfunding Contributions)
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

-- Enable RLS for donations
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Users can view own donations" ON donations;
DROP POLICY IF EXISTS "Users can insert donations" ON donations;

CREATE POLICY "Users can view own donations" ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert donations" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 3. MERCHANT COINS TABLE (User Holdings)
-- ============================================================================

-- We drop this one to ensure the schema is correct (fixing the holder_id issue)
DROP TABLE IF EXISTS merchant_coins CASCADE;

CREATE TABLE merchant_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    holder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'locked',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for merchant_coins
ALTER TABLE merchant_coins ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Users can view own coins" ON merchant_coins;

CREATE POLICY "Users can view own coins" ON merchant_coins FOR SELECT USING (auth.uid() = holder_id);


-- ============================================================================
-- 4. AUCTION BIDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'valid',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for bids
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Bids are public" ON bids;
DROP POLICY IF EXISTS "Users can place bids" ON bids;

CREATE POLICY "Bids are public" ON bids FOR SELECT USING (true);
CREATE POLICY "Users can place bids" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);


-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
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
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_holder_id ON merchant_coins(holder_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_project_id ON merchant_coins(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================

SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('projects', 'donations', 'merchant_coins', 'bids')
AND table_schema = 'public';

-- Merchant Coins - Fix Existing Tables Migration
-- Adds missing columns to 'projects' table and ensures other tables exist
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UPDATE PROJECTS TABLE (Add missing columns)
-- ============================================================================

-- Add 'slug' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'slug') THEN
        ALTER TABLE projects ADD COLUMN slug VARCHAR(255);
        -- Create unique slugs for existing rows to avoid constraint errors
        UPDATE projects SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8) WHERE slug IS NULL;
        -- Now add the constraints
        ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE projects ADD CONSTRAINT projects_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Add other potentially missing columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_goal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funds_raised DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_cashtag VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_paypal_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS redemption_policy TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_plan_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auction_start_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auction_end_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. ENSURE DONATIONS TABLE EXISTS
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

-- Re-apply policies to be safe
DROP POLICY IF EXISTS "Users can view own donations" ON donations;
DROP POLICY IF EXISTS "Users can insert donations" ON donations;

CREATE POLICY "Users can view own donations" ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert donations" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. RECREATE MERCHANT COINS TABLE (To fix holder_id)
-- ============================================================================

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

ALTER TABLE merchant_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coins" ON merchant_coins FOR SELECT USING (auth.uid() = holder_id);

-- ============================================================================
-- 4. ENSURE BIDS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'valid',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bids are public" ON bids;
DROP POLICY IF EXISTS "Users can place bids" ON bids;

CREATE POLICY "Bids are public" ON bids FOR SELECT USING (true);
CREATE POLICY "Users can place bids" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- ============================================================================
-- 5. RE-APPLY TRIGGERS
-- ============================================================================

-- Trigger: Update funds_raised
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

-- Trigger: Issue Coins
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
-- 6. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_holder_id ON merchant_coins(holder_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_project_id ON merchant_coins(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

SELECT 'Migration completed successfully' as status;

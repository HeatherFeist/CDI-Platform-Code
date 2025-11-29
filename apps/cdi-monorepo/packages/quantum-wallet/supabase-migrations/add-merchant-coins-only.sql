-- Merchant Coins - Add Missing Table Only
-- This assumes projects and donations tables already exist
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP AND RECREATE MERCHANT_COINS TABLE ONLY
-- ============================================================================

-- Drop existing merchant_coins table and related objects
DROP TRIGGER IF EXISTS on_donation_coin_issuance ON donations;
DROP FUNCTION IF EXISTS issue_coins_on_donation();
DROP TABLE IF EXISTS merchant_coins CASCADE;

-- Create merchant_coins table with correct schema
CREATE TABLE merchant_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    holder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'locked',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR MERCHANT_COINS
-- ============================================================================

ALTER TABLE merchant_coins ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own coins" ON merchant_coins;

-- Merchant Coins: Users see their own
CREATE POLICY "Users can view own coins" 
ON merchant_coins FOR SELECT USING (auth.uid() = holder_id);

-- ============================================================================
-- TRIGGER: Issue Coins on Donation Complete
-- ============================================================================

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

CREATE TRIGGER on_donation_coin_issuance
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION issue_coins_on_donation();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_merchant_coins_holder_id ON merchant_coins(holder_id);
CREATE INDEX IF NOT EXISTS idx_merchant_coins_project_id ON merchant_coins(project_id);

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================

-- Check if table exists
SELECT 'merchant_coins table created successfully' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'merchant_coins'
);

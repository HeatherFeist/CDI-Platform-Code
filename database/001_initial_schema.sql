-- Turnkey Business Engine - Initial Schema
-- Version: 1.2
-- Description: Core tables for Projects (Incubation), Donations (Crowdfunding), and Merchant Coins

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROJECTS (The Businesses)
-- Stores the businesses being incubated, their funding goals, and status.
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- For URL (e.g., /projects/seasonal-greetings)
    description TEXT,
    tagline VARCHAR(255),
    
    -- Financials
    funding_goal DECIMAL(10,2) NOT NULL,
    funds_raised DECIMAL(10,2) DEFAULT 0,
    
    -- Payment Integrations (Direct-to-Platform)
    payment_cashtag VARCHAR(50), -- e.g. "$SeasonalGreetingsDayton"
    payment_paypal_url TEXT, -- e.g. "paypal.me/seasonaldayton"
    
    -- Redemption Rules (Owner Protection)
    redemption_policy TEXT, -- e.g. "Max 25% of total bill per visit"
    
    -- Status Workflow
    status VARCHAR(50) DEFAULT 'draft', 
    -- 'draft': Internal committee work
    -- 'funding': Live for donations
    -- 'funded': Goal reached, preparing for auction
    -- 'auction_live': Active bidding
    -- 'sold': Transferred to new owner
    
    -- Content
    business_plan_url TEXT, -- Link to full PDF/Doc
    image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auction_start_at TIMESTAMP WITH TIME ZONE,
    auction_end_at TIMESTAMP WITH TIME ZONE
);

-- 2. DONATIONS (The Funding)
-- Records community contributions. Linked to a user and a project.
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Assumes Supabase/Firebase Auth
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Transaction Info
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_intent_id VARCHAR(255), -- Stripe/Payment Processor ID
    payment_method VARCHAR(50), -- 'cash_app', 'paypal', 'stripe'
    
    -- Coin Issuance Tracking
    coins_issued BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MERCHANT COINS (The Liability/Asset)
-- Represents the store credit issued to donors.
CREATE TABLE merchant_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id), -- The business liable for this coin
    holder_id UUID REFERENCES auth.users(id), -- The user who owns the coin
    
    amount DECIMAL(10,2) NOT NULL, -- Number of coins
    
    status VARCHAR(50) DEFAULT 'locked',
    -- 'locked': Business not yet launched
    -- 'active': Redeemable
    -- 'redeemed': Spent
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE -- Date when business launches
);

-- 4. AUCTION BIDS
-- Records bids placed during the auction phase.
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES auth.users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'retracted', 'winning'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Secure the data so users can only see what they should.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Projects: Public read, Admin write
CREATE POLICY "Public projects are viewable by everyone" 
ON projects FOR SELECT USING (true);

-- Donations: Users see their own, Admins see all
CREATE POLICY "Users can view own donations" 
ON donations FOR SELECT USING (auth.uid() = user_id);

-- Merchant Coins: Users see their own
CREATE POLICY "Users can view own coins" 
ON merchant_coins FOR SELECT USING (auth.uid() = holder_id);

-- Bids: Public read (for transparency), Users create own
CREATE POLICY "Bids are public" 
ON bids FOR SELECT USING (true);

CREATE POLICY "Users can place bids" 
ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- FUNCTIONS & TRIGGERS

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

CREATE TRIGGER on_donation_completed
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_project_funds();

-- Trigger: Issue Coins on Donation Complete
CREATE OR REPLACE FUNCTION issue_coins_on_donation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO merchant_coins (project_id, holder_id, amount, status)
        VALUES (NEW.project_id, NEW.user_id, NEW.amount, 'locked');
        
        UPDATE donations SET coins_issued = TRUE WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_donation_coin_issuance
AFTER UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION issue_coins_on_donation();

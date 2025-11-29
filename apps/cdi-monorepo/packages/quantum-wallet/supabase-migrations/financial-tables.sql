-- Real Financial Data Schema
-- Tables for storing linked accounts and transactions from Plaid
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plaid Info
    plaid_account_id VARCHAR(255) NOT NULL,
    plaid_item_id VARCHAR(255),
    
    -- Account Details
    name VARCHAR(255) NOT NULL,
    mask VARCHAR(10), -- Last 4 digits
    type VARCHAR(50), -- depository, credit, loan, etc.
    subtype VARCHAR(50), -- checking, savings, credit card
    
    -- Balances
    current_balance DECIMAL(12,2),
    available_balance DECIMAL(12,2),
    iso_currency_code VARCHAR(3) DEFAULT 'USD',
    
    institution_name VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, plaid_account_id)
);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 2. TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Plaid Info
    plaid_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Transaction Details
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Positive for spending, negative for income (Plaid convention)
    name VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(255),
    
    category JSONB, -- Array of categories
    payment_channel VARCHAR(50), -- online, in store
    
    pending BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

SELECT 'Financial tables created successfully' as status;

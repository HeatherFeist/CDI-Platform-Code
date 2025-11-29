-- Plaid API Keys Schema (Fixed)
-- Stores encrypted user API keys for Plaid integration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- USER API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL, -- e.g., 'plaid', 'plaid_secret', 'openai'
    api_key TEXT NOT NULL, -- Encrypted or raw key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one key per service per user
    UNIQUE(user_id, service)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can manage own api keys" ON user_api_keys;

-- Policy: Users can only see and manage their own keys
CREATE POLICY "Users can manage own api keys" 
ON user_api_keys 
FOR ALL 
USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Plaid schema applied successfully' as status;

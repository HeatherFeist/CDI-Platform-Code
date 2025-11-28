-- Payment BYOK (Bring Your Own Keys) Schema
-- Users store their own payment provider credentials

-- Create payment_integrations table
CREATE TABLE IF NOT EXISTS payment_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Payment provider
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'plaid', 'cashapp')),
    
    -- User's own API credentials (encrypted at rest by Supabase)
    api_key_1 TEXT, -- e.g., PayPal Client ID, Stripe Publishable Key
    api_key_2 TEXT, -- e.g., PayPal Secret, Stripe Secret Key
    api_key_3 TEXT, -- e.g., Additional credentials if needed
    
    -- Public identifiers (not sensitive)
    public_identifier TEXT, -- e.g., Cash App tag, PayPal email
    
    -- Connection status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Verified that credentials work
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Environment (sandbox vs production)
    environment TEXT DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, provider, environment)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_integrations_profile_id ON payment_integrations(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_integrations_provider ON payment_integrations(provider);

-- Enable Row Level Security
ALTER TABLE payment_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own payment integrations
CREATE POLICY "Users can view their own payment integrations"
    ON payment_integrations
    FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own payment integrations"
    ON payment_integrations
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own payment integrations"
    ON payment_integrations
    FOR UPDATE
    USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own payment integrations"
    ON payment_integrations
    FOR DELETE
    USING (profile_id = auth.uid());

-- Create transactions table for payment history
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'refund', 'fee')),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    
    -- Payment provider used
    provider TEXT, -- 'paypal', 'stripe', 'cashapp', etc.
    provider_transaction_id TEXT, -- External transaction ID
    
    -- Related parties
    recipient_id UUID REFERENCES auth.users(id),
    sender_id UUID REFERENCES auth.users(id),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Ensure amount is positive
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile_id ON wallet_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can see transactions they're involved in
CREATE POLICY "Users can view their own transactions"
    ON wallet_transactions
    FOR SELECT
    USING (
        profile_id = auth.uid() 
        OR recipient_id = auth.uid() 
        OR sender_id = auth.uid()
    );

CREATE POLICY "Users can insert their own transactions"
    ON wallet_transactions
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payment_integrations_updated_at 
    BEFORE UPDATE ON payment_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON payment_integrations TO authenticated;
GRANT ALL ON wallet_transactions TO authenticated;

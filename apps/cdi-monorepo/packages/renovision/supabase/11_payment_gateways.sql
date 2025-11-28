-- Payment Gateways Configuration Table
-- Stores API credentials and settings for multiple payment processors

-- Create businesses table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create estimates table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    gateway_type TEXT NOT NULL CHECK (gateway_type IN ('stripe', 'cashapp', 'paypal')),
    api_key TEXT, -- Publishable key, Cashtag, or Client ID
    api_secret TEXT, -- Secret key (should be encrypted in production)
    is_active BOOLEAN DEFAULT true,
    webhook_url TEXT,
    test_mode BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one gateway of each type per business
    UNIQUE(business_id, gateway_type)
);

-- Index for faster lookups
CREATE INDEX idx_payment_gateways_business ON payment_gateways(business_id);
CREATE INDEX idx_payment_gateways_active ON payment_gateways(business_id, is_active) WHERE is_active = true;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_payment_gateway_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_gateway_updated
    BEFORE UPDATE ON payment_gateways
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_gateway_timestamp();

-- RLS Policies
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own payment gateways
CREATE POLICY payment_gateways_business_owner ON payment_gateways
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admins can view all payment gateways
CREATE POLICY payment_gateways_admin_view ON payment_gateways
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment Transactions Log
-- Track all payment attempts and their status
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
    gateway_type TEXT NOT NULL,
    transaction_id TEXT, -- External payment processor transaction ID
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    customer_email TEXT,
    customer_name TEXT,
    description TEXT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

-- Indexes for payment transactions
CREATE INDEX idx_payment_transactions_business ON payment_transactions(business_id);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(gateway_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- RLS for payment transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_transactions_business_access ON payment_transactions
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Function to get active payment gateway for business
CREATE OR REPLACE FUNCTION get_active_payment_gateway(
    p_business_id UUID,
    p_gateway_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    gateway_type TEXT,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    test_mode BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.gateway_type,
        pg.api_key,
        pg.api_secret,
        pg.webhook_url,
        pg.test_mode
    FROM payment_gateways pg
    WHERE pg.business_id = p_business_id
      AND pg.is_active = true
      AND (p_gateway_type IS NULL OR pg.gateway_type = p_gateway_type)
    ORDER BY pg.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log payment transaction
CREATE OR REPLACE FUNCTION log_payment_transaction(
    p_business_id UUID,
    p_gateway_type TEXT,
    p_amount DECIMAL,
    p_status TEXT,
    p_transaction_id TEXT DEFAULT NULL,
    p_invoice_id UUID DEFAULT NULL,
    p_customer_email TEXT DEFAULT NULL,
    p_customer_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_gateway_id UUID;
BEGIN
    -- Get gateway ID
    SELECT id INTO v_gateway_id
    FROM payment_gateways
    WHERE business_id = p_business_id
      AND gateway_type = p_gateway_type
      AND is_active = true
    LIMIT 1;
    
    -- Insert transaction
    INSERT INTO payment_transactions (
        business_id,
        gateway_id,
        gateway_type,
        transaction_id,
        amount,
        status,
        invoice_id,
        customer_email,
        customer_name,
        description,
        metadata
    ) VALUES (
        p_business_id,
        v_gateway_id,
        p_gateway_type,
        p_transaction_id,
        p_amount,
        p_status,
        p_invoice_id,
        p_customer_email,
        p_customer_name,
        p_description,
        p_metadata
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON payment_gateways TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_payment_gateway TO authenticated;
GRANT EXECUTE ON FUNCTION log_payment_transaction TO authenticated;

COMMENT ON TABLE payment_gateways IS 'Stores payment processor API credentials for businesses';
COMMENT ON TABLE payment_transactions IS 'Logs all payment transactions across all gateways';
COMMENT ON FUNCTION get_active_payment_gateway IS 'Retrieves active payment gateway configuration for a business';
COMMENT ON FUNCTION log_payment_transaction IS 'Creates a payment transaction log entry';

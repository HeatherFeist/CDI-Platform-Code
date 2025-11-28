-- Platform Gratuity System
-- Adds a customizable platform donation/gratuity to all transactions
-- Default suggested 10% donation (not required) for organization members
-- Non-members pay monthly subscription instead of per-transaction fees
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS platform_donation_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (platform_donation_percentage >= 0 AND platform_donation_percentage <= 100),
ADD COLUMN IF NOT EXISTS is_organization_member BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS non_member_subscription_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS non_member_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS non_member_subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS non_member_subscription_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.platform_donation_percentage IS 'Suggested platform donation percentage (0-100). Default 10%. Optional donation to support platform operations. Users can customize or set to 0.';
COMMENT ON COLUMN profiles.is_organization_member IS 'True if user is an organization member (free, gets workspace email, uses voluntary donation model). False if non-member seller (pays $29.99/month, no per-transaction fees).';
COMMENT ON COLUMN profiles.non_member_subscription_active IS 'For non-members only. True if subscription is active and paid.';
COMMENT ON COLUMN profiles.non_member_subscription_id IS 'Stripe subscription ID for non-member monthly fee';
COMMENT ON COLUMN profiles.non_member_subscription_started_at IS 'When non-member subscription started';
COMMENT ON COLUMN profiles.non_member_subscription_expires_at IS 'When non-member subscription expires (monthly renewal)';

-- Add platform fee tracking to orders/transactions
-- Assuming you have an orders or transactions table - adjust table name as needed
CREATE TABLE IF NOT EXISTS order_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL, -- Reference to your orders table
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Breakdown of charges
    item_total DECIMAL(10,2) NOT NULL, -- Base product price
    seller_fees DECIMAL(10,2) DEFAULT 0, -- Any seller-specific fees (shipping, etc)
    
    -- Platform donation (TAX-DEDUCTIBLE to 501(c)(3))
    platform_donation_percentage DECIMAL(5,2) NOT NULL, -- Snapshot of seller's setting at time of order
    platform_donation_amount DECIMAL(10,2) NOT NULL, -- Calculated amount - TAX-DEDUCTIBLE
    
    -- Tax receipt tracking
    tax_receipt_issued BOOLEAN DEFAULT FALSE,
    tax_receipt_number TEXT UNIQUE, -- Format: TR-YYYY-XXXXXX
    tax_receipt_issued_at TIMESTAMPTZ,
    tax_receipt_sent_to_email TEXT,
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL, -- item_total + seller_fees
    total DECIMAL(10,2) NOT NULL, -- subtotal + platform_gratuity_amount
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Payment tracking
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    platform_donation_received BOOLEAN DEFAULT FALSE,
    platform_donation_received_date TIMESTAMPTZ,
    
    CONSTRAINT positive_amounts CHECK (
        item_total >= 0 AND 
        seller_fees >= 0 AND 
        platform_donation_amount >= 0 AND
        subtotal >= 0 AND
        total >= 0
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_order_fees_seller ON order_fees(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_buyer ON order_fees(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_payment_status ON order_fees(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_fees_created_at ON order_fees(created_at DESC);

-- Function to calculate platform donation (TAX-DEDUCTIBLE)
-- Only applies to organization members. Non-members pay monthly subscription instead.
CREATE OR REPLACE FUNCTION calculate_platform_donation(
    p_seller_id UUID,
    p_item_total DECIMAL,
    p_seller_fees DECIMAL DEFAULT 0
)
RETURNS TABLE (
    subtotal DECIMAL,
    platform_donation_percentage DECIMAL,
    platform_donation_amount DECIMAL,
    total DECIMAL,
    is_member BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_donation_pct DECIMAL;
    v_subtotal DECIMAL;
    v_donation_amt DECIMAL;
    v_total DECIMAL;
    v_is_member BOOLEAN;
BEGIN
    -- Check if seller is organization member
    SELECT 
        COALESCE(is_organization_member, TRUE),
        COALESCE(platform_donation_percentage, 10.00)
    INTO v_is_member, v_donation_pct
    FROM profiles
    WHERE id = p_seller_id;
    
    -- Calculate amounts
    v_subtotal := p_item_total + p_seller_fees;
    
    -- Only apply donation if organization member
    IF v_is_member THEN
        v_donation_amt := ROUND((v_subtotal * v_donation_pct / 100), 2);
    ELSE
        v_donation_amt := 0; -- Non-members pay monthly fee instead
    END IF;
    
    v_total := v_subtotal + v_donation_amt;
    
    RETURN QUERY SELECT 
        v_subtotal,
        v_donation_pct,
        v_donation_amt,
        v_total,
        v_is_member;
END;
$$;

-- Function to create order with fees
CREATE OR REPLACE FUNCTION create_order_with_fees(
    p_order_id UUID,
    p_seller_id UUID,
    p_buyer_id UUID,
    p_item_total DECIMAL,
    p_seller_fees DECIMAL DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_fee_breakdown RECORD;
    v_fee_id UUID;
BEGIN
    -- Calculate fees
    SELECT * INTO v_fee_breakdown
    FROM calculate_platform_donation(p_seller_id, p_item_total, p_seller_fees);
    
    -- Insert fee record
    INSERT INTO order_fees (
        order_id,
        seller_id,
        buyer_id,
        item_total,
        seller_fees,
        platform_donation_percentage,
        platform_donation_amount,
        subtotal,
        total
    ) VALUES (
        p_order_id,
        p_seller_id,
        p_buyer_id,
        p_item_total,
        p_seller_fees,
        v_fee_breakdown.platform_donation_percentage,
        v_fee_breakdown.platform_donation_amount,
        v_fee_breakdown.subtotal,
        v_fee_breakdown.total
    )
    RETURNING id INTO v_fee_id;
    
    RETURN v_fee_id;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_order_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_fees_updated_at
    BEFORE UPDATE ON order_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_order_fees_updated_at();

-- RLS Policies
ALTER TABLE order_fees ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own order fees
CREATE POLICY "Buyers can view their order fees"
    ON order_fees FOR SELECT
    USING (auth.uid() = buyer_id);

-- Sellers can view their order fees
CREATE POLICY "Sellers can view their order fees"
    ON order_fees FOR SELECT
    USING (auth.uid() = seller_id);

-- System can insert order fees (typically done by backend/edge functions)
CREATE POLICY "System can insert order fees"
    ON order_fees FOR INSERT
    WITH CHECK (true); -- Adjust this based on your auth pattern

-- Only system can update payment status (edge functions only)
CREATE POLICY "System can update order fees"
    ON order_fees FOR UPDATE
    USING (true); -- Adjust this based on your auth pattern

-- View for sellers to see their platform donation earnings
CREATE OR REPLACE VIEW seller_platform_donations AS
SELECT 
    seller_id,
    COUNT(*) as total_orders,
    SUM(platform_donation_amount) as total_platform_donations,
    SUM(CASE WHEN platform_donation_received THEN platform_donation_amount ELSE 0 END) as received_donations,
    SUM(CASE WHEN NOT platform_donation_received THEN platform_donation_amount ELSE 0 END) as pending_donations,
    AVG(platform_donation_percentage) as avg_donation_percentage,
    SUM(CASE WHEN tax_receipt_issued THEN 1 ELSE 0 END) as receipts_issued
FROM order_fees
WHERE payment_status = 'completed'
GROUP BY seller_id;

-- Grant access to view
GRANT SELECT ON seller_platform_donations TO authenticated;

-- RLS for view
ALTER VIEW seller_platform_donations SET (security_invoker = on);

COMMENT ON TABLE order_fees IS 'Tracks all fee breakdowns including optional platform donation (default 10%) to support platform operations';
COMMENT ON FUNCTION calculate_platform_donation IS 'Calculates optional platform donation based on seller settings. Default 10%. Supports platform operations.';
COMMENT ON VIEW seller_platform_donations IS 'Summary of platform donation contributions per seller';

-- Trigger to automatically create mentor commissions when donations are received
CREATE OR REPLACE FUNCTION process_mentor_commission_on_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when donation is marked as received
  IF NEW.platform_donation_received = true AND
     (OLD.platform_donation_received = false OR OLD.platform_donation_received IS NULL) THEN

    -- Call the mentor commission function
    PERFORM create_mentor_commission_from_donation(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mentor_commission_on_donation
  AFTER UPDATE ON order_fees
  FOR EACH ROW
  EXECUTE FUNCTION process_mentor_commission_on_donation();

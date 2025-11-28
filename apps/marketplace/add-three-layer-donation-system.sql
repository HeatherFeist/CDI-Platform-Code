-- REVOLUTIONARY TAX-OPTIMIZED MARKETPLACE MODEL
-- Three-layer optional donation system for maximum tax benefits

-- Update profiles table for board member tax-exempt status and optional charges
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_board_volunteer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS board_role_group TEXT,
ADD COLUMN IF NOT EXISTS tax_exempt_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_optional_donation_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (seller_optional_donation_percentage >= 0 AND seller_optional_donation_percentage <= 7.5),
ADD COLUMN IF NOT EXISTS platform_donation_percentage DECIMAL(5,2) DEFAULT 15.00 CHECK (platform_donation_percentage >= 0 AND platform_donation_percentage <= 100);

COMMENT ON COLUMN profiles.is_board_volunteer IS 'True if member is a board role group volunteer (not THE board member). Qualifies for tax-exempt selling.';
COMMENT ON COLUMN profiles.board_role_group IS 'Which board role group: Technology, Marketing, Operations, Finance, Community, etc.';
COMMENT ON COLUMN profiles.tax_exempt_status IS 'True if seller is tax-exempt (board volunteers). No sales tax on their transactions.';
COMMENT ON COLUMN profiles.seller_optional_donation_percentage IS 'Optional "sales tax replacement" donation (0-7.5%) that seller can add. Buyer pays it, seller gets tax receipt. Mimics sales tax but is actually charitable donation.';
COMMENT ON COLUMN profiles.platform_donation_percentage IS 'Optional buyer tip/donation to platform (default 15%). Buyer gets tax receipt.';

-- Enhanced order fees table with three-layer donation system
CREATE TABLE IF NOT EXISTS order_fees_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Base amounts
    item_price DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Layer 1: Seller's Optional "Sales Tax Replacement" Donation (0-7.5%)
    -- Seller chooses to add this. Buyer pays it. Seller gets tax receipt.
    seller_donation_enabled BOOLEAN DEFAULT FALSE,
    seller_donation_percentage DECIMAL(5,2) DEFAULT 0,
    seller_donation_amount DECIMAL(10,2) DEFAULT 0,
    seller_tax_receipt_number TEXT UNIQUE, -- Format: STR-YYYY-XXXXXX
    seller_tax_receipt_issued BOOLEAN DEFAULT FALSE,
    seller_tax_receipt_issued_at TIMESTAMPTZ,
    
    -- Layer 2: Buyer's Optional Platform Tip/Donation (variable %)
    -- Buyer chooses to add this. Goes to platform. Buyer gets tax receipt.
    buyer_donation_enabled BOOLEAN DEFAULT TRUE,
    buyer_donation_percentage DECIMAL(5,2) DEFAULT 15.00,
    buyer_donation_amount DECIMAL(10,2) DEFAULT 0,
    buyer_tax_receipt_number TEXT UNIQUE, -- Format: BTR-YYYY-XXXXXX
    buyer_tax_receipt_issued BOOLEAN DEFAULT FALSE,
    buyer_tax_receipt_issued_at TIMESTAMPTZ,
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL, -- item_price + shipping_fee
    total_donations DECIMAL(10,2) NOT NULL, -- seller_donation + buyer_donation
    grand_total DECIMAL(10,2) NOT NULL, -- subtotal + total_donations
    
    -- Seller receives (what they actually get paid)
    seller_payout DECIMAL(10,2) NOT NULL, -- item_price + shipping_fee (NO donations)
    
    -- Metadata
    seller_is_board_volunteer BOOLEAN DEFAULT FALSE, -- Snapshot at time of sale
    seller_is_tax_exempt BOOLEAN DEFAULT FALSE, -- Snapshot at time of sale
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    CONSTRAINT positive_amounts CHECK (
        item_price >= 0 AND 
        shipping_fee >= 0 AND 
        seller_donation_amount >= 0 AND
        buyer_donation_amount >= 0 AND
        subtotal >= 0 AND
        grand_total >= 0
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_fees_v2_seller ON order_fees_v2(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_v2_buyer ON order_fees_v2(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_v2_status ON order_fees_v2(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_fees_v2_created ON order_fees_v2(created_at DESC);

-- Function to calculate all donation layers
CREATE OR REPLACE FUNCTION calculate_three_layer_donations(
    p_seller_id UUID,
    p_item_price DECIMAL,
    p_shipping_fee DECIMAL DEFAULT 0,
    p_buyer_donation_pct DECIMAL DEFAULT 15.00
)
RETURNS TABLE (
    subtotal DECIMAL,
    seller_donation_enabled BOOLEAN,
    seller_donation_percentage DECIMAL,
    seller_donation_amount DECIMAL,
    buyer_donation_percentage DECIMAL,
    buyer_donation_amount DECIMAL,
    total_donations DECIMAL,
    grand_total DECIMAL,
    seller_payout DECIMAL,
    seller_is_board_volunteer BOOLEAN,
    seller_is_tax_exempt BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtotal DECIMAL;
    v_seller_donation_enabled BOOLEAN;
    v_seller_donation_pct DECIMAL;
    v_seller_donation_amt DECIMAL;
    v_buyer_donation_amt DECIMAL;
    v_total_donations DECIMAL;
    v_grand_total DECIMAL;
    v_seller_payout DECIMAL;
    v_is_board_volunteer BOOLEAN;
    v_is_tax_exempt BOOLEAN;
BEGIN
    -- Get seller's settings
    SELECT 
        COALESCE(is_board_volunteer, FALSE),
        COALESCE(tax_exempt_status, FALSE),
        COALESCE(seller_optional_donation_percentage, 0.00)
    INTO 
        v_is_board_volunteer,
        v_is_tax_exempt,
        v_seller_donation_pct
    FROM profiles
    WHERE id = p_seller_id;
    
    -- Calculate subtotal (what buyer would pay without donations)
    v_subtotal := p_item_price + p_shipping_fee;
    
    -- Layer 1: Seller's optional "sales tax replacement" donation (0-7.5%)
    -- Only charged if seller enabled it
    v_seller_donation_enabled := (v_seller_donation_pct > 0);
    IF v_seller_donation_enabled THEN
        v_seller_donation_amt := ROUND((v_subtotal * v_seller_donation_pct / 100), 2);
    ELSE
        v_seller_donation_amt := 0;
    END IF;
    
    -- Layer 2: Buyer's optional platform tip/donation
    -- Calculated on subtotal (not including seller donation)
    v_buyer_donation_amt := ROUND((v_subtotal * p_buyer_donation_pct / 100), 2);
    
    -- Total donations
    v_total_donations := v_seller_donation_amt + v_buyer_donation_amt;
    
    -- Grand total (what buyer actually pays)
    v_grand_total := v_subtotal + v_total_donations;
    
    -- Seller payout (they get item_price + shipping, NO donations)
    v_seller_payout := v_subtotal;
    
    RETURN QUERY SELECT 
        v_subtotal,
        v_seller_donation_enabled,
        v_seller_donation_pct,
        v_seller_donation_amt,
        p_buyer_donation_pct,
        v_buyer_donation_amt,
        v_total_donations,
        v_grand_total,
        v_seller_payout,
        v_is_board_volunteer,
        v_is_tax_exempt;
END;
$$;

-- Function to create order with three-layer donations
CREATE OR REPLACE FUNCTION create_order_with_three_layer_donations(
    p_order_id UUID,
    p_seller_id UUID,
    p_buyer_id UUID,
    p_item_price DECIMAL,
    p_shipping_fee DECIMAL DEFAULT 0,
    p_buyer_donation_pct DECIMAL DEFAULT 15.00
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_fee_breakdown RECORD;
    v_fee_id UUID;
BEGIN
    -- Calculate all layers
    SELECT * INTO v_fee_breakdown
    FROM calculate_three_layer_donations(p_seller_id, p_item_price, p_shipping_fee, p_buyer_donation_pct);
    
    -- Insert fee record
    INSERT INTO order_fees_v2 (
        order_id,
        seller_id,
        buyer_id,
        item_price,
        shipping_fee,
        seller_donation_enabled,
        seller_donation_percentage,
        seller_donation_amount,
        buyer_donation_enabled,
        buyer_donation_percentage,
        buyer_donation_amount,
        subtotal,
        total_donations,
        grand_total,
        seller_payout,
        seller_is_board_volunteer,
        seller_is_tax_exempt
    ) VALUES (
        p_order_id,
        p_seller_id,
        p_buyer_id,
        p_item_price,
        p_shipping_fee,
        v_fee_breakdown.seller_donation_enabled,
        v_fee_breakdown.seller_donation_percentage,
        v_fee_breakdown.seller_donation_amount,
        TRUE, -- buyer donation always enabled (they can decline at checkout)
        v_fee_breakdown.buyer_donation_percentage,
        v_fee_breakdown.buyer_donation_amount,
        v_fee_breakdown.subtotal,
        v_fee_breakdown.total_donations,
        v_fee_breakdown.grand_total,
        v_fee_breakdown.seller_payout,
        v_fee_breakdown.seller_is_board_volunteer,
        v_fee_breakdown.seller_is_tax_exempt
    )
    RETURNING id INTO v_fee_id;
    
    RETURN v_fee_id;
END;
$$;

-- View for sellers to see their donation tax benefits
CREATE OR REPLACE VIEW seller_donation_summary AS
SELECT 
    seller_id,
    COUNT(*) as total_sales,
    SUM(seller_donation_amount) as total_seller_donations_received,
    SUM(CASE WHEN seller_tax_receipt_issued THEN 1 ELSE 0 END) as seller_receipts_issued,
    AVG(seller_donation_percentage) as avg_seller_donation_percentage,
    SUM(seller_payout) as total_seller_payouts
FROM order_fees_v2
WHERE payment_status = 'completed'
GROUP BY seller_id;

-- View for buyers to see their donation tax benefits
CREATE OR REPLACE VIEW buyer_donation_summary AS
SELECT 
    buyer_id,
    COUNT(*) as total_purchases,
    SUM(buyer_donation_amount) as total_buyer_donations_made,
    SUM(CASE WHEN buyer_tax_receipt_issued THEN 1 ELSE 0 END) as buyer_receipts_issued,
    AVG(buyer_donation_percentage) as avg_buyer_donation_percentage
FROM order_fees_v2
WHERE payment_status = 'completed'
GROUP BY buyer_id;

-- View for platform donation revenue
CREATE OR REPLACE VIEW platform_donation_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(seller_donation_amount) as seller_donations,
    SUM(buyer_donation_amount) as buyer_donations,
    SUM(seller_donation_amount + buyer_donation_amount) as total_donations,
    COUNT(DISTINCT seller_id) as unique_sellers,
    COUNT(DISTINCT buyer_id) as unique_buyers,
    COUNT(*) as total_transactions
FROM order_fees_v2
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- RLS Policies
ALTER TABLE order_fees_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fee records as buyer"
    ON order_fees_v2 FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own fee records as seller"
    ON order_fees_v2 FOR SELECT
    USING (auth.uid() = seller_id);

CREATE POLICY "System can manage fee records"
    ON order_fees_v2 FOR ALL
    USING (true);

-- Grant access to views
GRANT SELECT ON seller_donation_summary TO authenticated;
GRANT SELECT ON buyer_donation_summary TO authenticated;
GRANT SELECT ON platform_donation_revenue TO authenticated;

COMMENT ON TABLE order_fees_v2 IS 'Three-layer optional donation system: 1) Seller optional 0-7.5% "sales tax replacement" (seller gets receipt), 2) Buyer optional platform tip (buyer gets receipt). All optional, all tax-deductible.';
COMMENT ON FUNCTION calculate_three_layer_donations IS 'Calculates three-layer optional donation system. Seller donations go to seller as tax deduction, buyer donations go to platform.';
COMMENT ON VIEW seller_donation_summary IS 'Tax-deductible donations sellers have received (up to 7.5% per sale)';
COMMENT ON VIEW buyer_donation_summary IS 'Tax-deductible donations buyers have made to platform';
COMMENT ON VIEW platform_donation_revenue IS 'Monthly breakdown of all donations';

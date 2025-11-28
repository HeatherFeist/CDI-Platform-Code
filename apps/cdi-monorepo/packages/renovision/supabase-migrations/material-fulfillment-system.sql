-- =====================================================
-- MATERIAL FULFILLMENT SYSTEM
-- Database schema for integrated payment and procurement
-- =====================================================

-- Material Orders Table
-- Stores client-facing orders with retail pricing
CREATE TABLE IF NOT EXISTS material_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending-payment',
    -- pending-payment, paid, purchasing, ordered, shipped, delivered, cancelled
    
    -- Client-facing pricing (what they see and pay)
    client_total DECIMAL(12,2) NOT NULL,           -- Retail price subtotal
    client_tax_amount DECIMAL(12,2) NOT NULL,      -- Sales tax charged to client
    client_grand_total DECIMAL(12,2) NOT NULL,     -- Total client pays
    
    -- Actual purchase cost (tax-exempt + discounts)
    purchase_cost DECIMAL(12,2) NOT NULL,          -- What nonprofit actually pays
    estimated_savings DECIMAL(12,2) NOT NULL,      -- Expected margin
    actual_savings DECIMAL(12,2),                  -- Actual margin after purchase
    
    -- Payment information
    payment_intent_id VARCHAR(255),                -- Stripe payment intent ID
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, completed, failed, refunded
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Purchase orders (JSON array)
    purchase_orders JSONB NOT NULL DEFAULT '[]',
    
    -- Delivery information
    delivery_address TEXT NOT NULL,
    requested_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders Table (detailed tracking)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_order_id UUID REFERENCES material_orders(id) ON DELETE CASCADE,
    
    -- Retailer information
    retailer VARCHAR(50) NOT NULL,                 -- homedepot, lowes, menards
    retailer_order_number VARCHAR(100),            -- Retailer's order confirmation number
    tracking_number VARCHAR(100),                  -- Shipping tracking number
    
    -- Pricing breakdown
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,   -- Should be $0 (tax-exempt)
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Contractor discount applied
    total DECIMAL(12,2) NOT NULL,
    
    -- Nonprofit credentials
    tax_exempt_cert_number VARCHAR(100),           -- 501(c)(3) certificate number
    pro_account_number VARCHAR(100),               -- Retailer pro account number
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, submitted, confirmed, shipped, delivered, cancelled
    
    -- Dates
    submitted_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Items (JSON array)
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    notes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Tracking Table
-- For transparent reporting of margins and operating capital
CREATE TABLE IF NOT EXISTS material_order_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_order_id UUID REFERENCES material_orders(id) ON DELETE CASCADE,
    
    -- Revenue (from client)
    revenue_amount DECIMAL(12,2) NOT NULL,
    revenue_date TIMESTAMP WITH TIME ZONE,
    
    -- Cost (to retailers)
    cost_amount DECIMAL(12,2) NOT NULL,
    cost_date TIMESTAMP WITH TIME ZONE,
    
    -- Margin breakdown
    tax_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
    affiliate_commission DECIMAL(12,2) DEFAULT 0,
    total_margin DECIMAL(12,2) NOT NULL,
    margin_percentage DECIMAL(5,2) NOT NULL,
    
    -- Fund allocation
    allocated_to_operating_capital DECIMAL(12,2) NOT NULL,
    allocated_to_reserves DECIMAL(12,2) DEFAULT 0,
    
    -- Audit trail
    recorded_by UUID REFERENCES profiles(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operating Capital Fund Tracking
-- Manages the revolving fund for material purchases
CREATE TABLE IF NOT EXISTS operating_capital_fund (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    
    -- Current balance
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Transactions
    transaction_type VARCHAR(50) NOT NULL,
    -- deposit (from margin), withdrawal (for purchase), adjustment
    amount DECIMAL(12,2) NOT NULL,
    
    -- Reference
    material_order_id UUID REFERENCES material_orders(id),
    description TEXT,
    
    -- Balance after transaction
    balance_after DECIMAL(12,2) NOT NULL,
    
    -- Metadata
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_orders_estimate ON material_orders(estimate_id);
CREATE INDEX IF NOT EXISTS idx_material_orders_project ON material_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_material_orders_status ON material_orders(status);
CREATE INDEX IF NOT EXISTS idx_material_orders_payment_status ON material_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_material_order ON purchase_orders(material_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_retailer ON purchase_orders(retailer);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_financials_material_order ON material_order_financials(material_order_id);
CREATE INDEX IF NOT EXISTS idx_capital_fund_business ON operating_capital_fund(business_id);

-- Row Level Security (RLS) Policies

-- Material Orders
ALTER TABLE material_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business's material orders"
    ON material_orders FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can create material orders"
    ON material_orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = material_orders.business_id
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update material orders"
    ON material_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = material_orders.business_id
            AND role IN ('admin', 'manager')
        )
    );

-- Purchase Orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase orders for their material orders"
    ON purchase_orders FOR SELECT
    USING (
        material_order_id IN (
            SELECT id FROM material_orders
            WHERE business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Financials (Admin only)
ALTER TABLE material_order_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view financials"
    ON material_order_financials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Operating Capital Fund (Admin only)
ALTER TABLE operating_capital_fund ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view capital fund"
    ON operating_capital_fund FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = operating_capital_fund.business_id
            AND role = 'admin'
        )
    );

-- Functions for automatic calculations

-- Function to calculate actual savings after purchase
CREATE OR REPLACE FUNCTION calculate_actual_savings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND NEW.actual_savings IS NULL THEN
        NEW.actual_savings := NEW.client_grand_total - NEW.purchase_cost;
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_savings
    BEFORE UPDATE ON material_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_actual_savings();

-- Function to update operating capital fund
CREATE OR REPLACE FUNCTION update_operating_capital()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(12,2);
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Get current balance
        SELECT COALESCE(MAX(balance_after), 0) INTO current_balance
        FROM operating_capital_fund
        WHERE business_id = NEW.business_id;
        
        -- Add client payment to fund
        INSERT INTO operating_capital_fund (
            business_id,
            transaction_type,
            amount,
            material_order_id,
            description,
            balance_after,
            processed_by
        ) VALUES (
            NEW.business_id,
            'deposit',
            NEW.client_grand_total,
            NEW.id,
            'Client payment received',
            current_balance + NEW.client_grand_total,
            auth.uid()
        );
        
    ELSIF NEW.status = 'ordered' AND OLD.status != 'ordered' THEN
        -- Deduct purchase cost from fund
        SELECT COALESCE(MAX(balance_after), 0) INTO current_balance
        FROM operating_capital_fund
        WHERE business_id = NEW.business_id;
        
        INSERT INTO operating_capital_fund (
            business_id,
            transaction_type,
            amount,
            material_order_id,
            description,
            balance_after,
            processed_by
        ) VALUES (
            NEW.business_id,
            'withdrawal',
            -NEW.purchase_cost,
            NEW.id,
            'Materials purchased from retailers',
            current_balance - NEW.purchase_cost,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_capital_fund
    AFTER UPDATE ON material_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_operating_capital();

-- View for financial reporting
CREATE OR REPLACE VIEW material_order_summary AS
SELECT 
    mo.id,
    mo.estimate_id,
    mo.project_id,
    mo.business_id,
    mo.status,
    mo.client_grand_total,
    mo.purchase_cost,
    mo.actual_savings,
    mo.paid_at,
    p.name as project_name,
    b.name as business_name,
    COUNT(po.id) as purchase_order_count,
    mo.created_at
FROM material_orders mo
LEFT JOIN projects p ON p.id = mo.project_id
LEFT JOIN businesses b ON b.id = mo.business_id
LEFT JOIN purchase_orders po ON po.material_order_id = mo.id
GROUP BY mo.id, p.name, b.name;

-- Comments for documentation
COMMENT ON TABLE material_orders IS 'Client material orders with retail pricing and payment tracking';
COMMENT ON TABLE purchase_orders IS 'Actual purchase orders placed with retailers (tax-exempt + discounts)';
COMMENT ON TABLE material_order_financials IS 'Financial tracking for transparency and reporting';
COMMENT ON TABLE operating_capital_fund IS 'Revolving fund for material purchases, built from margins';

COMMENT ON COLUMN material_orders.client_grand_total IS 'Amount charged to client (retail + tax)';
COMMENT ON COLUMN material_orders.purchase_cost IS 'Actual cost paid to retailers (tax-exempt + discounts)';
COMMENT ON COLUMN material_orders.estimated_savings IS 'Expected margin (tax savings + discounts)';
COMMENT ON COLUMN material_orders.actual_savings IS 'Actual margin realized after purchase';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON material_orders TO authenticated;
GRANT SELECT ON purchase_orders TO authenticated;
GRANT SELECT ON material_order_summary TO authenticated;
GRANT SELECT ON operating_capital_fund TO authenticated;

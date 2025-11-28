-- ============================================================================
-- SUPPLIER PARTNERSHIP SYSTEM
-- ============================================================================
-- Enable big-box retailers (Lowe's, Home Depot, etc.) to list scratch/dent
-- and unsellable inventory directly to contractor marketplace
-- Keeps materials out of landfills, stores recover value, contractors save money
-- ============================================================================

-- ============================================================================
-- SUPPLIER ACCOUNTS TABLE
-- ============================================================================
-- Corporate accounts for retail partners

CREATE TABLE IF NOT EXISTS supplier_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    company_type TEXT CHECK (company_type IN ('big_box', 'local_supplier', 'manufacturer', 'wholesaler')) DEFAULT 'big_box',
    
    -- Contact Info
    primary_contact_name TEXT NOT NULL,
    primary_contact_email TEXT NOT NULL,
    primary_contact_phone TEXT,
    corporate_address TEXT,
    
    -- Partnership Details
    partnership_status TEXT CHECK (partnership_status IN ('pending', 'active', 'paused', 'terminated')) DEFAULT 'pending',
    partnership_started_at TIMESTAMP WITH TIME ZONE,
    
    -- Account Settings
    auto_approve_listings BOOLEAN DEFAULT false, -- Trust level
    default_pickup_locations TEXT[], -- Array of store addresses
    notification_email TEXT, -- Where to send sale notifications
    
    -- Financial
    commission_rate DECIMAL(4,2) DEFAULT 10.00, -- Platform takes 10% of sale
    payment_method TEXT CHECK (payment_method IN ('check', 'ach', 'donation', 'credit')) DEFAULT 'check',
    tax_id TEXT, -- For 1099 reporting
    
    -- Stats
    total_listings INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_items_diverted_from_landfill INTEGER DEFAULT 0, -- Environmental impact!
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_accounts_active ON supplier_accounts(is_active, partnership_status);

COMMENT ON TABLE supplier_accounts IS 
'Corporate supplier accounts for big-box retailers and wholesalers. Enables them to list clearance/damaged inventory directly to contractor marketplace.';


-- ============================================================================
-- SUPPLIER LISTINGS (Special Type)
-- ============================================================================
-- Extend existing listings table to support supplier partnerships

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES supplier_accounts(id),
ADD COLUMN IF NOT EXISTS is_supplier_listing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retail_value DECIMAL(10,2), -- Original shelf price
ADD COLUMN IF NOT EXISTS condition_notes TEXT, -- Damage description
ADD COLUMN IF NOT EXISTS pickup_location TEXT, -- Specific store address
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT, -- "Ask for receiving dept"
ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 1, -- Bulk lots
ADD COLUMN IF NOT EXISTS lot_description TEXT, -- "Pallet of 50 units"
ADD COLUMN IF NOT EXISTS environmental_impact TEXT; -- "Diverted from landfill"

CREATE INDEX IF NOT EXISTS idx_listings_supplier ON listings(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_supplier_active ON listings(is_supplier_listing) WHERE is_supplier_listing = true AND status = 'active';

COMMENT ON COLUMN listings.supplier_id IS 
'Links to supplier account if this listing is from a retail partner (Home Depot, Lowes, etc.)';

COMMENT ON COLUMN listings.retail_value IS 
'Original retail price before damage/clearance. Shows contractors the savings!';


-- ============================================================================
-- SUPPLIER LISTING CATEGORIES (Specific to Retail Clearance)
-- ============================================================================

INSERT INTO categories (name, description, icon) VALUES
('Scratch & Dent Appliances', 'Working appliances with cosmetic damage', '🏠'),
('Clearance Building Materials', 'Overstocked lumber, drywall, insulation', '🧱'),
('Return Items', 'Customer returns in good condition', '↩️'),
('Discontinued Products', 'End-of-line items, full functionality', '📦'),
('Bulk Pallets', 'Mixed pallets of miscellaneous items', '🚛'),
('Seasonal Clearance', 'End of season inventory', '🍂'),
('Display Models', 'Floor models, fully functional', '✨'),
('Packaging Damage', 'Product perfect, box damaged', '📦')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- SUPPLIER DASHBOARD VIEW
-- ============================================================================
-- What each supplier sees about their performance

CREATE OR REPLACE VIEW supplier_dashboard AS
SELECT 
    sa.id as supplier_id,
    sa.company_name,
    sa.partnership_status,
    
    -- Listing Stats
    COUNT(DISTINCT l.id) as active_listings,
    COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END) as total_sold,
    
    -- Financial Stats
    SUM(CASE WHEN l.status = 'sold' THEN l.current_price ELSE 0 END) as total_revenue,
    SUM(CASE WHEN l.status = 'sold' THEN l.current_price * (sa.commission_rate / 100) ELSE 0 END) as platform_fees,
    SUM(CASE WHEN l.status = 'sold' THEN l.current_price * (1 - sa.commission_rate / 100) ELSE 0 END) as net_revenue,
    
    -- Environmental Impact
    SUM(CASE WHEN l.status = 'sold' THEN l.quantity_available ELSE 0 END) as items_diverted_from_landfill,
    
    -- Value Recovery
    SUM(CASE WHEN l.status = 'sold' THEN l.retail_value ELSE 0 END) as original_retail_value,
    SUM(CASE WHEN l.status = 'sold' THEN l.current_price ELSE 0 END) as auction_recovery_value,
    ROUND(
        (SUM(CASE WHEN l.status = 'sold' THEN l.current_price ELSE 0 END)::DECIMAL / 
         NULLIF(SUM(CASE WHEN l.status = 'sold' THEN l.retail_value ELSE 0 END), 0)) * 100,
        1
    ) as recovery_percentage,
    
    -- Timing
    AVG(EXTRACT(EPOCH FROM (l.sold_at - l.created_at)) / 86400) as avg_days_to_sell,
    
    -- Recent Activity
    MAX(l.created_at) as last_listing_date,
    MAX(l.sold_at) as last_sale_date
    
FROM supplier_accounts sa
LEFT JOIN listings l ON sa.id = l.supplier_id
WHERE sa.is_active = true
GROUP BY sa.id, sa.company_name, sa.partnership_status, sa.commission_rate;

GRANT SELECT ON supplier_dashboard TO authenticated;

COMMENT ON VIEW supplier_dashboard IS 
'Performance dashboard for each supplier partner. Shows revenue, environmental impact, and recovery rates.';


-- ============================================================================
-- CONTRACTOR BENEFITS VIEW
-- ============================================================================
-- Show members how much they save on supplier deals

CREATE OR REPLACE VIEW contractor_supplier_savings AS
SELECT 
    p.id as member_id,
    p.username,
    p.first_name || ' ' || p.last_name as full_name,
    
    -- Purchase Stats
    COUNT(DISTINCT t.id) as supplier_purchases,
    SUM(l.retail_value) as retail_value_purchased,
    SUM(t.final_amount) as actual_amount_paid,
    SUM(l.retail_value - t.final_amount) as total_savings,
    ROUND(
        ((SUM(l.retail_value) - SUM(t.final_amount))::DECIMAL / NULLIF(SUM(l.retail_value), 0)) * 100,
        1
    ) as savings_percentage,
    
    -- Environmental Impact
    SUM(l.quantity_available) as items_saved_from_landfill,
    
    -- Recent Activity
    MAX(t.created_at) as last_purchase_date
    
FROM profiles p
JOIN transactions t ON p.id = t.buyer_id
JOIN listings l ON t.listing_id = l.id
WHERE l.is_supplier_listing = true
    AND t.status = 'completed'
GROUP BY p.id, p.username, p.first_name, p.last_name
ORDER BY total_savings DESC;

GRANT SELECT ON contractor_supplier_savings TO authenticated;

COMMENT ON VIEW contractor_supplier_savings IS 
'Shows each contractor how much money they saved buying from supplier listings vs retail. Powerful motivator!';


-- ============================================================================
-- SUPPLIER ONBOARDING WORKFLOW
-- ============================================================================

-- Function: Submit partnership application
CREATE OR REPLACE FUNCTION apply_as_supplier(
    p_company_name TEXT,
    p_company_type TEXT,
    p_contact_name TEXT,
    p_contact_email TEXT,
    p_contact_phone TEXT DEFAULT NULL,
    p_corporate_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_supplier_id UUID;
BEGIN
    INSERT INTO supplier_accounts (
        company_name,
        company_type,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        corporate_address,
        partnership_status
    ) VALUES (
        p_company_name,
        p_company_type,
        p_contact_name,
        p_contact_email,
        p_contact_phone,
        p_corporate_address,
        'pending'
    ) RETURNING id INTO v_supplier_id;
    
    -- Notify director about new application
    INSERT INTO notifications (
        profile_id,
        type,
        title,
        message
    ) VALUES (
        '0a1bce62-23b6-42d1-b597-e923d128ae0c', -- Director's profile ID
        'new_supplier_application',
        'New Supplier Partnership Application',
        p_company_name || ' (' || p_company_type || ') has applied to become a supplier partner. Contact: ' || p_contact_email
    );
    
    RETURN v_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_as_supplier IS 
'Public function for suppliers to apply for partnership. Creates pending account and notifies director.';


-- Function: Approve supplier partnership
CREATE OR REPLACE FUNCTION approve_supplier_partnership(
    p_supplier_id UUID,
    p_commission_rate DECIMAL DEFAULT 10.00,
    p_auto_approve_listings BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
    UPDATE supplier_accounts
    SET 
        partnership_status = 'active',
        partnership_started_at = NOW(),
        commission_rate = p_commission_rate,
        auto_approve_listings = p_auto_approve_listings,
        updated_at = NOW()
    WHERE id = p_supplier_id;
    
    -- Notify supplier of approval
    -- (Would send email via Edge Function)
    
    RAISE NOTICE 'Supplier partnership approved: %', p_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SUPPLIER LISTING CREATION (Special Flow)
-- ============================================================================

-- Function: Create supplier listing (simplified for batch uploads)
CREATE OR REPLACE FUNCTION create_supplier_listing(
    p_supplier_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_category TEXT,
    p_retail_value DECIMAL,
    p_starting_bid DECIMAL,
    p_condition_notes TEXT,
    p_pickup_location TEXT,
    p_quantity INTEGER DEFAULT 1,
    p_images TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_listing_id UUID;
    v_category_id UUID;
BEGIN
    -- Get category ID
    SELECT id INTO v_category_id FROM categories WHERE name = p_category LIMIT 1;
    
    -- Create listing
    INSERT INTO listings (
        seller_id, -- Supplier doesn't need a profile, handled separately
        supplier_id,
        is_supplier_listing,
        title,
        description,
        category_id,
        starting_price,
        current_price,
        retail_value,
        condition_notes,
        pickup_location,
        quantity_available,
        images,
        listing_type,
        status,
        environmental_impact
    ) VALUES (
        NULL, -- No individual seller
        p_supplier_id,
        true,
        p_title,
        p_description,
        v_category_id,
        p_starting_bid,
        p_starting_bid,
        p_retail_value,
        p_condition_notes,
        p_pickup_location,
        p_quantity,
        p_images,
        'auction',
        'active',
        'Diverted from landfill ♻️'
    ) RETURNING id INTO v_listing_id;
    
    -- Update supplier stats
    UPDATE supplier_accounts
    SET total_listings = total_listings + 1,
        updated_at = NOW()
    WHERE id = p_supplier_id;
    
    RETURN v_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_supplier_listing IS 
'Simplified listing creation for supplier partners. Handles batch uploads of clearance inventory.';


-- ============================================================================
-- ENVIRONMENTAL IMPACT TRACKING
-- ============================================================================

CREATE OR REPLACE VIEW environmental_impact_stats AS
SELECT 
    'Total Items Diverted from Landfill' as metric,
    SUM(quantity_available)::TEXT as value
FROM listings
WHERE is_supplier_listing = true AND status = 'sold'

UNION ALL

SELECT 
    'Estimated Retail Value Recovered' as metric,
    '$' || TO_CHAR(SUM(retail_value), 'FM999,999,999.00') as value
FROM listings
WHERE is_supplier_listing = true AND status = 'sold'

UNION ALL

SELECT 
    'Total Revenue to Suppliers' as metric,
    '$' || TO_CHAR(SUM(current_price), 'FM999,999,999.00') as value
FROM listings
WHERE is_supplier_listing = true AND status = 'sold'

UNION ALL

SELECT 
    'Total Savings to Contractors' as metric,
    '$' || TO_CHAR(SUM(retail_value - current_price), 'FM999,999,999.00') as value
FROM listings
WHERE is_supplier_listing = true AND status = 'sold'

UNION ALL

SELECT 
    'Partner Stores' as metric,
    COUNT(DISTINCT id)::TEXT as value
FROM supplier_accounts
WHERE partnership_status = 'active';

GRANT SELECT ON environmental_impact_stats TO authenticated;

COMMENT ON VIEW environmental_impact_stats IS 
'Public-facing environmental and economic impact statistics. Great for PR and showing value to all stakeholders.';


-- ============================================================================
-- SUPPLIER API INTEGRATION (For Future Automation)
-- ============================================================================

-- Table: Store supplier API keys for automated listing uploads
CREATE TABLE IF NOT EXISTS supplier_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_accounts(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    api_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_supplier_api_keys_active ON supplier_api_keys(api_key) WHERE is_active = true;

COMMENT ON TABLE supplier_api_keys IS 
'API credentials for suppliers to automate listing uploads. Future: Home Depot uploads clearance items nightly via API.';


-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Supplier accounts: Public read (for transparency)
ALTER TABLE supplier_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active suppliers"
    ON supplier_accounts FOR SELECT
    USING (is_active = true AND partnership_status = 'active');

-- Supplier listings: Public read
CREATE POLICY "Public can view supplier listings"
    ON listings FOR SELECT
    USING (is_supplier_listing = true OR seller_id = auth.uid());

-- Members can bid on supplier listings
CREATE POLICY "Members can bid on supplier listings"
    ON bids FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id 
            AND (is_supplier_listing = true OR seller_id != auth.uid())
        )
    );


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
================================================================================
✅ SUPPLIER PARTNERSHIP SYSTEM INSTALLED
================================================================================

🏢 Corporate Accounts:
- supplier_accounts: Track partnerships with Home Depot, Lowes, etc.
- Partnership status, commission rates, contact info
- Auto-approve trusted partners for faster listings

📦 Enhanced Listings:
- Supplier listings with retail value comparison
- Condition notes, bulk quantities, pickup locations
- "Diverted from landfill" environmental messaging

📊 Dashboards:
- supplier_dashboard: Each supplier sees their performance
- contractor_supplier_savings: Members see how much they save
- environmental_impact_stats: Public-facing impact metrics

🔧 Functions:
- apply_as_supplier(): Public application form
- approve_supplier_partnership(): Director approves partnerships
- create_supplier_listing(): Simplified batch listing creation

💰 Value Proposition:

For Suppliers:
✅ Recover value from unsellable inventory (instead of $0)
✅ Free disposal/pickup (members handle logistics)
✅ Environmental PR win (landfill diversion)
✅ Tax benefits (potential donation deduction)
✅ Zero effort (automated platform)

For Contractors:
✅ 40-80% savings vs retail on NEW products
✅ Access to commercial-grade materials
✅ Bulk lots perfect for multiple jobs
✅ Local pickup, inspect before buying
✅ Scratch/dent irrelevant for most applications

For Environment:
✅ Keeps materials out of landfills
✅ Extends product lifecycle
✅ Reduces waste in construction industry

Partnership Pitch:
"Mr. Home Depot Manager, instead of throwing away that pallet of scratched 
appliances, list them on our contractor marketplace. You get $500 instead 
of $0, we handle pickup, and you can tell corporate you diverted 2 tons 
from the landfill this quarter. Win-win-win."

Next Steps:
1. Create supplier application landing page
2. Design partnership pitch deck (environmental + financial benefits)
3. Set up automated listing uploads (API integration)
4. Build supplier onboarding workflow
5. Approach local stores first (pilot program), then scale to regional/national

This could be HUGE. 🚀
================================================================================
    ';
END $$;

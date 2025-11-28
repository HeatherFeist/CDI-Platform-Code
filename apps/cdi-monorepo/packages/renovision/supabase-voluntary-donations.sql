-- =====================================================
-- VOLUNTARY DONATION & TAX REPORTING SYSTEM
-- =====================================================

-- 1. Update transactions table to include donation tracking
ALTER TABLE transactions
ADD COLUMN donation_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN donation_percentage DECIMAL(5,2),
ADD COLUMN is_tax_deductible BOOLEAN DEFAULT true,
ADD COLUMN donation_receipt_sent BOOLEAN DEFAULT false,
ADD COLUMN donation_receipt_date TIMESTAMP WITH TIME ZONE;

-- 2. Create tax_documents table for W-9 and other forms
CREATE TABLE tax_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) CHECK (document_type IN ('w9', '1099-k', 'donation_receipt', 'earnings_summary')),
    tax_year INTEGER NOT NULL,
    document_url TEXT,
    document_data JSONB, -- Structured data for generating documents
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, document_type, tax_year)
);

-- 3. Create donation_history table for detailed tracking
CREATE TABLE donation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    donation_amount DECIMAL(10,2) NOT NULL,
    donation_percentage DECIMAL(5,2),
    earnings_amount DECIMAL(10,2) NOT NULL, -- What they earned from this payment
    suggested_amount DECIMAL(10,2), -- What we suggested (5%)
    donation_choice VARCHAR(50) CHECK (donation_choice IN ('custom', 'suggested', 'preset_low', 'preset_mid', 'preset_high', 'skipped')),
    tax_year INTEGER NOT NULL,
    receipt_number VARCHAR(50) UNIQUE,
    receipt_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create tax_settings table for user preferences
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    legal_name VARCHAR(200),
    business_name VARCHAR(200),
    tax_id_type VARCHAR(20) CHECK (tax_id_type IN ('ssn', 'ein')),
    tax_id_last_four VARCHAR(4), -- Only store last 4 digits for security
    tax_id_encrypted TEXT, -- Full encrypted version for 1099 generation
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'US',
    w9_submitted BOOLEAN DEFAULT false,
    w9_submitted_date TIMESTAMP WITH TIME ZONE,
    default_donation_percentage DECIMAL(5,2) DEFAULT 5.00,
    remind_donation BOOLEAN DEFAULT true, -- Show donation prompt
    auto_send_receipts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create annual_tax_summary view
CREATE VIEW annual_tax_summary AS
SELECT 
    p.id as profile_id,
    p.username,
    p.email,
    EXTRACT(YEAR FROM t.created_at) as tax_year,
    SUM(t.amount) as total_earned,
    SUM(t.donation_amount) as total_donated,
    COUNT(DISTINCT t.id) as number_of_payments,
    AVG(t.donation_percentage) as avg_donation_percentage,
    COUNT(DISTINCT CASE WHEN t.donation_amount > 0 THEN t.id END) as times_donated,
    COUNT(DISTINCT CASE WHEN t.donation_amount = 0 THEN t.id END) as times_skipped
FROM profiles p
LEFT JOIN transactions t ON p.id = t.user_id
WHERE t.type = 'payment_received'
GROUP BY p.id, p.username, p.email, EXTRACT(YEAR FROM t.created_at);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_tax_documents_profile_year ON tax_documents(profile_id, tax_year);
CREATE INDEX idx_donation_history_profile_year ON donation_history(profile_id, tax_year);
CREATE INDEX idx_donation_history_receipt ON donation_history(receipt_number);
CREATE INDEX idx_tax_settings_profile ON tax_settings(profile_id);
CREATE INDEX idx_transactions_donation ON transactions(donation_amount) WHERE donation_amount > 0;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Tax Documents: Users can only see their own
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax documents"
    ON tax_documents FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Users can create own tax documents"
    ON tax_documents FOR INSERT
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own tax documents"
    ON tax_documents FOR UPDATE
    USING (profile_id = auth.uid());

-- Donation History: Users can view their own, admins can view all
ALTER TABLE donation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own donation history"
    ON donation_history FOR SELECT
    USING (profile_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "System can create donation records"
    ON donation_history FOR INSERT
    WITH CHECK (true); -- Created by system

-- Tax Settings: Users can manage their own
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax settings"
    ON tax_settings FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Users can create own tax settings"
    ON tax_settings FOR INSERT
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own tax settings"
    ON tax_settings FOR UPDATE
    USING (profile_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    year_str TEXT;
    random_str TEXT;
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');
    random_str := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    RETURN 'CDI-' || year_str || '-' || random_str;
END;
$$ LANGUAGE plpgsql;

-- Function to create donation record when transaction includes donation
CREATE OR REPLACE FUNCTION create_donation_record()
RETURNS TRIGGER AS $$
DECLARE
    earnings_amt DECIMAL(10,2);
    receipt_num TEXT;
BEGIN
    IF NEW.donation_amount > 0 THEN
        -- Calculate earnings (transaction amount minus donation)
        earnings_amt := NEW.amount - NEW.donation_amount;
        
        -- Generate receipt number
        receipt_num := generate_receipt_number();
        
        -- Create donation history record
        INSERT INTO donation_history (
            profile_id,
            transaction_id,
            donation_amount,
            donation_percentage,
            earnings_amount,
            suggested_amount,
            donation_choice,
            tax_year,
            receipt_number
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.donation_amount,
            NEW.donation_percentage,
            earnings_amt,
            earnings_amt * 0.05, -- 5% suggestion
            'custom', -- Could be determined by comparing to presets
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            receipt_num
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create donation record
CREATE TRIGGER trigger_create_donation_record
    AFTER INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.donation_amount > 0)
    EXECUTE FUNCTION create_donation_record();

-- Function to initialize tax settings on profile creation
CREATE OR REPLACE FUNCTION create_tax_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tax_settings (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create tax settings
CREATE TRIGGER trigger_create_tax_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_tax_settings();

-- Function to update annual tax summary
CREATE OR REPLACE FUNCTION get_user_tax_summary(
    user_id UUID,
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS TABLE(
    total_earned DECIMAL(10,2),
    total_donated DECIMAL(10,2),
    number_of_payments INTEGER,
    number_of_donations INTEGER,
    avg_donation_pct DECIMAL(5,2),
    tax_benefit_estimate DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t.amount), 0) as total_earned,
        COALESCE(SUM(t.donation_amount), 0) as total_donated,
        COUNT(t.id)::INTEGER as number_of_payments,
        COUNT(CASE WHEN t.donation_amount > 0 THEN 1 END)::INTEGER as number_of_donations,
        COALESCE(AVG(CASE WHEN t.donation_amount > 0 THEN t.donation_percentage END), 0) as avg_donation_pct,
        COALESCE(SUM(t.donation_amount) * 0.24, 0) as tax_benefit_estimate -- Assume 24% tax bracket
    FROM transactions t
    WHERE t.user_id = get_user_tax_summary.user_id
        AND EXTRACT(YEAR FROM t.created_at) = get_user_tax_summary.year
        AND t.type = 'payment_received';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONATION PRESET CONFIGURATIONS
-- =====================================================

-- Create table for donation presets (configurable by admins)
CREATE TABLE donation_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_name VARCHAR(50) UNIQUE NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    display_order INTEGER NOT NULL,
    is_recommended BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default presets
INSERT INTO donation_presets (preset_name, percentage, display_order, is_recommended, description) VALUES
('modest', 2.5, 1, false, 'Every bit helps!'),
('standard', 5.0, 2, true, 'Recommended - Supports all programs'),
('generous', 7.5, 3, false, 'Extra impact for the community'),
('champion', 10.0, 4, false, 'Maximum support - Thank you!');

-- RLS for donation presets
ALTER TABLE donation_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donation presets"
    ON donation_presets FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage donation presets"
    ON donation_presets FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Create tax settings for existing users
INSERT INTO tax_settings (profile_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT profile_id FROM tax_settings);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Quarterly donation summary for nonprofit reporting
CREATE VIEW quarterly_donation_summary AS
SELECT 
    EXTRACT(YEAR FROM dh.created_at) as year,
    EXTRACT(QUARTER FROM dh.created_at) as quarter,
    COUNT(DISTINCT dh.profile_id) as unique_donors,
    COUNT(dh.id) as total_donations,
    SUM(dh.donation_amount) as total_amount,
    AVG(dh.donation_percentage) as avg_percentage,
    SUM(dh.earnings_amount) as total_earnings_base
FROM donation_history dh
GROUP BY EXTRACT(YEAR FROM dh.created_at), EXTRACT(QUARTER FROM dh.created_at)
ORDER BY year DESC, quarter DESC;

-- Top donors leaderboard (anonymous, just stats)
CREATE VIEW top_donors_stats AS
SELECT 
    EXTRACT(YEAR FROM dh.created_at) as year,
    dh.profile_id,
    p.username,
    COUNT(dh.id) as donation_count,
    SUM(dh.donation_amount) as total_donated,
    AVG(dh.donation_percentage) as avg_percentage,
    RANK() OVER (PARTITION BY EXTRACT(YEAR FROM dh.created_at) ORDER BY SUM(dh.donation_amount) DESC) as donor_rank
FROM donation_history dh
JOIN profiles p ON dh.profile_id = p.id
GROUP BY EXTRACT(YEAR FROM dh.created_at), dh.profile_id, p.username
ORDER BY year DESC, total_donated DESC;

-- ============================================================================
-- CONSTRUCTIVE DESIGNS TOOL RENTAL & DONATION SYSTEM
-- Warranty-Cycling, Rent-to-Own, Tax-Deductible Donation Platform
-- ============================================================================

-- ============================================================================
-- 1. TOOL BRANDS & CATEGORIES
-- ============================================================================

CREATE TABLE tool_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL UNIQUE, -- 'Ryobi', 'DeWalt', 'Milwaukee', etc.
  warranty_period_months INTEGER, -- 36 for Ryobi, NULL for Ridgid (lifetime)
  is_lifetime_warranty BOOLEAN DEFAULT FALSE,
  tax_exempt_discount_pct NUMERIC(5,2) DEFAULT 35.00, -- 35% off retail
  bulk_discount_pct NUMERIC(5,2) DEFAULT 10.00, -- Additional 10% bulk
  total_discount_pct NUMERIC(5,2) GENERATED ALWAYS AS (tax_exempt_discount_pct + bulk_discount_pct) STORED,
  handling_fee_pct NUMERIC(5,2) DEFAULT 15.00, -- 15% handling fee
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tool_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_name TEXT NOT NULL UNIQUE, -- 'Drills', 'Saws', 'Sanders', etc.
  icon TEXT, -- Material icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TOOL INVENTORY (All Tools - New, Used, Broken)
-- ============================================================================

CREATE TYPE tool_condition AS ENUM (
  'brand_new',      -- Never used, full warranty
  'excellent',      -- Donated, minimal wear, functional
  'good',           -- Donated, normal wear, functional  
  'fair',           -- Heavy wear but functional
  'poor',           -- Barely functional, needs repair soon
  'broken',         -- Not functional, in repair queue
  'under_repair',   -- Being repaired by mechanic
  'beyond_repair'   -- Cannot be economically repaired
);

CREATE TYPE tool_status AS ENUM (
  'available',        -- Ready to rent
  'rented',          -- Currently with member
  'reserved',        -- Reserved for incoming rental
  'maintenance',     -- Scheduled maintenance
  'warranty_claim',  -- Sent for warranty replacement
  'retired'          -- Removed from circulation
);

CREATE TABLE tool_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  brand_id UUID REFERENCES tool_brands(id) NOT NULL,
  category_id UUID REFERENCES tool_categories(id) NOT NULL,
  tool_name TEXT NOT NULL, -- 'Impact/Drill Combo Kit'
  model_number TEXT,
  serial_number TEXT UNIQUE,
  
  -- Financial Info
  retail_price NUMERIC(10,2) NOT NULL, -- $199
  platform_cost NUMERIC(10,2), -- $110 (for new tools purchased by platform)
  member_rental_price NUMERIC(10,2) NOT NULL, -- $229 (retail + handling)
  weekly_rental_rate NUMERIC(10,2) NOT NULL, -- $2.50/week
  
  -- Acquisition Info
  acquisition_type TEXT NOT NULL, -- 'purchased_new', 'donated_working', 'donated_broken'
  acquired_from_member_id UUID REFERENCES profiles(id), -- If donated
  acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  acquisition_cost NUMERIC(10,2) DEFAULT 0, -- What platform paid (0 for donations)
  
  -- Physical Condition
  condition tool_condition NOT NULL DEFAULT 'brand_new',
  status tool_status NOT NULL DEFAULT 'available',
  condition_notes TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  
  -- Warranty Info
  has_manufacturer_warranty BOOLEAN DEFAULT TRUE,
  warranty_start_date DATE,
  warranty_expiry_date DATE,
  warranty_claim_count INTEGER DEFAULT 0,
  
  -- Usage Tracking
  total_rental_weeks INTEGER DEFAULT 0,
  total_revenue_generated NUMERIC(10,2) DEFAULT 0,
  times_rented INTEGER DEFAULT 0,
  times_repaired INTEGER DEFAULT 0,
  
  -- Storage
  photo_url TEXT,
  storage_location TEXT, -- 'Warehouse A, Shelf 12'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TOOL RENTAL AGREEMENTS (Rent-to-Own Contracts)
-- ============================================================================

CREATE TYPE rental_status AS ENUM (
  'active',           -- Currently renting
  'paused',          -- Temporarily paused (member request)
  'completed',       -- Paid off, member owns it
  'returned',        -- Member returned before payoff
  'defaulted',       -- Missed payments, tool reclaimed
  'traded_in'        -- Traded for upgrade
);

CREATE TABLE tool_rental_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties
  member_id UUID REFERENCES profiles(id) NOT NULL,
  tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  
  -- Financial Terms
  total_cost NUMERIC(10,2) NOT NULL, -- $229 (retail + handling)
  weekly_rate NUMERIC(10,2) NOT NULL, -- $2.50/week
  minimum_weekly_payment NUMERIC(10,2) NOT NULL, -- Based on warranty period
  
  -- Payment Tracking
  amount_paid NUMERIC(10,2) DEFAULT 0,
  amount_remaining NUMERIC(10,2),
  weeks_paid INTEGER DEFAULT 0,
  estimated_weeks_remaining INTEGER,
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Status
  status rental_status DEFAULT 'active',
  
  -- Platform Warranty
  platform_warranty_active BOOLEAN DEFAULT TRUE,
  platform_warranty_expiry DATE, -- = expected_completion_date
  
  -- Auto-deduct from project earnings
  auto_deduct_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. RENTAL PAYMENTS
-- ============================================================================

CREATE TABLE tool_rental_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  agreement_id UUID REFERENCES tool_rental_agreements(id) NOT NULL,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source
  deducted_from_project_id UUID REFERENCES projects(id), -- If auto-deducted
  payment_method TEXT, -- 'auto_deduct', 'manual', 'card'
  
  -- Receipt
  receipt_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TOOL DONATIONS & TAX RECEIPTS
-- ============================================================================

CREATE TYPE donation_condition_grade AS ENUM (
  'excellent',  -- 100% deduction, 20% credit
  'good',       -- 100% deduction, 20% credit
  'fair',       -- 50-75% deduction, 10% credit
  'poor',       -- 10-25% deduction, 5% credit
  'broken'      -- 0% deduction, 0% credit (but accepted)
);

CREATE TABLE tool_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Donor Info
  donor_member_id UUID REFERENCES profiles(id) NOT NULL,
  original_agreement_id UUID REFERENCES tool_rental_agreements(id), -- If donated after payoff
  
  -- Tool Info
  tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  tool_brand TEXT NOT NULL,
  tool_model TEXT NOT NULL,
  original_price_paid NUMERIC(10,2) NOT NULL,
  
  -- Condition Assessment
  condition_grade donation_condition_grade NOT NULL,
  condition_notes TEXT,
  inspection_photos JSONB, -- Array of photo URLs
  
  -- Warranty Status at Donation
  warranty_active_at_donation BOOLEAN,
  warranty_months_remaining INTEGER,
  
  -- Tax Deduction
  fair_market_value NUMERIC(10,2) NOT NULL, -- What IRS receipt shows
  deduction_percentage NUMERIC(5,2) NOT NULL, -- 100%, 75%, 50%, etc.
  tax_deduction_amount NUMERIC(10,2) NOT NULL,
  tax_receipt_issued BOOLEAN DEFAULT FALSE,
  tax_receipt_url TEXT,
  tax_receipt_issued_at TIMESTAMPTZ,
  
  -- Platform Credit
  platform_credit_percentage NUMERIC(5,2) NOT NULL, -- 20%, 10%, 5%, 0%
  platform_credit_amount NUMERIC(10,2) NOT NULL,
  credit_applied_to_agreement_id UUID REFERENCES tool_rental_agreements(id),
  
  -- Processing
  donation_date TIMESTAMPTZ DEFAULT NOW(),
  accepted BOOLEAN DEFAULT TRUE, -- Even broken tools accepted
  processed_by UUID REFERENCES profiles(id), -- Staff member who processed
  
  -- Badge Award
  donor_badge_awarded TEXT, -- 'Tool Donor 🛠️', 'Tool Supporter 🔧'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TOOL REPAIRS & MAINTENANCE
-- ============================================================================

CREATE TYPE repair_status AS ENUM (
  'pending',      -- In queue, not started
  'in_progress',  -- Mechanic working on it
  'completed',    -- Repair finished, ready to rent
  'parts_ordered',-- Waiting for parts
  'beyond_repair' -- Cannot be fixed economically
);

CREATE TABLE tool_repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tool Info
  tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  reported_by_member_id UUID REFERENCES profiles(id), -- Member who reported issue
  
  -- Issue Details
  issue_description TEXT NOT NULL,
  issue_photos JSONB, -- Array of photo URLs
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Repair Details
  diagnosis TEXT,
  parts_needed JSONB, -- [{part: 'Bearing', cost: 8.50}, {part: 'Switch', cost: 6.25}]
  labor_hours NUMERIC(4,2),
  
  -- Costs
  parts_cost NUMERIC(10,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  total_repair_cost NUMERIC(10,2) GENERATED ALWAYS AS (parts_cost + labor_cost) STORED,
  
  -- Mechanic
  assigned_to_mechanic_id UUID REFERENCES profiles(id),
  mechanic_hourly_rate NUMERIC(10,2) DEFAULT 25.00,
  
  -- Status
  status repair_status DEFAULT 'pending',
  priority TEXT DEFAULT 'normal', -- 'urgent', 'normal', 'low'
  
  -- Timeline
  repair_started_at TIMESTAMPTZ,
  repair_completed_at TIMESTAMPTZ,
  estimated_completion_date DATE,
  
  -- Resolution
  repair_notes TEXT,
  back_in_inventory BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. WARRANTY CLAIMS & CYCLING
-- ============================================================================

CREATE TYPE warranty_claim_status AS ENUM (
  'submitted',      -- Claim submitted to manufacturer
  'approved',       -- Manufacturer approved
  'replacement_received', -- New tool received
  'denied',         -- Claim denied
  'withdrawn'       -- Platform withdrew claim
);

CREATE TABLE warranty_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Original Broken Tool
  broken_tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  rental_agreement_id UUID REFERENCES tool_rental_agreements(id), -- Member affected
  
  -- Warranty Holder (The NEW tool we claim on)
  warranty_holder_tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  
  -- Claim Details
  failure_description TEXT NOT NULL,
  failure_date DATE NOT NULL,
  photos JSONB, -- Proof of failure
  
  -- Manufacturer Response
  claim_number TEXT, -- Manufacturer's claim #
  submitted_to_manufacturer_at DATE,
  manufacturer_response TEXT,
  status warranty_claim_status DEFAULT 'submitted',
  
  -- Replacement Tool
  replacement_tool_id UUID REFERENCES tool_inventory(id), -- New tool received
  replacement_received_at DATE,
  
  -- Member Impact
  member_downtime_hours INTEGER DEFAULT 0, -- How long member waited
  replacement_tool_given_to_member BOOLEAN DEFAULT FALSE,
  
  -- Financial Impact
  claim_value NUMERIC(10,2), -- Value of replacement tool
  platform_cost_avoided NUMERIC(10,2), -- What platform would have paid
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. TOOL UPGRADE TRADE-INS
-- ============================================================================

CREATE TABLE tool_trade_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Member & Old Tool
  member_id UUID REFERENCES profiles(id) NOT NULL,
  old_agreement_id UUID REFERENCES tool_rental_agreements(id) NOT NULL,
  old_tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  
  -- Upgrade Info
  new_agreement_id UUID REFERENCES tool_rental_agreements(id) NOT NULL,
  new_tool_id UUID REFERENCES tool_inventory(id) NOT NULL,
  
  -- Trade-In Value
  amount_paid_on_old_tool NUMERIC(10,2) NOT NULL,
  payment_completion_percentage NUMERIC(5,2) NOT NULL, -- 50% = 50.00
  trade_in_credit_percentage NUMERIC(5,2) NOT NULL, -- 25%, 50%, 70%
  trade_in_credit_amount NUMERIC(10,2) NOT NULL,
  
  -- Applied to New Tool
  new_tool_total_cost NUMERIC(10,2) NOT NULL,
  new_tool_balance_after_credit NUMERIC(10,2) NOT NULL,
  
  -- Old Tool Disposition
  old_tool_returned_condition TEXT,
  old_tool_added_to_inventory BOOLEAN DEFAULT TRUE,
  
  trade_in_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TOOL MECHANIC PROFILES
-- ============================================================================

CREATE TABLE tool_mechanics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  
  -- Mechanic Info
  specialties TEXT[], -- ['Power Tools', 'Hand Tools', 'Pneumatic']
  certifications TEXT[], -- ['Certified Tool Technician', 'Milwaukee Service']
  hourly_rate NUMERIC(10,2) DEFAULT 25.00,
  
  -- Stats
  total_repairs_completed INTEGER DEFAULT 0,
  average_repair_time_hours NUMERIC(5,2),
  total_earnings NUMERIC(10,2) DEFAULT 0,
  member_rating NUMERIC(3,2), -- 4.85
  
  -- Availability
  available_for_repairs BOOLEAN DEFAULT TRUE,
  max_concurrent_repairs INTEGER DEFAULT 5,
  current_repair_queue_size INTEGER DEFAULT 0,
  
  -- Payment
  payment_type TEXT DEFAULT 'per_repair', -- 'per_repair', 'hourly', 'salary'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Calculate weekly rental rate based on warranty period
CREATE OR REPLACE FUNCTION calculate_weekly_rental_rate(
  p_member_price NUMERIC,
  p_warranty_months INTEGER,
  p_is_lifetime BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
  v_weekly_rate NUMERIC;
  v_total_weeks INTEGER;
BEGIN
  IF p_is_lifetime THEN
    -- For lifetime warranty, use 5-year timeline (260 weeks)
    v_total_weeks := 260;
  ELSE
    -- For fixed warranty, spread over warranty period
    v_total_weeks := (p_warranty_months * 52.0 / 12.0)::INTEGER;
  END IF;
  
  v_weekly_rate := ROUND(p_member_price / v_total_weeks, 2);
  
  RETURN v_weekly_rate;
END;
$$ LANGUAGE plpgsql;

-- Calculate trade-in credit based on payment completion
CREATE OR REPLACE FUNCTION calculate_trade_in_credit(
  p_amount_paid NUMERIC,
  p_payment_completion_pct NUMERIC
) RETURNS TABLE (
  credit_percentage NUMERIC,
  credit_amount NUMERIC
) AS $$
BEGIN
  -- Tiered credit structure
  IF p_payment_completion_pct >= 75 THEN
    credit_percentage := 70.00;
  ELSIF p_payment_completion_pct >= 50 THEN
    credit_percentage := 50.00;
  ELSIF p_payment_completion_pct >= 25 THEN
    credit_percentage := 25.00;
  ELSE
    credit_percentage := 0.00;
  END IF;
  
  credit_amount := ROUND(p_amount_paid * credit_percentage / 100.0, 2);
  
  RETURN QUERY SELECT credit_percentage, credit_amount;
END;
$$ LANGUAGE plpgsql;

-- Process rental payment and update agreement
CREATE OR REPLACE FUNCTION process_rental_payment(
  p_agreement_id UUID,
  p_amount NUMERIC,
  p_project_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_agreement RECORD;
  v_new_amount_paid NUMERIC;
  v_new_amount_remaining NUMERIC;
  v_payment_id UUID;
BEGIN
  -- Get current agreement
  SELECT * INTO v_agreement
  FROM tool_rental_agreements
  WHERE id = p_agreement_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agreement not found');
  END IF;
  
  -- Calculate new totals
  v_new_amount_paid := v_agreement.amount_paid + p_amount;
  v_new_amount_remaining := v_agreement.total_cost - v_new_amount_paid;
  
  -- Insert payment record
  INSERT INTO tool_rental_payments (
    agreement_id, member_id, amount, deducted_from_project_id
  ) VALUES (
    p_agreement_id, v_agreement.member_id, p_amount, p_project_id
  ) RETURNING id INTO v_payment_id;
  
  -- Update agreement
  UPDATE tool_rental_agreements
  SET 
    amount_paid = v_new_amount_paid,
    amount_remaining = v_new_amount_remaining,
    weeks_paid = weeks_paid + 1,
    status = CASE 
      WHEN v_new_amount_remaining <= 0 THEN 'completed'::rental_status
      ELSE status 
    END,
    actual_completion_date = CASE
      WHEN v_new_amount_remaining <= 0 THEN CURRENT_DATE
      ELSE actual_completion_date
    END,
    updated_at = NOW()
  WHERE id = p_agreement_id;
  
  -- If completed, update tool inventory
  IF v_new_amount_remaining <= 0 THEN
    UPDATE tool_inventory
    SET 
      status = 'available'::tool_status,
      times_rented = times_rented + 1,
      total_revenue_generated = total_revenue_generated + v_agreement.total_cost,
      updated_at = NOW()
    WHERE id = v_agreement.tool_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'new_balance', v_new_amount_remaining,
    'paid_off', v_new_amount_remaining <= 0
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE tool_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_rental_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_mechanics ENABLE ROW LEVEL SECURITY;

-- Public read for brands and categories
CREATE POLICY "Anyone can view tool brands"
  ON tool_brands FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view tool categories"
  ON tool_categories FOR SELECT
  USING (true);

-- Members can view available tools
CREATE POLICY "Members can view available tools"
  ON tool_inventory FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    status = 'available'
  );

-- Members can view their own rental agreements
CREATE POLICY "Members view own rental agreements"
  ON tool_rental_agreements FOR SELECT
  USING (auth.uid() = member_id);

-- Members can view their own payments
CREATE POLICY "Members view own rental payments"
  ON tool_rental_payments FOR SELECT
  USING (auth.uid() = member_id);

-- Members can view their own donations
CREATE POLICY "Members view own donations"
  ON tool_donations FOR SELECT
  USING (auth.uid() = donor_member_id);

-- Staff/admin can manage everything (add separate admin policies as needed)

-- ============================================================================
-- 12. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_tool_inventory_status ON tool_inventory(status);
CREATE INDEX idx_tool_inventory_condition ON tool_inventory(condition);
CREATE INDEX idx_tool_inventory_brand ON tool_inventory(brand_id);
CREATE INDEX idx_rental_agreements_member ON tool_rental_agreements(member_id);
CREATE INDEX idx_rental_agreements_status ON tool_rental_agreements(status);
CREATE INDEX idx_rental_payments_agreement ON tool_rental_payments(agreement_id);
CREATE INDEX idx_tool_repairs_status ON tool_repairs(status);
CREATE INDEX idx_tool_repairs_tool ON tool_repairs(tool_id);
CREATE INDEX idx_warranty_claims_status ON warranty_claims(status);

-- ============================================================================
-- 13. SAMPLE DATA
-- ============================================================================

-- Insert tool brands
INSERT INTO tool_brands (brand_name, warranty_period_months, is_lifetime_warranty, tax_exempt_discount_pct, bulk_discount_pct, handling_fee_pct) VALUES
('Harbor Freight', 3, FALSE, 30.00, 15.00, 20.00),
('Hart (Walmart)', 36, FALSE, 32.00, 12.00, 18.00),
('Ryobi', 36, FALSE, 35.00, 10.00, 15.00),
('Ridgid', NULL, TRUE, 35.00, 10.00, 15.00),
('DeWalt', 36, FALSE, 35.00, 10.00, 15.00),
('Milwaukee', 60, FALSE, 35.00, 10.00, 15.00);

-- Insert tool categories
INSERT INTO tool_categories (category_name, icon) VALUES
('Drills & Drivers', 'build'),
('Saws', 'carpenter'),
('Sanders & Grinders', 'engineering'),
('Nailers & Staplers', 'construction'),
('Measuring Tools', 'straighten'),
('Hand Tools', 'handyman');

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create React components for:
--    - Tool marketplace browsing
--    - Rental agreement creation
--    - Payment processing
--    - Donation submission
--    - Tool mechanic dashboard
-- 3. Integrate with project payment distribution (auto-deduct)
-- ============================================================================

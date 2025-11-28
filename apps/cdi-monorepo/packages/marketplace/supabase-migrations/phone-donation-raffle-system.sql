-- Phone Donation Raffle System Schema
-- Anonymous donation with IMEI verification and job opportunity matching

-- Donated Phones (Raffle Entries)
CREATE TABLE donated_phones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Device Information
  imei TEXT NOT NULL UNIQUE,
  device_make TEXT, -- Apple, Samsung, Google, etc.
  device_model TEXT, -- iPhone 12, Galaxy S21, etc.
  carrier TEXT, -- Cricket, Verizon, AT&T, T-Mobile (detected from IMEI)
  storage_capacity TEXT, -- 64GB, 128GB, 256GB
  device_condition TEXT, -- Excellent, Good, Fair, Poor
  physical_damage BOOLEAN DEFAULT false,
  screen_intact BOOLEAN DEFAULT true,
  
  -- IMEI Verification Results (from carrier API)
  imei_status TEXT, -- 'clean', 'stolen', 'blacklisted', 'financed', 'paid_off'
  contract_balance DECIMAL(10, 2), -- Remaining contract amount
  contract_months_remaining INTEGER,
  verification_date TIMESTAMPTZ,
  verified_by_carrier TEXT,
  
  -- Red Flag System (private, only visible to admins)
  is_stolen BOOLEAN DEFAULT false,
  red_flag_notes TEXT, -- Private notes for monitoring
  watch_level TEXT DEFAULT 'none', -- 'none', 'low', 'medium', 'high'
  
  -- Donor Information (for raffle/job notifications)
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  consented_to_notifications BOOLEAN DEFAULT true,
  consented_to_job_opportunities BOOLEAN DEFAULT true,
  
  -- Raffle Entry Status
  raffle_entry_number TEXT UNIQUE, -- Auto-generated entry number
  entered_raffle_at TIMESTAMPTZ DEFAULT NOW(),
  is_eligible_for_drawing BOOLEAN DEFAULT true,
  times_drawn INTEGER DEFAULT 0, -- How many times selected but not accepted
  
  -- Matching Status
  matched_with_contractor_id UUID REFERENCES profiles(id),
  job_opportunity_sent_at TIMESTAMPTZ,
  job_opportunity_response TEXT, -- 'pending', 'accepted', 'declined', 'expired'
  job_opportunity_response_at TIMESTAMPTZ,
  
  -- Prize Fulfillment
  prize_awarded BOOLEAN DEFAULT false,
  prize_type TEXT, -- 'original_phone_activated', 'replacement_phone', 'accessories', 'cash'
  prize_details JSONB,
  prize_awarded_at TIMESTAMPTZ,
  
  -- Phone Status
  phone_status TEXT DEFAULT 'received', -- 'received', 'verified', 'in_pool', 'matched', 'awarded', 'returned_to_carrier'
  current_location TEXT, -- 'warehouse', 'with_contractor', 'with_winner', 'returned'
  
  -- Timestamps
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Opportunity Notifications
CREATE TABLE job_opportunity_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Links
  donated_phone_id UUID REFERENCES donated_phones(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Opportunity Details
  job_title TEXT NOT NULL,
  job_description TEXT,
  project_type TEXT, -- 'interior', 'exterior', 'commercial', 'residential'
  pay_rate DECIMAL(10, 2),
  start_date DATE,
  duration_estimate TEXT,
  location TEXT,
  
  -- Notification Tracking
  notification_sent_at TIMESTAMPTZ DEFAULT NOW(),
  notification_method TEXT, -- 'email', 'sms', 'push', 'all'
  notification_opened BOOLEAN DEFAULT false,
  notification_opened_at TIMESTAMPTZ,
  
  -- Response
  response TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  response_at TIMESTAMPTZ,
  response_notes TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  
  -- Follow-up
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raffle Drawings (for compliance/audit trail)
CREATE TABLE raffle_drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Drawing Details
  drawing_date TIMESTAMPTZ DEFAULT NOW(),
  triggered_by TEXT, -- 'contractor_request', 'scheduled', 'manual'
  contractor_id UUID REFERENCES profiles(id),
  
  -- Selection
  total_eligible_entries INTEGER,
  selected_phone_id UUID REFERENCES donated_phones(id),
  raffle_entry_number TEXT,
  
  -- Randomization Proof
  random_seed TEXT, -- For verifiable randomness
  selection_method TEXT DEFAULT 'crypto_random',
  
  -- Outcome
  notification_id UUID REFERENCES job_opportunity_notifications(id),
  outcome TEXT, -- 'accepted', 'declined', 'expired', 'pending'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper Placements (successful matches)
CREATE TABLE helper_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Links
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  donated_phone_id UUID REFERENCES donated_phones(id),
  job_opportunity_id UUID REFERENCES job_opportunity_notifications(id),
  
  -- Placement Details
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'terminated', 'graduated'
  
  -- Phone Assignment
  phone_assigned BOOLEAN DEFAULT false,
  phone_activated_at TIMESTAMPTZ,
  phone_plan_type TEXT, -- 'contractor_family_plan', 'individual_plan'
  monthly_phone_deduction DECIMAL(10, 2), -- Amount deducted from pay
  
  -- Work History
  projects_completed INTEGER DEFAULT 0,
  hours_worked DECIMAL(10, 2) DEFAULT 0,
  performance_rating DECIMAL(3, 2), -- 1.00 to 5.00
  
  -- Milestones
  first_week_completed BOOLEAN DEFAULT false,
  thirty_days_completed BOOLEAN DEFAULT false,
  ninety_days_completed BOOLEAN DEFAULT false,
  first_certification BOOLEAN DEFAULT false,
  graduated_to_own_plan BOOLEAN DEFAULT false,
  became_lead_helper BOOLEAN DEFAULT false,
  
  -- Red Flag Monitoring (from phone donation)
  watch_level TEXT DEFAULT 'none',
  project_restrictions TEXT[], -- ['no_interior', 'supervised_only', 'exterior_only']
  incident_count INTEGER DEFAULT 0,
  
  -- Progression
  independence_level TEXT DEFAULT 'dependent', -- 'dependent', 'semi_independent', 'independent', 'contractor'
  graduation_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carrier Partners
CREATE TABLE carrier_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Carrier Information
  carrier_name TEXT NOT NULL,
  carrier_type TEXT, -- 'corporate', 'store', 'franchise'
  
  -- Contact Information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  store_location TEXT,
  store_address TEXT,
  
  -- Partnership Details
  partnership_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum', 'exclusive'
  partnership_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  partnership_start_date DATE,
  exclusive_rights BOOLEAN DEFAULT false,
  
  -- API Access
  imei_api_key TEXT, -- Encrypted
  imei_api_endpoint TEXT,
  api_access_granted BOOLEAN DEFAULT false,
  
  -- Sponsorship
  sponsorships_count INTEGER DEFAULT 0,
  total_donated_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Recognition
  public_recognition_enabled BOOLEAN DEFAULT true,
  featured_sponsor BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone Sponsorships (store donations)
CREATE TABLE milestone_sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sponsor
  carrier_partner_id UUID REFERENCES carrier_partners(id),
  sponsor_store_name TEXT NOT NULL,
  sponsor_location TEXT,
  
  -- Donation
  donation_type TEXT, -- 'phone', 'service_plan', 'accessories', 'cash'
  donation_value DECIMAL(10, 2),
  donation_description TEXT,
  
  -- Recipient
  helper_placement_id UUID REFERENCES helper_placements(id),
  milestone_achieved TEXT, -- 'first_week', 'thirty_days', 'independence', etc.
  
  -- Fulfillment
  awarded BOOLEAN DEFAULT false,
  awarded_at TIMESTAMPTZ,
  ceremony_date DATE,
  
  -- Public Recognition
  social_media_post_id TEXT,
  press_release_sent BOOLEAN DEFAULT false,
  photo_captured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_donated_phones_imei ON donated_phones(imei);
CREATE INDEX idx_donated_phones_status ON donated_phones(phone_status);
CREATE INDEX idx_donated_phones_raffle_eligible ON donated_phones(is_eligible_for_drawing) WHERE is_eligible_for_drawing = true;
CREATE INDEX idx_donated_phones_carrier ON donated_phones(carrier);
CREATE INDEX idx_donated_phones_stolen ON donated_phones(is_stolen) WHERE is_stolen = true;

CREATE INDEX idx_job_notifications_donor ON job_opportunity_notifications(donor_id);
CREATE INDEX idx_job_notifications_contractor ON job_opportunity_notifications(contractor_id);
CREATE INDEX idx_job_notifications_response ON job_opportunity_notifications(response);

CREATE INDEX idx_helper_placements_helper ON helper_placements(helper_id);
CREATE INDEX idx_helper_placements_contractor ON helper_placements(contractor_id);
CREATE INDEX idx_helper_placements_status ON helper_placements(status);

-- Row Level Security
ALTER TABLE donated_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_opportunity_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_sponsorships ENABLE ROW LEVEL SECURITY;

-- Donors can only see their own donations (limited view)
CREATE POLICY "Donors can view their own donations"
  ON donated_phones
  FOR SELECT
  TO authenticated
  USING (donor_id = auth.uid());

-- Only admins can see red flags and verification details
CREATE POLICY "Admins can see all donation details"
  ON donated_phones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Donors can see their job opportunities
CREATE POLICY "Donors can view their job opportunities"
  ON job_opportunity_notifications
  FOR SELECT
  TO authenticated
  USING (donor_id = auth.uid());

-- Contractors can see their requests
CREATE POLICY "Contractors can view their job opportunities"
  ON job_opportunity_notifications
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

-- Helpers can see their placements
CREATE POLICY "Helpers can view their placements"
  ON helper_placements
  FOR SELECT
  TO authenticated
  USING (helper_id = auth.uid());

-- Contractors can manage their helpers
CREATE POLICY "Contractors can manage their helpers"
  ON helper_placements
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

-- Public can view carrier partners (for transparency)
CREATE POLICY "Anyone can view carrier partners"
  ON carrier_partners
  FOR SELECT
  TO authenticated
  USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_donated_phones_updated_at
  BEFORE UPDATE ON donated_phones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_placements_updated_at
  BEFORE UPDATE ON helper_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate raffle entry number
CREATE OR REPLACE FUNCTION generate_raffle_entry_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raffle_entry_number = 'RE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('raffle_entry_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE raffle_entry_seq;

CREATE TRIGGER generate_raffle_entry_before_insert
  BEFORE INSERT ON donated_phones
  FOR EACH ROW
  EXECUTE FUNCTION generate_raffle_entry_number();

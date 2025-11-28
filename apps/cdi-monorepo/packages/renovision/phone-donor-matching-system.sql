-- ============================================================================
-- PHONE DONOR MATCHING SYSTEM
-- "Donate Your Problem, Get Back a Solution"
-- ============================================================================
-- Philosophy: The phone you donate is the EXACT phone you get back when hired!
-- The device itself is the bridge between donation and opportunity.
-- ============================================================================

-- ============================================================================
-- 1. ADD MATCHING FIELDS TO SWEEPSTAKES ENTRIES
-- ============================================================================

ALTER TABLE sweepstakes_entries
ADD COLUMN IF NOT EXISTS device_status TEXT DEFAULT 'pending_match' CHECK (
  device_status IN (
    'pending_match',     -- Waiting to be matched with contractor (Prize waiting!)
    'offered',           -- Job offer sent to donor
    'accepted',          -- Donor accepted job
    'activated',         -- Phone unlocked and activated (LEVEL 1 WON!)
    'in_use',            -- Donor working with the phone
    'contract_paid_off', -- Original contract paid off (LEVEL 2 WON!)
    'upgraded',          -- Contractor upgraded them to new phone
    'independent',       -- Worker chose their own plan (LEVEL 3 WON!)
    'graduated',         -- Became contractor themselves (MASTER LEVEL!)
    'returned',          -- Phone returned (donor left job)
    'retired'            -- Phone no longer usable
  )
),
ADD COLUMN IF NOT EXISTS prize_level INTEGER DEFAULT 0 CHECK (prize_level BETWEEN 0 AND 3),
ADD COLUMN IF NOT EXISTS level_1_won_at TIMESTAMP, -- Got phone back
ADD COLUMN IF NOT EXISTS level_2_won_at TIMESTAMP, -- Paid off contract
ADD COLUMN IF NOT EXISTS level_3_won_at TIMESTAMP, -- Became independent
ADD COLUMN IF NOT EXISTS graduation_ceremony_date DATE,
ADD COLUMN IF NOT EXISTS contract_balance_remaining DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS original_contract_months INTEGER,
ADD COLUMN IF NOT EXISTS months_worked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS match_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_offer_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS offer_response_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS assigned_contractor_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS phone_unlocked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS phone_activated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS service_start_date DATE,
ADD COLUMN IF NOT EXISTS weekly_deduction_amount DECIMAL(10,2) DEFAULT 12.50,
ADD COLUMN IF NOT EXISTS contractor_monthly_charge DECIMAL(10,2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS contractor_profit_per_month DECIMAL(10,2) DEFAULT 25.00;

-- ============================================================================
-- 2. CONTRACTOR HELP REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES profiles(id) NOT NULL,
  workers_needed INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  hourly_wage DECIMAL(10,2),
  start_date DATE,
  location_city TEXT,
  location_state TEXT,
  requirements TEXT,
  
  -- Matching status
  status TEXT DEFAULT 'open' CHECK (
    status IN ('open', 'matching', 'filled', 'cancelled')
  ),
  
  -- Matched donors
  matched_device_ids UUID[], -- Array of device entry IDs
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_contractor ON contractor_help_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON contractor_help_requests(status);

-- ============================================================================
-- 3. JOB OFFERS SENT TABLE (Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_offers_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  help_request_id UUID REFERENCES contractor_help_requests(id),
  entry_id UUID REFERENCES sweepstakes_entries(id),
  contractor_id UUID REFERENCES profiles(id),
  
  -- Offer details
  sent_at TIMESTAMP DEFAULT NOW(),
  response_deadline TIMESTAMP,
  
  -- Response tracking
  donor_response TEXT CHECK (
    donor_response IN ('pending', 'accepted', 'declined', 'expired')
  ) DEFAULT 'pending',
  responded_at TIMESTAMP,
  
  -- Phone return reveal
  revealed_same_phone BOOLEAN DEFAULT false, -- Did we tell them it's their phone?
  donor_reaction_notes TEXT -- For tracking the "aha moment"
);

CREATE INDEX IF NOT EXISTS idx_job_offers_entry ON job_offers_sent(entry_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_response ON job_offers_sent(donor_response);

-- ============================================================================
-- 4. MATCHING ALGORITHM FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION match_donors_to_contractor(
  p_help_request_id UUID,
  p_workers_needed INTEGER
)
RETURNS TABLE (
  entry_id UUID,
  donor_name TEXT,
  donor_phone TEXT,
  donor_email TEXT,
  device_imei TEXT
) AS $$
BEGIN
  -- Select random donors who:
  -- 1. Opted in to job offers
  -- 2. Are in 'pending_match' status
  -- 3. Haven't been offered a job recently (48 hours)
  
  RETURN QUERY
  SELECT 
    se.id,
    se.donor_full_name,
    se.donor_phone,
    se.donor_email,
    se.device_imei
  FROM sweepstakes_entries se
  WHERE 
    se.opt_in_job_offers = true
    AND se.device_status = 'pending_match'
    AND (
      se.last_offer_sent_at IS NULL 
      OR se.last_offer_sent_at < NOW() - INTERVAL '48 hours'
    )
  ORDER BY RANDOM() -- Random selection from eligible pool
  LIMIT p_workers_needed;
  
  -- Update selected entries
  UPDATE sweepstakes_entries
  SET 
    device_status = 'offered',
    last_offer_sent_at = NOW(),
    offer_response_deadline = NOW() + INTERVAL '48 hours',
    match_attempts = match_attempts + 1
  WHERE id IN (
    SELECT se.id
    FROM sweepstakes_entries se
    WHERE 
      se.opt_in_job_offers = true
      AND se.device_status = 'pending_match'
      AND (
        se.last_offer_sent_at IS NULL 
        OR se.last_offer_sent_at < NOW() - INTERVAL '48 hours'
      )
    ORDER BY RANDOM()
    LIMIT p_workers_needed
  );
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DONOR ACCEPTS JOB FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION donor_accepts_job(
  p_entry_id UUID,
  p_help_request_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_contractor_id UUID;
  v_device_imei TEXT;
BEGIN
  -- Get contractor info
  SELECT contractor_id INTO v_contractor_id
  FROM contractor_help_requests
  WHERE id = p_help_request_id;
  
  -- Get device IMEI
  SELECT device_imei INTO v_device_imei
  FROM sweepstakes_entries
  WHERE id = p_entry_id;
  
  -- Update sweepstakes entry
  UPDATE sweepstakes_entries
  SET 
    device_status = 'accepted',
    assigned_contractor_id = v_contractor_id,
    engagement_status = 'hired',
    hired_date = NOW()
  WHERE id = p_entry_id;
  
  -- Record the acceptance
  UPDATE job_offers_sent
  SET 
    donor_response = 'accepted',
    responded_at = NOW()
  WHERE entry_id = p_entry_id
    AND help_request_id = p_help_request_id;
  
  -- Award engagement points (hired = +50 points)
  INSERT INTO engagement_milestones (entry_id, milestone_type, points_awarded, notes)
  VALUES (p_entry_id, 'job_hired', 50, 'Donor accepted job offer and will receive their phone back!');
  
  -- Mark other offers from this help request as expired
  UPDATE job_offers_sent
  SET donor_response = 'expired'
  WHERE help_request_id = p_help_request_id
    AND donor_response = 'pending'
    AND entry_id != p_entry_id;
  
  -- TODO: Trigger email to contractor: "Worker accepted! Unlock their phone and activate service"
  -- TODO: Trigger email to donor: "Congrats! Your phone is being unlocked for you!"
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. PHONE ACTIVATION FUNCTION (LEVEL 1 WIN!)
-- ============================================================================

CREATE OR REPLACE FUNCTION activate_donor_phone(
  p_entry_id UUID,
  p_service_plan TEXT,
  p_phone_number TEXT,
  p_contract_balance DECIMAL(10,2),
  p_contract_months INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE sweepstakes_entries
  SET 
    device_status = 'activated',
    phone_unlocked_at = NOW(),
    phone_activated_at = NOW(),
    service_start_date = CURRENT_DATE,
    prize_level = 1, -- LEVEL 1 WON!
    level_1_won_at = NOW(),
    contract_balance_remaining = p_contract_balance,
    original_contract_months = p_contract_months
  WHERE id = p_entry_id;
  
  -- Award activation milestone
  INSERT INTO engagement_milestones (entry_id, milestone_type, points_awarded, notes)
  VALUES (
    p_entry_id, 
    'bonus_referral',
    10, 
    '🏆 LEVEL 1 WON! Donor received their phone back unlocked and activated!'
  );
  
  -- TODO: Send email to CONTRACTOR (not worker!): "New worker's phone is ready for activation"
  -- TODO: Send email to WORKER: "Welcome aboard! Your contractor will provide your work phone"
  -- NOTE: DO NOT mention sweepstakes, prize, or that it's their phone!
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6B. CONTRACT PAYOFF FUNCTION (LEVEL 2 WIN!)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_contract_paid_off(
  p_entry_id UUID,
  p_contractor_choice TEXT -- 'release' or 'upgrade'
)
RETURNS VOID AS $$
BEGIN
  UPDATE sweepstakes_entries
  SET 
    device_status = CASE 
      WHEN p_contractor_choice = 'upgrade' THEN 'upgraded'
      ELSE 'contract_paid_off'
    END,
    prize_level = 2, -- LEVEL 2 WON!
    level_2_won_at = NOW(),
    contract_balance_remaining = 0
  WHERE id = p_entry_id;
  
  -- Award Level 2 milestone (SILENT - worker doesn't know!)
  INSERT INTO engagement_milestones (entry_id, milestone_type, points_awarded, notes)
  VALUES (
    p_entry_id,
    'worked_30_days',
    50,
    '🔒 INTERNAL: Contract paid off. Worker owns phone but doesnt know it yet. Prompt contractor to suggest upgrade.'
  );
  
  -- TODO: Send email to PROJECT MANAGER: "Time to nudge contractor about upgrade/independence talk"
  -- TODO: Send email to CONTRACTOR: "Great news! [Worker] has been with you 2 years. Consider rewarding them..."
  -- NOTE: DO NOT tell worker anything! They should think it's contractor's idea!
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6C. INDEPENDENCE DECLARATION (LEVEL 3 WIN!)
-- ============================================================================

CREATE OR REPLACE FUNCTION declare_independence(
  p_entry_id UUID,
  p_ceremony_date DATE
)
RETURNS VOID AS $$
DECLARE
  v_donor_name TEXT;
  v_months_worked INTEGER;
BEGIN
  -- Get worker details
  SELECT donor_full_name, months_worked
  INTO v_donor_name, v_months_worked
  FROM sweepstakes_entries
  WHERE id = p_entry_id;
  
  UPDATE sweepstakes_entries
  SET 
    device_status = 'independent',
    prize_level = 3, -- LEVEL 3 WON!
    level_3_won_at = NOW(),
    graduation_ceremony_date = p_ceremony_date
  WHERE id = p_entry_id;
  
  -- Award MASTER LEVEL milestone (SILENT until 1-on-1 reveal!)
  INSERT INTO engagement_milestones (entry_id, milestone_type, points_awarded, notes)
  VALUES (
    p_entry_id,
    'worked_30_days',
    100,
    '🔒 INTERNAL: Worker ready for independence. Schedule PRIVATE 1-on-1 reveal meeting. DO NOT send group invitation!'
  );
  
  -- TODO: Send email to ADMIN: "Worker ready for graduation. Schedule private reveal meeting."
  -- TODO: Prepare graduation packet: Business license, EIN, phone, reveal script
  -- TODO: DO NOT invite to group ceremony - this is PRIVATE reveal moment!
  -- NOTE: Worker should NOT know this is connected to sweepstakes until the reveal!
  
  RAISE NOTICE '% has achieved independence after % months! Graduation ceremony: %', 
    v_donor_name, v_months_worked, p_ceremony_date;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. HANDLE EXPIRED OFFERS (Daily Cron Job)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_job_offers()
RETURNS VOID AS $$
BEGIN
  -- Mark expired offers
  UPDATE job_offers_sent
  SET donor_response = 'expired'
  WHERE donor_response = 'pending'
    AND response_deadline < NOW();
  
  -- Return devices to pending_match status
  UPDATE sweepstakes_entries
  SET device_status = 'pending_match'
  WHERE device_status = 'offered'
    AND offer_response_deadline < NOW();
  
END;
$$ LANGUAGE plpgsql;

-- Run this daily via cron or scheduled function
-- SELECT expire_old_job_offers();

-- ============================================================================
-- 8. VIEWS FOR CONTRACTOR DASHBOARD
-- ============================================================================

-- Available workers (devices waiting to be matched)
CREATE OR REPLACE VIEW available_workers_pool AS
SELECT 
  COUNT(*) as total_available,
  COUNT(*) FILTER (WHERE match_attempts = 0) as never_contacted,
  COUNT(*) FILTER (WHERE match_attempts > 0) as previously_contacted,
  AVG(match_attempts) as avg_attempts
FROM sweepstakes_entries
WHERE device_status = 'pending_match'
  AND opt_in_job_offers = true;

-- Contractor's active workers
CREATE OR REPLACE VIEW contractor_active_workers AS
SELECT 
  se.id,
  se.donor_full_name,
  se.donor_phone,
  se.device_imei,
  se.device_make,
  se.device_model,
  se.hired_date,
  se.service_start_date,
  se.days_worked,
  se.weekly_deduction_amount,
  se.contractor_monthly_charge,
  p.business_name as contractor_business
FROM sweepstakes_entries se
JOIN profiles p ON se.assigned_contractor_id = p.id
WHERE se.device_status IN ('activated', 'in_use');

-- ============================================================================
-- 9. PAYROLL DEDUCTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_payroll_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES sweepstakes_entries(id),
  contractor_id UUID REFERENCES profiles(id),
  
  -- Deduction details
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  deduction_amount DECIMAL(10,2) NOT NULL, -- Usually $12.50/week
  
  -- Payment tracking
  deducted_at TIMESTAMP DEFAULT NOW(),
  paid_to_nonprofit BOOLEAN DEFAULT false,
  payment_date TIMESTAMP,
  
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payroll_entry ON worker_payroll_deductions(entry_id);
CREATE INDEX IF NOT EXISTS idx_payroll_contractor ON worker_payroll_deductions(contractor_id);

-- ============================================================================
-- 10. PRIZE LEVEL TRACKING VIEWS
-- ============================================================================

-- Overview of all prize levels
CREATE OR REPLACE VIEW prize_level_statistics AS
SELECT 
  prize_level,
  CASE prize_level
    WHEN 0 THEN 'Waiting for Prize (Pending)'
    WHEN 1 THEN 'Level 1: Got Phone Back'
    WHEN 2 THEN 'Level 2: Owns Phone Free'
    WHEN 3 THEN 'Level 3: Independent/Graduate'
  END as level_name,
  COUNT(*) as total_winners,
  AVG(months_worked) as avg_months_to_achieve,
  MIN(level_1_won_at) as first_winner_date,
  MAX(level_3_won_at) as latest_graduation
FROM sweepstakes_entries
GROUP BY prize_level
ORDER BY prize_level;

-- Upcoming graduations
CREATE OR REPLACE VIEW upcoming_graduation_ceremonies AS
SELECT 
  donor_full_name,
  donor_phone,
  donor_email,
  graduation_ceremony_date,
  months_worked,
  level_3_won_at as independence_declared_at,
  DATE_PART('day', graduation_ceremony_date - CURRENT_DATE) as days_until_ceremony
FROM sweepstakes_entries
WHERE prize_level = 3
  AND graduation_ceremony_date >= CURRENT_DATE
ORDER BY graduation_ceremony_date ASC;

-- Success stories (for marketing)
CREATE OR REPLACE VIEW success_stories AS
SELECT 
  donor_full_name as worker_name,
  DATE_PART('day', level_1_won_at - donation_date) as days_to_first_job,
  DATE_PART('month', level_2_won_at - level_1_won_at) as months_to_payoff,
  DATE_PART('month', level_3_won_at - level_1_won_at) as months_to_independence,
  months_worked as total_months_worked,
  device_make,
  device_model,
  'Donated ' || device_make || ' → Got job → Owned phone → Became contractor!' as journey_summary
FROM sweepstakes_entries
WHERE prize_level = 3
ORDER BY level_3_won_at DESC;

-- ============================================================================
-- 11. THE PERPETUAL PRIZE POOL (Everyone Wins Eventually!)
-- ============================================================================

-- How many "prizes" are still waiting to be claimed?
CREATE OR REPLACE VIEW unclaimed_prizes AS
SELECT 
  COUNT(*) as total_phones_waiting,
  COUNT(*) FILTER (WHERE match_attempts = 0) as never_contacted,
  COUNT(*) FILTER (WHERE match_attempts BETWEEN 1 AND 3) as contacted_1_3_times,
  COUNT(*) FILTER (WHERE match_attempts > 3) as contacted_4_plus_times,
  AVG(match_attempts) as avg_contact_attempts,
  'Every one of these will eventually be won by someone!' as message
FROM sweepstakes_entries
WHERE device_status = 'pending_match'
  AND opt_in_job_offers = true;

-- The truth: EVERYONE is a winner, just at different stages
CREATE OR REPLACE VIEW everyone_wins_report AS
SELECT 
  'Total Entrants' as category,
  COUNT(*) as count,
  '100% of engaged participants eventually win' as note
FROM sweepstakes_entries
UNION ALL
SELECT 
  'Level 1 Winners (Got Phone Back)',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sweepstakes_entries WHERE opt_in_job_offers = true), 1) || '% of those who opted in'
FROM sweepstakes_entries
WHERE prize_level >= 1
UNION ALL
SELECT 
  'Level 2 Winners (Own Phone Free)',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sweepstakes_entries WHERE prize_level >= 1), 1) || '% of Level 1 winners'
FROM sweepstakes_entries
WHERE prize_level >= 2
UNION ALL
SELECT 
  'Level 3 Winners (Independent/Graduate)',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sweepstakes_entries WHERE prize_level >= 2), 1) || '% of Level 2 winners'
FROM sweepstakes_entries
WHERE prize_level = 3;

-- ============================================================================
-- DONE! 🎉🎉🎉
-- ============================================================================
-- THE COMPLETE SYSTEM:
-- ✅ Everyone who enters WILL win (eventually)
-- ✅ Prizes don't disappear - they WAIT for you
-- ✅ Random selection IS fair (everyone gets infinite chances)
-- ✅ Three prize levels (phone back, own it, independence)
-- ✅ Graduation ceremony (the BIG reveal!)
-- ✅ Success stories for marketing
-- ✅ Perpetual prize pool (keeps rotating until claimed)
--
-- The Philosophy:
-- "You didn't WIN the sweepstakes. You BECAME the prize."
--
-- The Truth:
-- EVERYONE IS A WINNER. They just have to claim it.
-- ============================================================================


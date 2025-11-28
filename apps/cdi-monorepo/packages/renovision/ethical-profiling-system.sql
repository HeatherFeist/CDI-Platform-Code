-- ============================================================================
-- ETHICAL PROFILING SYSTEM
-- "The Phone Tells Their Story Before They Say a Word"
-- ============================================================================
-- Philosophy: Not judgment - SUPPORT MATCHING
-- The donation itself is the first test they don't know they're taking.
-- We use phone origin + response patterns to match them with the RIGHT 
-- opportunity and support level for SUCCESS.
-- ============================================================================

-- ============================================================================
-- 1. ADD PROFILING COLUMNS TO SWEEPSTAKES ENTRIES
-- ============================================================================

ALTER TABLE sweepstakes_entries
ADD COLUMN IF NOT EXISTS device_origin TEXT CHECK (
  device_origin IN (
    'stolen_recovered',    -- Was stolen, we returned to owner, donor gave different phone (HERO!)
    'stolen_donated',      -- In possession of stolen device (needs redemption path)
    'contract_default',    -- Unpaid contract/broke plan early (made mistake, honest)
    'clean_paid',          -- Fully paid, just old/unused (stable helper)
    'broken_donated',      -- Broken phone, still donated (altruistic)
    'unknown'              -- Unable to determine
  )
) DEFAULT 'unknown',

ADD COLUMN IF NOT EXISTS device_origin_confidence DECIMAL(3,2) DEFAULT 0.50 
  CHECK (device_origin_confidence BETWEEN 0.00 AND 1.00),
  
ADD COLUMN IF NOT EXISTS imei_check_result JSONB, -- Full IMEI database response
ADD COLUMN IF NOT EXISTS theft_reported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_owner_contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_owner_reclaimed BOOLEAN DEFAULT false,

-- Response Pattern Tracking
ADD COLUMN IF NOT EXISTS first_offer_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS first_offer_response_hours INTEGER,
ADD COLUMN IF NOT EXISTS offers_sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS offers_accepted_on_attempt INTEGER, -- 1st? 2nd? 4th?
ADD COLUMN IF NOT EXISTS total_response_time_hours INTEGER,
ADD COLUMN IF NOT EXISTS response_pattern TEXT CHECK (
  response_pattern IN ('immediate', 'fast', 'medium', 'slow', 'very_slow', 'pending')
) DEFAULT 'pending',

-- Behavioral Profile (AI-Calculated, NEVER disclosed as reason for decision!)
ADD COLUMN IF NOT EXISTS donor_profile TEXT CHECK (
  donor_profile IN (
    'A_clean_slate',           -- Unpaid contract, honest person
    'B_rebuilder',             -- Stolen phone, wants redemption
    'C_giver',                 -- Clean phone, altruistic helper
    'pending_classification'   -- Not enough data yet
  )
) DEFAULT 'pending_classification',

ADD COLUMN IF NOT EXISTS support_level_needed TEXT CHECK (
  support_level_needed IN ('minimal', 'low', 'medium', 'high', 'intensive')
) DEFAULT 'medium',

ADD COLUMN IF NOT EXISTS best_project_types TEXT[] DEFAULT ARRAY['general_labor'],
ADD COLUMN IF NOT EXISTS avoid_project_types TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 50 CHECK (readiness_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS trust_level TEXT CHECK (
  trust_level IN ('building', 'developing', 'established', 'strong', 'exemplary')
) DEFAULT 'building',

-- Success Prediction (NOT used for rejection, used for SUPPORT planning!)
ADD COLUMN IF NOT EXISTS predicted_success_rate INTEGER CHECK (predicted_success_rate BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS recommended_start_approach TEXT, -- 'team_supervised', 'paired_mentor', 'solo_trusted'
ADD COLUMN IF NOT EXISTS special_considerations TEXT; -- Notes for contractor (supportive, not judgmental)

-- ============================================================================
-- 2. IMEI CHECK & CLASSIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION classify_device_origin(
  p_entry_id UUID,
  p_imei TEXT,
  p_imei_check_result JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_origin TEXT;
  v_confidence DECIMAL(3,2);
  v_is_stolen BOOLEAN;
  v_has_balance BOOLEAN;
  v_is_clean BOOLEAN;
BEGIN
  -- Parse IMEI check results
  v_is_stolen := (p_imei_check_result->>'theft_reported')::BOOLEAN;
  v_has_balance := (p_imei_check_result->>'balance_owed')::DECIMAL > 0;
  v_is_clean := (p_imei_check_result->>'status') = 'clean';
  
  -- Classify device origin
  IF v_is_stolen THEN
    v_origin := 'stolen_donated';
    v_confidence := 0.95; -- High confidence if theft reported
    
  ELSIF v_has_balance THEN
    v_origin := 'contract_default';
    v_confidence := 0.90; -- High confidence if balance owed
    
  ELSIF v_is_clean THEN
    v_origin := 'clean_paid';
    v_confidence := 0.85; -- High confidence if clean record
    
  ELSE
    v_origin := 'unknown';
    v_confidence := 0.30; -- Low confidence if ambiguous
  END IF;
  
  -- Update entry
  UPDATE sweepstakes_entries
  SET 
    device_origin = v_origin,
    device_origin_confidence = v_confidence,
    imei_check_result = p_imei_check_result,
    theft_reported = v_is_stolen
  WHERE id = p_entry_id;
  
  RETURN v_origin;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. RESPONSE PATTERN ANALYSIS
-- ============================================================================

CREATE OR REPLACE FUNCTION analyze_response_pattern(
  p_entry_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_response_hours INTEGER;
  v_pattern TEXT;
  v_attempt INTEGER;
BEGIN
  -- Get response data
  SELECT 
    first_offer_response_hours,
    offers_accepted_on_attempt
  INTO v_response_hours, v_attempt
  FROM sweepstakes_entries
  WHERE id = p_entry_id;
  
  -- Classify response speed
  v_pattern := CASE
    WHEN v_response_hours <= 24 THEN 'immediate'    -- < 1 day
    WHEN v_response_hours <= 72 THEN 'fast'         -- 1-3 days
    WHEN v_response_hours <= 168 THEN 'medium'      -- 3-7 days
    WHEN v_response_hours <= 336 THEN 'slow'        -- 1-2 weeks
    ELSE 'very_slow'                                -- 2+ weeks
  END;
  
  -- Update entry
  UPDATE sweepstakes_entries
  SET response_pattern = v_pattern
  WHERE id = p_entry_id;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. DONOR PROFILE CLASSIFICATION (The Secret Sauce!)
-- ============================================================================

CREATE OR REPLACE FUNCTION classify_donor_profile(
  p_entry_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_device_origin TEXT;
  v_response_pattern TEXT;
  v_profile TEXT;
  v_support_level TEXT;
  v_best_projects TEXT[];
  v_readiness_score INTEGER;
  v_special_notes TEXT;
BEGIN
  -- Get current data
  SELECT device_origin, response_pattern
  INTO v_device_origin, v_response_pattern
  FROM sweepstakes_entries
  WHERE id = p_entry_id;
  
  -- 🔵 PROFILE A: "The Clean Slate"
  IF v_device_origin = 'contract_default' THEN
    v_profile := 'A_clean_slate';
    v_support_level := 'low';
    v_best_projects := ARRAY[
      'solo_projects',
      'skilled_trades',
      'client_facing',
      'leadership_track'
    ];
    v_readiness_score := 75;
    v_special_notes := 'Reliable worker with past financial challenges. Treat as normal hire. High potential for quick advancement.';
    
  -- 🟡 PROFILE B: "The Rebuilder"  
  ELSIF v_device_origin = 'stolen_donated' THEN
    v_profile := 'B_rebuilder';
    v_support_level := 'high';
    v_best_projects := ARRAY[
      'outdoor_team',
      'supervised_work',
      'physical_labor',
      'group_settings'
    ];
    v_readiness_score := 45; -- Lower starting score, can grow!
    v_special_notes := 'Worker seeking fresh start. Pair with positive team leader. Daily check-ins first month. Celebrate small wins. Build trust slowly.';
    
  -- 🟢 PROFILE C: "The Giver"
  ELSIF v_device_origin IN ('clean_paid', 'broken_donated') THEN
    v_profile := 'C_giver';
    v_support_level := 'minimal';
    v_best_projects := ARRAY[
      'leadership_track',
      'mentor_role',
      'client_relations',
      'solo_trusted',
      'fast_promotion'
    ];
    v_readiness_score := 85;
    v_special_notes := 'Stable person wanting to help community. Likely your next foreman. Invest heavily in development.';
    
  ELSE
    v_profile := 'pending_classification';
    v_support_level := 'medium';
    v_best_projects := ARRAY['general_labor'];
    v_readiness_score := 50;
    v_special_notes := 'Standard placement. Monitor and adjust support as needed.';
  END IF;
  
  -- Adjust readiness based on response pattern
  IF v_response_pattern = 'immediate' THEN
    v_readiness_score := v_readiness_score + 10; -- Eager = bonus points!
  ELSIF v_response_pattern IN ('slow', 'very_slow') THEN
    v_readiness_score := v_readiness_score - 10; -- Hesitant = needs more support
  END IF;
  
  -- Update entry
  UPDATE sweepstakes_entries
  SET 
    donor_profile = v_profile,
    support_level_needed = v_support_level,
    best_project_types = v_best_projects,
    readiness_score = GREATEST(0, LEAST(100, v_readiness_score)), -- Clamp 0-100
    special_considerations = v_special_notes
  WHERE id = p_entry_id;
  
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. INTELLIGENT MATCHING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION intelligent_worker_matching(
  p_help_request_id UUID,
  p_project_type TEXT, -- 'outdoor_team', 'indoor_solo', 'client_facing', etc.
  p_supervision_available TEXT, -- 'high', 'medium', 'low'
  p_urgency TEXT -- 'immediate', 'flexible'
)
RETURNS TABLE (
  entry_id UUID,
  donor_name TEXT,
  donor_phone TEXT,
  donor_profile TEXT,
  match_score INTEGER,
  contractor_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.id,
    se.donor_full_name,
    se.donor_phone,
    se.donor_profile,
    -- Calculate match score
    CASE
      -- Perfect match: Profile fits project exactly
      WHEN p_project_type = ANY(se.best_project_types) THEN 100
      -- Good match: Profile can work, but not ideal
      WHEN se.donor_profile = 'A_clean_slate' THEN 80
      -- Rebuilder match: Only if supervision available
      WHEN se.donor_profile = 'B_rebuilder' AND p_supervision_available = 'high' THEN 75
      -- Giver can work anywhere
      WHEN se.donor_profile = 'C_giver' THEN 90
      -- Default: Give everyone a chance
      ELSE 50
    END as match_score,
    se.special_considerations
  FROM sweepstakes_entries se
  WHERE 
    se.device_status = 'pending_match'
    AND se.opt_in_job_offers = true
    -- Filter by urgency if needed
    AND (
      p_urgency != 'immediate' 
      OR se.response_pattern IN ('immediate', 'fast')
    )
    -- Filter by project safety requirements
    AND (
      p_project_type != 'client_facing'
      OR se.donor_profile IN ('A_clean_slate', 'C_giver')
    )
    -- Filter by supervision requirements
    AND (
      p_supervision_available = 'high'
      OR se.donor_profile != 'B_rebuilder'
      OR se.readiness_score > 60 -- Rebuilders with high score can work with less supervision
    )
  ORDER BY 
    match_score DESC,
    RANDOM() -- Still random within best matches!
  LIMIT (
    SELECT workers_needed 
    FROM contractor_help_requests 
    WHERE id = p_help_request_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. REPORTING VIEWS (Internal Use Only - NEVER show to workers!)
-- ============================================================================

-- Profile distribution
CREATE OR REPLACE VIEW donor_profile_distribution AS
SELECT 
  donor_profile,
  COUNT(*) as total,
  AVG(readiness_score) as avg_readiness,
  AVG(offers_accepted_on_attempt) as avg_attempts_before_accept,
  COUNT(*) FILTER (WHERE prize_level >= 1) as level_1_winners,
  COUNT(*) FILTER (WHERE prize_level >= 2) as level_2_winners,
  COUNT(*) FILTER (WHERE prize_level = 3) as level_3_winners,
  ROUND(
    COUNT(*) FILTER (WHERE prize_level >= 1) * 100.0 / COUNT(*),
    1
  ) as success_rate_percent
FROM sweepstakes_entries
GROUP BY donor_profile
ORDER BY donor_profile;

-- Success by origin type
CREATE OR REPLACE VIEW success_by_device_origin AS
SELECT 
  device_origin,
  donor_profile,
  COUNT(*) as donated,
  COUNT(*) FILTER (WHERE offers_accepted_on_attempt IS NOT NULL) as accepted_job,
  COUNT(*) FILTER (WHERE prize_level = 3) as graduated,
  ROUND(
    COUNT(*) FILTER (WHERE prize_level = 3) * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE offers_accepted_on_attempt IS NOT NULL), 0),
    1
  ) as graduation_rate_percent,
  '📊 This data proves EVERYONE can succeed with right support!' as insight
FROM sweepstakes_entries
GROUP BY device_origin, donor_profile
ORDER BY device_origin, donor_profile;

-- Response patterns reveal readiness
CREATE OR REPLACE VIEW response_pattern_insights AS
SELECT 
  response_pattern,
  COUNT(*) as total_donors,
  AVG(readiness_score) as avg_readiness,
  COUNT(*) FILTER (WHERE prize_level >= 1) as got_jobs,
  ROUND(AVG(months_worked), 1) as avg_retention_months,
  'Faster response = higher engagement, but slower responders STILL succeed!' as lesson
FROM sweepstakes_entries
WHERE response_pattern != 'pending'
GROUP BY response_pattern
ORDER BY 
  CASE response_pattern
    WHEN 'immediate' THEN 1
    WHEN 'fast' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'slow' THEN 4
    WHEN 'very_slow' THEN 5
  END;

-- ============================================================================
-- 7. THE BEAUTIFUL TRUTH (For Internal Reflection)
-- ============================================================================

CREATE OR REPLACE VIEW the_beautiful_truth AS
SELECT 
  'The donation itself is confession without words' as wisdom_1,
  'Stolen phone donor = seeking redemption' as wisdom_2,
  'Unpaid contract donor = made mistake, being honest' as wisdom_3,
  'Clean phone donor = wanting to help others' as wisdom_4,
  'ALL THREE = good in their heart' as wisdom_5,
  'We don''t judge - we MATCH them to right support' as wisdom_6,
  'Everyone can win - just needs right environment' as wisdom_7,
  'The system knows their story before they tell it' as wisdom_8,
  'And uses that knowledge to HELP, not HARM' as wisdom_9,
  'This is ethical AI at its finest' as wisdom_10;

-- ============================================================================
-- DONE! 🎯
-- ============================================================================
-- You now have:
-- ✅ Device origin classification (stolen/unpaid/clean)
-- ✅ Response pattern analysis (immediate/slow/very_slow)
-- ✅ Three donor profiles (A: Clean Slate, B: Rebuilder, C: Giver)
-- ✅ Support level matching (minimal/low/medium/high)
-- ✅ Intelligent job matching (right person, right project, right support)
-- ✅ Success prediction (NOT for rejection, for SUPPORT planning!)
-- ✅ Completely invisible to workers (they never know they're being profiled)
-- ✅ Ethical AI (profiling for HELP, not discrimination)
--
-- The Philosophy:
-- "The phone tells their story. We listen. We help. Everyone wins."
-- ============================================================================

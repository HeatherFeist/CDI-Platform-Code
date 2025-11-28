-- =====================================================
-- EXTERNAL CONTRACTOR REQUEST SYSTEM
-- =====================================================
-- Purpose: Allow contractors to send job request forms to 
-- external contractors (like Nick) who aren't in the network yet
--
-- Flow:
-- 1. Contractor creates external request (generates unique form link)
-- 2. External contractor fills form (no login required)
-- 3. Job appears in contractor's dashboard for approval
-- 4. After completion, soft onboarding to join network
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: sub-job-notification-system.sql

-- =====================================================
-- EXTERNAL CONTRACTOR REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS external_contractor_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_name TEXT NOT NULL, -- Who's requesting (Heath)
  
  -- External contractor info (not in network yet)
  external_contractor_name TEXT NOT NULL, -- Nick Johnson
  external_contractor_contact TEXT NOT NULL, -- Phone or email
  
  -- Pre-filled job details (contractor provides these)
  job_description TEXT, -- "Kitchen repaint + gutter install"
  estimated_scope TEXT, -- "3-4 day job"
  
  -- Request tracking
  form_link TEXT NOT NULL UNIQUE, -- https://yourapp.com/fill-job?id=xxx
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE, -- When Nick opened link
  fulfilled BOOLEAN DEFAULT false, -- Did Nick fill it out?
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  
  -- Link to created job (after Nick fills form)
  job_id UUID REFERENCES sub_opportunities(id) ON DELETE SET NULL,
  
  -- SMS/Email tracking
  sent_via TEXT CHECK (sent_via IN ('sms', 'email', 'manual')), -- How was link sent?
  delivery_status TEXT, -- 'sent', 'delivered', 'failed'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days') NOT NULL
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate external contractor request (you send link to Nick)
CREATE OR REPLACE FUNCTION create_external_contractor_request(
  p_contractor_id UUID,
  p_external_contractor_name TEXT,
  p_external_contractor_contact TEXT,
  p_job_description TEXT DEFAULT NULL,
  p_estimated_scope TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_request_id UUID;
  v_form_link TEXT;
  v_contractor_name TEXT;
BEGIN
  -- Get contractor name
  SELECT full_name INTO v_contractor_name
  FROM profiles
  WHERE id = p_contractor_id;
  
  -- Generate unique request ID
  v_request_id := gen_random_uuid();
  
  -- Build form link
  v_form_link := format(
    'https://constructivedesigns.com/fill-job?id=%s&from=%s',
    v_request_id,
    encode(v_contractor_name::bytea, 'base64')
  );
  
  -- Insert request
  INSERT INTO external_contractor_requests (
    id,
    contractor_id,
    contractor_name,
    external_contractor_name,
    external_contractor_contact,
    job_description,
    estimated_scope,
    form_link
  ) VALUES (
    v_request_id,
    p_contractor_id,
    v_contractor_name,
    p_external_contractor_name,
    p_external_contractor_contact,
    p_job_description,
    p_estimated_scope,
    v_form_link
  );
  
  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'form_link', v_form_link,
    'sms_message', format(
      'Hey %s! Can you fill out this quick job request? Takes 30 seconds: %s',
      p_external_contractor_name,
      v_form_link
    ),
    'email_subject', format('%s needs your availability', v_contractor_name),
    'email_body', format(
      'Hi %s,\n\nI have a job coming up and wanted to see if you''re available. Can you fill out this quick form? It takes about 30 seconds:\n\n%s\n\nThanks!\n%s',
      p_external_contractor_name,
      v_form_link,
      v_contractor_name
    )
  );
END;
$$;

-- Mark request as opened (when Nick clicks link)
CREATE OR REPLACE FUNCTION mark_external_request_opened(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE external_contractor_requests
  SET opened_at = NOW()
  WHERE id = p_request_id
  AND opened_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Get pending external requests (for contractor dashboard)
CREATE OR REPLACE FUNCTION get_pending_external_requests(p_contractor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'request_id', id,
        'external_contractor_name', external_contractor_name,
        'external_contractor_contact', external_contractor_contact,
        'job_description', job_description,
        'form_link', form_link,
        'sent_at', sent_at,
        'opened', opened_at IS NOT NULL,
        'opened_at', opened_at,
        'fulfilled', fulfilled,
        'fulfilled_at', fulfilled_at,
        'job_id', job_id,
        'days_ago', EXTRACT(DAY FROM (NOW() - sent_at))
      )
      ORDER BY sent_at DESC
    )
    FROM external_contractor_requests
    WHERE contractor_id = p_contractor_id
    AND NOT fulfilled
    AND expires_at > NOW()
  );
END;
$$;

-- Soft onboarding stats (show external contractor their value)
CREATE OR REPLACE FUNCTION get_external_contractor_value(
  p_external_contractor_contact TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_jobs_completed INTEGER;
  v_total_paid NUMERIC;
  v_portfolio_photos INTEGER;
  v_avg_rating NUMERIC;
BEGIN
  -- Count jobs completed as external contractor
  SELECT 
    COUNT(*),
    COALESCE(SUM(CAST(REGEXP_REPLACE(pay_rate, '[^0-9.]', '', 'g') AS NUMERIC)), 0),
    COALESCE(SUM(array_length(portfolio_photos, 1)), 0),
    AVG(contractor_rating)
  INTO v_jobs_completed, v_total_paid, v_portfolio_photos, v_avg_rating
  FROM sub_opportunities
  WHERE is_external_contractor = true
  AND external_contractor_contact = p_external_contractor_contact
  AND status = 'completed';
  
  RETURN json_build_object(
    'jobs_completed', v_jobs_completed,
    'total_earned', v_total_paid,
    'portfolio_photos', v_portfolio_photos,
    'average_rating', ROUND(v_avg_rating, 1),
    'tier_eligible', CASE
      WHEN v_jobs_completed >= 4 AND v_portfolio_photos >= 4 THEN 'sub_contractor'
      WHEN v_jobs_completed >= 1 THEN 'helper'
      ELSE 'ready_to_start'
    END,
    'onboarding_message', CASE
      WHEN v_jobs_completed >= 4 THEN 
        format('You''ve completed %s jobs with us! Join the network to unlock Sub-Contractor features.', v_jobs_completed)
      WHEN v_jobs_completed >= 1 THEN
        format('Great work on your first job! Complete %s more to unlock Sub-Contractor.', 4 - v_jobs_completed)
      ELSE
        'Ready to join the network? Get access to more jobs and build your portfolio.'
    END
  );
END;
$$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_requests_contractor_id ON external_contractor_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_external_requests_fulfilled ON external_contractor_requests(fulfilled);
CREATE INDEX IF NOT EXISTS idx_external_requests_contact ON external_contractor_requests(external_contractor_contact);
CREATE INDEX IF NOT EXISTS idx_external_requests_job_id ON external_contractor_requests(job_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE external_contractor_requests ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own requests
DROP POLICY IF EXISTS "Contractors view own requests" ON external_contractor_requests;
CREATE POLICY "Contractors view own requests" ON external_contractor_requests
  FOR SELECT USING (auth.uid() = contractor_id);

-- Contractors can create requests
DROP POLICY IF EXISTS "Contractors create requests" ON external_contractor_requests;
CREATE POLICY "Contractors create requests" ON external_contractor_requests
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

-- Contractors can update their requests
DROP POLICY IF EXISTS "Contractors update requests" ON external_contractor_requests;
CREATE POLICY "Contractors update requests" ON external_contractor_requests
  FOR UPDATE USING (auth.uid() = contractor_id);

-- =====================================================
-- UTILITY QUERIES
-- =====================================================

-- Create request and get share links
-- SELECT create_external_contractor_request(
--   'your-user-id',
--   'Nick Johnson',
--   '+1-303-555-1234',
--   'Kitchen repaint + gutter install',
--   '3-4 day job, I provide materials'
-- );

-- Get pending requests
-- SELECT get_pending_external_requests('your-user-id');

-- Check external contractor's value (for soft onboarding)
-- SELECT get_external_contractor_value('+1-303-555-1234');

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ External contractor request system created
-- ✅ Form link generation
-- ✅ Request tracking (sent, opened, fulfilled)
-- ✅ Soft onboarding value calculator
-- ✅ Dashboard queries for pending requests
--
-- NEXT STEPS:
-- 1. Deploy Supabase Edge Function (external-contractor-submit)
-- 2. Host HTML form (external-contractor-form.html)
-- 3. Integrate SMS sending (Twilio) for link delivery
-- 4. Build dashboard UI for creating requests
-- 5. Build soft onboarding flow after job completion
-- =====================================================

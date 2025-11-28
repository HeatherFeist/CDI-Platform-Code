-- =====================================================
-- SUB JOB NOTIFICATION SYSTEM
-- =====================================================
-- Push notification network for contractors to broadcast
-- job opportunities to helpers/subs with skill-based filtering
-- Project: gjbrjysuqdvvqlxklvos.supabase.co

-- =====================================================
-- 1. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- SUB JOB NOTIFICATIONS
  receive_sub_job_offers BOOLEAN DEFAULT true, -- Opt in/out of job texts
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('sms', 'email', 'both', 'app_only')) DEFAULT 'sms',
  phone_number TEXT, -- For SMS notifications
  
  -- SKILL FILTERS (only get jobs matching your skills)
  skill_filters TEXT[], -- ['painting', 'drywall', 'flooring'] - NULL = get all jobs
  location_radius_miles INTEGER DEFAULT 50, -- Only jobs within X miles
  min_pay_rate NUMERIC, -- Only jobs paying above $X/hour (optional filter)
  
  -- COMMUNITY NOTIFICATIONS (for newsletters, promotions, etc.)
  receive_newsletters BOOLEAN DEFAULT true,
  receive_member_promotions BOOLEAN DEFAULT true,
  receive_supplier_deals BOOLEAN DEFAULT true,
  receive_community_updates BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. SUB OPPORTUNITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sub_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL if external contractor
  
  -- EXTERNAL CONTRACTOR INFO (for contractors not yet in network)
  is_external_contractor BOOLEAN DEFAULT false, -- true if contractor not in system
  external_contractor_name TEXT, -- "Nick Johnson" - for display
  external_contractor_phone TEXT, -- For contact outside system
  external_contractor_email TEXT, -- For sending template form
  external_contractor_business TEXT, -- Business name if applicable
  
  -- THE 5 ESSENTIALS (keeping it minimal for contractors!)
  job_location TEXT NOT NULL, -- "123 Oak St, Pittsburgh PA"
  location_city TEXT, -- Parsed for filtering
  location_state TEXT, -- Parsed for filtering
  start_date TEXT NOT NULL, -- "Nov 15" or "TBD - waiting on client approval"
  estimated_duration TEXT NOT NULL, -- "3 days" or "20 hours"
  pay_details TEXT NOT NULL, -- "$2,000 flat rate" or "$35/hour"
  additional_notes TEXT, -- Materials, tools, special requirements, etc.
  
  -- CATEGORIZATION (for skill-based filtering)
  trade_types TEXT[] NOT NULL, -- ['painting', 'gutters'] - multiple skills per job
  
  -- NOTIFICATION TRACKING
  sent_to_users UUID[], -- Array of user IDs who received the notification
  interested_users UUID[] DEFAULT '{}', -- Users who clicked "I'm Interested"
  
  -- STATUS TRACKING
  status TEXT CHECK (status IN ('posted', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'posted',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Which helper/sub took it (YOU in this case)
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- PORTFOLIO & REVIEW TRACKING (even if contractor external)
  portfolio_photos TEXT[], -- Before/after photos for your portfolio
  helper_self_review TEXT, -- Your notes about the job for your records
  contractor_reviewed BOOLEAN DEFAULT false, -- Did external contractor leave review?
  
  -- GOOGLE CALENDAR INTEGRATION
  google_calendar_event_id TEXT, -- Store event ID for updates/deletion
  calendar_synced BOOLEAN DEFAULT false, -- Has this been added to calendar?
  calendar_sync_error TEXT, -- Store any sync errors for debugging
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraint: Either contractor_id OR external contractor info must be provided
  CONSTRAINT valid_contractor CHECK (
    (contractor_id IS NOT NULL AND is_external_contractor = false) OR
    (is_external_contractor = true AND external_contractor_name IS NOT NULL)
  )
);

-- =====================================================
-- 3. COMMUNITY BROADCASTS TABLE (for newsletters, promos)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  broadcast_type TEXT CHECK (broadcast_type IN ('newsletter', 'promotion', 'announcement', 'supplier_deal')) NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  image_url TEXT,
  
  -- TARGETING OPTIONS
  send_to_roles TEXT[], -- ['contractor', 'helper', 'admin'] - NULL = everyone
  send_to_locations TEXT[], -- ['Pittsburgh', 'Philadelphia'] - NULL = everyone
  send_to_skill_groups TEXT[], -- ['painting', 'plumbing'] - NULL = everyone
  
  -- DELIVERY TRACKING
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_receive_jobs ON notification_preferences(receive_sub_job_offers);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_skill_filters ON notification_preferences USING GIN(skill_filters);

CREATE INDEX IF NOT EXISTS idx_sub_opps_contractor_id ON sub_opportunities(contractor_id);
CREATE INDEX IF NOT EXISTS idx_sub_opps_trade_types ON sub_opportunities USING GIN(trade_types);
CREATE INDEX IF NOT EXISTS idx_sub_opps_status ON sub_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_sub_opps_assigned_to ON sub_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sub_opps_location_city ON sub_opportunities(location_city);

CREATE INDEX IF NOT EXISTS idx_broadcasts_sender_id ON community_broadcasts(sender_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_type ON community_broadcasts(broadcast_type);
CREATE INDEX IF NOT EXISTS idx_broadcasts_sent_at ON community_broadcasts(sent_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get eligible recipients for a sub job opportunity
CREATE OR REPLACE FUNCTION get_eligible_sub_job_recipients(
  p_opportunity_id UUID
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  phone_number TEXT,
  email TEXT,
  contact_method TEXT,
  matched_skills TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_contractor_id UUID;
  v_trade_types TEXT[];
  v_location_city TEXT;
  v_location_state TEXT;
BEGIN
  -- Get opportunity details
  SELECT contractor_id, trade_types, location_city, location_state
  INTO v_contractor_id, v_trade_types, v_location_city, v_location_state
  FROM sub_opportunities
  WHERE id = p_opportunity_id;
  
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    np.phone_number,
    p.email,
    np.preferred_contact_method AS contact_method,
    ARRAY(SELECT UNNEST(np.skill_filters) INTERSECT SELECT UNNEST(v_trade_types)) AS matched_skills
  FROM profiles p
  JOIN notification_preferences np ON p.id = np.user_id
  WHERE 
    np.receive_sub_job_offers = true -- Opted in
    AND p.id != v_contractor_id -- Don't notify the poster
    AND (
      np.skill_filters IS NULL -- No filters = get all jobs
      OR np.skill_filters && v_trade_types -- Skill match (array overlap operator)
    )
    AND (
      v_location_city IS NULL
      OR np.location_radius_miles IS NULL -- No location filter
      OR p.city = v_location_city -- Same city (simple match for now)
      -- TODO: Add radius calculation using PostGIS in future
    )
  ORDER BY p.rating DESC NULLS LAST; -- Highest rated members prioritized
END;
$$;

-- Function to mark interest in a sub job
CREATE OR REPLACE FUNCTION express_interest_in_sub_job(
  p_opportunity_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Add user to interested_users array if not already present
  UPDATE sub_opportunities
  SET interested_users = array_append(interested_users, p_user_id)
  WHERE id = p_opportunity_id
    AND NOT (interested_users @> ARRAY[p_user_id]); -- Don't add duplicates
  
  -- Create notification for contractor with profile link
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    so.contractor_id,
    'sub_job_interest',
    '🙋 New Interest in Your Sub Job',
    p.full_name || ' is interested in your ' || array_to_string(so.trade_types, '/') || ' job. Tap to review their profile.',
    '/sub-jobs/' || p_opportunity_id::text || '/interested'
  FROM sub_opportunities so
  JOIN profiles p ON p.id = p_user_id
  WHERE so.id = p_opportunity_id;
  
  -- Return helper profile summary for immediate display
  SELECT json_build_object(
    'user_id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'rating', COALESCE(p.rating, 0),
    'total_reviews', COALESCE(p.total_reviews, 0),
    'city', p.city,
    'state', p.state,
    'specialties', p.specialties,
    'avatar_url', p.avatar_url,
    'member_since', p.created_at,
    'profile_completion', calculate_profile_completion(p.id),
    'completed_sub_jobs', (
      SELECT COUNT(*) 
      FROM sub_opportunities 
      WHERE assigned_to = p.id 
      AND status = 'completed'
    )
  )
  INTO v_result
  FROM profiles p
  WHERE p.id = p_user_id;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- HELPER FUNCTIONS FOR PROFILE REVIEW
-- =====================================================

-- Function to calculate user's achievable role based on requirements
CREATE OR REPLACE FUNCTION calculate_achievable_role(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_ein BOOLEAN;
  v_profile_complete BOOLEAN;
  v_portfolio_photos INTEGER;
  v_selected_role TEXT;
  v_achievable_role TEXT;
  v_blocked_reason TEXT;
  v_jobs_completed INTEGER;
  v_tier TEXT;
  v_google_verified_reviews INTEGER;
  v_google_business_connected BOOLEAN;
  v_fast_track_eligible BOOLEAN;
BEGIN
  -- Get user's current data
  SELECT 
    contractor_features_unlocked,
    role,
    (SELECT COUNT(*) FROM sub_opportunities WHERE assigned_to = p_user_id AND portfolio_photos IS NOT NULL AND array_length(portfolio_photos, 1) >= 1),
    (bio IS NOT NULL AND phone IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL AND specialties IS NOT NULL),
    COALESCE(google_business_review_count, 0),
    (google_business_id IS NOT NULL AND google_business_verified = true)
  INTO v_has_ein, v_selected_role, v_jobs_completed, v_profile_complete, v_google_verified_reviews, v_google_business_connected
  FROM profiles
  WHERE id = p_user_id;
  
  -- Count portfolio photos across all completed jobs
  SELECT COALESCE(SUM(array_length(portfolio_photos, 1)), 0)
  INTO v_portfolio_photos
  FROM sub_opportunities
  WHERE assigned_to = p_user_id
  AND portfolio_photos IS NOT NULL
  AND status = 'completed';
  
  -- Check if eligible for Fast-Track (Google Business with 51+ verified reviews)
  v_fast_track_eligible := (v_google_business_connected = true AND v_google_verified_reviews >= 51);
  
  -- Calculate tier based on total verified work (network jobs + Google reviews)
  -- Fast-track contractors get instant Platinum if 51+ Google reviews
  DECLARE
    v_total_verified_jobs INTEGER := v_jobs_completed + v_google_verified_reviews;
  BEGIN
    IF v_total_verified_jobs >= 51 THEN
      v_tier := 'platinum';
    ELSIF v_total_verified_jobs >= 26 THEN
      v_tier := 'gold';
    ELSIF v_total_verified_jobs >= 11 THEN
      v_tier := 'silver';
    ELSE
      v_tier := 'bronze'; -- Default for new members
    END IF;
  END;
  -- Determine achievable role based on requirements
  -- FAST-TRACK PATH: Google Business with 51+ reviews = Instant Platinum Contractor
  IF v_fast_track_eligible = true THEN
    v_achievable_role := 'contractor';
    v_blocked_reason := NULL;
    -- EIN auto-verified from Google Business
    -- Portfolio auto-populated from Google Business photos
    -- Tier auto-set to Platinum
    
  ELSIF v_has_ein = true AND v_portfolio_photos >= 4 THEN
    -- Full Contractor access unlocked (traditional path)
    v_achievable_role := 'contractor';
    v_blocked_reason := NULL;
    
  ELSIF v_portfolio_photos >= 4 AND v_profile_complete = true THEN
    -- Sub-Contractor unlocked
    v_achievable_role := 'sub_contractor';
    
    -- Block Contractor role if selected but not qualified
    IF v_selected_role = 'contractor' THEN
      v_blocked_reason := 'Contractor role requires EIN verification. Currently limited to Sub-Contractor features. OR connect Google Business with 51+ reviews for instant Platinum!';
    ELSE
      v_blocked_reason := NULL;
    END IF;
    
  ELSIF v_profile_complete = true THEN
    -- Helper only
    v_achievable_role := 'helper';
    
    -- Block higher roles if selected
    IF v_selected_role IN ('contractor', 'sub_contractor') THEN
      v_blocked_reason := 'Upload 4+ project photos to unlock Sub-Contractor role. OR connect Google Business with 51+ reviews for instant Platinum!';
    ELSE
      v_blocked_reason := NULL;
    END IF;
    
  ELSE
    -- Nothing unlocked yet
    v_achievable_role := 'helper';
    v_blocked_reason := 'Complete your profile (bio, phone, location, specialties) to unlock Helper role.';
  END IF;
  
  RETURN json_build_object(
    'achievable_role', v_achievable_role,
    'selected_role', v_selected_role,
    'blocked_reason', v_blocked_reason,
    'is_blocked', (v_selected_role != v_achievable_role AND v_selected_role IN ('contractor', 'sub_contractor')),
    'fast_track_eligible', v_fast_track_eligible,
    'google_business_connected', v_google_business_connected,
    'google_verified_reviews', v_google_verified_reviews,
    
    -- Requirements status
    'requirements', json_build_object(
      'ein_verified', COALESCE(v_has_ein, false),
      'portfolio_photos', v_portfolio_photos,
      'profile_complete', v_profile_complete,
      'jobs_completed', v_jobs_completed,
      'google_business_verified', v_google_business_connected,
      'google_review_count', v_google_verified_reviews
    ),
    
    -- What's needed for next level
    'next_milestone', CASE
      WHEN v_achievable_role = 'contractor' THEN NULL -- Already at top
      WHEN v_achievable_role = 'sub_contractor' THEN 
        json_build_object(
          'target_role', 'contractor',
          'missing', ARRAY['Get EIN verified OR connect Google Business with 51+ reviews'],
          'message', 'Obtain EIN to unlock full Contractor features, OR connect your Google Business Profile for instant Platinum status!'
        )
      WHEN v_achievable_role = 'helper' AND v_portfolio_photos < 4 THEN
        json_build_object(
          'target_role', 'sub_contractor',
          'missing', ARRAY[format('%s more project photos needed OR connect Google Business', 4 - v_portfolio_photos)],
          'message', 'Upload project photos from completed jobs to unlock Sub-Contractor role, OR skip the line with Google Business verification!'
        )
      ELSE
        json_build_object(
          'target_role', 'sub_contractor',
          'missing', ARRAY['Complete profile OR connect Google Business'],
          'message', 'Fill in bio, phone, location, and specialties to start accepting jobs'
        )
    END,
    
    -- Tier info (can be instant Platinum via Google Business)
    'tier', v_tier,
    'tier_display', UPPER(v_tier),
    'tier_color', CASE
      WHEN v_tier = 'platinum' THEN '#E5E4E2'
      WHEN v_tier = 'gold' THEN '#FFD700'
      WHEN v_tier = 'silver' THEN '#C0C0C0'
      ELSE '#CD7F32' -- Bronze
    END,
    'tier_progress', json_build_object(
      'current_jobs', v_jobs_completed,
      'google_verified_reviews', v_google_verified_reviews,
      'total_verified_work', v_jobs_completed + v_google_verified_reviews,
      'next_tier_at', CASE
        WHEN v_jobs_completed + v_google_verified_reviews >= 51 THEN NULL -- Max tier
        WHEN v_jobs_completed + v_google_verified_reviews >= 26 THEN 51
        WHEN v_jobs_completed + v_google_verified_reviews >= 11 THEN 26
        ELSE 11
      END,
      'jobs_until_next', CASE
        WHEN v_jobs_completed + v_google_verified_reviews >= 51 THEN 0
        WHEN v_jobs_completed + v_google_verified_reviews >= 26 THEN 51 - (v_jobs_completed + v_google_verified_reviews)
        WHEN v_jobs_completed + v_google_verified_reviews >= 11 THEN 26 - (v_jobs_completed + v_google_verified_reviews)
        ELSE 11 - (v_jobs_completed + v_google_verified_reviews)
      END,
      'fast_track_used', v_fast_track_eligible
    ),
    
    -- Display labels
    'display_label', CASE
      WHEN v_achievable_role = 'contractor' AND v_fast_track_eligible THEN 'Contractor (Fast-Track)'
      WHEN v_achievable_role = 'contractor' THEN 'Contractor'
      WHEN v_achievable_role = 'sub_contractor' THEN 'Sub-Contractor'
      ELSE 'Helper'
    END,
    'badge_color', CASE
      WHEN v_achievable_role = 'contractor' THEN 'gold'
      WHEN v_achievable_role = 'sub_contractor' THEN 'blue'
      ELSE 'green'
    END
  );
END;
$$;

-- Function to check if user can access contractor features
CREATE OR REPLACE FUNCTION can_access_contractor_features(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_info JSON;
BEGIN
  SELECT calculate_achievable_role(p_user_id) INTO v_role_info;
  RETURN (v_role_info->>'achievable_role') = 'contractor';
END;
$$;

-- Function to check if user can access sub-contractor features  
CREATE OR REPLACE FUNCTION can_access_sub_contractor_features(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_info JSON;
BEGIN
  SELECT calculate_achievable_role(p_user_id) INTO v_role_info;
  RETURN (v_role_info->>'achievable_role') IN ('contractor', 'sub_contractor');
END;
$$;

-- Function to get detailed helper profile for contractor review
CREATE OR REPLACE FUNCTION get_helper_profile_for_review(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile JSON;
  v_role_info JSON;
BEGIN
  -- Calculate achievable role with gating logic
  SELECT calculate_achievable_role(p_user_id) INTO v_role_info;
  
  SELECT json_build_object(
    -- Basic Info
    'user_id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'city', p.city,
    'state', p.state,
    'phone', p.phone,
    'email', p.email,
    
    -- Gated Role System (based on requirements met)
    'role_info', v_role_info,
    'achievable_role', v_role_info->>'achievable_role',
    'selected_role', v_role_info->>'selected_role',
    'role_display_label', v_role_info->>'display_label',
    'badge_color', v_role_info->>'badge_color',
    'is_blocked', (v_role_info->>'is_blocked')::BOOLEAN,
    'blocked_reason', v_role_info->>'blocked_reason',
    
    -- Tier System (Bronze → Silver → Gold → Platinum)
    'tier', v_role_info->>'tier',
    'tier_display', v_role_info->>'tier_display',
    'tier_color', v_role_info->>'tier_color',
    'tier_progress', v_role_info->'tier_progress',
    
    -- Requirements Status
    'requirements', v_role_info->'requirements',
    'next_milestone', v_role_info->'next_milestone',
    
    -- Trust Signals
    'rating', COALESCE(p.rating, 0),
    'total_reviews', COALESCE(p.total_reviews, 0),
    'member_since', p.created_at,
    'profile_completion', calculate_profile_completion(p.id),
    'verified_phone', (p.phone IS NOT NULL),
    'verified_email', (p.email IS NOT NULL),
    
    -- Skills & Experience
    'specialties', p.specialties,
    'stored_role', p.role, -- What they SELECTED
    'ein_verified', COALESCE(p.contractor_features_unlocked, false),
    
    -- Work History
    'total_jobs_completed', (v_role_info->'requirements'->>'jobs_completed')::INTEGER,
    'portfolio_photos', (v_role_info->'requirements'->>'portfolio_photos')::INTEGER,
    'profile_complete', (v_role_info->'requirements'->>'profile_complete')::BOOLEAN,
    
    'total_jobs_in_progress', (
      SELECT COUNT(*) 
      FROM sub_opportunities 
      WHERE assigned_to = p.id 
      AND status IN ('assigned', 'in_progress')
    ),
    
    'success_rate', (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN NULL
          ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 100, 1)
        END
      FROM sub_opportunities
      WHERE assigned_to = p.id
    ),
    
    -- Recent Reviews (top 5)
    'recent_reviews', (
      SELECT json_agg(
        json_build_object(
          'rating', r.rating,
          'comment', r.comment,
          'reviewer_name', reviewer.full_name,
          'created_at', r.created_at
        ) ORDER BY r.created_at DESC
      )
      FROM reviews r
      JOIN profiles reviewer ON r.reviewer_id = reviewer.id
      WHERE r.reviewee_id = p.id
      LIMIT 5
    ),
    
    -- Response Time (for reliability assessment)
    'avg_response_time_hours', (
      SELECT AVG(
        EXTRACT(EPOCH FROM (assigned_at - created_at)) / 3600
      )
      FROM sub_opportunities
      WHERE assigned_to = p.id
      AND assigned_at IS NOT NULL
    )
  )
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;
  
  RETURN v_profile;
END;
$$;

-- Function to get all interested helpers for a job (with profile summaries)
CREATE OR REPLACE FUNCTION get_interested_helpers(
  p_opportunity_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_helpers JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'user_id', p.id,
      'full_name', p.full_name,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'rating', COALESCE(p.rating, 0),
      'total_reviews', COALESCE(p.total_reviews, 0),
      'city', p.city,
      'state', p.state,
      'specialties', p.specialties,
      'completed_sub_jobs', (
        SELECT COUNT(*) 
        FROM sub_opportunities 
        WHERE assigned_to = p.id 
        AND status = 'completed'
      ),
      'member_since', p.created_at,
      'interested_at', NOW() -- Timestamp when they expressed interest
    ) ORDER BY p.rating DESC NULLS LAST, p.total_reviews DESC
  )
  INTO v_helpers
  FROM profiles p
  WHERE p.id = ANY(
    SELECT UNNEST(interested_users) 
    FROM sub_opportunities 
    WHERE id = p_opportunity_id
  );
  
  RETURN COALESCE(v_helpers, '[]'::json);
END;
$$;

-- =====================================================
-- ENHANCED ASSIGNMENT FUNCTION WITH CONTRACTOR VERIFICATION
-- =====================================================

-- Function to assign sub job to a helper
CREATE OR REPLACE FUNCTION assign_sub_job(
  p_opportunity_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contractor_id UUID;
BEGIN
  -- Get contractor ID
  SELECT contractor_id INTO v_contractor_id
  FROM sub_opportunities
  WHERE id = p_opportunity_id;
  
  -- Verify caller is the contractor who posted it
  IF v_contractor_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the contractor who posted this job can assign it';
  END IF;
  
  -- Assign the job
  UPDATE sub_opportunities
  SET 
    assigned_to = p_user_id,
    assigned_at = NOW(),
    status = 'assigned'
  WHERE id = p_opportunity_id;
  
  -- Notify the assigned user
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    p_user_id,
    'sub_job_assigned',
    'You Got the Job!',
    'You have been assigned to a ' || array_to_string(trade_types, '/') || ' job. Check details.',
    '/sub-jobs/' || p_opportunity_id::text
  FROM sub_opportunities
  WHERE id = p_opportunity_id;
  
  -- Notify other interested users they weren't selected
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    UNNEST(interested_users),
    'sub_job_filled',
    'Job Was Filled',
    'The job you were interested in has been assigned to another member.',
    '/sub-jobs'
  FROM sub_opportunities
  WHERE id = p_opportunity_id
    AND interested_users IS NOT NULL
    AND UNNEST(interested_users) != p_user_id; -- Don't notify the person who got it
END;
$$;

-- Function to create default notification preferences when user signs up
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, phone_number)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$;

-- Trigger to create notification preferences on profile creation
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON profiles;
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_opps_updated_at ON sub_opportunities;
CREATE TRIGGER update_sub_opps_updated_at
    BEFORE UPDATE ON sub_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Notification Preferences policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sub Opportunities policies
ALTER TABLE sub_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sub opportunities are viewable by everyone" ON sub_opportunities;
CREATE POLICY "Sub opportunities are viewable by everyone" ON sub_opportunities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractors can insert sub opportunities" ON sub_opportunities;
CREATE POLICY "Contractors can insert sub opportunities" ON sub_opportunities
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

DROP POLICY IF EXISTS "Contractors can update their own sub opportunities" ON sub_opportunities;
CREATE POLICY "Contractors can update their own sub opportunities" ON sub_opportunities
  FOR UPDATE USING (auth.uid() = contractor_id);

-- Community Broadcasts policies
ALTER TABLE community_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Broadcasts are viewable by everyone" ON community_broadcasts;
CREATE POLICY "Broadcasts are viewable by everyone" ON community_broadcasts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage broadcasts" ON community_broadcasts;
CREATE POLICY "Admins can manage broadcasts" ON community_broadcasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- UPDATE NOTIFICATIONS TABLE
-- =====================================================
-- Add new notification types for sub job system

DO $$
BEGIN
  -- Add new notification types if not already present
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'outbid', 
    'won_auction', 
    'new_bid', 
    'listing_ended', 
    'payment_received', 
    'estimate_leftover',
    'sub_job_interest',      -- New: someone interested in your job posting
    'sub_job_assigned',      -- New: you got assigned a job
    'sub_job_filled',        -- New: job you were interested in was filled
    'newsletter',            -- New: community newsletter
    'promotion',             -- New: member promotion/announcement
    'supplier_deal'          -- New: supplier partnership deal
  ));
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that all tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notification_preferences', 'sub_opportunities', 'community_broadcasts');
-- Expected: 3 rows

-- Check notification preferences columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name IN ('receive_sub_job_offers', 'skill_filters', 'preferred_contact_method');
-- Expected: 3 rows

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Push notification system for sub job opportunities
-- ✅ Skill-based filtering (painters only see paint jobs)
-- ✅ Location-based filtering (local jobs prioritized)
-- ✅ Interest tracking (helpers express interest, contractors assign)
-- ✅ Community broadcasts (newsletters, promotions, supplier deals)
-- ✅ Extensible for future notification types
--
-- NEXT STEPS:
-- 1. Integrate Twilio for SMS notifications (backend)
-- 2. Build "Post Sub Job" form (mobile-optimized, voice-to-text)
-- 3. Build notification preferences UI (skill filters, opt-in/out)
-- 4. Test group text flow with 2-3 test users
-- 5. Add community broadcast admin panel
-- =====================================================

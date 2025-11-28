-- =====================================================
-- COLLABORATIVE CREDIT SYSTEM
-- =====================================================
-- Purpose: Share reviews and portfolio photos among ALL team members
-- on a project, not just the contractor
--
-- Real World Problem: Helpers are invisible - contractor gets all credit
-- Platform Solution: Everyone who worked the job gets credit, reviews, portfolio
--
-- This accelerates helper → sub → contractor progression by letting
-- helpers build portfolios from day 1 instead of staying invisible
--
-- Project: gjbrjysuqdvvqlxklvos.supabase.co
-- Run AFTER: sub-job-notification-system.sql

-- =====================================================
-- PROJECT TEAM MEMBERS TABLE
-- =====================================================
-- Track who worked on each job and their specific contribution

CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES sub_opportunities(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Role on this specific project
  project_role TEXT CHECK (project_role IN (
    'contractor', -- Lead contractor (manages project)
    'sub_contractor', -- Sub-contractor (manages portion)
    'helper' -- Helper (assists with tasks)
  )) NOT NULL,
  
  -- Contribution details
  contribution_description TEXT, -- What did they do? ("Prep work", "Final painting", etc.)
  hours_worked NUMERIC(5,2), -- Optional: track hours for payment
  date_started DATE,
  date_completed DATE,
  
  -- Credit sharing
  share_reviews BOOLEAN DEFAULT true, -- Share project reviews on this member's profile?
  share_photos BOOLEAN DEFAULT true, -- Share project photos in this member's portfolio?
  share_in_portfolio BOOLEAN DEFAULT true, -- List this project in member's portfolio?
  
  -- Compensation (optional)
  compensation_amount NUMERIC(10,2),
  compensation_paid BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(project_id, member_id) -- Each member listed once per project
);

-- =====================================================
-- TEAM MEMBER REVIEWS
-- =====================================================
-- Contractor reviews each team member's contribution
-- (Separate from client review of overall project)

CREATE TABLE IF NOT EXISTS team_member_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES sub_opportunities(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Contractor doing review
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Team member being reviewed
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Skill categories (contractor rates each)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  comment TEXT,
  would_hire_again BOOLEAN,
  
  -- Public visibility (default visible to help member build reputation)
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(project_id, reviewer_id, reviewee_id) -- One review per team member per project
);

-- =====================================================
-- SHARED PORTFOLIO ENTRIES
-- =====================================================
-- Each project can appear in multiple members' portfolios

CREATE OR REPLACE VIEW portfolio_entries AS
SELECT 
  ptm.member_id,
  ptm.project_id,
  so.job_location,
  so.start_date,
  so.status,
  so.portfolio_photos,
  ptm.project_role,
  ptm.contribution_description,
  
  -- Contractor info (who they worked FOR)
  CASE 
    WHEN so.contractor_id IS NOT NULL THEN so.contractor_id
    WHEN so.is_external_contractor THEN ptm.member_id -- If external, member IS contractor
    ELSE NULL
  END as worked_for_contractor_id,
  
  CASE 
    WHEN so.contractor_id IS NOT NULL THEN (SELECT full_name FROM profiles WHERE id = so.contractor_id)
    WHEN so.is_external_contractor THEN so.external_contractor_name
    ELSE NULL
  END as worked_for_contractor_name,
  
  -- Team size
  (SELECT COUNT(*) FROM project_team_members WHERE project_id = so.id) as team_size,
  
  -- Reviews for this member on this project
  (SELECT AVG(rating) FROM team_member_reviews WHERE project_id = so.id AND reviewee_id = ptm.member_id) as project_rating,
  (SELECT comment FROM team_member_reviews WHERE project_id = so.id AND reviewee_id = ptm.member_id LIMIT 1) as review_comment,
  
  ptm.created_at
FROM project_team_members ptm
JOIN sub_opportunities so ON ptm.project_id = so.id
WHERE ptm.share_in_portfolio = true
  AND so.status = 'completed';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Add team member to project
CREATE OR REPLACE FUNCTION add_team_member(
  p_project_id UUID,
  p_member_id UUID,
  p_project_role TEXT,
  p_contribution_description TEXT DEFAULT NULL,
  p_share_reviews BOOLEAN DEFAULT true,
  p_share_photos BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_member BOOLEAN;
BEGIN
  -- Check if member already on team
  SELECT EXISTS (
    SELECT 1 FROM project_team_members 
    WHERE project_id = p_project_id 
    AND member_id = p_member_id
  ) INTO v_existing_member;
  
  IF v_existing_member THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_on_team',
      'message', 'This member is already on the project team'
    );
  END IF;
  
  -- Add team member
  INSERT INTO project_team_members (
    project_id,
    member_id,
    project_role,
    contribution_description,
    share_reviews,
    share_photos,
    share_in_portfolio
  ) VALUES (
    p_project_id,
    p_member_id,
    p_project_role,
    p_contribution_description,
    p_share_reviews,
    p_share_photos,
    true
  );
  
  RETURN json_build_object(
    'success', true,
    'message', format('Added %s to project team as %s', 
      (SELECT full_name FROM profiles WHERE id = p_member_id),
      p_project_role
    )
  );
END;
$$;

-- Review team member's contribution
CREATE OR REPLACE FUNCTION review_team_member(
  p_project_id UUID,
  p_reviewer_id UUID,
  p_reviewee_id UUID,
  p_rating INTEGER,
  p_quality_rating INTEGER DEFAULT NULL,
  p_timeliness_rating INTEGER DEFAULT NULL,
  p_communication_rating INTEGER DEFAULT NULL,
  p_professionalism_rating INTEGER DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_would_hire_again BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_reviewee_name TEXT;
BEGIN
  -- Verify reviewer is contractor on project
  IF NOT EXISTS (
    SELECT 1 FROM sub_opportunities 
    WHERE id = p_project_id 
    AND (contractor_id = p_reviewer_id OR assigned_to = p_reviewer_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_authorized',
      'message', 'Only the project contractor can review team members'
    );
  END IF;
  
  -- Verify reviewee is on team
  IF NOT EXISTS (
    SELECT 1 FROM project_team_members 
    WHERE project_id = p_project_id 
    AND member_id = p_reviewee_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_on_team',
      'message', 'This member is not on the project team'
    );
  END IF;
  
  -- Get reviewee name
  SELECT full_name INTO v_reviewee_name
  FROM profiles
  WHERE id = p_reviewee_id;
  
  -- Insert or update review
  INSERT INTO team_member_reviews (
    project_id,
    reviewer_id,
    reviewee_id,
    rating,
    quality_rating,
    timeliness_rating,
    communication_rating,
    professionalism_rating,
    comment,
    would_hire_again
  ) VALUES (
    p_project_id,
    p_reviewer_id,
    p_reviewee_id,
    p_rating,
    p_quality_rating,
    p_timeliness_rating,
    p_communication_rating,
    p_professionalism_rating,
    p_comment,
    p_would_hire_again
  )
  ON CONFLICT (project_id, reviewer_id, reviewee_id) 
  DO UPDATE SET
    rating = EXCLUDED.rating,
    quality_rating = EXCLUDED.quality_rating,
    timeliness_rating = EXCLUDED.timeliness_rating,
    communication_rating = EXCLUDED.communication_rating,
    professionalism_rating = EXCLUDED.professionalism_rating,
    comment = EXCLUDED.comment,
    would_hire_again = EXCLUDED.would_hire_again;
  
  -- Update reviewee's overall rating
  PERFORM update_profile_rating(p_reviewee_id);
  
  RETURN json_build_object(
    'success', true,
    'message', format('Review for %s submitted successfully', v_reviewee_name),
    'rating', p_rating,
    'would_hire_again', p_would_hire_again
  );
END;
$$;

-- Get member's portfolio (includes shared projects)
CREATE OR REPLACE FUNCTION get_member_portfolio(
  p_member_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_portfolio JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'project_id', pe.project_id,
      'location', pe.job_location,
      'date', pe.start_date,
      'role', pe.project_role,
      'contribution', pe.contribution_description,
      'worked_for', json_build_object(
        'contractor_id', pe.worked_for_contractor_id,
        'contractor_name', pe.worked_for_contractor_name
      ),
      'team_size', pe.team_size,
      'photos', pe.portfolio_photos,
      'rating', ROUND(pe.project_rating, 1),
      'review', pe.review_comment,
      'completed_at', pe.created_at
    )
    ORDER BY pe.created_at DESC
  )
  INTO v_portfolio
  FROM portfolio_entries pe
  WHERE pe.member_id = p_member_id
  LIMIT p_limit;
  
  RETURN COALESCE(v_portfolio, '[]'::json);
END;
$$;

-- Get project team (for contractor managing team)
CREATE OR REPLACE FUNCTION get_project_team(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'member_id', ptm.member_id,
        'member_name', p.full_name,
        'member_avatar', p.avatar_url,
        'project_role', ptm.project_role,
        'contribution', ptm.contribution_description,
        'hours_worked', ptm.hours_worked,
        'compensation', ptm.compensation_amount,
        'paid', ptm.compensation_paid,
        'rating', (
          SELECT rating FROM team_member_reviews 
          WHERE project_id = p_project_id 
          AND reviewee_id = ptm.member_id
        ),
        'reviewed', EXISTS (
          SELECT 1 FROM team_member_reviews 
          WHERE project_id = p_project_id 
          AND reviewee_id = ptm.member_id
        )
      )
    )
    FROM project_team_members ptm
    JOIN profiles p ON ptm.member_id = p.id
    WHERE ptm.project_id = p_project_id
  );
END;
$$;

-- Calculate how many projects member has worked on
CREATE OR REPLACE FUNCTION count_member_projects(
  p_member_id UUID,
  p_role_filter TEXT DEFAULT NULL -- 'contractor', 'sub_contractor', 'helper', or NULL for all
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM project_team_members ptm
  JOIN sub_opportunities so ON ptm.project_id = so.id
  WHERE ptm.member_id = p_member_id
    AND so.status = 'completed'
    AND (p_role_filter IS NULL OR ptm.project_role = p_role_filter);
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_member_id ON project_team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_role ON project_team_members(project_role);
CREATE INDEX IF NOT EXISTS idx_team_member_reviews_project_id ON team_member_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_team_member_reviews_reviewee_id ON team_member_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_team_member_reviews_reviewer_id ON team_member_reviews(reviewer_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- Members can view teams they're part of
DROP POLICY IF EXISTS "Members can view own team memberships" ON project_team_members;
CREATE POLICY "Members can view own team memberships" ON project_team_members
  FOR SELECT USING (auth.uid() = member_id);

-- Contractors can view teams for their projects
DROP POLICY IF EXISTS "Contractors can view project teams" ON project_team_members;
CREATE POLICY "Contractors can view project teams" ON project_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sub_opportunities 
      WHERE id = project_id 
      AND (contractor_id = auth.uid() OR assigned_to = auth.uid())
    )
  );

-- Contractors can add team members to their projects
DROP POLICY IF EXISTS "Contractors can add team members" ON project_team_members;
CREATE POLICY "Contractors can add team members" ON project_team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sub_opportunities 
      WHERE id = project_id 
      AND (contractor_id = auth.uid() OR assigned_to = auth.uid())
    )
  );

ALTER TABLE team_member_reviews ENABLE ROW LEVEL SECURITY;

-- Public reviews are viewable by everyone (help members build reputation)
DROP POLICY IF EXISTS "Public reviews viewable by all" ON team_member_reviews;
CREATE POLICY "Public reviews viewable by all" ON team_member_reviews
  FOR SELECT USING (is_public = true);

-- Members can view their own reviews (even if private)
DROP POLICY IF EXISTS "Members can view own reviews" ON team_member_reviews;
CREATE POLICY "Members can view own reviews" ON team_member_reviews
  FOR SELECT USING (auth.uid() = reviewee_id);

-- Contractors can create reviews for their team members
DROP POLICY IF EXISTS "Contractors can review team members" ON team_member_reviews;
CREATE POLICY "Contractors can review team members" ON team_member_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_project_team_members_updated_at ON project_team_members;
CREATE TRIGGER update_project_team_members_updated_at
  BEFORE UPDATE ON project_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY QUERIES
-- =====================================================

-- See all projects a member has worked on (including as helper)
-- SELECT * FROM portfolio_entries WHERE member_id = 'user-id-here';

-- See who worked on a specific project
-- SELECT get_project_team('project-id-here');

-- Count how many projects as helper vs contractor
-- SELECT 
--   count_member_projects('user-id', 'helper') as helper_projects,
--   count_member_projects('user-id', 'contractor') as contractor_projects;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Collaborative credit system implemented
-- ✅ Team members tracked per project
-- ✅ Reviews shared among team (contractor reviews each member)
-- ✅ Portfolio photos shared (all team members get credit)
-- ✅ Portfolio view includes ALL projects worked on (not just as contractor)
-- ✅ Helpers can build portfolios from day 1
-- ✅ Accelerates helper → sub → contractor progression
--
-- NEXT STEPS:
-- 1. Build "Add Team Member" UI (contractor adds helpers to project)
-- 2. Build "Review Team Member" UI (after project completion)
-- 3. Build portfolio gallery showing shared projects
-- 4. Add "Worked with [Contractor Name]" badge on portfolio items
-- 5. Analytics: Track progression speed with vs without collaborative credit
-- =====================================================

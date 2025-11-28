-- ============================================================================
-- MEMBER DISCOVERY & TRANSPARENCY SYSTEM
-- ============================================================================
-- Makes ALL member profiles, badges, ratings, and skills visible to everyone
-- Enables merit-based collaboration without hierarchy
-- Self-organizing network through transparent reputation
-- ============================================================================

-- ============================================================================
-- COMPREHENSIVE MEMBER DIRECTORY VIEW
-- ============================================================================
-- Shows EVERYTHING about every member to ALL other members
-- No hidden profiles, no gatekeeping, complete transparency

CREATE OR REPLACE VIEW public_member_directory AS
SELECT 
    -- Basic Identity
    p.id,
    p.username,
    p.first_name || ' ' || p.last_name as full_name,
    p.bio,
    p.avatar_url,
    
    -- Contact & Location
    p.email,
    p.phone,
    p.city,
    p.state,
    
    -- Professional Identity
    p.workspace_email, -- @constructivedesignsinc.org email
    b.name as business_name,
    b.website as business_website,
    b.logo_url as business_logo,
    
    -- Reputation (THE KEY TRANSPARENCY)
    p.rating as overall_rating,
    p.total_reviews,
    ub.tier_name as badge_tier,
    ub.tier_level as badge_level,
    bt.badge_icon,
    bt.badge_color,
    
    -- Experience Metrics
    p.total_projects,
    p.completed_projects,
    ROUND((p.completed_projects::DECIMAL / NULLIF(p.total_projects, 0) * 100), 1) as completion_rate,
    
    -- Performance Stats
    us.on_time_completion_rate,
    us.response_time_hours,
    us.repeat_client_rate,
    us.total_revenue,
    us.avg_project_value,
    
    -- Skills & Specialties (SEARCHABLE)
    p.specialties, -- Array of skills
    tm.role as business_role, -- If they're in a business: employee, subcontractor, helper
    
    -- Availability Indicators
    p.is_active,
    p.is_accepting_projects,
    p.verified,
    p.membership_type, -- 'free_member' or 'paid_guest'
    
    -- Social Proof
    COUNT(DISTINCT ptr.id) as total_referrals_given,
    COUNT(DISTINCT ptr2.id) as total_referrals_received,
    
    -- Activity Recency
    p.last_active_at,
    p.created_at as member_since,
    DATE_PART('day', NOW() - p.created_at) as days_as_member
    
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
LEFT JOIN user_badges ub ON p.id = ub.profile_id AND ub.is_current = true
LEFT JOIN badge_tiers bt ON ub.tier_id = bt.id
LEFT JOIN user_stats us ON p.id = us.profile_id
LEFT JOIN team_members tm ON p.id = tm.profile_id
LEFT JOIN profile_trust_referrals ptr ON p.id = ptr.referrer_id
LEFT JOIN profile_trust_referrals ptr2 ON p.id = ptr2.referee_id
WHERE p.membership_type = 'free_member' -- Only show members, not paid guests
GROUP BY 
    p.id, p.username, p.first_name, p.last_name, p.bio, p.avatar_url,
    p.email, p.phone, p.city, p.state, p.workspace_email,
    b.name, b.website, b.logo_url,
    p.rating, p.total_reviews, ub.tier_name, ub.tier_level,
    bt.badge_icon, bt.badge_color,
    p.total_projects, p.completed_projects,
    us.on_time_completion_rate, us.response_time_hours, 
    us.repeat_client_rate, us.total_revenue, us.avg_project_value,
    p.specialties, tm.role,
    p.is_active, p.is_accepting_projects, p.verified, p.membership_type,
    p.last_active_at, p.created_at
ORDER BY p.rating DESC, p.total_reviews DESC;

-- Grant universal read access to ALL members
GRANT SELECT ON public_member_directory TO authenticated;

COMMENT ON VIEW public_member_directory IS 
'Complete transparency: Every member can see every other member''s full profile, ratings, badges, skills, and stats. Enables merit-based collaboration without hierarchy.';


-- ============================================================================
-- MEMBER SEARCH FUNCTION
-- ============================================================================
-- Find members by skills, location, rating, availability

CREATE OR REPLACE FUNCTION search_members(
    search_skills TEXT[] DEFAULT NULL,
    min_rating DECIMAL DEFAULT 0,
    min_badge_level INTEGER DEFAULT 0,
    search_location TEXT DEFAULT NULL,
    available_only BOOLEAN DEFAULT false,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    member_id UUID,
    username TEXT,
    full_name TEXT,
    rating DECIMAL,
    badge_tier TEXT,
    badge_level INTEGER,
    specialties TEXT[],
    location TEXT,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pmd.id,
        pmd.username,
        pmd.full_name,
        pmd.overall_rating,
        pmd.badge_tier,
        pmd.badge_level,
        pmd.specialties,
        COALESCE(pmd.city || ', ' || pmd.state, pmd.state, 'Location not set') as location,
        -- Calculate match score
        (
            -- Skill match (most important)
            (CASE 
                WHEN search_skills IS NOT NULL AND pmd.specialties && search_skills 
                THEN array_length(ARRAY(SELECT unnest(pmd.specialties) INTERSECT SELECT unnest(search_skills)), 1) * 10
                ELSE 0 
            END) +
            -- Rating score
            (pmd.overall_rating * 5)::INTEGER +
            -- Badge level bonus
            (pmd.badge_level * 3) +
            -- Completion rate
            (pmd.completion_rate::INTEGER / 10) +
            -- Review count (social proof)
            (CASE WHEN pmd.total_reviews > 10 THEN 5 ELSE pmd.total_reviews / 2 END)
        ) as match_score
    FROM public_member_directory pmd
    WHERE 
        -- Rating filter
        pmd.overall_rating >= min_rating
        -- Badge filter
        AND (min_badge_level = 0 OR pmd.badge_level >= min_badge_level)
        -- Location filter
        AND (search_location IS NULL OR 
             pmd.city ILIKE '%' || search_location || '%' OR 
             pmd.state ILIKE '%' || search_location || '%')
        -- Availability filter
        AND (NOT available_only OR pmd.is_accepting_projects = true)
        -- Active members only
        AND pmd.is_active = true
    ORDER BY match_score DESC, pmd.overall_rating DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_members IS 
'Search for members by skills, rating, location. Returns ranked results with match scores. Enables finding the right collaborator for any project.';


-- ============================================================================
-- MEMBER ACTIVITY FEED
-- ============================================================================
-- Shows recent achievements, projects, reviews for transparency

CREATE OR REPLACE VIEW member_activity_feed AS
SELECT 
    'badge_earned' as activity_type,
    bh.profile_id,
    p.username,
    p.first_name || ' ' || p.last_name as full_name,
    'earned ' || bh.to_tier_name || ' badge' as activity_description,
    NULL::TEXT as related_project,
    bh.created_at
FROM badge_history bh
JOIN profiles p ON bh.profile_id = p.id
WHERE bh.reason = 'promotion'
    AND p.membership_type = 'free_member'

UNION ALL

SELECT 
    'project_completed' as activity_type,
    e.created_by as profile_id,
    p.username,
    p.first_name || ' ' || p.last_name as full_name,
    'completed project: ' || pr.name as activity_description,
    pr.name as related_project,
    e.completed_at as created_at
FROM estimates e
JOIN profiles p ON e.created_by = p.id
JOIN projects pr ON e.project_id = pr.id
WHERE e.status = 'completed'
    AND p.membership_type = 'free_member'
    AND e.completed_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'review_received' as activity_type,
    ur.reviewee_id as profile_id,
    p.username,
    p.first_name || ' ' || p.last_name as full_name,
    'received ' || ur.rating || '-star review' as activity_description,
    NULL::TEXT as related_project,
    ur.created_at
FROM user_reviews ur
JOIN profiles p ON ur.reviewee_id = p.id
WHERE p.membership_type = 'free_member'
    AND ur.created_at > NOW() - INTERVAL '30 days'

ORDER BY created_at DESC
LIMIT 100;

GRANT SELECT ON member_activity_feed TO authenticated;

COMMENT ON VIEW member_activity_feed IS 
'Real-time feed of member achievements, completed projects, and reviews. Creates social proof and motivation through transparency.';


-- ============================================================================
-- SKILL-BASED RECOMMENDATIONS
-- ============================================================================
-- "Members you might want to work with" based on complementary skills

CREATE OR REPLACE FUNCTION get_recommended_collaborators(
    for_member_id UUID,
    limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    member_id UUID,
    username TEXT,
    full_name TEXT,
    rating DECIMAL,
    badge_tier TEXT,
    complementary_skills TEXT[],
    reason_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH member_skills AS (
        SELECT specialties
        FROM profiles
        WHERE id = for_member_id
    )
    SELECT 
        pmd.id,
        pmd.username,
        pmd.full_name,
        pmd.overall_rating,
        pmd.badge_tier,
        ARRAY(
            SELECT unnest(pmd.specialties) 
            EXCEPT 
            SELECT unnest(ms.specialties)
        ) as complementary_skills,
        'Has complementary skills: ' || 
        array_to_string(ARRAY(
            SELECT unnest(pmd.specialties) 
            EXCEPT 
            SELECT unnest(ms.specialties)
        ), ', ') as reason_text
    FROM public_member_directory pmd
    CROSS JOIN member_skills ms
    WHERE pmd.id != for_member_id
        AND pmd.is_active = true
        AND pmd.is_accepting_projects = true
        -- Has skills the member doesn't have
        AND NOT (pmd.specialties <@ ms.specialties)
        -- But has at least one skill in common (for compatibility)
        AND (pmd.specialties && ms.specialties)
    ORDER BY pmd.overall_rating DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recommended_collaborators IS 
'Suggests members with complementary skills for collaboration. Finds people who can fill gaps in your skill set.';


-- ============================================================================
-- LEADERBOARDS (Public Rankings)
-- ============================================================================
-- Creates healthy competition through transparency

CREATE OR REPLACE VIEW member_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY overall_rating DESC, total_reviews DESC) as rank,
    username,
    full_name,
    overall_rating,
    total_reviews,
    badge_tier,
    completed_projects,
    member_since,
    days_as_member,
    -- Calculate projects per month
    ROUND(
        completed_projects::DECIMAL / 
        GREATEST(DATE_PART('day', NOW() - member_since) / 30, 1), 
        1
    ) as avg_projects_per_month
FROM public_member_directory
WHERE overall_rating > 0  -- Only members with at least one review
ORDER BY rank
LIMIT 100;

GRANT SELECT ON member_leaderboard TO authenticated;

COMMENT ON VIEW member_leaderboard IS 
'Top 100 members ranked by rating and reviews. Creates healthy competition and showcases excellence.';


-- ============================================================================
-- RISING STARS (New Members Excelling)
-- ============================================================================
-- Highlights new members who are doing exceptionally well

CREATE OR REPLACE VIEW rising_stars AS
SELECT 
    username,
    full_name,
    overall_rating,
    total_reviews,
    badge_tier,
    completed_projects,
    member_since,
    days_as_member,
    -- Projects per month (velocity)
    ROUND(
        completed_projects::DECIMAL / 
        GREATEST(DATE_PART('day', NOW() - member_since) / 30, 1), 
        2
    ) as projects_per_month
FROM public_member_directory
WHERE days_as_member <= 180  -- Joined within last 6 months
    AND completed_projects >= 3  -- At least 3 projects
    AND overall_rating >= 4.0  -- Strong rating
ORDER BY projects_per_month DESC, overall_rating DESC
LIMIT 20;

GRANT SELECT ON rising_stars TO authenticated;

COMMENT ON VIEW rising_stars IS 
'New members (< 6 months) who are excelling. Shows that merit rises quickly in this system regardless of tenure.';


-- ============================================================================
-- TRANSPARENCY POLICIES (RLS)
-- ============================================================================
-- Ensure ALL members can see ALL other members' data

-- Member directory: Universal read access for all authenticated users
CREATE POLICY "All members can view all other members"
    ON profiles FOR SELECT
    TO authenticated
    USING (membership_type = 'free_member');

-- Badges: Everyone can see everyone's badges
CREATE POLICY "All members can view all badges"
    ON user_badges FOR SELECT
    TO authenticated
    USING (true);

-- Reviews: Public read (transparency in reputation)
CREATE POLICY "All members can view all reviews"
    ON user_reviews FOR SELECT
    TO authenticated
    USING (true);

-- Projects: Public read (see what everyone's working on)
CREATE POLICY "All members can view all projects"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

-- Estimates: Public read (learn from others' estimates)
CREATE POLICY "All members can view all estimates"
    ON estimates FOR SELECT
    TO authenticated
    USING (true);


-- ============================================================================
-- SELF-ORGANIZING FEATURES
-- ============================================================================
-- Enable members to manage themselves without director intervention

-- Function: Request to join a project
CREATE OR REPLACE FUNCTION request_to_join_project(
    p_project_id UUID,
    p_requester_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
    v_project_creator UUID;
BEGIN
    -- Get project creator
    SELECT created_by INTO v_project_creator
    FROM projects
    WHERE id = p_project_id;
    
    -- Create notification for project creator
    INSERT INTO notifications (
        profile_id,
        type,
        title,
        message,
        related_project_id,
        related_profile_id
    ) VALUES (
        v_project_creator,
        'project_join_request',
        'New Project Join Request',
        (SELECT username FROM profiles WHERE id = p_requester_id) || 
        ' wants to join your project' ||
        CASE WHEN p_message IS NOT NULL THEN ': ' || p_message ELSE '' END,
        p_project_id,
        p_requester_id
    ) RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_to_join_project IS 
'Members can request to join any project they see. Project creator receives notification and can accept/decline. Self-organizing collaboration.';


-- Function: Endorse another member's skills
CREATE OR REPLACE FUNCTION endorse_member_skill(
    p_member_id UUID,
    p_skill TEXT,
    p_endorser_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Add to skill endorsements table (create if doesn't exist)
    INSERT INTO skill_endorsements (
        profile_id,
        skill,
        endorsed_by,
        endorsed_at
    ) VALUES (
        p_member_id,
        p_skill,
        p_endorser_id,
        NOW()
    )
    ON CONFLICT (profile_id, skill, endorsed_by) DO NOTHING;
    
    -- Notify the member
    INSERT INTO notifications (
        profile_id,
        type,
        title,
        message,
        related_profile_id
    ) VALUES (
        p_member_id,
        'skill_endorsed',
        'Skill Endorsed',
        (SELECT username FROM profiles WHERE id = p_endorser_id) || 
        ' endorsed your ' || p_skill || ' skills',
        p_endorser_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create skill endorsements table
CREATE TABLE IF NOT EXISTS skill_endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    endorsed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endorsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, skill, endorsed_by)
);

CREATE INDEX IF NOT EXISTS idx_skill_endorsements_profile ON skill_endorsements(profile_id);
GRANT SELECT ON skill_endorsements TO authenticated;

COMMENT ON FUNCTION endorse_member_skill IS 
'Members can endorse each other''s skills. Creates peer validation without director intervention.';


-- ============================================================================
-- ANALYTICS FOR THE DIRECTOR (Without Micromanaging)
-- ============================================================================
-- High-level view of network health, not individual control

CREATE OR REPLACE VIEW network_health_dashboard AS
SELECT 
    -- Membership metrics
    COUNT(DISTINCT id) as total_members,
    COUNT(DISTINCT CASE WHEN last_active_at > NOW() - INTERVAL '7 days' THEN id END) as active_this_week,
    COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN id END) as new_this_month,
    
    -- Quality metrics
    ROUND(AVG(overall_rating), 2) as network_avg_rating,
    COUNT(DISTINCT CASE WHEN badge_level >= 3 THEN id END) as gold_plus_members,
    
    -- Activity metrics
    SUM(completed_projects) as total_projects_completed,
    SUM(total_reviews) as total_reviews_given,
    
    -- Health indicators
    ROUND(AVG(completion_rate), 1) as avg_completion_rate,
    ROUND(COUNT(DISTINCT CASE WHEN is_accepting_projects THEN id END)::DECIMAL / COUNT(*) * 100, 1) as pct_accepting_work,
    
    -- Growth indicators
    ROUND(
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN id END)::DECIMAL /
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '60 days' AND created_at <= NOW() - INTERVAL '30 days' THEN id END),
        2
    ) as growth_rate_mom
    
FROM public_member_directory;

GRANT SELECT ON network_health_dashboard TO authenticated;

COMMENT ON VIEW network_health_dashboard IS 
'High-level network health metrics for the director. Shows trends without micromanaging individual members. System self-regulates.';


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
================================================================================
✅ MEMBER DISCOVERY & TRANSPARENCY SYSTEM INSTALLED
================================================================================

Created Views:
- public_member_directory: Every member sees every other member (complete transparency)
- member_activity_feed: Real-time feed of achievements (social proof)
- member_leaderboard: Top 100 members by rating (healthy competition)
- rising_stars: New members excelling (merit rises fast)
- network_health_dashboard: Director overview without micromanaging

Created Functions:
- search_members(): Find collaborators by skill/rating/location
- get_recommended_collaborators(): Suggests complementary skills
- request_to_join_project(): Members self-organize onto projects
- endorse_member_skill(): Peer validation without hierarchy

Key Features:
✨ TOTAL TRANSPARENCY: All members see all profiles, ratings, badges
✨ MERIT-BASED: Reputation visible to everyone, no favoritism
✨ SELF-ORGANIZING: Members find and invite each other
✨ NO HIERARCHY: Equal access, equal visibility for all
✨ RUNS ITSELF: Director monitors health, members manage collaboration

Result: Your time is freed up. The network self-regulates through transparency.
================================================================================
    ';
END $$;

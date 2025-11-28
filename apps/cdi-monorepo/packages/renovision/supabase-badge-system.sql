-- ============================================================================
-- BADGE SYSTEM FOR GAMIFICATION & ACCOUNTABILITY
-- ============================================================================
-- Dynamic badge tiers based on user ratings, reviews, and performance
-- Users can level up OR down based on their behavior
-- Creates accountability while rewarding excellence
-- ============================================================================

-- Badge Tiers Table
CREATE TABLE IF NOT EXISTS badge_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name TEXT NOT NULL UNIQUE, -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    tier_level INTEGER NOT NULL UNIQUE, -- 1, 2, 3, 4 for sorting
    min_rating DECIMAL(3,2) NOT NULL, -- Minimum average rating required
    min_reviews INTEGER NOT NULL, -- Minimum number of reviews required
    min_projects INTEGER NOT NULL, -- Minimum completed projects
    badge_icon TEXT, -- Emoji or icon identifier
    badge_color TEXT, -- Hex color for display
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table (current badge per user)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES badge_tiers(id),
    tier_name TEXT NOT NULL, -- Denormalized for quick access
    tier_level INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    previous_tier_id UUID REFERENCES badge_tiers(id), -- Track progression
    times_earned INTEGER DEFAULT 1, -- How many times they've reached this tier
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, is_current) WHERE is_current = true
);

-- Badge History (track all tier changes)
CREATE TABLE IF NOT EXISTS badge_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_tier_id UUID REFERENCES badge_tiers(id),
    from_tier_name TEXT,
    to_tier_id UUID NOT NULL REFERENCES badge_tiers(id),
    to_tier_name TEXT NOT NULL,
    reason TEXT, -- 'promotion', 'demotion', 'initial'
    rating_at_change DECIMAL(3,2),
    review_count_at_change INTEGER,
    project_count_at_change INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics View (real-time calculations)
CREATE OR REPLACE VIEW user_performance_metrics AS
SELECT 
    p.id as profile_id,
    p.username,
    p.display_name,
    p.rating,
    p.total_projects,
    p.completed_projects,
    COUNT(DISTINCT ur.id) as total_reviews,
    AVG(ur.rating) as avg_review_rating,
    COUNT(DISTINCT CASE WHEN ur.rating >= 4 THEN ur.id END) as positive_reviews,
    COUNT(DISTINCT CASE WHEN ur.rating <= 2 THEN ur.id END) as negative_reviews,
    COALESCE(us.on_time_completion_rate, 0) as on_time_rate,
    COALESCE(us.response_time_hours, 24) as response_time,
    ub.tier_name as current_badge,
    ub.tier_level as current_level,
    bt.tier_name as eligible_tier,
    bt.tier_level as eligible_level
FROM profiles p
LEFT JOIN user_reviews ur ON p.id = ur.reviewee_id
LEFT JOIN user_stats us ON p.id = us.profile_id
LEFT JOIN user_badges ub ON p.id = ub.profile_id AND ub.is_current = true
LEFT JOIN badge_tiers bt ON (
    COALESCE(p.rating, 0) >= bt.min_rating 
    AND COALESCE(p.completed_projects, 0) >= bt.min_projects
)
GROUP BY p.id, p.username, p.display_name, p.rating, p.total_projects, 
         p.completed_projects, us.on_time_completion_rate, us.response_time_hours,
         ub.tier_name, ub.tier_level, bt.tier_name, bt.tier_level
ORDER BY bt.tier_level DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate eligible badge tier for a user
CREATE OR REPLACE FUNCTION calculate_badge_tier(user_id UUID)
RETURNS TABLE (
    tier_id UUID,
    tier_name TEXT,
    tier_level INTEGER,
    meets_requirements BOOLEAN,
    current_rating DECIMAL,
    current_reviews INTEGER,
    current_projects INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.id,
        bt.tier_name,
        bt.tier_level,
        (
            COALESCE(p.rating, 0) >= bt.min_rating 
            AND COALESCE(review_count.total, 0) >= bt.min_reviews
            AND COALESCE(p.completed_projects, 0) >= bt.min_projects
        ) as meets_requirements,
        COALESCE(p.rating, 0) as current_rating,
        COALESCE(review_count.total, 0) as current_reviews,
        COALESCE(p.completed_projects, 0) as current_projects
    FROM badge_tiers bt
    CROSS JOIN profiles p
    LEFT JOIN (
        SELECT reviewee_id, COUNT(*) as total
        FROM user_reviews
        WHERE reviewee_id = user_id
        GROUP BY reviewee_id
    ) review_count ON true
    WHERE p.id = user_id
    ORDER BY bt.tier_level DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update user badge based on performance
CREATE OR REPLACE FUNCTION update_user_badge(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_badge RECORD;
    v_eligible_tier RECORD;
    v_profile RECORD;
    v_review_count INTEGER;
    v_result JSONB;
BEGIN
    -- Get current profile data
    SELECT * INTO v_profile
    FROM profiles
    WHERE id = user_id;

    -- Count reviews
    SELECT COUNT(*) INTO v_review_count
    FROM user_reviews
    WHERE reviewee_id = user_id;

    -- Get current badge
    SELECT * INTO v_current_badge
    FROM user_badges
    WHERE profile_id = user_id AND is_current = true;

    -- Find highest tier they qualify for
    SELECT bt.* INTO v_eligible_tier
    FROM badge_tiers bt
    WHERE 
        COALESCE(v_profile.rating, 0) >= bt.min_rating
        AND v_review_count >= bt.min_reviews
        AND COALESCE(v_profile.completed_projects, 0) >= bt.min_projects
    ORDER BY bt.tier_level DESC
    LIMIT 1;

    -- If no tier qualifies, assign Bronze (tier 1)
    IF v_eligible_tier IS NULL THEN
        SELECT * INTO v_eligible_tier
        FROM badge_tiers
        ORDER BY tier_level ASC
        LIMIT 1;
    END IF;

    -- Check if badge needs updating
    IF v_current_badge IS NULL THEN
        -- First time - assign initial badge
        INSERT INTO user_badges (profile_id, tier_id, tier_name, tier_level, previous_tier_id)
        VALUES (user_id, v_eligible_tier.id, v_eligible_tier.tier_name, v_eligible_tier.tier_level, NULL);

        INSERT INTO badge_history (profile_id, to_tier_id, to_tier_name, reason, rating_at_change, review_count_at_change, project_count_at_change)
        VALUES (user_id, v_eligible_tier.id, v_eligible_tier.tier_name, 'initial', v_profile.rating, v_review_count, v_profile.completed_projects);

        v_result := jsonb_build_object(
            'action', 'assigned',
            'badge', v_eligible_tier.tier_name,
            'level', v_eligible_tier.tier_level
        );

    ELSIF v_current_badge.tier_level != v_eligible_tier.tier_level THEN
        -- Badge changed - promotion or demotion
        DECLARE
            v_reason TEXT;
        BEGIN
            IF v_eligible_tier.tier_level > v_current_badge.tier_level THEN
                v_reason := 'promotion';
            ELSE
                v_reason := 'demotion';
            END IF;

            -- Mark old badge as not current
            UPDATE user_badges
            SET is_current = false
            WHERE profile_id = user_id AND is_current = true;

            -- Check if they've had this tier before
            DECLARE
                v_previous_badge RECORD;
            BEGIN
                SELECT * INTO v_previous_badge
                FROM user_badges
                WHERE profile_id = user_id AND tier_id = v_eligible_tier.id
                ORDER BY earned_at DESC
                LIMIT 1;

                IF v_previous_badge IS NOT NULL THEN
                    -- Re-earning a tier
                    INSERT INTO user_badges (profile_id, tier_id, tier_name, tier_level, previous_tier_id, times_earned)
                    VALUES (user_id, v_eligible_tier.id, v_eligible_tier.tier_name, v_eligible_tier.tier_level, v_current_badge.tier_id, v_previous_badge.times_earned + 1);
                ELSE
                    -- New tier
                    INSERT INTO user_badges (profile_id, tier_id, tier_name, tier_level, previous_tier_id)
                    VALUES (user_id, v_eligible_tier.id, v_eligible_tier.tier_name, v_eligible_tier.tier_level, v_current_badge.tier_id);
                END IF;
            END;

            -- Record in history
            INSERT INTO badge_history (
                profile_id, 
                from_tier_id, 
                from_tier_name, 
                to_tier_id, 
                to_tier_name, 
                reason,
                rating_at_change,
                review_count_at_change,
                project_count_at_change
            ) VALUES (
                user_id,
                v_current_badge.tier_id,
                v_current_badge.tier_name,
                v_eligible_tier.id,
                v_eligible_tier.tier_name,
                v_reason,
                v_profile.rating,
                v_review_count,
                v_profile.completed_projects
            );

            v_result := jsonb_build_object(
                'action', v_reason,
                'from', v_current_badge.tier_name,
                'to', v_eligible_tier.tier_name,
                'from_level', v_current_badge.tier_level,
                'to_level', v_eligible_tier.tier_level
            );
        END;
    ELSE
        -- No change
        v_result := jsonb_build_object(
            'action', 'no_change',
            'badge', v_current_badge.tier_name,
            'level', v_current_badge.tier_level
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get badge display info for user
CREATE OR REPLACE FUNCTION get_user_badge_info(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'current_badge', jsonb_build_object(
            'tier_name', ub.tier_name,
            'tier_level', ub.tier_level,
            'badge_icon', bt.badge_icon,
            'badge_color', bt.badge_color,
            'earned_at', ub.earned_at,
            'times_earned', ub.times_earned
        ),
        'performance', jsonb_build_object(
            'rating', p.rating,
            'total_projects', p.total_projects,
            'completed_projects', p.completed_projects,
            'total_reviews', (SELECT COUNT(*) FROM user_reviews WHERE reviewee_id = user_id)
        ),
        'next_tier', (
            SELECT jsonb_build_object(
                'tier_name', next_bt.tier_name,
                'tier_level', next_bt.tier_level,
                'required_rating', next_bt.min_rating,
                'required_reviews', next_bt.min_reviews,
                'required_projects', next_bt.min_projects,
                'rating_gap', next_bt.min_rating - COALESCE(p.rating, 0),
                'reviews_gap', next_bt.min_reviews - (SELECT COUNT(*) FROM user_reviews WHERE reviewee_id = user_id),
                'projects_gap', next_bt.min_projects - COALESCE(p.completed_projects, 0)
            )
            FROM badge_tiers next_bt
            WHERE next_bt.tier_level > ub.tier_level
            ORDER BY next_bt.tier_level ASC
            LIMIT 1
        ),
        'history', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'from_tier', bh.from_tier_name,
                    'to_tier', bh.to_tier_name,
                    'reason', bh.reason,
                    'date', bh.created_at
                )
                ORDER BY bh.created_at DESC
            )
            FROM badge_history bh
            WHERE bh.profile_id = user_id
            LIMIT 10
        )
    ) INTO v_result
    FROM profiles p
    LEFT JOIN user_badges ub ON p.id = ub.profile_id AND ub.is_current = true
    LEFT JOIN badge_tiers bt ON ub.tier_id = bt.id
    WHERE p.id = user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update badge when user receives a review
CREATE OR REPLACE FUNCTION trigger_badge_update_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the reviewee's badge
    PERFORM update_user_badge(NEW.reviewee_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badge_after_review
AFTER INSERT OR UPDATE ON user_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_badge_update_on_review();

-- Auto-update badge when project is completed
CREATE OR REPLACE FUNCTION trigger_badge_update_on_project_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If project status changed to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Update badges for all team members on this project
        PERFORM update_user_badge(ptm.profile_id)
        FROM project_team_members ptm
        WHERE ptm.project_id = NEW.id;
        
        -- Update badge for business owner
        PERFORM update_user_badge(NEW.business_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badge_after_project_completion
AFTER UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_badge_update_on_project_completion();

-- ============================================================================
-- DEFAULT BADGE TIERS
-- ============================================================================

INSERT INTO badge_tiers (tier_name, tier_level, min_rating, min_reviews, min_projects, badge_icon, badge_color, description)
VALUES
    ('Bronze', 1, 0.00, 0, 0, '🥉', '#CD7F32', 'Starting tier - Welcome to the community!'),
    ('Silver', 2, 4.00, 5, 3, '🥈', '#C0C0C0', 'Reliable member - Building a solid reputation'),
    ('Gold', 3, 4.50, 15, 10, '🥇', '#FFD700', 'Excellent professional - Highly trusted'),
    ('Platinum', 4, 4.80, 30, 25, '💎', '#E5E4E2', 'Elite tier - Top-rated expert in the community')
ON CONFLICT (tier_name) DO UPDATE SET
    tier_level = EXCLUDED.tier_level,
    min_rating = EXCLUDED.min_rating,
    min_reviews = EXCLUDED.min_reviews,
    min_projects = EXCLUDED.min_projects,
    badge_icon = EXCLUDED.badge_icon,
    badge_color = EXCLUDED.badge_color,
    description = EXCLUDED.description;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE badge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view badge tiers
CREATE POLICY "Badge tiers are viewable by everyone"
ON badge_tiers FOR SELECT
USING (true);

-- Everyone can view user badges (public reputation)
CREATE POLICY "User badges are viewable by everyone"
ON user_badges FOR SELECT
USING (true);

-- Users can only view their own badge history
CREATE POLICY "Users can view their own badge history"
ON badge_history FOR SELECT
USING (auth.uid() = profile_id);

-- System can insert/update badges
CREATE POLICY "System can manage user badges"
ON user_badges FOR ALL
USING (true);

CREATE POLICY "System can manage badge history"
ON badge_history FOR ALL
USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_badges_profile_current ON user_badges(profile_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_badges_tier_level ON user_badges(tier_level);
CREATE INDEX IF NOT EXISTS idx_badge_history_profile ON badge_history(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badge_tiers_level ON badge_tiers(tier_level);

-- ============================================================================
-- BADGE LEADERBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW badge_leaderboard AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    ub.tier_name,
    ub.tier_level,
    bt.badge_icon,
    bt.badge_color,
    p.rating,
    p.completed_projects,
    COUNT(DISTINCT ur.id) as total_reviews,
    ub.earned_at as badge_earned_at,
    ub.times_earned,
    CASE 
        WHEN ub.times_earned > 1 THEN true
        ELSE false
    END as is_comeback_story
FROM profiles p
LEFT JOIN user_badges ub ON p.id = ub.profile_id AND ub.is_current = true
LEFT JOIN badge_tiers bt ON ub.tier_id = bt.id
LEFT JOIN user_reviews ur ON p.id = ur.reviewee_id
WHERE p.public_profile = true
GROUP BY p.id, p.username, p.display_name, p.avatar_url, ub.tier_name, 
         ub.tier_level, bt.badge_icon, bt.badge_color, p.rating, 
         p.completed_projects, ub.earned_at, ub.times_earned
ORDER BY ub.tier_level DESC, p.rating DESC, p.completed_projects DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE badge_tiers IS 'Defines the tier system: Bronze, Silver, Gold, Platinum with requirements';
COMMENT ON TABLE user_badges IS 'Tracks current badge for each user - can go up OR down';
COMMENT ON TABLE badge_history IS 'Complete audit trail of all badge changes (promotions and demotions)';
COMMENT ON FUNCTION update_user_badge IS 'Recalculates user badge based on current rating, reviews, and projects - handles both promotion and demotion';
COMMENT ON FUNCTION get_user_badge_info IS 'Returns comprehensive badge info including current badge, progress to next tier, and history';
COMMENT ON VIEW badge_leaderboard IS 'Public leaderboard showing users by badge tier with comeback story indicator';

-- RenovVision Team Member Profile & Rating System
-- Database Schema

-- =====================================================
-- TEAM PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT,
    phone TEXT,
    email TEXT,
    profile_photo_url TEXT,
    location TEXT,
    years_experience INTEGER DEFAULT 0,
    specialties TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    available_for_hire BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT, -- e.g., 'Plumbing', 'Electrical', 'Carpentry'
    years_experience INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- =====================================================
-- TEAM CERTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    credential_id TEXT,
    credential_url TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verified BOOLEAN DEFAULT false,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECT ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT, -- e.g., 'Lead Contractor', 'Assistant', 'Specialist'
    status TEXT DEFAULT 'assigned', -- assigned, in_progress, completed, cancelled
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    hours_worked DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, team_member_id)
);

-- =====================================================
-- TEAM REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('client', 'team_member', 'manager')),
    
    -- Overall rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Detailed ratings
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    
    -- Review content
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    
    -- Verification
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(team_member_id, project_id, reviewer_id)
);

-- =====================================================
-- TEAM RATINGS TABLE (Calculated)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Overall metrics
    overall_rating DECIMAL(3,2) DEFAULT 0 CHECK (overall_rating >= 0 AND overall_rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    
    -- Detailed breakdown (stored as JSONB for flexibility)
    breakdown JSONB DEFAULT '{}',
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM BADGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id TEXT NOT NULL, -- e.g., 'verified_pro', 'quality_master'
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    badge_category TEXT, -- skill, achievement, quality, experience
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- =====================================================
-- PROJECT PORTFOLIO ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_type TEXT,
    completion_date DATE,
    client_name TEXT,
    location TEXT,
    photos TEXT[] DEFAULT '{}',
    before_photos TEXT[] DEFAULT '{}',
    after_photos TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_team_profiles_user_id ON team_profiles(user_id);
CREATE INDEX idx_team_skills_user_id ON team_skills(user_id);
CREATE INDEX idx_team_certifications_user_id ON team_certifications(user_id);
CREATE INDEX idx_project_assignments_team_member ON project_assignments(team_member_id);
CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_status ON project_assignments(status);
CREATE INDEX idx_team_reviews_team_member ON team_reviews(team_member_id);
CREATE INDEX idx_team_reviews_reviewer ON team_reviews(reviewer_id);
CREATE INDEX idx_team_reviews_status ON team_reviews(status);
CREATE INDEX idx_team_ratings_user_id ON team_ratings(user_id);
CREATE INDEX idx_team_badges_user_id ON team_badges(user_id);
CREATE INDEX idx_team_portfolio_user_id ON team_portfolio_items(user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Team Profiles: Public read, own profile write
ALTER TABLE team_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team profiles are viewable by everyone"
    ON team_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own team profile"
    ON team_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team profile"
    ON team_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Team Skills: Public read, own skills write
ALTER TABLE team_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team skills are viewable by everyone"
    ON team_skills FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own skills"
    ON team_skills FOR ALL
    USING (auth.uid() = user_id);

-- Team Certifications: Public read, own certifications write
ALTER TABLE team_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team certifications are viewable by everyone"
    ON team_certifications FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own certifications"
    ON team_certifications FOR ALL
    USING (auth.uid() = user_id);

-- Project Assignments: Team members and managers can view
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own assignments"
    ON project_assignments FOR SELECT
    USING (auth.uid() = team_member_id OR EXISTS (
        SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    ));

-- Team Reviews: Public approved reviews, anyone can submit
ALTER TABLE team_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are viewable by everyone"
    ON team_reviews FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Anyone can submit a review"
    ON team_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Team Ratings: Public read
ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team ratings are viewable by everyone"
    ON team_ratings FOR SELECT
    USING (true);

-- Team Badges: Public read
ALTER TABLE team_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team badges are viewable by everyone"
    ON team_badges FOR SELECT
    USING (true);

-- Portfolio Items: Public visible items, own items management
ALTER TABLE team_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible portfolio items are viewable by everyone"
    ON team_portfolio_items FOR SELECT
    USING (visible = true);

CREATE POLICY "Users can manage own portfolio items"
    ON team_portfolio_items FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to tables
CREATE TRIGGER update_team_profiles_updated_at
    BEFORE UPDATE ON team_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_certifications_updated_at
    BEFORE UPDATE ON team_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assignments_updated_at
    BEFORE UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_reviews_updated_at
    BEFORE UPDATE ON team_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_portfolio_items_updated_at
    BEFORE UPDATE ON team_portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample specialties
COMMENT ON COLUMN team_profiles.specialties IS 'Array of specialties: ["Plumbing", "HVAC", "Electrical", "Carpentry", "Painting", "Drywall", "Roofing", "Flooring", "Masonry", "Landscaping"]';

-- Insert sample skills categories
COMMENT ON COLUMN team_skills.category IS 'Skill categories: Plumbing, Electrical, Carpentry, Painting, HVAC, Roofing, Flooring, Masonry, Landscaping, General Contracting';

COMMENT ON TABLE team_reviews IS 'Community reviews for team members - transparency and quality tracking';
COMMENT ON TABLE team_ratings IS 'Calculated ratings based on reviews and project completion - updated automatically';
COMMENT ON TABLE team_badges IS 'Achievement badges earned by team members based on performance and milestones';

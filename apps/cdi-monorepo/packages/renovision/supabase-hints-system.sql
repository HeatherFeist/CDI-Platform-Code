-- ============================================================================
-- CONTEXTUAL HINTS & TIPS SYSTEM
-- ============================================================================
-- Smart guidance system that displays helpful tips throughout the app
-- Context-aware hints that teach best practices and answer questions proactively
-- Users can dismiss hints, and system tracks which hints they've seen
-- ============================================================================

-- Hint Categories
CREATE TYPE hint_category AS ENUM (
    'estimates',
    'projects',
    'team_management',
    'payments',
    'tax_planning',
    'community',
    'profile',
    'scheduling',
    'communication',
    'photography',
    'milestones',
    'general'
);

-- Hint Priority (determines order of display)
CREATE TYPE hint_priority AS ENUM (
    'critical',      -- Must-know information (compliance, legal)
    'high',          -- Very helpful tips (money-saving, efficiency)
    'medium',        -- Good to know (best practices)
    'low'            -- Nice to have (productivity tips)
);

-- Hints Library Table
CREATE TABLE IF NOT EXISTS hints_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category hint_category NOT NULL,
    priority hint_priority DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT, -- Material icon name or emoji
    action_text TEXT, -- Optional button text like "Learn More"
    action_url TEXT, -- Optional link to documentation/video
    page_path TEXT, -- Which page(s) to show this hint on (regex pattern)
    user_role TEXT[], -- Which roles should see this (null = all)
    show_once BOOLEAN DEFAULT false, -- Show only once, or can reappear
    is_active BOOLEAN DEFAULT true,
    display_duration INTEGER DEFAULT 8000, -- Milliseconds to show (0 = user dismisses)
    sequence_order INTEGER, -- Order within a category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Hint Interactions (tracks what users have seen/dismissed)
CREATE TABLE IF NOT EXISTS user_hint_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hint_id UUID NOT NULL REFERENCES hints_library(id) ON DELETE CASCADE,
    seen_count INTEGER DEFAULT 0,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, hint_id)
);

-- Hint Display Rules (advanced targeting)
CREATE TABLE IF NOT EXISTS hint_display_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hint_id UUID NOT NULL REFERENCES hints_library(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL, -- 'project_count', 'days_since_signup', 'has_team_members', etc.
    rule_operator TEXT NOT NULL, -- 'greater_than', 'less_than', 'equals', 'exists'
    rule_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get hints for a user on a specific page
CREATE OR REPLACE FUNCTION get_hints_for_user(
    user_id UUID,
    page_path TEXT,
    user_role TEXT DEFAULT NULL
)
RETURNS TABLE (
    hint_id UUID,
    category hint_category,
    priority hint_priority,
    title TEXT,
    message TEXT,
    icon TEXT,
    action_text TEXT,
    action_url TEXT,
    seen_count INTEGER,
    is_new BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.category,
        h.priority,
        h.title,
        h.message,
        h.icon,
        h.action_text,
        h.action_url,
        COALESCE(uhi.seen_count, 0) as seen_count,
        (uhi.id IS NULL) as is_new
    FROM hints_library h
    LEFT JOIN user_hint_interactions uhi ON h.id = uhi.hint_id AND uhi.profile_id = user_id
    WHERE 
        h.is_active = true
        AND (h.page_path IS NULL OR page_path ~ h.page_path)
        AND (h.user_role IS NULL OR user_role = ANY(h.user_role))
        AND (uhi.dismissed IS NULL OR uhi.dismissed = false)
        AND (
            h.show_once = false 
            OR (h.show_once = true AND uhi.id IS NULL)
        )
    ORDER BY 
        CASE h.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        h.sequence_order,
        h.created_at DESC
    LIMIT 3; -- Show max 3 hints at once
END;
$$ LANGUAGE plpgsql;

-- Record hint interaction
CREATE OR REPLACE FUNCTION record_hint_interaction(
    user_id UUID,
    hint_id UUID,
    action TEXT -- 'seen', 'dismissed', 'rated'
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_hint_interactions (profile_id, hint_id, seen_count, last_seen_at)
    VALUES (user_id, hint_id, 1, NOW())
    ON CONFLICT (profile_id, hint_id)
    DO UPDATE SET
        seen_count = user_hint_interactions.seen_count + 1,
        last_seen_at = NOW(),
        dismissed = CASE 
            WHEN action = 'dismissed' THEN true 
            ELSE user_hint_interactions.dismissed 
        END,
        dismissed_at = CASE 
            WHEN action = 'dismissed' THEN NOW() 
            ELSE user_hint_interactions.dismissed_at 
        END;
END;
$$ LANGUAGE plpgsql;

-- Rate hint helpfulness
CREATE OR REPLACE FUNCTION rate_hint(
    user_id UUID,
    hint_id UUID,
    rating INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE user_hint_interactions
    SET helpful_rating = rating
    WHERE profile_id = user_id AND hint_id = hint_id;
END;
$$ LANGUAGE plpgsql;

-- Get hint statistics (for admins)
CREATE OR REPLACE VIEW hint_statistics AS
SELECT 
    h.id,
    h.title,
    h.category,
    COUNT(DISTINCT uhi.profile_id) as users_shown,
    COUNT(DISTINCT CASE WHEN uhi.dismissed = true THEN uhi.profile_id END) as users_dismissed,
    AVG(uhi.seen_count) as avg_views_per_user,
    AVG(uhi.helpful_rating) as avg_rating,
    COUNT(DISTINCT CASE WHEN uhi.helpful_rating IS NOT NULL THEN uhi.profile_id END) as rating_count
FROM hints_library h
LEFT JOIN user_hint_interactions uhi ON h.id = uhi.hint_id
GROUP BY h.id, h.title, h.category;

-- ============================================================================
-- DEFAULT HINTS
-- ============================================================================

-- ESTIMATES HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order, show_once) VALUES
('estimates', 'high', 'Pay Yourself as an Employee', 
'💡 Pro Tip: Always include yourself as a team member with a salary! This makes tax accounting much easier at year-end and helps you track true project profitability.', 
'account_balance_wallet', 
'/business/estimates.*', 
1, 
false),

('estimates', 'medium', 'Detailed Task Breakdown', 
'Breaking tasks into specific line items increases client trust and makes it easier to track progress during the project.', 
'checklist', 
'/business/estimates.*', 
2, 
false),

('estimates', 'high', 'Include Contingency Buffer', 
'⚠️ Consider adding a 10-15% contingency line item for unexpected issues. Transparency about buffers builds trust and protects your profit margin.', 
'shield', 
'/business/estimates.*', 
3, 
true),

('estimates', 'medium', 'AI-Generated Visualizations', 
'Upload before photos and let AI generate stunning after visualizations! Visual estimates convert 3x better than text-only quotes.', 
'auto_awesome', 
'/business/estimates.*', 
4, 
true),

('estimates', 'high', 'Use AI Job Costing Assistant', 
'🤖 Let AI help you price accurately! Our job costing tool uses zip code-based unit costs to verify your estimates. Get instant feedback if your pricing is off-market in either direction.', 
'calculate', 
'/business/estimates.*', 
5,
false),

('estimates', 'medium', 'Market-Rate Pricing by Zip Code', 
'📍 Costs vary by location! A kitchen remodel in Dayton, OH costs different than Miami, FL. Our AI uses local labor rates, material costs, and permit fees to ensure competitive pricing.', 
'location_on', 
'/business/estimates.*', 
6,
false);

-- PROJECT MANAGEMENT HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('projects', 'high', 'Document Everything with Photos', 
'📸 Take photos at every stage! Before, during, and after photos protect you from disputes, showcase your work, and help with future marketing.', 
'photo_camera', 
'/business/projects/.*', 
1),

('projects', 'critical', 'Get Milestone Approvals', 
'Always get client approval before marking milestones complete. This protects payment and ensures alignment on quality standards.', 
'approval', 
'/business/projects/.*/active', 
2),

('projects', 'medium', 'Communicate Proactively', 
'Send daily or weekly updates to clients even when everything is going well. Over-communication builds trust and prevents anxiety.', 
'forum', 
'/business/projects/.*', 
3);

-- TEAM MANAGEMENT HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('team_management', 'high', 'Clear Compensation Agreements', 
'🤝 Always set clear pay terms before work begins. Fixed, hourly, or milestone-based - transparency prevents disputes and builds team loyalty.', 
'handshake', 
'/business/team.*', 
1),

('team_management', 'high', 'Contractor Supervision Premium', 
'💼 Industry standard: The lead contractor who manages the project typically keeps 15-25% more than team members to compensate for supervision, project management, client communication, and liability. This is fair and expected.', 
'supervisor_account', 
'/business/estimates.*|/business/team.*', 
2),

('team_management', 'medium', 'Track Certifications & Skills', 
'Keep records of your team''s licenses, certifications, and specialties. This helps you bid on bigger projects and proves qualifications to clients.', 
'workspace_premium', 
'/business/team.*', 
3),

('team_management', 'high', 'Build Your Reputation Together', 
'Encourage your team to create profiles and earn reviews. A highly-rated team attracts better clients and higher-paying projects.', 
'groups', 
'/business/team.*', 
4);

-- PAYMENT & TAX HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('payments', 'critical', 'Separate Business & Personal', 
'🏦 Use a dedicated business bank account! Mixing personal and business funds creates tax nightmares and looks unprofessional during audits.', 
'account_balance', 
'/business/payments.*|/business/transactions.*', 
1),

('tax_planning', 'critical', 'Track Deductible Expenses', 
'Keep receipts for tools, materials, vehicle expenses, and equipment! These deductions significantly reduce your tax bill. The app tracks everything automatically.', 
'receipt_long', 
'/business/.*|/tax/.*', 
1),

('tax_planning', 'high', 'Quarterly Estimated Taxes', 
'⏰ As a business owner, you need to pay quarterly estimated taxes! Mark your calendar: April 15, June 15, Sept 15, Jan 15. Avoid penalties by planning ahead.', 
'event', 
'/tax/.*', 
2),

('payments', 'high', 'Voluntary Donations Are Tax-Deductible', 
'💚 When you make voluntary donations through the app, they''re fully tax-deductible! You''re supporting the community while reducing your tax burden.', 
'volunteer_activism', 
'/business/payments.*', 
2);

-- COMMUNITY HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('community', 'medium', 'Build Your Badge Tier', 
'🏆 Earn higher badge tiers (Bronze → Silver → Gold → Platinum) by completing projects and getting great reviews. Higher badges attract premium clients!', 
'military_tech', 
'/business/community.*|/business/badges.*', 
1),

('community', 'high', 'Network = Net Worth', 
'Connect with other contractors, subcontractors, and specialists. The strongest businesses are built on reliable partnerships and referral networks.', 
'diversity_3', 
'/business/community.*', 
2),

('community', 'medium', 'Share Your Expertise', 
'Help others in the community! Answering questions and sharing tips builds your reputation as an expert and attracts collaboration opportunities.', 
'school', 
'/business/community.*', 
3);

-- PROFILE HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order, show_once) VALUES
('profile', 'high', 'Complete Your Profile', 
'✨ Profiles with photos, skills, and detailed bios get 5x more project invitations! Take 5 minutes to showcase your expertise.', 
'badge', 
'/settings/profile.*', 
1,
true),

('profile', 'medium', 'Set Your Availability Status', 
'Let others know you''re available for work or seeking help on projects. Clear availability increases collaboration opportunities.', 
'event_available', 
'/settings/profile.*', 
2,
false);

-- SCHEDULING HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('scheduling', 'medium', 'Sync Google Calendar', 
'📅 Connect your Google Calendar to avoid double-bookings and show real-time availability to clients. Saves hours of back-and-forth scheduling!', 
'calendar_today', 
'/business/schedule.*|/business/calendar.*', 
1),

('scheduling', 'high', 'Buffer Time Between Projects', 
'Always schedule 1-2 day buffers between projects for cleanup, equipment maintenance, and unexpected delays. Rushed transitions lead to mistakes.', 
'schedule', 
'/business/schedule.*', 
2);

-- PHOTOGRAPHY HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('photography', 'high', 'Consistent Photo Quality', 
'📸 Use good lighting and clear angles for before/after photos. High-quality photos are your best marketing tool and increase estimate conversions by 300%!', 
'photo_library', 
'/business/photos.*', 
1),

('photography', 'medium', 'Show the Process', 
'Don''t just show before/after - capture during photos too! Clients love seeing the transformation happen and it proves work quality.', 
'timeline', 
'/business/photos.*', 
2);

-- MILESTONE HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('milestones', 'critical', 'Front-Load Early Payments', 
'💰 Structure milestone payments so you receive 30-50% upfront. This covers initial expenses and filters out non-serious clients.', 
'payments', 
'/business/estimates.*|/business/projects.*', 
1),

('milestones', 'high', 'Milestone = Deliverable', 
'Each milestone should represent a clear, measurable deliverable (e.g., "Foundation Complete" not "Week 2"). This prevents payment disputes.', 
'task_alt', 
'/business/estimates.*|/business/projects.*', 
2);

-- GENERAL HINTS
INSERT INTO hints_library (category, priority, title, message, icon, page_path, sequence_order) VALUES
('general', 'medium', 'Keyboard Shortcuts', 
'⌨️ Pro tip: Use Ctrl+K (Cmd+K on Mac) to quickly search and navigate anywhere in the app. Speed up your workflow!', 
'keyboard', 
'.*', 
1),

('general', 'low', 'Mobile App Available', 
'📱 This app works great on mobile! Add it to your home screen for quick access to photos, communication, and milestone updates on the go.', 
'phone_android', 
'.*', 
2);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hints_library_category ON hints_library(category);
CREATE INDEX IF NOT EXISTS idx_hints_library_priority ON hints_library(priority);
CREATE INDEX IF NOT EXISTS idx_hints_library_active ON hints_library(is_active);
CREATE INDEX IF NOT EXISTS idx_hints_library_page_path ON hints_library(page_path);
CREATE INDEX IF NOT EXISTS idx_user_hint_interactions_profile ON user_hint_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_hint_interactions_hint ON user_hint_interactions(hint_id);
CREATE INDEX IF NOT EXISTS idx_user_hint_interactions_dismissed ON user_hint_interactions(dismissed);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hints_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hint_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hint_display_rules ENABLE ROW LEVEL SECURITY;

-- Anyone can view active hints
CREATE POLICY "Hints are viewable by everyone"
ON hints_library FOR SELECT
USING (is_active = true);

-- Users can view their own interactions
CREATE POLICY "Users can view their own hint interactions"
ON user_hint_interactions FOR SELECT
USING (auth.uid() = profile_id);

-- Users can insert/update their own interactions
CREATE POLICY "Users can manage their own hint interactions"
ON user_hint_interactions FOR ALL
USING (auth.uid() = profile_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE hints_library IS 'Library of contextual hints/tips shown throughout the app';
COMMENT ON TABLE user_hint_interactions IS 'Tracks which hints users have seen, dismissed, or rated';
COMMENT ON TABLE hint_display_rules IS 'Advanced targeting rules for hint display';
COMMENT ON FUNCTION get_hints_for_user IS 'Returns appropriate hints for a user on a specific page';
COMMENT ON FUNCTION record_hint_interaction IS 'Records when a user sees or dismisses a hint';
COMMENT ON FUNCTION rate_hint IS 'Allows users to rate hint helpfulness (1-5 stars)';

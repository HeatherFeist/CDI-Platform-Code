-- =====================================================
-- COMMUNITY MARKETPLACE & MESSAGING EXTENSIONS
-- =====================================================
-- Add to existing supabase-schema.sql

-- 1. Add username and availability fields to profiles
ALTER TABLE profiles
ADD COLUMN username VARCHAR(50) UNIQUE,
ADD COLUMN display_name VARCHAR(100),
ADD COLUMN bio TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN is_available_for_work BOOLEAN DEFAULT true,
ADD COLUMN is_seeking_help BOOLEAN DEFAULT false,
ADD COLUMN skills TEXT[], -- Array of skills/specialties
ADD COLUMN hourly_rate DECIMAL(10,2),
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_projects INTEGER DEFAULT 0,
ADD COLUMN completed_projects INTEGER DEFAULT 0,
ADD COLUMN public_profile BOOLEAN DEFAULT true; -- Allow users to opt out of directory

-- 2. Create user_stats table for leaderboard metrics
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    projects_as_contractor INTEGER DEFAULT 0,
    projects_as_team_member INTEGER DEFAULT 0,
    on_time_completion_rate DECIMAL(5,2) DEFAULT 100.00,
    response_time_hours DECIMAL(6,2),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create direct_messages table
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB, -- For future: photo attachments, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create conversations table (tracks DM threads)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1_id, participant_2_id)
);

-- 5. Create user_reviews table (for rating system)
CREATE TABLE user_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(20) CHECK (review_type IN ('contractor', 'team_member', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create availability_posts table (marketplace listings)
CREATE TABLE availability_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_type VARCHAR(20) CHECK (post_type IN ('available_for_work', 'seeking_help', 'offering_service')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    skills_needed TEXT[],
    hourly_rate DECIMAL(10,2),
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_available ON profiles(is_available_for_work, is_seeking_help);
CREATE INDEX idx_profiles_public ON profiles(public_profile);
CREATE INDEX idx_user_stats_profile ON user_stats(profile_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_read ON direct_messages(is_read);
CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_user_reviews_reviewee ON user_reviews(reviewee_id);
CREATE INDEX idx_availability_posts_active ON availability_posts(is_active, post_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- User Stats: Users can read all, update only their own
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stats"
    ON user_stats FOR SELECT
    USING (true);

CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE
    USING (profile_id = auth.uid());

-- Direct Messages: Users can only see their own messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
    ON direct_messages FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON direct_messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages"
    ON direct_messages FOR UPDATE
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Conversations: Users can only see their own conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

-- User Reviews: Everyone can read, users can create for projects they're involved in
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
    ON user_reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews"
    ON user_reviews FOR INSERT
    WITH CHECK (reviewer_id = auth.uid());

-- Availability Posts: Everyone can read active posts, users can manage their own
ALTER TABLE availability_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active posts"
    ON availability_posts FOR SELECT
    USING (is_active = true OR profile_id = auth.uid());

CREATE POLICY "Users can create own posts"
    ON availability_posts FOR INSERT
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own posts"
    ON availability_posts FOR UPDATE
    USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own posts"
    ON availability_posts FOR DELETE
    USING (profile_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to generate username from email
CREATE OR REPLACE FUNCTION generate_username_from_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Extract part before @ and remove special characters
    base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9]', '', 'g'));
    final_username := base_username;
    
    -- Check for uniqueness, append number if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::TEXT;
    END LOOP;
    
    RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user stats
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (profile_id, joined_date)
    VALUES (NEW.id, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create stats when profile is created
CREATE TRIGGER trigger_create_user_stats
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_stats();

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.message, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is sent
CREATE TRIGGER trigger_update_conversation
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to update user rating when review is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(rating)::DECIMAL(3,2)
    INTO avg_rating
    FROM user_reviews
    WHERE reviewee_id = NEW.reviewee_id;
    
    UPDATE profiles
    SET rating = avg_rating
    WHERE id = NEW.reviewee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on new review
CREATE TRIGGER trigger_update_rating
    AFTER INSERT OR UPDATE ON user_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rating();

-- Function to mark user as active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_stats
    SET last_active = NOW()
    WHERE profile_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA MIGRATION
-- =====================================================

-- Generate usernames for existing users
UPDATE profiles
SET username = generate_username_from_email(email)
WHERE username IS NULL;

-- Create stats for existing users (if trigger didn't run)
INSERT INTO user_stats (profile_id, joined_date)
SELECT id, created_at
FROM profiles
WHERE id NOT IN (SELECT profile_id FROM user_stats);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE availability_posts;

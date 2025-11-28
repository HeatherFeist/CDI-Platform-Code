-- Portfolio Photos Table
-- Stores work samples that contractors can showcase on their profiles

CREATE TABLE IF NOT EXISTS profile_portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_type TEXT, -- Kitchen, Bathroom, Flooring, Painting, etc.
    completion_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_profile ON profile_portfolio(profile_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON profile_portfolio(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_portfolio_type ON profile_portfolio(project_type);

-- RLS Policies
ALTER TABLE profile_portfolio ENABLE ROW LEVEL SECURITY;

-- Anyone can view public portfolios
CREATE POLICY "Anyone can view portfolio photos"
    ON profile_portfolio FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = profile_portfolio.profile_id
            AND profiles.public_profile = TRUE
        )
    );

-- Users can manage their own portfolio
CREATE POLICY "Users can manage own portfolio"
    ON profile_portfolio FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_portfolio_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_updated_at
    BEFORE UPDATE ON profile_portfolio
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_timestamp();

COMMENT ON TABLE profile_portfolio IS 'Stores portfolio photos showcasing contractors work history and capabilities';
COMMENT ON COLUMN profile_portfolio.is_featured IS 'Featured photos show prominently on profile and get star badge';
COMMENT ON COLUMN profile_portfolio.display_order IS 'Order in which photos appear (lower numbers first)';

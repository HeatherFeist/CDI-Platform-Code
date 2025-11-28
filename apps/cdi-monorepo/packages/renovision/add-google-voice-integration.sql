-- Google Voice Integration Tables
-- Free phone numbers for team members via Google Voice

-- Add Google Voice configuration to phone_integrations
ALTER TABLE phone_integrations 
ADD COLUMN IF NOT EXISTS use_google_voice BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_voice_credentials JSONB,
ADD COLUMN IF NOT EXISTS google_service_account_email VARCHAR(255);

-- Google Voice numbers assigned to team members
CREATE TABLE IF NOT EXISTS google_voice_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- The Google Voice number assigned
    google_voice_account_email VARCHAR(255), -- Google account used for this number
    is_primary BOOLEAN DEFAULT false, -- Is this the business primary number?
    is_active BOOLEAN DEFAULT true,
    setup_completed BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    sms_enabled BOOLEAN DEFAULT true,
    call_forwarding_enabled BOOLEAN DEFAULT true,
    forward_to_number VARCHAR(20), -- Forward calls to personal phone
    voicemail_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_google_voice_numbers_business ON google_voice_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_google_voice_numbers_team_member ON google_voice_numbers(team_member_id);
CREATE INDEX IF NOT EXISTS idx_google_voice_numbers_phone ON google_voice_numbers(phone_number);

-- Enable RLS
ALTER TABLE google_voice_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view Google Voice numbers for their business" ON google_voice_numbers;
CREATE POLICY "Users can view Google Voice numbers for their business" ON google_voice_numbers
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage Google Voice numbers for their business" ON google_voice_numbers;
CREATE POLICY "Users can manage Google Voice numbers for their business" ON google_voice_numbers
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team members can view their own Google Voice number" ON google_voice_numbers;
CREATE POLICY "Team members can view their own Google Voice number" ON google_voice_numbers
    FOR SELECT
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_google_voice_numbers_updated_at ON google_voice_numbers;
CREATE TRIGGER handle_google_voice_numbers_updated_at
    BEFORE UPDATE ON google_voice_numbers
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Update task_assignments table to include Google Voice number used
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS google_voice_number_id UUID REFERENCES google_voice_numbers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notification_phone_number VARCHAR(20); -- The number SMS was sent to

-- Update team_members table to track Google Voice preference
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS wants_google_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_voice_setup_at TIMESTAMP WITH TIME ZONE;

-- Grant permissions
GRANT ALL ON google_voice_numbers TO authenticated;
GRANT ALL ON google_voice_numbers TO service_role;

-- View to see team members with/without Google Voice
CREATE OR REPLACE VIEW team_members_phone_status AS
SELECT 
    tm.id as team_member_id,
    tm.first_name,
    tm.last_name,
    tm.email,
    tm.phone as personal_phone,
    tm.wants_google_voice,
    gv.phone_number as google_voice_number,
    gv.is_active as google_voice_active,
    gv.setup_completed as google_voice_setup_completed,
    CASE 
        WHEN gv.phone_number IS NOT NULL THEN 'has_google_voice'
        WHEN tm.phone IS NOT NULL THEN 'has_personal_phone'
        WHEN tm.wants_google_voice THEN 'wants_google_voice'
        ELSE 'no_phone'
    END as phone_status
FROM team_members tm
LEFT JOIN google_voice_numbers gv ON tm.id = gv.team_member_id
WHERE tm.is_active = true;

GRANT SELECT ON team_members_phone_status TO authenticated;

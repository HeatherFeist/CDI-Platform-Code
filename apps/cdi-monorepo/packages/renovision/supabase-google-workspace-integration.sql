-- =====================================================
-- GOOGLE WORKSPACE INTEGRATION SCHEMA
-- =====================================================

-- Add org_email field to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS org_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_workspace_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_workspace_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create Google Workspace accounts tracking table
CREATE TABLE IF NOT EXISTS google_workspace_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    org_email VARCHAR(255) UNIQUE NOT NULL,
    google_user_id VARCHAR(255) UNIQUE,
    workspace_account_created BOOLEAN DEFAULT false,
    calendar_connected BOOLEAN DEFAULT false,
    drive_access_granted BOOLEAN DEFAULT false,
    account_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create onboarding workflows table
CREATE TABLE IF NOT EXISTS onboarding_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES profiles(business_id) ON DELETE CASCADE NOT NULL,
    workflow_type VARCHAR(50) DEFAULT 'google_workspace',
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
    steps_completed JSONB DEFAULT '[]',
    current_step VARCHAR(100),
    error_message TEXT,
    initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Google Calendar integration table
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    google_calendar_id VARCHAR(255) NOT NULL,
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted  
    token_expires_at TIMESTAMP WITH TIME ZONE,
    calendar_sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'active', -- active, error, disabled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_google_workspace_accounts_team_member ON google_workspace_accounts(team_member_id);
CREATE INDEX IF NOT EXISTS idx_google_workspace_accounts_org_email ON google_workspace_accounts(org_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_team_member ON onboarding_workflows(team_member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_status ON onboarding_workflows(status);
CREATE INDEX IF NOT EXISTS idx_google_calendar_integrations_team_member ON google_calendar_integrations(team_member_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE google_workspace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Google Workspace accounts policies
CREATE POLICY "Business members can view workspace accounts" ON google_workspace_accounts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.business_id = tm.business_id
        WHERE tm.id = google_workspace_accounts.team_member_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "Business owners can manage workspace accounts" ON google_workspace_accounts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.business_id = tm.business_id
        WHERE tm.id = google_workspace_accounts.team_member_id
        AND p.id = auth.uid()
    )
);

-- Onboarding workflows policies
CREATE POLICY "Business members can view onboarding workflows" ON onboarding_workflows
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.business_id = onboarding_workflows.business_id
    )
);

CREATE POLICY "Business owners can manage onboarding workflows" ON onboarding_workflows
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.business_id = onboarding_workflows.business_id
    )
);

-- Google Calendar integration policies  
CREATE POLICY "Team members can manage their calendar integration" ON google_calendar_integrations
FOR ALL USING (
    team_member_id IN (
        SELECT id FROM team_members 
        WHERE business_id = (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
    OR EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.business_id = tm.business_id
        WHERE tm.id = google_calendar_integrations.team_member_id
        AND p.id = auth.uid()
    )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER handle_google_workspace_accounts_updated_at 
    BEFORE UPDATE ON google_workspace_accounts 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_onboarding_workflows_updated_at 
    BEFORE UPDATE ON onboarding_workflows 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_google_calendar_integrations_updated_at 
    BEFORE UPDATE ON google_calendar_integrations 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate org email address
CREATE OR REPLACE FUNCTION generate_org_email(first_name TEXT, last_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    clean_first_name TEXT;
    last_initial TEXT;
    org_email TEXT;
BEGIN
    -- Clean first name (remove non-alphabetic characters)
    clean_first_name := lower(regexp_replace(first_name, '[^a-zA-Z]', '', 'g'));
    
    -- Get first letter of last name
    last_initial := lower(left(last_name, 1));
    
    -- Generate email
    org_email := clean_first_name || '.' || last_initial || '@constructivedesignsinc.org';
    
    RETURN org_email;
END;
$$;

-- Function to initiate Google Workspace onboarding
CREATE OR REPLACE FUNCTION initiate_google_workspace_onboarding(
    p_team_member_id UUID,
    p_business_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workflow_id UUID;
    v_member_record team_members%ROWTYPE;
    v_org_email TEXT;
BEGIN
    -- Get team member details
    SELECT * INTO v_member_record
    FROM team_members
    WHERE id = p_team_member_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team member not found';
    END IF;

    -- Generate org email
    v_org_email := generate_org_email(v_member_record.first_name, v_member_record.last_name);

    -- Create onboarding workflow
    INSERT INTO onboarding_workflows (
        team_member_id, business_id, workflow_type, status, current_step, initiated_by
    ) VALUES (
        p_team_member_id, p_business_id, 'google_workspace', 'in_progress', 'create_account', auth.uid()
    ) RETURNING id INTO v_workflow_id;

    -- Create Google Workspace account record
    INSERT INTO google_workspace_accounts (
        team_member_id, org_email
    ) VALUES (
        p_team_member_id, v_org_email
    ) ON CONFLICT (org_email) DO NOTHING;

    -- Update team member with org email
    UPDATE team_members 
    SET org_email = v_org_email,
        onboarding_status = 'in_progress',
        google_workspace_status = 'creating'
    WHERE id = p_team_member_id;

    RETURN v_workflow_id;
END;
$$;

-- Function to complete onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    p_workflow_id UUID,
    p_step_name TEXT,
    p_next_step TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workflow onboarding_workflows%ROWTYPE;
    v_steps_completed JSONB;
    v_new_step JSONB;
BEGIN
    -- Get current workflow
    SELECT * INTO v_workflow
    FROM onboarding_workflows
    WHERE id = p_workflow_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Onboarding workflow not found';
    END IF;

    -- Add completed step to the steps array
    v_new_step := jsonb_build_object(
        'step', p_step_name,
        'completed_at', NOW(),
        'data', p_data
    );

    v_steps_completed := COALESCE(v_workflow.steps_completed, '[]'::jsonb) || v_new_step;

    -- Update workflow
    UPDATE onboarding_workflows
    SET steps_completed = v_steps_completed,
        current_step = COALESCE(p_next_step, 'completed'),
        status = CASE 
            WHEN p_next_step IS NULL THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE 
            WHEN p_next_step IS NULL THEN NOW()
            ELSE completed_at
        END
    WHERE id = p_workflow_id;

    -- If workflow is completed, update team member status
    IF p_next_step IS NULL THEN
        UPDATE team_members
        SET onboarding_status = 'completed',
            onboarding_completed_at = NOW(),
            google_workspace_status = 'active'
        WHERE id = v_workflow.team_member_id;
    END IF;

    RETURN TRUE;
END;
$$;
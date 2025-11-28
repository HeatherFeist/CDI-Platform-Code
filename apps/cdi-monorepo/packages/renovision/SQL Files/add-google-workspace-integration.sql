-- =====================================================
-- GOOGLE WORKSPACE INTEGRATION - DATABASE SETUP
-- =====================================================
-- This script sets up all database tables and functions needed for
-- Google Workspace integration with team member management.
-- =====================================================

-- Step 1: Add org_email column to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS org_email TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_org_email ON team_members(org_email);

-- Step 2: Create google_workspace_accounts table
CREATE TABLE IF NOT EXISTS google_workspace_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    org_email TEXT NOT NULL UNIQUE,
    google_user_id TEXT UNIQUE,
    workspace_account_created BOOLEAN DEFAULT false,
    calendar_connected BOOLEAN DEFAULT false,
    drive_access_granted BOOLEAN DEFAULT false,
    account_suspended BOOLEAN DEFAULT false,
    temp_password TEXT, -- Store temporarily, should be deleted after first login
    password_changed BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_team_member FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
);

-- Step 3: Create onboarding_workflows table
CREATE TABLE IF NOT EXISTS onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL DEFAULT 'google_workspace',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    steps_completed JSONB DEFAULT '[]'::jsonb,
    current_step TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create google_calendar_integrations table
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    google_calendar_id TEXT NOT NULL,
    calendar_sync_enabled BOOLEAN DEFAULT true,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('active', 'error', 'disabled')) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    google_access_token TEXT, -- Encrypted in production
    google_refresh_token TEXT, -- Encrypted in production
    token_expires_at TIMESTAMP WITH TIME ZONE,
    sync_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Enable RLS on new tables
ALTER TABLE google_workspace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for google_workspace_accounts
DROP POLICY IF EXISTS "Business users can manage workspace accounts" ON google_workspace_accounts;
CREATE POLICY "Business users can manage workspace accounts"
ON google_workspace_accounts
FOR ALL
TO authenticated
USING (
    team_member_id IN (
        SELECT tm.id FROM team_members tm
        INNER JOIN profiles p ON p.business_id = tm.business_id
        WHERE p.id = auth.uid()
    )
);

-- Team members can view their own workspace account
DROP POLICY IF EXISTS "Team members can view own workspace account" ON google_workspace_accounts;
CREATE POLICY "Team members can view own workspace account"
ON google_workspace_accounts
FOR SELECT
TO authenticated
USING (
    team_member_id IN (
        SELECT id FROM team_members WHERE email = (
            SELECT email FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Step 7: Create RLS policies for onboarding_workflows
DROP POLICY IF EXISTS "Business users can manage onboarding workflows" ON onboarding_workflows;
CREATE POLICY "Business users can manage onboarding workflows"
ON onboarding_workflows
FOR ALL
TO authenticated
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Step 8: Create RLS policies for google_calendar_integrations
DROP POLICY IF EXISTS "Business users can manage calendar integrations" ON google_calendar_integrations;
CREATE POLICY "Business users can manage calendar integrations"
ON google_calendar_integrations
FOR ALL
TO authenticated
USING (
    team_member_id IN (
        SELECT tm.id FROM team_members tm
        INNER JOIN profiles p ON p.business_id = tm.business_id
        WHERE p.id = auth.uid()
    )
);

-- Team members can manage their own calendar integration
DROP POLICY IF EXISTS "Team members can manage own calendar integration" ON google_calendar_integrations;
CREATE POLICY "Team members can manage own calendar integration"
ON google_calendar_integrations
FOR ALL
TO authenticated
USING (
    team_member_id IN (
        SELECT id FROM team_members WHERE email = (
            SELECT email FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_accounts_team_member ON google_workspace_accounts(team_member_id);
CREATE INDEX IF NOT EXISTS idx_workspace_accounts_google_user ON google_workspace_accounts(google_user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_team_member ON onboarding_workflows(team_member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_business ON onboarding_workflows(business_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_status ON onboarding_workflows(status);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_team_member ON google_calendar_integrations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_sync_status ON google_calendar_integrations(sync_status);

-- Step 10: Create function to initiate Google Workspace onboarding
CREATE OR REPLACE FUNCTION initiate_google_workspace_onboarding(
    p_team_member_id UUID,
    p_business_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workflow_id UUID;
BEGIN
    -- Create onboarding workflow
    INSERT INTO onboarding_workflows (
        team_member_id,
        business_id,
        workflow_type,
        status,
        current_step,
        started_at
    ) VALUES (
        p_team_member_id,
        p_business_id,
        'google_workspace',
        'in_progress',
        'create_account',
        NOW()
    )
    RETURNING id INTO v_workflow_id;

    RETURN v_workflow_id;
END;
$$;

-- Step 11: Create function to complete onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    p_workflow_id UUID,
    p_step_name TEXT,
    p_next_step TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_steps_completed JSONB;
    v_new_status TEXT;
BEGIN
    -- Get current steps
    SELECT steps_completed INTO v_steps_completed
    FROM onboarding_workflows
    WHERE id = p_workflow_id;

    -- Add new step to completed steps
    v_steps_completed := v_steps_completed || jsonb_build_object(
        'step', p_step_name,
        'completed_at', NOW(),
        'data', p_data
    );

    -- Determine new status
    IF p_next_step IS NULL THEN
        v_new_status := 'completed';
    ELSE
        v_new_status := 'in_progress';
    END IF;

    -- Update workflow
    UPDATE onboarding_workflows
    SET 
        steps_completed = v_steps_completed,
        current_step = p_next_step,
        status = v_new_status,
        completed_at = CASE WHEN v_new_status = 'completed' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_workflow_id;

    RETURN TRUE;
END;
$$;

-- Step 12: Create function to mark onboarding as failed
CREATE OR REPLACE FUNCTION fail_onboarding_workflow(
    p_workflow_id UUID,
    p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE onboarding_workflows
    SET 
        status = 'failed',
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_workflow_id;

    RETURN TRUE;
END;
$$;

-- Step 13: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to all new tables
DROP TRIGGER IF EXISTS update_google_workspace_accounts_updated_at ON google_workspace_accounts;
CREATE TRIGGER update_google_workspace_accounts_updated_at
    BEFORE UPDATE ON google_workspace_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_workflows_updated_at ON onboarding_workflows;
CREATE TRIGGER update_onboarding_workflows_updated_at
    BEFORE UPDATE ON onboarding_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_calendar_integrations_updated_at ON google_calendar_integrations;
CREATE TRIGGER update_google_calendar_integrations_updated_at
    BEFORE UPDATE ON google_calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Verify installation
DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Google Workspace Integration Database Setup Complete!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ google_workspace_accounts';
    RAISE NOTICE '  ✓ onboarding_workflows';
    RAISE NOTICE '  ✓ google_calendar_integrations';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  ✓ initiate_google_workspace_onboarding()';
    RAISE NOTICE '  ✓ complete_onboarding_step()';
    RAISE NOTICE '  ✓ fail_onboarding_workflow()';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS policies: ENABLED';
    RAISE NOTICE 'Indexes: CREATED';
    RAISE NOTICE 'Triggers: CONFIGURED';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Create Supabase Edge Functions';
    RAISE NOTICE '  2. Configure Google Cloud Console';
    RAISE NOTICE '  3. Update TeamMembersView.tsx';
    RAISE NOTICE '========================================================';
END $$;

-- Query to check tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('google_workspace_accounts', 'onboarding_workflows', 'google_calendar_integrations')
ORDER BY table_name;

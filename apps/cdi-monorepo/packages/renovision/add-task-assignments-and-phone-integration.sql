-- Add team member task assignments table to track who's assigned to what
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
    line_item_index INTEGER NOT NULL, -- Index of the line item in the estimate
    line_item_description TEXT NOT NULL,
    line_item_cost DECIMAL(10,2) NOT NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'invited', -- 'invited', 'accepted', 'declined', 'completed'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_cost DECIMAL(10,2), -- Their portion of the cost
    notes TEXT,
    notification_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(estimate_id, line_item_index, team_member_id)
);

-- Create indexes
CREATE INDEX idx_task_assignments_estimate ON task_assignments(estimate_id);
CREATE INDEX idx_task_assignments_team_member ON task_assignments(team_member_id);
CREATE INDEX idx_task_assignments_business ON task_assignments(business_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);

-- Enable RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view task assignments for their business" ON task_assignments
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert task assignments for their business" ON task_assignments
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update task assignments for their business" ON task_assignments
    FOR UPDATE
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Team members can view their assignments" ON task_assignments
    FOR SELECT
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Team members can update their own assignments" ON task_assignments
    FOR UPDATE
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_task_assignments_updated_at ON task_assignments;
CREATE TRIGGER handle_task_assignments_updated_at
    BEFORE UPDATE ON task_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Add phone integration table
CREATE TABLE IF NOT EXISTS phone_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL, -- Business phone number
    phone_provider VARCHAR(50), -- 'twilio', 'vonage', 'plivo', etc.
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    webhook_url TEXT, -- URL for receiving incoming call/SMS webhooks
    sms_enabled BOOLEAN DEFAULT true,
    voice_enabled BOOLEAN DEFAULT true,
    call_recording_enabled BOOLEAN DEFAULT false,
    auto_create_lead BOOLEAN DEFAULT true, -- Automatically create lead from incoming calls
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_phone_integrations_business ON phone_integrations(business_id);
CREATE INDEX idx_phone_integrations_phone ON phone_integrations(phone_number);

-- Enable RLS
ALTER TABLE phone_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view phone integrations for their business" ON phone_integrations
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage phone integrations for their business" ON phone_integrations
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Phone call logs table
CREATE TABLE IF NOT EXISTS phone_call_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    phone_integration_id UUID REFERENCES phone_integrations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
    call_direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    call_status VARCHAR(50), -- 'answered', 'missed', 'voicemail', 'busy', 'failed'
    call_duration INTEGER, -- Duration in seconds
    recording_url TEXT,
    transcript TEXT,
    notes TEXT,
    tags TEXT[], -- Tags like ['estimate-request', 'follow-up', 'urgent']
    call_metadata JSONB, -- Additional call details from provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_phone_call_logs_business ON phone_call_logs(business_id);
CREATE INDEX idx_phone_call_logs_customer ON phone_call_logs(customer_id);
CREATE INDEX idx_phone_call_logs_project ON phone_call_logs(project_id);
CREATE INDEX idx_phone_call_logs_from_number ON phone_call_logs(from_number);
CREATE INDEX idx_phone_call_logs_created_at ON phone_call_logs(created_at DESC);

-- Enable RLS
ALTER TABLE phone_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view call logs for their business" ON phone_call_logs
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage call logs for their business" ON phone_call_logs
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- SMS message logs table
CREATE TABLE IF NOT EXISTS sms_message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    phone_integration_id UUID REFERENCES phone_integrations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
    task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    message_status VARCHAR(50), -- 'sent', 'delivered', 'failed', 'queued'
    message_type VARCHAR(50), -- 'task-invitation', 'estimate-notification', 'general', 'reminder'
    error_message TEXT,
    sms_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sms_message_logs_business ON sms_message_logs(business_id);
CREATE INDEX idx_sms_message_logs_customer ON sms_message_logs(customer_id);
CREATE INDEX idx_sms_message_logs_team_member ON sms_message_logs(team_member_id);
CREATE INDEX idx_sms_message_logs_to_number ON sms_message_logs(to_number);
CREATE INDEX idx_sms_message_logs_created_at ON sms_message_logs(created_at DESC);

-- Enable RLS
ALTER TABLE sms_message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view SMS logs for their business" ON sms_message_logs
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage SMS logs for their business" ON sms_message_logs
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS handle_phone_integrations_updated_at ON phone_integrations;
CREATE TRIGGER handle_phone_integrations_updated_at
    BEFORE UPDATE ON phone_integrations
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS handle_phone_call_logs_updated_at ON phone_call_logs;
CREATE TRIGGER handle_phone_call_logs_updated_at
    BEFORE UPDATE ON phone_call_logs
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS handle_sms_message_logs_updated_at ON sms_message_logs;
CREATE TRIGGER handle_sms_message_logs_updated_at
    BEFORE UPDATE ON sms_message_logs
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Grant permissions
GRANT ALL ON task_assignments TO authenticated;
GRANT ALL ON task_assignments TO service_role;
GRANT ALL ON phone_integrations TO authenticated;
GRANT ALL ON phone_integrations TO service_role;
GRANT ALL ON phone_call_logs TO authenticated;
GRANT ALL ON phone_call_logs TO service_role;
GRANT ALL ON sms_message_logs TO authenticated;
GRANT ALL ON sms_message_logs TO service_role;

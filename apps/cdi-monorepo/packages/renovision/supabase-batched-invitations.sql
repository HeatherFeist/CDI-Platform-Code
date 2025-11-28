-- Create batched_task_invitations table to group multiple assignments
CREATE TABLE IF NOT EXISTS batched_task_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'accepted', 'declined', 'expired')),
    total_assignments INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    sent_at TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_batched_invitations_team_member ON batched_task_invitations(team_member_id, invitation_status);
CREATE INDEX idx_batched_invitations_status ON batched_task_invitations(invitation_status, expires_at);

-- Add batch_invitation_id to task_assignments to link them
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS batch_invitation_id UUID REFERENCES batched_task_invitations(id) ON DELETE SET NULL;

CREATE INDEX idx_task_assignments_batch ON task_assignments(batch_invitation_id);

-- RLS Policies for batched_task_invitations
ALTER TABLE batched_task_invitations ENABLE ROW LEVEL SECURITY;

-- Business owners can view their batched invitations
CREATE POLICY "Business owners can view batched invitations"
    ON batched_task_invitations
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Team members can view their own invitations
CREATE POLICY "Team members can view their invitations"
    ON batched_task_invitations
    FOR SELECT
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Business owners can insert batched invitations
CREATE POLICY "Business owners can insert batched invitations"
    ON batched_task_invitations
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Team members can update their own invitation status
CREATE POLICY "Team members can update their invitation status"
    ON batched_task_invitations
    FOR UPDATE
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Business owners can update batched invitations
CREATE POLICY "Business owners can update batched invitations"
    ON batched_task_invitations
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Function to create or update batched invitation
CREATE OR REPLACE FUNCTION upsert_batched_invitation(
    p_business_id UUID,
    p_team_member_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_batch_id UUID;
    v_total_assignments INTEGER;
    v_total_cost DECIMAL(10,2);
BEGIN
    -- Check if there's an existing pending batch for this team member
    SELECT id INTO v_batch_id
    FROM batched_task_invitations
    WHERE team_member_id = p_team_member_id
        AND business_id = p_business_id
        AND invitation_status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calculate totals from all pending assignments for this member
    SELECT 
        COUNT(*),
        COALESCE(SUM(assigned_cost), 0)
    INTO v_total_assignments, v_total_cost
    FROM task_assignments
    WHERE team_member_id = p_team_member_id
        AND status = 'invited'
        AND (batch_invitation_id IS NULL OR batch_invitation_id = v_batch_id);

    -- If no pending batch exists, create one
    IF v_batch_id IS NULL THEN
        INSERT INTO batched_task_invitations (
            business_id,
            team_member_id,
            invitation_status,
            total_assignments,
            total_cost
        ) VALUES (
            p_business_id,
            p_team_member_id,
            'pending',
            v_total_assignments,
            v_total_cost
        )
        RETURNING id INTO v_batch_id;
    ELSE
        -- Update existing batch
        UPDATE batched_task_invitations
        SET total_assignments = v_total_assignments,
            total_cost = v_total_cost,
            updated_at = NOW()
        WHERE id = v_batch_id;
    END IF;

    -- Link all pending assignments to this batch
    UPDATE task_assignments
    SET batch_invitation_id = v_batch_id
    WHERE team_member_id = p_team_member_id
        AND status = 'invited'
        AND batch_invitation_id IS NULL;

    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send batched invitation (marks as sent)
CREATE OR REPLACE FUNCTION send_batched_invitation(
    p_batch_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE batched_task_invitations
    SET invitation_status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = p_batch_id
        AND invitation_status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to accept batched invitation (accepts all assignments)
CREATE OR REPLACE FUNCTION accept_batched_invitation(
    p_batch_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update batch status
    UPDATE batched_task_invitations
    SET invitation_status = 'accepted',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_batch_id
        AND invitation_status IN ('pending', 'sent');

    -- Update all associated task assignments
    UPDATE task_assignments
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE batch_invitation_id = p_batch_id
        AND status = 'invited';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to decline batched invitation (declines all assignments)
CREATE OR REPLACE FUNCTION decline_batched_invitation(
    p_batch_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update batch status
    UPDATE batched_task_invitations
    SET invitation_status = 'declined',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_batch_id
        AND invitation_status IN ('pending', 'sent');

    -- Update all associated task assignments
    UPDATE task_assignments
    SET status = 'declined',
        declined_at = NOW(),
        decline_reason = p_reason
    WHERE batch_invitation_id = p_batch_id
        AND status = 'invited';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View to get batched invitation details with all assignments
CREATE OR REPLACE VIEW batched_invitation_details AS
SELECT 
    bi.id as batch_id,
    bi.business_id,
    bi.team_member_id,
    tm.first_name || ' ' || tm.last_name as team_member_name,
    tm.email as team_member_email,
    tm.phone as team_member_phone,
    bi.invitation_status,
    bi.total_assignments,
    bi.total_cost,
    bi.sent_at,
    bi.responded_at,
    bi.expires_at,
    bi.created_at,
    -- Aggregate all assignments as JSON array
    jsonb_agg(
        jsonb_build_object(
            'assignment_id', ta.id,
            'estimate_id', ta.estimate_id,
            'line_item_index', ta.line_item_index,
            'line_item_description', ta.line_item_description,
            'assigned_cost', ta.assigned_cost,
            'status', ta.status
        ) ORDER BY ta.created_at
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM batched_task_invitations bi
JOIN team_members tm ON tm.id = bi.team_member_id
LEFT JOIN task_assignments ta ON ta.batch_invitation_id = bi.id
GROUP BY 
    bi.id, 
    bi.business_id, 
    bi.team_member_id, 
    tm.first_name, 
    tm.last_name, 
    tm.email, 
    tm.phone,
    bi.invitation_status,
    bi.total_assignments,
    bi.total_cost,
    bi.sent_at,
    bi.responded_at,
    bi.expires_at,
    bi.created_at;

-- Grant permissions
GRANT SELECT ON batched_invitation_details TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_batched_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION send_batched_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_batched_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION decline_batched_invitation TO authenticated;

-- Trigger to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE batched_task_invitations
    SET invitation_status = 'expired',
        updated_at = NOW()
    WHERE invitation_status IN ('pending', 'sent')
        AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add decline_reason to task_assignments if not exists
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP;

COMMENT ON TABLE batched_task_invitations IS 'Groups multiple task assignments into single invitation for team members';
COMMENT ON VIEW batched_invitation_details IS 'Complete details of batched invitations with all assignments';
COMMENT ON FUNCTION upsert_batched_invitation IS 'Creates or updates a batched invitation for a team member';
COMMENT ON FUNCTION accept_batched_invitation IS 'Accepts all task assignments in a batch';
COMMENT ON FUNCTION decline_batched_invitation IS 'Declines all task assignments in a batch';

-- Google Calendar Integration for Task Assignments
-- Adds project timeline tracking and automatic calendar event creation

-- Add date tracking to estimates table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS project_start_date DATE,
ADD COLUMN IF NOT EXISTS project_end_date DATE,
ADD COLUMN IF NOT EXISTS estimated_duration_days INTEGER;

-- Add calendar event tracking to task_assignments
ALTER TABLE task_assignments
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT DEFAULT 'pending' 
    CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'cancelled'));

-- Create calendar_events table for tracking all calendar integrations
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    batch_invitation_id UUID REFERENCES batched_task_invitations(id) ON DELETE SET NULL,
    
    -- Google Calendar details
    google_calendar_id TEXT NOT NULL, -- The calendar ID (usually email)
    google_event_id TEXT, -- The Google event ID after creation
    
    -- Event details
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_location TEXT,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT false,
    
    -- Status tracking
    sync_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (sync_status IN ('pending', 'synced', 'failed', 'cancelled', 'deleted')),
    sync_error TEXT,
    last_sync_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_team_member 
    ON calendar_events(team_member_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task 
    ON calendar_events(task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_estimate 
    ON calendar_events(estimate_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google 
    ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates 
    ON calendar_events(start_datetime, end_datetime);

-- RLS Policies for calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Business owners can view their calendar events
CREATE POLICY "Business owners can view calendar events"
    ON calendar_events
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Team members can view their own calendar events
CREATE POLICY "Team members can view their calendar events"
    ON calendar_events
    FOR SELECT
    USING (
        team_member_id IN (
            SELECT id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Business owners can insert calendar events
CREATE POLICY "Business owners can insert calendar events"
    ON calendar_events
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- System can update calendar events (for sync status)
CREATE POLICY "System can update calendar events"
    ON calendar_events
    FOR UPDATE
    USING (true);

-- Function to create calendar events for accepted batch
CREATE OR REPLACE FUNCTION create_calendar_events_for_batch(
    p_batch_id UUID,
    p_team_member_id UUID
)
RETURNS TABLE (
    calendar_event_id UUID,
    task_assignment_id UUID,
    estimate_id UUID
) AS $$
DECLARE
    v_assignment RECORD;
    v_estimate RECORD;
    v_team_member RECORD;
    v_business RECORD;
    v_calendar_event_id UUID;
BEGIN
    -- Get team member details
    SELECT * INTO v_team_member
    FROM team_members
    WHERE id = p_team_member_id;

    -- Loop through all assignments in the batch
    FOR v_assignment IN
        SELECT ta.*
        FROM task_assignments ta
        WHERE ta.batch_invitation_id = p_batch_id
            AND ta.team_member_id = p_team_member_id
            AND ta.status = 'accepted'
    LOOP
        -- Get estimate details with dates
        SELECT e.*, b.*
        INTO v_estimate
        FROM estimates e
        JOIN businesses b ON b.id = e.business_id
        WHERE e.id = v_assignment.estimate_id;

        -- Only create calendar event if dates are set
        IF v_estimate.project_start_date IS NOT NULL AND v_estimate.project_end_date IS NOT NULL THEN
            -- Create calendar event record
            INSERT INTO calendar_events (
                business_id,
                team_member_id,
                task_assignment_id,
                estimate_id,
                batch_invitation_id,
                google_calendar_id,
                event_title,
                event_description,
                start_datetime,
                end_datetime,
                all_day,
                sync_status
            ) VALUES (
                v_estimate.business_id,
                p_team_member_id,
                v_assignment.id,
                v_estimate.id,
                p_batch_id,
                v_team_member.email, -- Use team member's email as calendar ID
                v_assignment.line_item_description,
                format('Task Assignment: %s\n\nProject: %s\nYour Share: $%s\n\nBusiness: %s',
                    v_assignment.line_item_description,
                    COALESCE(v_estimate.project_name, 'Estimate #' || v_estimate.id),
                    v_assignment.assigned_cost::TEXT,
                    v_estimate.business_name
                ),
                v_estimate.project_start_date::TIMESTAMP,
                v_estimate.project_end_date::TIMESTAMP + INTERVAL '1 day' - INTERVAL '1 second',
                true, -- Multi-day events
                'pending' -- Will be synced by Edge Function
            )
            RETURNING id INTO v_calendar_event_id;

            -- Update task assignment with calendar event ID
            UPDATE task_assignments
            SET calendar_sync_status = 'pending'
            WHERE id = v_assignment.id;

            -- Return the created event
            RETURN QUERY SELECT v_calendar_event_id, v_assignment.id, v_estimate.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel/delete calendar events for declined batch
CREATE OR REPLACE FUNCTION cancel_calendar_events_for_batch(
    p_batch_id UUID,
    p_team_member_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Mark all calendar events as cancelled
    UPDATE calendar_events
    SET sync_status = 'cancelled',
        updated_at = NOW()
    WHERE batch_invitation_id = p_batch_id
        AND team_member_id = p_team_member_id
        AND sync_status IN ('pending', 'synced');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Update the accept_batched_invitation function to create calendar events
CREATE OR REPLACE FUNCTION accept_batched_invitation(
    p_batch_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_team_member_id UUID;
BEGIN
    -- Get team member ID
    SELECT team_member_id INTO v_team_member_id
    FROM batched_task_invitations
    WHERE id = p_batch_id;

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

    -- Create calendar events for all accepted assignments
    PERFORM create_calendar_events_for_batch(p_batch_id, v_team_member_id);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Update the decline_batched_invitation function to cancel calendar events
CREATE OR REPLACE FUNCTION decline_batched_invitation(
    p_batch_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_team_member_id UUID;
BEGIN
    -- Get team member ID
    SELECT team_member_id INTO v_team_member_id
    FROM batched_task_invitations
    WHERE id = p_batch_id;

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

    -- Cancel any calendar events
    PERFORM cancel_calendar_events_for_batch(p_batch_id, v_team_member_id);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View to see calendar event status by estimate
CREATE OR REPLACE VIEW estimate_calendar_events AS
SELECT 
    e.id as estimate_id,
    e.project_name,
    e.project_start_date,
    e.project_end_date,
    e.estimated_duration_days,
    tm.id as team_member_id,
    tm.first_name || ' ' || tm.last_name as team_member_name,
    tm.email as team_member_email,
    ce.id as calendar_event_id,
    ce.google_event_id,
    ce.event_title,
    ce.sync_status,
    ce.sync_error,
    ce.last_sync_at,
    ta.status as assignment_status
FROM estimates e
JOIN task_assignments ta ON ta.estimate_id = e.id
JOIN team_members tm ON tm.id = ta.team_member_id
LEFT JOIN calendar_events ce ON ce.task_assignment_id = ta.id
ORDER BY e.project_start_date, tm.first_name;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_calendar_events_for_batch TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_calendar_events_for_batch TO authenticated;
GRANT SELECT ON estimate_calendar_events TO authenticated;

-- Comments for documentation
COMMENT ON TABLE calendar_events IS 'Tracks Google Calendar events created for task assignments';
COMMENT ON FUNCTION create_calendar_events_for_batch IS 'Creates calendar events for all tasks in an accepted batch invitation';
COMMENT ON FUNCTION cancel_calendar_events_for_batch IS 'Cancels calendar events for declined batch invitation';
COMMENT ON VIEW estimate_calendar_events IS 'Shows calendar sync status for all estimate assignments';

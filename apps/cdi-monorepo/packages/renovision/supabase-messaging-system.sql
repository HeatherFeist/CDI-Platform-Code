-- =====================================================
-- TEAM MEMBER TAGGING & MESSAGING SYSTEM
-- =====================================================

-- 1. NOTIFICATIONS TABLE (in-app notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'task_invitation', 'message', 'project_update', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional structured data
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DIRECT_MESSAGES TABLE (internal messaging system)
-- =====================================================
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general', -- 'task_invitation', 'general', 'project_update'
    metadata JSONB DEFAULT '{}', -- Additional context (estimate_id, project_id, etc.)
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    replied_to UUID REFERENCES direct_messages(id) ON DELETE SET NULL, -- For threading
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TASK_INVITATIONS TABLE (track invitation status)
-- =====================================================
CREATE TABLE IF NOT EXISTS task_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    line_item_id VARCHAR(255) NOT NULL, -- Reference to specific line item
    line_item_description TEXT NOT NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    status VARCHAR(20) CHECK (status IN ('invited', 'accepted', 'declined', 'expired')) DEFAULT 'invited',
    message TEXT, -- Optional message from inviter
    response_message TEXT, -- Optional response from invitee
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    direct_message_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Direct messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_type ON direct_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read ON direct_messages(read);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Task invitations indexes
CREATE INDEX IF NOT EXISTS idx_task_invitations_estimate ON task_invitations(estimate_id);
CREATE INDEX IF NOT EXISTS idx_task_invitations_project ON task_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_task_invitations_team_member ON task_invitations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_task_invitations_status ON task_invitations(status);
CREATE INDEX IF NOT EXISTS idx_task_invitations_invited_by ON task_invitations(invited_by);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_invitations ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (
    recipient_id = auth.uid()
    OR sender_id = auth.uid()
);

CREATE POLICY "Users can create notifications" ON notifications
FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (
    recipient_id = auth.uid()
);

-- Direct messages policies
CREATE POLICY "Users can view their messages" ON direct_messages
FOR SELECT USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
);

CREATE POLICY "Users can send messages" ON direct_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

CREATE POLICY "Users can update their received messages" ON direct_messages
FOR UPDATE USING (
    recipient_id = auth.uid()
);

-- Task invitations policies
CREATE POLICY "Business members can view task invitations" ON task_invitations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.business_id = (
            SELECT tm.business_id 
            FROM team_members tm 
            WHERE tm.id = task_invitations.team_member_id
        )
    )
    OR team_member_id IN (
        SELECT id FROM team_members 
        WHERE business_id = (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Business owners can create task invitations" ON task_invitations
FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.business_id = (
            SELECT tm.business_id 
            FROM team_members tm 
            WHERE tm.id = task_invitations.team_member_id
        )
    )
);

CREATE POLICY "Team members can update their invitations" ON task_invitations
FOR UPDATE USING (
    team_member_id IN (
        SELECT id FROM team_members 
        WHERE business_id = (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER handle_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_direct_messages_updated_at 
    BEFORE UPDATE ON direct_messages 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_task_invitations_updated_at 
    BEFORE UPDATE ON task_invitations 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- =====================================================
-- FUNCTIONS FOR MESSAGING SYSTEM
-- =====================================================

-- Function to create task invitation with notification
CREATE OR REPLACE FUNCTION create_task_invitation(
    p_estimate_id UUID,
    p_project_id UUID,
    p_line_item_id VARCHAR,
    p_line_item_description TEXT,
    p_team_member_id UUID,
    p_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation_id UUID;
    v_notification_id UUID;
    v_message_id UUID;
    v_team_member_profile_id UUID;
BEGIN
    -- Get the profile ID for the team member
    SELECT profile_id INTO v_team_member_profile_id
    FROM team_members 
    WHERE id = p_team_member_id;

    -- Create task invitation
    INSERT INTO task_invitations (
        estimate_id, project_id, line_item_id, line_item_description,
        team_member_id, invited_by, message
    ) VALUES (
        p_estimate_id, p_project_id, p_line_item_id, p_line_item_description,
        p_team_member_id, auth.uid(), p_message
    ) RETURNING id INTO v_invitation_id;

    -- Create notification if team member has profile (org member)
    IF v_team_member_profile_id IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id, sender_id, type, title, message, data
        ) VALUES (
            v_team_member_profile_id, auth.uid(), 'task_invitation',
            'New Task Assignment',
            'You have been assigned to: ' || p_line_item_description,
            json_build_object(
                'invitation_id', v_invitation_id,
                'estimate_id', p_estimate_id,
                'project_id', p_project_id,
                'line_item_id', p_line_item_id
            )::jsonb
        ) RETURNING id INTO v_notification_id;

        -- Create direct message
        INSERT INTO direct_messages (
            sender_id, recipient_id, subject, content, message_type, metadata
        ) VALUES (
            auth.uid(), v_team_member_profile_id,
            'Task Assignment: ' || p_line_item_description,
            COALESCE(p_message, 'You have been assigned to work on: ' || p_line_item_description || E'\n\nPlease review and respond to this assignment.'),
            'task_invitation',
            json_build_object(
                'invitation_id', v_invitation_id,
                'estimate_id', p_estimate_id,
                'project_id', p_project_id
            )::jsonb
        ) RETURNING id INTO v_message_id;

        -- Update invitation with notification references
        UPDATE task_invitations 
        SET notification_id = v_notification_id, direct_message_id = v_message_id
        WHERE id = v_invitation_id;
    END IF;

    RETURN v_invitation_id;
END;
$$;

-- Function to respond to task invitation
CREATE OR REPLACE FUNCTION respond_to_task_invitation(
    p_invitation_id UUID,
    p_status VARCHAR,
    p_response_message TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation task_invitations%ROWTYPE;
    v_sender_id UUID;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM task_invitations
    WHERE id = p_invitation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    -- Update invitation status
    UPDATE task_invitations
    SET status = p_status,
        response_message = p_response_message,
        responded_at = NOW()
    WHERE id = p_invitation_id;

    -- Get the original sender
    v_sender_id := v_invitation.invited_by;

    -- Send response notification to original sender
    INSERT INTO notifications (
        recipient_id, sender_id, type, title, message, data
    ) VALUES (
        v_sender_id, auth.uid(), 'task_response',
        'Task Invitation Response',
        'Response to task: ' || v_invitation.line_item_description || ' - ' || UPPER(p_status),
        json_build_object(
            'invitation_id', p_invitation_id,
            'status', p_status,
            'response_message', p_response_message
        )::jsonb
    );

    RETURN TRUE;
END;
$$;
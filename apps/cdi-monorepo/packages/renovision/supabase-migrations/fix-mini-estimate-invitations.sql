-- Align mini-estimate invitation schema with current Renovision flow

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS batched_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    invitation_token VARCHAR(100) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    total_tasks INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'partial')),
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, team_member_id)
);

ALTER TABLE task_assignments
    ADD COLUMN IF NOT EXISTS line_item_cost DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS batch_invitation_id UUID REFERENCES batched_invitations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS decline_reason TEXT;

UPDATE task_assignments
SET line_item_cost = COALESCE(line_item_cost, assigned_cost, 0)
WHERE line_item_cost IS NULL;

ALTER TABLE task_assignments
    ALTER COLUMN line_item_cost SET NOT NULL;

CREATE TABLE IF NOT EXISTS invitation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_invitation_id UUID NOT NULL REFERENCES batched_invitations(id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('accepted', 'declined', 'partial')),
    message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batched_invitations_business_id ON batched_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_batched_invitations_team_member_id ON batched_invitations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_batched_invitations_token ON batched_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_task_assignments_batch_invitation_id ON task_assignments(batch_invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_batch_invitation_id ON invitation_responses(batch_invitation_id);

ALTER TABLE batched_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business users can view their invitations" ON batched_invitations;
CREATE POLICY "Business users can view their invitations"
ON batched_invitations FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Business users can create invitations" ON batched_invitations;
CREATE POLICY "Business users can create invitations"
ON batched_invitations FOR INSERT
TO authenticated
WITH CHECK (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Business users can update their invitations" ON batched_invitations;
CREATE POLICY "Business users can update their invitations"
ON batched_invitations FOR UPDATE
TO authenticated
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON batched_invitations;
CREATE POLICY "Anyone can view invitation by token"
ON batched_invitations FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can respond to invitations" ON invitation_responses;
CREATE POLICY "Anyone can respond to invitations"
ON invitation_responses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

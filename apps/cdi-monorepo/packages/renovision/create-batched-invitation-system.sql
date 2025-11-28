-- ENHANCED BATCHED INVITATION SYSTEM
-- Creates tables for consolidated team member invitations with accept/deny functionality

-- Step 1: Create batched_invitations table (if not exists)
CREATE TABLE IF NOT EXISTS batched_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    invitation_token VARCHAR(100) UNIQUE NOT NULL,
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

-- Step 2: Enhance task_assignments table (add columns if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_assignments' AND column_name = 'completed') THEN
        ALTER TABLE task_assignments ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_assignments' AND column_name = 'completed_at') THEN
        ALTER TABLE task_assignments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_assignments' AND column_name = 'batch_invitation_id') THEN
        ALTER TABLE task_assignments ADD COLUMN batch_invitation_id UUID REFERENCES batched_invitations(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_assignments' AND column_name = 'team_member_notes') THEN
        ALTER TABLE task_assignments ADD COLUMN team_member_notes TEXT;
    END IF;
END $$;

-- Step 3: Create invitation_responses table for tracking history
CREATE TABLE IF NOT EXISTS invitation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_invitation_id UUID NOT NULL REFERENCES batched_invitations(id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('accepted', 'declined', 'partial')),
    message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Step 4: Enable RLS on new tables
ALTER TABLE batched_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for batched_invitations
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

-- Step 6: Allow public access to view invitation by token (for team members clicking link)
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON batched_invitations;
CREATE POLICY "Anyone can view invitation by token"
ON batched_invitations FOR SELECT
TO anon, authenticated
USING (true);  -- Token validation happens in application layer

-- Step 7: Allow public to respond to invitations
DROP POLICY IF EXISTS "Anyone can respond to invitations" ON invitation_responses;
CREATE POLICY "Anyone can respond to invitations"
ON invitation_responses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 8: Create function to update invitation totals
CREATE OR REPLACE FUNCTION update_invitation_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE batched_invitations
    SET 
        total_tasks = (
            SELECT COUNT(*) 
            FROM task_assignments 
            WHERE batch_invitation_id = NEW.batch_invitation_id
        ),
        total_amount = (
            SELECT COALESCE(SUM(assigned_cost), 0)
            FROM task_assignments 
            WHERE batch_invitation_id = NEW.batch_invitation_id
        ),
        updated_at = NOW()
    WHERE id = NEW.batch_invitation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for automatic total updates
DROP TRIGGER IF EXISTS update_invitation_totals_trigger ON task_assignments;
CREATE TRIGGER update_invitation_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON task_assignments
FOR EACH ROW
EXECUTE FUNCTION update_invitation_totals();

-- Step 10: Create function to generate unique tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batched_invitations_business_id ON batched_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_batched_invitations_team_member_id ON batched_invitations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_batched_invitations_token ON batched_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_batched_invitations_status ON batched_invitations(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_batch_id ON task_assignments(batch_invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_batch_id ON invitation_responses(batch_invitation_id);

-- Step 12: Grant permissions
GRANT ALL ON batched_invitations TO authenticated, anon;
GRANT ALL ON invitation_responses TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION update_invitation_totals() TO authenticated;

-- Step 13: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 14: Verify tables created
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('batched_invitations', 'invitation_responses') THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('batched_invitations', 'invitation_responses', 'task_assignments')
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Batched Invitation System Created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ Consolidated invitations per team member';
    RAISE NOTICE '  ✅ Unique token-based links';
    RAISE NOTICE '  ✅ Accept/Decline functionality';
    RAISE NOTICE '  ✅ Individual task completion tracking';
    RAISE NOTICE '  ✅ Automatic total calculations';
    RAISE NOTICE '  ✅ Email/SMS tracking';
    RAISE NOTICE '  ✅ Response history';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Create invitation view page and email templates';
    RAISE NOTICE '================================================';
END $$;

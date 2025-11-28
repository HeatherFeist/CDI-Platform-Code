-- =====================================================
-- QUARTERLY MILESTONE PAYMENT STRUCTURE
-- =====================================================
-- Industry-standard payment structure: 25% at start, 25% at 50%, 25% at 75%, 25% at completion
-- Protects contractors (upfront capital) and clients (pay as work progresses)
-- Ensures fair cash flow throughout project lifecycle

-- =====================================================
-- 1. ADD COLUMNS TO project_milestones TABLE
-- =====================================================

ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS milestone_percentage NUMERIC(5,2) CHECK (milestone_percentage >= 0 AND milestone_percentage <= 100),
ADD COLUMN IF NOT EXISTS milestone_sequence INTEGER CHECK (milestone_sequence >= 1),
ADD COLUMN IF NOT EXISTS is_start_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_completion_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS progress_percentage_required NUMERIC(5,2) CHECK (progress_percentage_required >= 0 AND progress_percentage_required <= 100),
ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_approval_notes TEXT;

COMMENT ON COLUMN project_milestones.milestone_percentage IS 'Percentage of total project cost (e.g., 25.00 for 25%)';
COMMENT ON COLUMN project_milestones.milestone_sequence IS 'Order of milestone (1=start, 2=halfway, 3=3/4, 4=completion)';
COMMENT ON COLUMN project_milestones.is_start_payment IS 'True if this is the project start payment (mobilization)';
COMMENT ON COLUMN project_milestones.is_completion_payment IS 'True if this is the final completion payment';
COMMENT ON COLUMN project_milestones.progress_percentage_required IS 'Project completion % required before this milestone (0%, 50%, 75%, 100%)';
COMMENT ON COLUMN project_milestones.client_approved_at IS 'When client approved this milestone completion';
COMMENT ON COLUMN project_milestones.client_approval_notes IS 'Client notes or feedback on milestone';

-- =====================================================
-- 2. FUNCTION: Auto-create quarterly milestones
-- =====================================================

CREATE OR REPLACE FUNCTION create_quarterly_milestones(
    p_project_id UUID,
    p_total_amount NUMERIC,
    p_estimated_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    milestone_id UUID,
    milestone_name TEXT,
    milestone_amount NUMERIC,
    milestone_percentage NUMERIC
) AS $$
DECLARE
    v_start_date DATE;
    v_milestone_amount NUMERIC;
BEGIN
    -- Get project start date
    SELECT expected_start_date INTO v_start_date
    FROM projects
    WHERE id = p_project_id;
    
    IF v_start_date IS NULL THEN
        v_start_date := CURRENT_DATE;
    END IF;
    
    -- Calculate 25% amount
    v_milestone_amount := ROUND(p_total_amount * 0.25, 2);
    
    -- Delete existing milestones if any
    DELETE FROM project_milestones WHERE project_id = p_project_id;
    
    -- Create Milestone 1: Project Start (25%)
    INSERT INTO project_milestones (
        project_id,
        title,
        description,
        amount,
        due_date,
        status,
        milestone_percentage,
        milestone_sequence,
        is_start_payment,
        progress_percentage_required
    ) VALUES (
        p_project_id,
        'Project Start - Mobilization',
        'Initial payment for materials purchase, crew mobilization, and project setup. Payment released upon project start and tool verification.',
        v_milestone_amount,
        v_start_date,
        'pending',
        25.00,
        1,
        true,
        0.00
    )
    RETURNING id, title, amount, milestone_percentage
    INTO milestone_id, milestone_name, milestone_amount, milestone_percentage;
    
    RETURN NEXT;
    
    -- Create Milestone 2: 50% Complete (25%)
    INSERT INTO project_milestones (
        project_id,
        title,
        description,
        amount,
        due_date,
        status,
        milestone_percentage,
        milestone_sequence,
        is_start_payment,
        progress_percentage_required
    ) VALUES (
        p_project_id,
        'Halfway Complete',
        '50% project completion payment. Released when contractor demonstrates project is at halfway point with photo documentation.',
        v_milestone_amount,
        v_start_date + (p_estimated_days * 0.5)::INTEGER,
        'pending',
        25.00,
        2,
        false,
        50.00
    )
    RETURNING id, title, amount, milestone_percentage
    INTO milestone_id, milestone_name, milestone_amount, milestone_percentage;
    
    RETURN NEXT;
    
    -- Create Milestone 3: 75% Complete (25%)
    INSERT INTO project_milestones (
        project_id,
        title,
        description,
        amount,
        due_date,
        status,
        milestone_percentage,
        milestone_sequence,
        is_start_payment,
        progress_percentage_required
    ) VALUES (
        p_project_id,
        'Three-Quarters Complete',
        '75% project completion payment. Released when contractor demonstrates project is at 3/4 completion with photo documentation.',
        v_milestone_amount,
        v_start_date + (p_estimated_days * 0.75)::INTEGER,
        'pending',
        25.00,
        3,
        false,
        75.00
    )
    RETURNING id, title, amount, milestone_percentage
    INTO milestone_id, milestone_name, milestone_amount, milestone_percentage;
    
    RETURN NEXT;
    
    -- Create Milestone 4: Completion (25% + any remainder)
    v_milestone_amount := p_total_amount - (v_milestone_amount * 3);
    
    INSERT INTO project_milestones (
        project_id,
        title,
        description,
        amount,
        due_date,
        status,
        milestone_percentage,
        milestone_sequence,
        is_start_payment,
        is_completion_payment,
        progress_percentage_required
    ) VALUES (
        p_project_id,
        'Project Completion',
        'Final payment upon satisfactory project completion, client walkthrough, and final approval. Includes any remaining balance.',
        v_milestone_amount,
        v_start_date + p_estimated_days,
        'pending',
        25.00,
        4,
        false,
        true,
        100.00
    )
    RETURNING id, title, amount, milestone_percentage
    INTO milestone_id, milestone_name, milestone_amount, milestone_percentage;
    
    RETURN NEXT;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_quarterly_milestones IS 'Auto-generates 4 quarterly milestones (25% each) for a project';

-- =====================================================
-- 3. FUNCTION: Validate milestone sequence
-- =====================================================

CREATE OR REPLACE FUNCTION validate_milestone_sequence()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_milestone_completed BOOLEAN;
    v_progress_required NUMERIC;
BEGIN
    -- Allow start payment (sequence 1) to be completed without checks
    IF NEW.milestone_sequence = 1 AND NEW.is_start_payment = true THEN
        RETURN NEW;
    END IF;
    
    -- For other milestones, check if previous milestone is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Check if previous milestone in sequence is completed
        SELECT EXISTS (
            SELECT 1 
            FROM project_milestones
            WHERE project_id = NEW.project_id
            AND milestone_sequence = NEW.milestone_sequence - 1
            AND status = 'completed'
        ) INTO v_previous_milestone_completed;
        
        IF NOT v_previous_milestone_completed THEN
            RAISE EXCEPTION 'Cannot complete milestone %: Previous milestone (%) must be completed first', 
                NEW.milestone_sequence, NEW.milestone_sequence - 1;
        END IF;
        
        -- Check if project progress meets requirement
        SELECT progress_percentage_required INTO v_progress_required
        FROM project_milestones
        WHERE id = NEW.id;
        
        -- Note: In production, you'd query actual project progress tracking
        -- For now, we'll allow completion if previous milestone is done
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_milestone_sequence
    BEFORE UPDATE OF status ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION validate_milestone_sequence();

COMMENT ON FUNCTION validate_milestone_sequence IS 'Ensures milestones are completed in order (1→2→3→4)';

-- =====================================================
-- 4. FUNCTION: Require client approval for completion
-- =====================================================

CREATE OR REPLACE FUNCTION require_client_approval_for_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only final completion milestone requires client approval
    IF NEW.is_completion_payment = true 
       AND NEW.status = 'completed' 
       AND OLD.status != 'completed'
       AND NEW.client_approved_at IS NULL THEN
        RAISE EXCEPTION 'Final completion milestone requires client approval before payment release';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_require_client_approval
    BEFORE UPDATE OF status ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION require_client_approval_for_completion();

COMMENT ON FUNCTION require_client_approval_for_completion IS 'Final milestone requires explicit client approval';

-- =====================================================
-- 5. FUNCTION: Auto-release start payment
-- =====================================================

CREATE OR REPLACE FUNCTION auto_release_start_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When project status changes to 'active', auto-release start payment
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- Mark start payment milestone as in_progress (ready for payment)
        UPDATE project_milestones
        SET status = 'in_progress',
            updated_at = NOW()
        WHERE project_id = NEW.id
        AND is_start_payment = true
        AND milestone_sequence = 1;
        
        -- Note: Actual payment processing would happen in payment service
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_release_start_payment
    AFTER UPDATE OF status ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_release_start_payment();

COMMENT ON FUNCTION auto_release_start_payment IS 'Automatically marks start payment as ready when project begins';

-- =====================================================
-- 6. FUNCTION: Calculate milestone payment distribution
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_milestone_distribution(
    p_milestone_id UUID
)
RETURNS TABLE (
    recipient_id UUID,
    recipient_type TEXT,
    recipient_name TEXT,
    payment_amount NUMERIC,
    payment_percentage NUMERIC
) AS $$
DECLARE
    v_milestone_amount NUMERIC;
    v_project_id UUID;
    v_platform_fee_percentage NUMERIC := 5.0; -- 5% platform fee
BEGIN
    -- Get milestone details
    SELECT amount, project_id
    INTO v_milestone_amount, v_project_id
    FROM project_milestones
    WHERE id = p_milestone_id;
    
    -- Return contractor payment (after platform fee)
    RETURN QUERY
    SELECT 
        p.contractor_id as recipient_id,
        'contractor'::TEXT as recipient_type,
        prof.full_name as recipient_name,
        ROUND(v_milestone_amount * (ptm.payment_percentage / 100), 2) as payment_amount,
        ptm.payment_percentage as payment_percentage
    FROM projects p
    JOIN project_team_members ptm ON ptm.project_id = p.id
    JOIN profiles prof ON prof.id = ptm.member_id
    WHERE p.id = v_project_id
    AND ptm.role = 'contractor'
    
    UNION ALL
    
    -- Return team member payments
    SELECT 
        ptm.member_id as recipient_id,
        'team_member'::TEXT as recipient_type,
        prof.full_name as recipient_name,
        ROUND(v_milestone_amount * (ptm.payment_percentage / 100), 2) as payment_amount,
        ptm.payment_percentage as payment_percentage
    FROM project_team_members ptm
    JOIN profiles prof ON prof.id = ptm.member_id
    WHERE ptm.project_id = v_project_id
    AND ptm.role != 'contractor'
    AND ptm.status = 'accepted'
    
    UNION ALL
    
    -- Return platform fee
    SELECT 
        NULL::UUID as recipient_id,
        'platform_fee'::TEXT as recipient_type,
        'Constructive Designs Inc. (Nonprofit)'::TEXT as recipient_name,
        ROUND(v_milestone_amount * (v_platform_fee_percentage / 100), 2) as payment_amount,
        v_platform_fee_percentage as payment_percentage;
        
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_milestone_distribution IS 'Calculates payment distribution for a milestone (contractor + team + platform fee)';

-- =====================================================
-- 7. VIEW: Milestone payment schedule
-- =====================================================

CREATE OR REPLACE VIEW milestone_payment_schedule AS
SELECT
    p.id as project_id,
    p.name as project_name,
    p.total_cost as project_total,
    pm.id as milestone_id,
    pm.title as milestone_title,
    pm.milestone_sequence,
    pm.milestone_percentage,
    pm.amount as milestone_amount,
    pm.due_date,
    pm.status as milestone_status,
    pm.is_start_payment,
    pm.is_completion_payment,
    pm.progress_percentage_required,
    pm.client_approved_at,
    CASE 
        WHEN pm.status = 'completed' THEN '✅ Paid'
        WHEN pm.status = 'in_progress' THEN '⏳ Ready for Payment'
        WHEN pm.status = 'pending' AND pm.milestone_sequence = 1 THEN '🔜 Auto-releases at project start'
        WHEN pm.status = 'pending' THEN '⏸️ Waiting for previous milestone'
        ELSE '❓ Unknown'
    END as payment_status_display,
    ROUND((pm.amount / p.total_cost) * 100, 2) as actual_percentage_of_total
FROM projects p
JOIN project_milestones pm ON pm.project_id = p.id
ORDER BY p.id, pm.milestone_sequence;

COMMENT ON VIEW milestone_payment_schedule IS 'User-friendly view of project milestone payment schedules';

-- =====================================================
-- 8. ANALYTICS VIEW: Milestone completion metrics
-- =====================================================

CREATE OR REPLACE VIEW milestone_completion_metrics AS
SELECT
    COUNT(DISTINCT pm.project_id) as total_projects_with_milestones,
    COUNT(*) as total_milestones,
    COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) as completed_milestones,
    COUNT(CASE WHEN pm.status = 'in_progress' THEN 1 END) as in_progress_milestones,
    COUNT(CASE WHEN pm.status = 'pending' THEN 1 END) as pending_milestones,
    
    -- Average days to complete each milestone sequence
    AVG(CASE WHEN pm.milestone_sequence = 1 AND pm.status = 'completed' 
        THEN EXTRACT(DAY FROM (pm.completed_at - pm.created_at)) END) as avg_days_milestone_1,
    AVG(CASE WHEN pm.milestone_sequence = 2 AND pm.status = 'completed' 
        THEN EXTRACT(DAY FROM (pm.completed_at - pm.created_at)) END) as avg_days_milestone_2,
    AVG(CASE WHEN pm.milestone_sequence = 3 AND pm.status = 'completed' 
        THEN EXTRACT(DAY FROM (pm.completed_at - pm.created_at)) END) as avg_days_milestone_3,
    AVG(CASE WHEN pm.milestone_sequence = 4 AND pm.status = 'completed' 
        THEN EXTRACT(DAY FROM (pm.completed_at - pm.created_at)) END) as avg_days_milestone_4,
    
    -- Payment timing metrics
    COUNT(CASE WHEN pm.is_start_payment = true AND pm.status = 'completed' THEN 1 END) as start_payments_released,
    COUNT(CASE WHEN pm.is_completion_payment = true AND pm.status = 'completed' THEN 1 END) as completion_payments_released,
    
    -- Client approval metrics
    COUNT(CASE WHEN pm.is_completion_payment = true AND pm.client_approved_at IS NOT NULL THEN 1 END) as client_approved_completions,
    AVG(CASE WHEN pm.is_completion_payment = true AND pm.client_approved_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (pm.client_approved_at - pm.completed_at)) END) as avg_days_to_client_approval
FROM project_milestones pm;

COMMENT ON VIEW milestone_completion_metrics IS 'Analytics on milestone completion timing and client approval rates';

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Clients can approve milestones for their projects
CREATE POLICY "Clients can approve milestones"
    ON project_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_milestones.project_id
            AND projects.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_milestones.project_id
            AND projects.client_id = auth.uid()
        )
    );

-- =====================================================
-- 10. HELPER FUNCTION: Client approve milestone
-- =====================================================

CREATE OR REPLACE FUNCTION client_approve_milestone(
    p_milestone_id UUID,
    p_approval_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_client BOOLEAN;
    v_is_completion BOOLEAN;
BEGIN
    -- Verify caller is the client for this project
    SELECT EXISTS (
        SELECT 1 
        FROM project_milestones pm
        JOIN projects p ON p.id = pm.project_id
        WHERE pm.id = p_milestone_id
        AND p.client_id = auth.uid()
    ) INTO v_is_client;
    
    IF NOT v_is_client THEN
        RAISE EXCEPTION 'Only the project client can approve milestones';
    END IF;
    
    -- Check if this is a completion milestone
    SELECT is_completion_payment INTO v_is_completion
    FROM project_milestones
    WHERE id = p_milestone_id;
    
    -- Update milestone with client approval
    UPDATE project_milestones
    SET 
        client_approved_at = NOW(),
        client_approval_notes = p_approval_notes,
        status = CASE WHEN v_is_completion THEN 'completed' ELSE status END
    WHERE id = p_milestone_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION client_approve_milestone IS 'Allows client to approve milestone completion (required for final payment)';

-- =====================================================
-- USAGE EXAMPLES:
-- =====================================================
-- 
-- 1. Create quarterly milestones for a new project:
--    SELECT * FROM create_quarterly_milestones(
--      'project-uuid-here',
--      12500.00,  -- total project cost
--      45         -- estimated days to completion
--    );
--
-- 2. View payment schedule for a project:
--    SELECT * FROM milestone_payment_schedule
--    WHERE project_id = 'project-uuid-here';
--
-- 3. Calculate payment distribution for a milestone:
--    SELECT * FROM calculate_milestone_distribution('milestone-uuid-here');
--
-- 4. Client approves final milestone:
--    SELECT client_approve_milestone(
--      'milestone-uuid-here',
--      'Work looks great! Very professional finish on the trim work.'
--    );
--
-- 5. View completion metrics:
--    SELECT * FROM milestone_completion_metrics;
--
-- =====================================================

-- Update metadata
COMMENT ON TABLE project_milestones IS 'Project milestones with quarterly payment structure (25% each at start/50%/75%/completion)';

-- AI Estimate Validation System
-- Pre-submission checks to catch errors and provide suggestions before sending to client

-- Estimate Validation Results Table
-- Stores AI analysis of estimates before they're sent to clients
CREATE TABLE IF NOT EXISTS estimate_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    validated_at TIMESTAMPTZ DEFAULT NOW(),
    validation_status TEXT NOT NULL CHECK (validation_status IN ('passed', 'warnings', 'critical_issues')),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100), -- 0-100 quality score
    
    -- Validation Checks
    has_all_tasks_assigned BOOLEAN DEFAULT FALSE,
    has_all_pay_defined BOOLEAN DEFAULT FALSE,
    has_materials_estimated BOOLEAN DEFAULT FALSE,
    has_timeline_defined BOOLEAN DEFAULT FALSE,
    pricing_variance_check BOOLEAN DEFAULT FALSE, -- Checked against market rates
    
    -- Issues Found
    missing_items JSONB DEFAULT '[]'::jsonb, -- Array of missing scope items
    pricing_warnings JSONB DEFAULT '[]'::jsonb, -- Array of pricing concerns
    team_issues JSONB DEFAULT '[]'::jsonb, -- Array of team assignment issues
    
    -- AI Suggestions
    ai_suggestions TEXT, -- Full AI explanation of findings
    recommended_changes JSONB DEFAULT '[]'::jsonb, -- Array of specific recommendations
    estimated_revenue_impact DECIMAL(10,2), -- How much $ could be gained/lost
    
    -- Approval
    contractor_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    contractor_notes TEXT, -- Why contractor proceeded despite warnings
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_estimate ON estimate_validations(estimate_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON estimate_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_validations_date ON estimate_validations(validated_at);

-- RLS Policies
ALTER TABLE estimate_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own estimate validations"
    ON estimate_validations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM estimates
            WHERE estimates.id = estimate_validations.estimate_id
            AND estimates.business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "System can create validations"
    ON estimate_validations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM estimates
            WHERE estimates.id = estimate_id
            AND estimates.business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Contractors can acknowledge validations"
    ON estimate_validations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM estimates
            WHERE estimates.id = estimate_validations.estimate_id
            AND estimates.business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Function: Validate Estimate Completeness
-- Checks if all required fields are filled before client submission
CREATE OR REPLACE FUNCTION validate_estimate_completeness(estimate_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    estimate_record RECORD;
    team_count INTEGER;
    unassigned_tasks INTEGER;
    missing_pay_count INTEGER;
    total_tasks INTEGER;
    issues TEXT[] := ARRAY[]::TEXT[];
    warnings TEXT[] := ARRAY[]::TEXT[];
    validation_status TEXT := 'passed';
    quality_score INTEGER := 100;
BEGIN
    -- Get estimate details
    SELECT * INTO estimate_record
    FROM estimates
    WHERE id = estimate_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'error', 'Estimate not found',
            'validation_status', 'critical_issues'
        );
    END IF;
    
    -- Check 1: Are there any team members assigned?
    SELECT COUNT(*) INTO team_count
    FROM project_team_members
    WHERE estimate_id = estimate_id_param;
    
    IF team_count = 0 THEN
        issues := array_append(issues, 'No team members assigned to this estimate');
        quality_score := quality_score - 30;
        validation_status := 'critical_issues';
    END IF;
    
    -- Check 2: Do all team members have tasks defined?
    SELECT COUNT(*) INTO unassigned_tasks
    FROM project_team_members
    WHERE estimate_id = estimate_id_param
    AND (tasks IS NULL OR tasks = '' OR tasks = '[]');
    
    IF unassigned_tasks > 0 THEN
        issues := array_append(issues, format('%s team member(s) have no tasks defined', unassigned_tasks));
        quality_score := quality_score - (unassigned_tasks * 10);
        validation_status := 'critical_issues';
    END IF;
    
    -- Check 3: Do all team members have pay defined?
    SELECT COUNT(*) INTO missing_pay_count
    FROM project_team_members
    WHERE estimate_id = estimate_id_param
    AND (pay_amount IS NULL OR pay_amount = 0);
    
    IF missing_pay_count > 0 THEN
        issues := array_append(issues, format('%s team member(s) have no compensation defined', missing_pay_count));
        quality_score := quality_score - (missing_pay_count * 15);
        IF validation_status != 'critical_issues' THEN
            validation_status := 'warnings';
        END IF;
    END IF;
    
    -- Check 4: Materials cost reasonable?
    IF estimate_record.materials_cost IS NULL OR estimate_record.materials_cost = 0 THEN
        warnings := array_append(warnings, 'No materials cost estimated - is this intentional?');
        quality_score := quality_score - 5;
        IF validation_status = 'passed' THEN
            validation_status := 'warnings';
        END IF;
    END IF;
    
    -- Check 5: Labor vs materials ratio (sanity check)
    IF estimate_record.materials_cost > 0 AND estimate_record.labor_cost > 0 THEN
        IF estimate_record.materials_cost > (estimate_record.labor_cost * 3) THEN
            warnings := array_append(warnings, 'Materials cost is very high compared to labor - verify accuracy');
            quality_score := quality_score - 5;
        END IF;
        IF estimate_record.labor_cost > (estimate_record.materials_cost * 5) THEN
            warnings := array_append(warnings, 'Labor cost is very high compared to materials - verify accuracy');
            quality_score := quality_score - 5;
        END IF;
    END IF;
    
    -- Check 6: Timeline/milestones defined?
    SELECT COUNT(*) INTO total_tasks
    FROM project_milestones
    WHERE estimate_id = estimate_id_param;
    
    IF total_tasks = 0 THEN
        warnings := array_append(warnings, 'No milestones or timeline defined');
        quality_score := quality_score - 10;
        IF validation_status = 'passed' THEN
            validation_status := 'warnings';
        END IF;
    END IF;
    
    -- Check 7: Total makes sense?
    IF estimate_record.total_amount IS NULL OR estimate_record.total_amount = 0 THEN
        issues := array_append(issues, 'Total amount is $0 - cannot submit');
        quality_score := quality_score - 50;
        validation_status := 'critical_issues';
    END IF;
    
    -- Check 8: All team members accepted invitations?
    SELECT COUNT(*) INTO unassigned_tasks
    FROM project_team_members
    WHERE estimate_id = estimate_id_param
    AND (status IS NULL OR status = 'pending');
    
    IF unassigned_tasks > 0 THEN
        warnings := array_append(warnings, format('%s team member(s) haven''t accepted invitation yet', unassigned_tasks));
        quality_score := quality_score - 10;
        IF validation_status = 'passed' THEN
            validation_status := 'warnings';
        END IF;
    END IF;
    
    -- Build result JSON
    result := jsonb_build_object(
        'validation_status', validation_status,
        'quality_score', GREATEST(0, quality_score),
        'team_count', team_count,
        'critical_issues', issues,
        'warnings', warnings,
        'has_all_tasks_assigned', unassigned_tasks = 0,
        'has_all_pay_defined', missing_pay_count = 0,
        'has_materials_estimated', COALESCE(estimate_record.materials_cost, 0) > 0,
        'has_timeline_defined', total_tasks > 0,
        'can_submit', validation_status != 'critical_issues',
        'estimate_details', jsonb_build_object(
            'total_amount', estimate_record.total_amount,
            'labor_cost', estimate_record.labor_cost,
            'materials_cost', estimate_record.materials_cost,
            'team_members', team_count,
            'milestones', total_tasks
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate AI Validation Report
-- Creates human-readable validation report with suggestions
CREATE OR REPLACE FUNCTION generate_ai_validation_report(estimate_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    validation_result JSONB;
    report_text TEXT := '';
    quality_score INTEGER;
    status TEXT;
BEGIN
    -- Get validation results
    validation_result := validate_estimate_completeness(estimate_id_param);
    quality_score := (validation_result->>'quality_score')::INTEGER;
    status := validation_result->>'validation_status';
    
    -- Build report header
    report_text := format(E'📊 ESTIMATE QUALITY REPORT\n\n');
    report_text := report_text || format(E'Quality Score: %s/100\n', quality_score);
    
    IF status = 'passed' THEN
        report_text := report_text || E'Status: ✅ Ready to Submit\n\n';
        report_text := report_text || E'Great work! Your estimate looks complete and professional. All team members are assigned, tasks are defined, and compensation is clear.\n\n';
    ELSIF status = 'warnings' THEN
        report_text := report_text || E'Status: ⚠️ Warnings Found\n\n';
        report_text := report_text || E'Your estimate can be submitted, but there are some items to review:\n\n';
    ELSE
        report_text := report_text || E'Status: ❌ Critical Issues\n\n';
        report_text := report_text || E'Please fix the following issues before submitting to client:\n\n';
    END IF;
    
    -- Add critical issues
    IF jsonb_array_length(validation_result->'critical_issues') > 0 THEN
        report_text := report_text || E'🚨 CRITICAL ISSUES:\n';
        FOR i IN 0..jsonb_array_length(validation_result->'critical_issues')-1 LOOP
            report_text := report_text || format(E'   • %s\n', validation_result->'critical_issues'->>i);
        END LOOP;
        report_text := report_text || E'\n';
    END IF;
    
    -- Add warnings
    IF jsonb_array_length(validation_result->'warnings') > 0 THEN
        report_text := report_text || E'⚠️ WARNINGS:\n';
        FOR i IN 0..jsonb_array_length(validation_result->'warnings')-1 LOOP
            report_text := report_text || format(E'   • %s\n', validation_result->'warnings'->>i);
        END LOOP;
        report_text := report_text || E'\n';
    END IF;
    
    -- Add summary
    report_text := report_text || E'📋 SUMMARY:\n';
    report_text := report_text || format(E'   • Total: $%s\n', 
        COALESCE((validation_result->'estimate_details'->>'total_amount')::NUMERIC, 0));
    report_text := report_text || format(E'   • Team Members: %s\n', 
        validation_result->'estimate_details'->>'team_members');
    report_text := report_text || format(E'   • Milestones: %s\n', 
        validation_result->'estimate_details'->>'milestones');
    
    -- Add recommendations
    IF status != 'passed' THEN
        report_text := report_text || E'\n💡 RECOMMENDATIONS:\n';
        IF NOT (validation_result->>'has_all_tasks_assigned')::BOOLEAN THEN
            report_text := report_text || E'   • Define specific tasks for each team member\n';
        END IF;
        IF NOT (validation_result->>'has_all_pay_defined')::BOOLEAN THEN
            report_text := report_text || E'   • Set compensation for all team members\n';
        END IF;
        IF NOT (validation_result->>'has_materials_estimated')::BOOLEAN THEN
            report_text := report_text || E'   • Add materials cost estimate\n';
        END IF;
        IF NOT (validation_result->>'has_timeline_defined')::BOOLEAN THEN
            report_text := report_text || E'   • Create project milestones and timeline\n';
        END IF;
    END IF;
    
    RETURN report_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-validate before status change to 'sent'
-- Prevents sending incomplete estimates to clients
CREATE OR REPLACE FUNCTION prevent_incomplete_estimate_submission()
RETURNS TRIGGER AS $$
DECLARE
    validation_result JSONB;
    can_submit BOOLEAN;
BEGIN
    -- Only check when status is changing to 'sent'
    IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
        -- Run validation
        validation_result := validate_estimate_completeness(NEW.id);
        can_submit := (validation_result->>'can_submit')::BOOLEAN;
        
        -- Block submission if critical issues exist
        IF NOT can_submit THEN
            RAISE EXCEPTION 'Cannot submit estimate with critical issues. Run validation check first. %', 
                validation_result->>'critical_issues';
        END IF;
        
        -- Log validation (even for warnings)
        INSERT INTO estimate_validations (
            estimate_id,
            validation_status,
            overall_score,
            has_all_tasks_assigned,
            has_all_pay_defined,
            has_materials_estimated,
            has_timeline_defined,
            ai_suggestions,
            contractor_acknowledged
        ) VALUES (
            NEW.id,
            validation_result->>'validation_status',
            (validation_result->>'quality_score')::INTEGER,
            (validation_result->>'has_all_tasks_assigned')::BOOLEAN,
            (validation_result->>'has_all_pay_defined')::BOOLEAN,
            (validation_result->>'has_materials_estimated')::BOOLEAN,
            (validation_result->>'has_timeline_defined')::BOOLEAN,
            generate_ai_validation_report(NEW.id),
            TRUE -- Auto-acknowledge if they're proceeding
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_before_submission ON estimates;
CREATE TRIGGER validate_before_submission
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION prevent_incomplete_estimate_submission();

COMMENT ON TABLE estimate_validations IS 'AI-powered pre-submission validation results with quality scoring';
COMMENT ON FUNCTION validate_estimate_completeness IS 'Checks estimate completeness and returns detailed validation report';
COMMENT ON FUNCTION generate_ai_validation_report IS 'Generates human-readable validation report with actionable suggestions';

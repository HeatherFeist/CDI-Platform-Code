-- =====================================================
-- REQUIRED TOOLS VERIFICATION SYSTEM
-- =====================================================
-- Ensures team members have required tools BEFORE projects start
-- Integrates tool rental system with contractor marketplace
-- Prevents project delays due to missing equipment

-- =====================================================
-- 1. ADD COLUMNS TO project_team_members TABLE
-- =====================================================

ALTER TABLE project_team_members 
ADD COLUMN IF NOT EXISTS required_tools JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools_verification_status TEXT DEFAULT 'unverified' CHECK (tools_verification_status IN ('unverified', 'verified', 'partially_verified')),
ADD COLUMN IF NOT EXISTS tools_verification_details JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN project_team_members.required_tools IS 'List of tools required for this team member: [{id, name, category, description, quantity}]';
COMMENT ON COLUMN project_team_members.tools_verification_status IS 'Overall verification status: unverified, verified, partially_verified';
COMMENT ON COLUMN project_team_members.tools_verification_details IS 'Verification details for each tool: [{tool_id, tool_name, verification_status, rental_agreement_id, notes}]';
COMMENT ON COLUMN project_team_members.tools_verified_at IS 'When all tools were verified';

-- =====================================================
-- 2. CREATE project_tool_requirements TABLE
-- =====================================================
-- Master list of common tools needed for different project types

CREATE TABLE IF NOT EXISTS project_tool_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name TEXT NOT NULL,
    tool_category TEXT NOT NULL,
    description TEXT,
    typical_project_types TEXT[], -- e.g., ['flooring', 'framing', 'drywall']
    is_power_tool BOOLEAN DEFAULT false,
    alternatives TEXT[], -- Alternative tool names
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common construction tools
INSERT INTO project_tool_requirements (tool_name, tool_category, description, typical_project_types, is_power_tool) VALUES
('Circular Saw', 'Power Tools', '7-1/4" corded or cordless circular saw for cutting lumber', ARRAY['framing', 'decking', 'flooring'], true),
('Miter Saw', 'Power Tools', '10" or 12" compound miter saw for precise angle cuts', ARRAY['trim', 'framing', 'flooring'], true),
('Drill/Driver', 'Power Tools', '18V or 20V cordless drill with multiple batteries', ARRAY['framing', 'drywall', 'trim', 'electrical'], true),
('Impact Driver', 'Power Tools', 'High-torque impact driver for driving screws and bolts', ARRAY['framing', 'decking', 'drywall'], true),
('Pneumatic Nailer', 'Power Tools', 'Framing or finish nailer with air compressor', ARRAY['framing', 'trim', 'flooring'], true),
('Air Compressor', 'Power Tools', '6-gallon portable air compressor for pneumatic tools', ARRAY['framing', 'trim', 'painting'], true),
('Reciprocating Saw', 'Power Tools', 'Sawzall for demolition and rough cuts', ARRAY['demolition', 'plumbing', 'electrical'], true),
('Jigsaw', 'Power Tools', 'Variable speed jigsaw for curved cuts', ARRAY['trim', 'cabinet_install', 'flooring'], true),
('Oscillating Multi-Tool', 'Power Tools', 'Multi-tool for cutting, sanding, scraping', ARRAY['trim', 'flooring', 'tile'], true),
('Belt Sander', 'Power Tools', '3x21 belt sander for smoothing surfaces', ARRAY['flooring', 'deck_refinishing'], true),
('Random Orbital Sander', 'Power Tools', '5" or 6" random orbital sander', ARRAY['drywall', 'painting_prep', 'refinishing'], true),

('Tape Measure', 'Hand Tools', '25ft or 30ft tape measure with standout', ARRAY['all'], false),
('Speed Square', 'Hand Tools', '7" aluminum rafter square', ARRAY['framing', 'roofing'], false),
('Level', 'Hand Tools', '24" or 48" box level', ARRAY['framing', 'trim', 'tile'], false),
('Laser Level', 'Measuring Tools', 'Self-leveling rotary or line laser', ARRAY['framing', 'tile', 'drywall'], false),
('Chalk Line', 'Measuring Tools', '100ft chalk line for long straight lines', ARRAY['framing', 'flooring', 'roofing'], false),
('Stud Finder', 'Measuring Tools', 'Electronic stud finder with AC detection', ARRAY['drywall', 'electrical', 'trim'], false),

('Hammer', 'Hand Tools', '16oz or 20oz framing hammer', ARRAY['framing', 'trim', 'general'], false),
('Rubber Mallet', 'Hand Tools', 'Dead blow or rubber mallet for flooring', ARRAY['flooring', 'tile'], false),
('Pry Bar', 'Hand Tools', 'Flat pry bar for demolition and trim removal', ARRAY['demolition', 'trim'], false),
('Cat''s Paw', 'Hand Tools', 'Nail puller for removing embedded nails', ARRAY['demolition', 'framing'], false),
('Utility Knife', 'Hand Tools', 'Retractable utility knife with extra blades', ARRAY['all'], false),
('Tin Snips', 'Hand Tools', 'Left, right, and straight cut tin snips', ARRAY['roofing', 'siding', 'hvac'], false),
('Chisel Set', 'Hand Tools', 'Wood chisel set (1/4", 1/2", 3/4", 1")', ARRAY['trim', 'framing', 'doors'], false),

('Cordless Grinder', 'Power Tools', '4-1/2" angle grinder for metal cutting', ARRAY['demolition', 'metal_work'], true),
('Wet Saw', 'Power Tools', '7" or 10" wet tile saw', ARRAY['tile'], true),
('Table Saw', 'Power Tools', '10" portable table saw', ARRAY['framing', 'trim', 'cabinet_install'], true),
('Planer', 'Power Tools', 'Electric hand planer for door fitting', ARRAY['doors', 'trim'], true),
('Router', 'Power Tools', 'Variable speed router with edge guide', ARRAY['trim', 'cabinet_install'], true),

('Extension Cords', 'Accessories', '12-gauge 50ft and 100ft extension cords', ARRAY['all'], false),
('Work Light', 'Accessories', 'LED work light or string lights', ARRAY['all'], false),
('Safety Glasses', 'Safety Equipment', 'ANSI-rated safety glasses', ARRAY['all'], false),
('Hearing Protection', 'Safety Equipment', 'Ear plugs or muffs (NRR 25+)', ARRAY['all'], false),
('Dust Mask/Respirator', 'Safety Equipment', 'N95 masks or half-face respirator', ARRAY['demolition', 'sanding', 'painting'], false),
('Work Gloves', 'Safety Equipment', 'Cut-resistant work gloves', ARRAY['all'], false),
('Knee Pads', 'Safety Equipment', 'Gel or foam knee pads', ARRAY['flooring', 'tile', 'framing'], false),
('Tool Belt', 'Accessories', 'Leather or nylon tool belt with pouches', ARRAY['framing', 'trim', 'general'], false)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. FUNCTION: Check if all tools are verified
-- =====================================================

CREATE OR REPLACE FUNCTION check_tools_verification_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- When tools_verification_details is updated, check if all tools are verified
    IF NEW.tools_verification_details IS NOT NULL THEN
        -- Check if all tools have a verification_status other than 'unverified'
        IF (
            SELECT COUNT(*) 
            FROM jsonb_array_elements(NEW.tools_verification_details) AS tool
            WHERE (tool->>'verification_status') = 'unverified'
        ) = 0 THEN
            -- All tools verified
            NEW.tools_verification_status := 'verified';
            NEW.tools_verified_at := NOW();
        ELSE
            -- Some tools still unverified
            NEW.tools_verification_status := 'partially_verified';
            NEW.tools_verified_at := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_tools_verification
    BEFORE UPDATE OF tools_verification_details ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION check_tools_verification_complete();

-- =====================================================
-- 4. FUNCTION: Prevent project start without tools
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_project_start_without_tools()
RETURNS TRIGGER AS $$
DECLARE
    unverified_members INTEGER;
BEGIN
    -- When trying to start project (change status to 'active')
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- Check if any team members have unverified tools
        SELECT COUNT(*)
        INTO unverified_members
        FROM project_team_members
        WHERE project_id = NEW.id
        AND status = 'accepted'
        AND (
            tools_verification_status IS NULL 
            OR tools_verification_status IN ('unverified', 'partially_verified')
        );
        
        IF unverified_members > 0 THEN
            RAISE EXCEPTION 'Cannot start project: % team member(s) have not verified their required tools', unverified_members;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_project_start_without_tools
    BEFORE UPDATE OF status ON projects
    FOR EACH ROW
    EXECUTE FUNCTION prevent_project_start_without_tools();

-- =====================================================
-- 5. FUNCTION: Prevent milestone payment without tools
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_milestone_payment_without_tools()
RETURNS TRIGGER AS $$
DECLARE
    unverified_members INTEGER;
BEGIN
    -- When trying to mark milestone as complete
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Check if any team members have unverified tools
        SELECT COUNT(*)
        INTO unverified_members
        FROM project_team_members ptm
        JOIN project_milestones pm ON pm.project_id = ptm.project_id
        WHERE pm.id = NEW.id
        AND ptm.status = 'accepted'
        AND (
            ptm.tools_verification_status IS NULL 
            OR ptm.tools_verification_status IN ('unverified', 'partially_verified')
        );
        
        IF unverified_members > 0 THEN
            RAISE EXCEPTION 'Cannot complete milestone: % team member(s) have not verified their required tools', unverified_members;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_milestone_payment_without_tools
    BEFORE UPDATE OF status ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION prevent_milestone_payment_without_tools();

-- =====================================================
-- 6. FUNCTION: Prevent invitation acceptance without tools
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_acceptance_without_tools()
RETURNS TRIGGER AS $$
BEGIN
    -- When trying to accept invitation
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Check if required_tools is set and tools are not verified
        IF NEW.required_tools IS NOT NULL 
           AND jsonb_array_length(NEW.required_tools) > 0
           AND (NEW.tools_verification_status IS NULL OR NEW.tools_verification_status != 'verified') THEN
            RAISE EXCEPTION 'Cannot accept invitation: You must verify all required tools first';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_acceptance_without_tools
    BEFORE UPDATE OF status ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_acceptance_without_tools();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Team members can view and update their own tool verifications
CREATE POLICY "Members manage own tool verifications"
    ON project_team_members
    FOR UPDATE
    USING (member_id = auth.uid())
    WITH CHECK (member_id = auth.uid());

-- Contractors can view tool verification status of their team
CREATE POLICY "Contractors view team tool status"
    ON project_team_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_team_members.project_id
            AND projects.contractor_id = auth.uid()
        )
        OR member_id = auth.uid()
    );

-- =====================================================
-- 8. HELPER FUNCTION: Get tools needed for project type
-- =====================================================

CREATE OR REPLACE FUNCTION get_tools_for_project_type(
    p_project_type TEXT
)
RETURNS TABLE (
    id UUID,
    tool_name TEXT,
    tool_category TEXT,
    description TEXT,
    is_power_tool BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ptr.id,
        ptr.tool_name,
        ptr.tool_category,
        ptr.description,
        ptr.is_power_tool
    FROM project_tool_requirements ptr
    WHERE p_project_type = ANY(ptr.typical_project_types)
       OR 'all' = ANY(ptr.typical_project_types)
    ORDER BY 
        CASE ptr.tool_category
            WHEN 'Safety Equipment' THEN 1
            WHEN 'Measuring Tools' THEN 2
            WHEN 'Power Tools' THEN 3
            WHEN 'Hand Tools' THEN 4
            ELSE 5
        END,
        ptr.tool_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. HELPER FUNCTION: Auto-link rentals to verifications
-- =====================================================

CREATE OR REPLACE FUNCTION link_rental_to_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- When a rental agreement is created, check if it matches any pending tool verifications
    -- This allows automatic linking when a member rents a tool they need for a project
    
    UPDATE project_team_members
    SET tools_verification_details = (
        SELECT jsonb_agg(
            CASE 
                WHEN (tool->>'tool_name') ILIKE '%' || (
                    SELECT model FROM tool_inventory WHERE id = NEW.tool_id
                ) || '%'
                THEN jsonb_set(
                    tool,
                    '{rental_agreement_id}',
                    to_jsonb(NEW.id::TEXT)
                )
                ELSE tool
            END
        )
        FROM jsonb_array_elements(tools_verification_details) AS tool
    )
    WHERE member_id = NEW.member_id
    AND tools_verification_status IN ('unverified', 'partially_verified')
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(tools_verification_details) AS tool
        WHERE (tool->>'verification_status') = 'rented'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_link_rental_to_verification
    AFTER INSERT ON tool_rental_agreements
    FOR EACH ROW
    EXECUTE FUNCTION link_rental_to_verification();

-- =====================================================
-- 10. ANALYTICS VIEW: Tool Verification Stats
-- =====================================================

CREATE OR REPLACE VIEW tool_verification_stats AS
SELECT
    COUNT(DISTINCT ptm.id) as total_team_members,
    COUNT(DISTINCT CASE WHEN ptm.tools_verification_status = 'verified' THEN ptm.id END) as verified_members,
    COUNT(DISTINCT CASE WHEN ptm.tools_verification_status = 'unverified' THEN ptm.id END) as unverified_members,
    COUNT(DISTINCT CASE WHEN ptm.tools_verification_status = 'partially_verified' THEN ptm.id END) as partially_verified_members,
    AVG(
        CASE WHEN ptm.tools_verification_details IS NOT NULL 
        THEN (
            SELECT COUNT(*) 
            FROM jsonb_array_elements(ptm.tools_verification_details) AS tool
            WHERE (tool->>'verification_status') != 'unverified'
        )::NUMERIC / jsonb_array_length(ptm.required_tools)
        ELSE 0
        END
    ) * 100 as avg_verification_percentage,
    COUNT(DISTINCT CASE 
        WHEN jsonb_array_length(ptm.tools_verification_details) > 0 
        THEN (
            SELECT tool->>'rental_agreement_id'
            FROM jsonb_array_elements(ptm.tools_verification_details) AS tool
            WHERE (tool->>'verification_status') = 'rented'
        )
    END) as tools_rented_from_library
FROM project_team_members ptm
WHERE ptm.required_tools IS NOT NULL 
AND jsonb_array_length(ptm.required_tools) > 0;

-- =====================================================
-- NOTES FOR INTEGRATION:
-- =====================================================
-- 
-- 1. When contractor invites team member, they should specify required_tools:
--    UPDATE project_team_members 
--    SET required_tools = '[
--      {"id": "uuid", "name": "Circular Saw", "category": "Power Tools", "quantity": 1},
--      {"id": "uuid", "name": "Tape Measure", "category": "Hand Tools", "quantity": 1}
--    ]'
--    WHERE id = 'team_member_id';
--
-- 2. Team member verifies each tool using RequiredToolsVerification.tsx component
--
-- 3. When all tools verified, tools_verification_status → 'verified'
--
-- 4. Only then can team member accept invitation
--
-- 5. Only then can project start and milestones be paid
--
-- 6. If team member needs to rent, they use ToolMarketplace.tsx
--
-- 7. Rental agreement automatically links to verification via trigger
--
-- =====================================================

COMMENT ON TABLE project_tool_requirements IS 'Master list of common construction tools with project type mappings';
COMMENT ON FUNCTION check_tools_verification_complete() IS 'Auto-updates verification status when all tools are verified';
COMMENT ON FUNCTION prevent_project_start_without_tools() IS 'Blocks project activation if any team member has unverified tools';
COMMENT ON FUNCTION prevent_milestone_payment_without_tools() IS 'Blocks milestone completion if tools not verified';
COMMENT ON FUNCTION prevent_acceptance_without_tools() IS 'Blocks invitation acceptance if required tools not verified';
COMMENT ON FUNCTION get_tools_for_project_type(TEXT) IS 'Returns recommended tools for a specific project type';
COMMENT ON FUNCTION link_rental_to_verification() IS 'Auto-links rental agreements to pending tool verifications';

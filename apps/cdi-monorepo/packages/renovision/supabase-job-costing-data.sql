-- ============================================================================
-- JOB COSTING DATABASE - ZIP CODE BASED UNIT COSTS
-- ============================================================================
-- Similar to Homewyse.com's unit cost method
-- Stores regional pricing data for construction tasks
-- AI uses this to validate estimates and provide market-rate guidance
-- ============================================================================

-- Cost Categories
CREATE TYPE cost_category AS ENUM (
    'labor',
    'materials',
    'equipment',
    'permits',
    'overhead',
    'waste_disposal'
);

-- Unit Types
CREATE TYPE unit_type AS ENUM (
    'square_foot',
    'linear_foot',
    'cubic_yard',
    'each',
    'hour',
    'day',
    'fixed'
);

-- Regional Cost Data (by ZIP code)
CREATE TABLE IF NOT EXISTS regional_cost_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code TEXT NOT NULL,
    city TEXT,
    state TEXT NOT NULL,
    metro_area TEXT,
    cost_index DECIMAL(5,2) DEFAULT 1.00, -- Relative to national average (1.00 = average, 1.15 = 15% above)
    labor_rate_multiplier DECIMAL(5,2) DEFAULT 1.00,
    material_rate_multiplier DECIMAL(5,2) DEFAULT 1.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT, -- 'manual', 'api', 'user_reported'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Cost Templates (base costs before regional adjustment)
CREATE TABLE IF NOT EXISTS task_cost_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name TEXT NOT NULL,
    task_category TEXT NOT NULL, -- 'Flooring', 'Painting', 'Roofing', 'Plumbing', etc.
    description TEXT,
    unit_type unit_type NOT NULL,
    base_labor_cost DECIMAL(10,2) NOT NULL, -- Per unit
    base_material_cost DECIMAL(10,2) NOT NULL, -- Per unit
    base_equipment_cost DECIMAL(10,2) DEFAULT 0,
    typical_crew_size INTEGER DEFAULT 1,
    hours_per_unit DECIMAL(5,2), -- Labor hours per unit
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5), -- 1=easy, 5=expert
    min_quantity DECIMAL(10,2) DEFAULT 1,
    max_quantity DECIMAL(10,2),
    waste_factor DECIMAL(5,4) DEFAULT 0.10, -- 10% typical waste
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Reported Costs (crowdsourced data)
CREATE TABLE IF NOT EXISTS user_reported_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    task_template_id UUID REFERENCES task_cost_templates(id) ON DELETE CASCADE,
    zip_code TEXT NOT NULL,
    actual_total_cost DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) GENERATED ALWAYS AS (actual_total_cost / NULLIF(quantity, 0)) STORED,
    completion_date DATE,
    labor_hours DECIMAL(10,2),
    crew_size INTEGER,
    notes TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Cost Analysis Results
CREATE TABLE IF NOT EXISTS cost_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID, -- Link to estimates table
    task_description TEXT NOT NULL,
    user_cost DECIMAL(10,2) NOT NULL,
    ai_suggested_cost DECIMAL(10,2) NOT NULL,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        ((user_cost - ai_suggested_cost) / NULLIF(ai_suggested_cost, 0)) * 100
    ) STORED,
    variance_category TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN ABS(((user_cost - ai_suggested_cost) / NULLIF(ai_suggested_cost, 0)) * 100) < 10 THEN 'on_target'
            WHEN ((user_cost - ai_suggested_cost) / NULLIF(ai_suggested_cost, 0)) * 100 >= 10 THEN 'overpriced'
            WHEN ((user_cost - ai_suggested_cost) / NULLIF(ai_suggested_cost, 0)) * 100 <= -10 THEN 'underpriced'
            ELSE 'on_target'
        END
    ) STORED,
    zip_code TEXT,
    explanation TEXT, -- AI's reasoning for the suggested cost
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1), -- 0.0 to 1.0
    data_points_used INTEGER, -- How many historical data points informed this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get regional cost multiplier for a zip code
CREATE OR REPLACE FUNCTION get_regional_multiplier(target_zip TEXT)
RETURNS TABLE (
    labor_multiplier DECIMAL,
    material_multiplier DECIMAL,
    cost_index DECIMAL,
    city TEXT,
    state TEXT
) AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Try exact zip match first
    SELECT 
        rcd.labor_rate_multiplier,
        rcd.material_rate_multiplier,
        rcd.cost_index,
        rcd.city,
        rcd.state
    INTO v_result
    FROM regional_cost_data rcd
    WHERE rcd.zip_code = target_zip
    ORDER BY rcd.last_updated DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT 
            v_result.labor_rate_multiplier,
            v_result.material_rate_multiplier,
            v_result.cost_index,
            v_result.city,
            v_result.state;
        RETURN;
    END IF;

    -- If no exact match, try nearby ZIP (same prefix)
    SELECT 
        AVG(rcd.labor_rate_multiplier),
        AVG(rcd.material_rate_multiplier),
        AVG(rcd.cost_index),
        MIN(rcd.city),
        MIN(rcd.state)
    INTO v_result
    FROM regional_cost_data rcd
    WHERE LEFT(rcd.zip_code, 3) = LEFT(target_zip, 3)
    GROUP BY LEFT(rcd.zip_code, 3);

    IF FOUND THEN
        RETURN QUERY SELECT 
            v_result.avg AS labor_rate_multiplier,
            v_result.avg AS material_rate_multiplier,
            v_result.avg AS cost_index,
            v_result.min AS city,
            v_result.min AS state;
        RETURN;
    END IF;

    -- Default to national average if no regional data
    RETURN QUERY SELECT 
        1.00::DECIMAL AS labor_rate_multiplier,
        1.00::DECIMAL AS material_rate_multiplier,
        1.00::DECIMAL AS cost_index,
        'Unknown'::TEXT AS city,
        'Unknown'::TEXT AS state;
END;
$$ LANGUAGE plpgsql;

-- Calculate market-rate cost for a task
CREATE OR REPLACE FUNCTION calculate_market_rate(
    task_template_id_param UUID,
    quantity_param DECIMAL,
    zip_code_param TEXT
)
RETURNS TABLE (
    suggested_total DECIMAL,
    labor_cost DECIMAL,
    material_cost DECIMAL,
    equipment_cost DECIMAL,
    total_with_waste DECIMAL,
    explanation TEXT
) AS $$
DECLARE
    v_template RECORD;
    v_regional RECORD;
    v_user_avg DECIMAL;
    v_data_points INTEGER;
BEGIN
    -- Get task template
    SELECT * INTO v_template
    FROM task_cost_templates
    WHERE id = task_template_id_param AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task template not found';
    END IF;

    -- Get regional multipliers
    SELECT * INTO v_regional
    FROM get_regional_multiplier(zip_code_param);

    -- Get user-reported average for this task in this region
    SELECT 
        AVG(unit_cost),
        COUNT(*)
    INTO v_user_avg, v_data_points
    FROM user_reported_costs
    WHERE 
        task_template_id = task_template_id_param
        AND LEFT(zip_code, 3) = LEFT(zip_code_param, 3)
        AND verified = true
        AND created_at > NOW() - INTERVAL '2 years';

    -- Calculate costs
    DECLARE
        v_labor DECIMAL;
        v_materials DECIMAL;
        v_equipment DECIMAL;
        v_subtotal DECIMAL;
        v_with_waste DECIMAL;
        v_explanation TEXT;
    BEGIN
        -- Apply regional multipliers
        v_labor := v_template.base_labor_cost * quantity_param * v_regional.labor_multiplier;
        v_materials := v_template.base_material_cost * quantity_param * v_regional.material_multiplier;
        v_equipment := v_template.base_equipment_cost * quantity_param;
        
        v_subtotal := v_labor + v_materials + v_equipment;
        v_with_waste := v_subtotal * (1 + v_template.waste_factor);

        -- Build explanation
        v_explanation := format(
            'Based on %s market rates for %s. Labor: $%s/unit × %s regional multiplier. Materials: $%s/unit × %s multiplier.',
            v_regional.city || ', ' || v_regional.state,
            v_template.task_name,
            v_template.base_labor_cost::TEXT,
            v_regional.labor_multiplier::TEXT,
            v_template.base_material_cost::TEXT,
            v_regional.material_multiplier::TEXT
        );

        IF v_data_points > 0 THEN
            v_explanation := v_explanation || format(' Verified by %s local contractors averaging $%s/unit.',
                v_data_points::TEXT,
                ROUND(v_user_avg, 2)::TEXT
            );
        END IF;

        RETURN QUERY SELECT 
            v_with_waste,
            v_labor,
            v_materials,
            v_equipment,
            v_with_waste,
            v_explanation;
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT REGIONAL DATA (Ohio focus, expandable)
-- ============================================================================

INSERT INTO regional_cost_data (zip_code, city, state, cost_index, labor_rate_multiplier, material_rate_multiplier, data_source) VALUES
-- Dayton, OH area
('45401', 'Dayton', 'OH', 0.92, 0.90, 0.95, 'manual'),
('45402', 'Dayton', 'OH', 0.92, 0.90, 0.95, 'manual'),
('45403', 'Dayton', 'OH', 0.91, 0.89, 0.94, 'manual'),
('45404', 'Dayton', 'OH', 0.88, 0.86, 0.92, 'manual'),
('45405', 'Dayton', 'OH', 0.93, 0.91, 0.96, 'manual'),
('45406', 'Dayton', 'OH', 0.90, 0.88, 0.93, 'manual'),
('45409', 'Dayton', 'OH', 0.94, 0.92, 0.97, 'manual'),
('45410', 'Dayton', 'OH', 0.89, 0.87, 0.92, 'manual'),
('45414', 'Dayton', 'OH', 0.95, 0.93, 0.98, 'manual'),
('45415', 'Dayton', 'OH', 0.96, 0.94, 0.99, 'manual'),
('45416', 'Dayton', 'OH', 0.94, 0.92, 0.97, 'manual'),
('45417', 'Dayton', 'OH', 0.90, 0.88, 0.93, 'manual'),
('45419', 'Dayton', 'OH', 0.91, 0.89, 0.94, 'manual'),
('45420', 'Dayton', 'OH', 0.93, 0.91, 0.96, 'manual'),
('45424', 'Dayton', 'OH', 0.97, 0.95, 1.00, 'manual'),
('45426', 'Dayton', 'OH', 0.98, 0.96, 1.01, 'manual'),
('45428', 'Dayton', 'OH', 0.96, 0.94, 0.99, 'manual'),
('45429', 'Dayton', 'OH', 0.99, 0.97, 1.02, 'manual'),
('45430', 'Dayton', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45431', 'Dayton', 'OH', 0.98, 0.96, 1.01, 'manual'),
('45432', 'Dayton', 'OH', 1.01, 0.99, 1.04, 'manual'),
('45433', 'Dayton', 'OH', 0.97, 0.95, 1.00, 'manual'),
('45434', 'Dayton', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45439', 'Dayton', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45440', 'Dayton', 'OH', 1.01, 0.99, 1.04, 'manual'),
('45449', 'Dayton', 'OH', 1.03, 1.01, 1.06, 'manual'),
('45458', 'Dayton', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45459', 'Dayton', 'OH', 1.04, 1.02, 1.07, 'manual'),

-- Columbus, OH area (for comparison)
('43201', 'Columbus', 'OH', 1.02, 1.00, 1.05, 'manual'),
('43202', 'Columbus', 'OH', 1.05, 1.03, 1.08, 'manual'),
('43203', 'Columbus', 'OH', 0.96, 0.94, 0.99, 'manual'),
('43204', 'Columbus', 'OH', 0.95, 0.93, 0.98, 'manual'),
('43205', 'Columbus', 'OH', 0.94, 0.92, 0.97, 'manual'),
('43206', 'Columbus', 'OH', 0.97, 0.95, 1.00, 'manual'),
('43210', 'Columbus', 'OH', 1.03, 1.01, 1.06, 'manual'),
('43214', 'Columbus', 'OH', 1.01, 0.99, 1.04, 'manual'),
('43215', 'Columbus', 'OH', 1.06, 1.04, 1.09, 'manual'),
('43220', 'Columbus', 'OH', 1.08, 1.06, 1.11, 'manual'),
('43221', 'Columbus', 'OH', 1.07, 1.05, 1.10, 'manual'),

-- Cincinnati, OH area
('45201', 'Cincinnati', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45202', 'Cincinnati', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45203', 'Cincinnati', 'OH', 0.95, 0.93, 0.98, 'manual'),
('45204', 'Cincinnati', 'OH', 0.93, 0.91, 0.96, 'manual'),
('45205', 'Cincinnati', 'OH', 0.94, 0.92, 0.97, 'manual'),
('45206', 'Cincinnati', 'OH', 0.99, 0.97, 1.02, 'manual'),
('45208', 'Cincinnati', 'OH', 1.05, 1.03, 1.08, 'manual'),
('45209', 'Cincinnati', 'OH', 1.07, 1.05, 1.10, 'manual'),
('45211', 'Cincinnati', 'OH', 0.96, 0.94, 0.99, 'manual'),
('45212', 'Cincinnati', 'OH', 1.01, 0.99, 1.04, 'manual'),
('45213', 'Cincinnati', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45214', 'Cincinnati', 'OH', 0.94, 0.92, 0.97, 'manual'),
('45215', 'Cincinnati', 'OH', 0.95, 0.93, 0.98, 'manual'),
('45216', 'Cincinnati', 'OH', 0.97, 0.95, 1.00, 'manual'),
('45217', 'Cincinnati', 'OH', 0.96, 0.94, 0.99, 'manual'),
('45219', 'Cincinnati', 'OH', 1.03, 1.01, 1.06, 'manual'),
('45220', 'Cincinnati', 'OH', 0.98, 0.96, 1.01, 'manual'),
('45223', 'Cincinnati', 'OH', 0.99, 0.97, 1.02, 'manual'),
('45224', 'Cincinnati', 'OH', 0.94, 0.92, 0.97, 'manual'),
('45225', 'Cincinnati', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45226', 'Cincinnati', 'OH', 1.08, 1.06, 1.11, 'manual'),
('45227', 'Cincinnati', 'OH', 1.06, 1.04, 1.09, 'manual'),
('45229', 'Cincinnati', 'OH', 1.04, 1.02, 1.07, 'manual'),
('45230', 'Cincinnati', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45231', 'Cincinnati', 'OH', 1.01, 0.99, 1.04, 'manual'),
('45232', 'Cincinnati', 'OH', 0.97, 0.95, 1.00, 'manual'),
('45233', 'Cincinnati', 'OH', 0.96, 0.94, 0.99, 'manual'),
('45236', 'Cincinnati', 'OH', 1.03, 1.01, 1.06, 'manual'),
('45237', 'Cincinnati', 'OH', 1.05, 1.03, 1.08, 'manual'),
('45238', 'Cincinnati', 'OH', 0.98, 0.96, 1.01, 'manual'),
('45239', 'Cincinnati', 'OH', 1.00, 0.98, 1.03, 'manual'),
('45240', 'Cincinnati', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45241', 'Cincinnati', 'OH', 1.06, 1.04, 1.09, 'manual'),
('45242', 'Cincinnati', 'OH', 1.10, 1.08, 1.13, 'manual'),
('45243', 'Cincinnati', 'OH', 1.09, 1.07, 1.12, 'manual'),
('45244', 'Cincinnati', 'OH', 1.04, 1.02, 1.07, 'manual'),
('45245', 'Cincinnati', 'OH', 1.03, 1.01, 1.06, 'manual'),
('45246', 'Cincinnati', 'OH', 1.05, 1.03, 1.08, 'manual'),
('45247', 'Cincinnati', 'OH', 1.01, 0.99, 1.04, 'manual'),
('45248', 'Cincinnati', 'OH', 1.02, 1.00, 1.05, 'manual'),
('45249', 'Cincinnati', 'OH', 1.07, 1.05, 1.10, 'manual'),
('45251', 'Cincinnati', 'OH', 1.08, 1.06, 1.11, 'manual'),
('45252', 'Cincinnati', 'OH', 1.06, 1.04, 1.09, 'manual'),
('45255', 'Cincinnati', 'OH', 1.09, 1.07, 1.12, 'manual');

-- Cleveland, OH area
INSERT INTO regional_cost_data (zip_code, city, state, cost_index, labor_rate_multiplier, material_rate_multiplier, data_source) VALUES
('44101', 'Cleveland', 'OH', 0.96, 0.94, 0.99, 'manual'),
('44102', 'Cleveland', 'OH', 0.91, 0.89, 0.94, 'manual'),
('44103', 'Cleveland', 'OH', 0.89, 0.87, 0.92, 'manual'),
('44104', 'Cleveland', 'OH', 0.88, 0.86, 0.91, 'manual'),
('44105', 'Cleveland', 'OH', 0.90, 0.88, 0.93, 'manual'),
('44106', 'Cleveland', 'OH', 1.05, 1.03, 1.08, 'manual'),
('44107', 'Cleveland', 'OH', 0.97, 0.95, 1.00, 'manual'),
('44108', 'Cleveland', 'OH', 0.92, 0.90, 0.95, 'manual'),
('44109', 'Cleveland', 'OH', 0.91, 0.89, 0.94, 'manual'),
('44110', 'Cleveland', 'OH', 0.93, 0.91, 0.96, 'manual'),
('44111', 'Cleveland', 'OH', 0.94, 0.92, 0.97, 'manual'),
('44112', 'Cleveland', 'OH', 0.95, 0.93, 0.98, 'manual'),
('44113', 'Cleveland', 'OH', 1.02, 1.00, 1.05, 'manual'),
('44114', 'Cleveland', 'OH', 1.08, 1.06, 1.11, 'manual'),
('44115', 'Cleveland', 'OH', 1.01, 0.99, 1.04, 'manual'),
('44118', 'Cleveland Heights', 'OH', 1.06, 1.04, 1.09, 'manual'),
('44119', 'Cleveland', 'OH', 0.98, 0.96, 1.01, 'manual'),
('44120', 'Cleveland', 'OH', 0.90, 0.88, 0.93, 'manual'),
('44121', 'Cleveland', 'OH', 0.96, 0.94, 0.99, 'manual'),
('44122', 'Beachwood', 'OH', 1.10, 1.08, 1.13, 'manual'),
('44124', 'Lyndhurst', 'OH', 1.04, 1.02, 1.07, 'manual'),
('44125', 'Cleveland', 'OH', 0.92, 0.90, 0.95, 'manual'),
('44126', 'Rocky River', 'OH', 1.07, 1.05, 1.10, 'manual'),
('44127', 'Cleveland', 'OH', 0.91, 0.89, 0.94, 'manual'),
('44128', 'Cleveland', 'OH', 0.93, 0.91, 0.96, 'manual'),
('44129', 'Cleveland', 'OH', 0.95, 0.93, 0.98, 'manual'),
('44130', 'Cleveland', 'OH', 0.99, 0.97, 1.02, 'manual'),
('44134', 'Cleveland', 'OH', 0.97, 0.95, 1.00, 'manual'),
('44135', 'Cleveland', 'OH', 0.96, 0.94, 0.99, 'manual'),
('44137', 'Cleveland', 'OH', 0.94, 0.92, 0.97, 'manual'),
('44138', 'Olmsted Falls', 'OH', 1.02, 1.00, 1.05, 'manual'),
('44139', 'Strongsville', 'OH', 1.05, 1.03, 1.08, 'manual'),
('44140', 'Bay Village', 'OH', 1.09, 1.07, 1.12, 'manual'),
('44141', 'Brecksville', 'OH', 1.08, 1.06, 1.11, 'manual'),
('44143', 'Cleveland', 'OH', 1.01, 0.99, 1.04, 'manual'),
('44144', 'Cleveland', 'OH', 1.00, 0.98, 1.03, 'manual'),
('44145', 'Cleveland', 'OH', 1.03, 1.01, 1.06, 'manual'),
('44146', 'Bedford', 'OH', 0.98, 0.96, 1.01, 'manual'),
('44147', 'Broadview Heights', 'OH', 1.04, 1.02, 1.07, 'manual');

-- ============================================================================
-- SAMPLE TASK COST TEMPLATES
-- ============================================================================

INSERT INTO task_cost_templates (task_name, task_category, description, unit_type, base_labor_cost, base_material_cost, base_equipment_cost, typical_crew_size, hours_per_unit, difficulty_level, waste_factor) VALUES
-- FLOORING
('Hardwood Floor Installation', 'Flooring', 'Install 3/4" solid hardwood flooring', 'square_foot', 4.50, 6.00, 0.25, 2, 0.30, 3, 0.10),
('Laminate Floor Installation', 'Flooring', 'Install laminate plank flooring', 'square_foot', 2.75, 2.50, 0.15, 2, 0.20, 2, 0.08),
('Tile Floor Installation', 'Flooring', 'Install ceramic or porcelain tile', 'square_foot', 5.00, 4.00, 0.30, 2, 0.35, 3, 0.12),
('Vinyl Plank Installation', 'Flooring', 'Install luxury vinyl plank', 'square_foot', 2.50, 3.00, 0.10, 1, 0.18, 2, 0.07),
('Carpet Installation', 'Flooring', 'Install carpet with pad', 'square_foot', 1.75, 3.50, 0.20, 2, 0.12, 2, 0.05),

-- PAINTING
('Interior Paint - Walls', 'Painting', 'Paint interior walls (2 coats)', 'square_foot', 0.85, 0.35, 0.10, 1, 0.05, 1, 0.08),
('Interior Paint - Ceiling', 'Painting', 'Paint interior ceiling (2 coats)', 'square_foot', 0.95, 0.35, 0.10, 1, 0.06, 2, 0.08),
('Exterior Paint - Siding', 'Painting', 'Paint exterior siding (2 coats)', 'square_foot', 1.25, 0.50, 0.30, 2, 0.08, 2, 0.10),
('Cabinet Painting', 'Painting', 'Paint kitchen cabinets', 'linear_foot', 8.00, 3.00, 0.50, 1, 0.45, 3, 0.05),
('Trim and Baseboard Paint', 'Painting', 'Paint trim and baseboards', 'linear_foot', 1.50, 0.25, 0.05, 1, 0.08, 2, 0.05),

-- ROOFING
('Asphalt Shingle Roof', 'Roofing', 'Install asphalt shingle roofing', 'square_foot', 1.75, 1.25, 0.40, 3, 0.12, 3, 0.15),
('Metal Roof Installation', 'Roofing', 'Install standing seam metal roof', 'square_foot', 4.00, 5.50, 0.75, 3, 0.25, 4, 0.10),
('Roof Tear-off', 'Roofing', 'Remove existing roofing material', 'square_foot', 1.25, 0.00, 0.50, 3, 0.08, 2, 0.00),
('Gutter Installation', 'Roofing', 'Install seamless aluminum gutters', 'linear_foot', 3.50, 4.00, 0.25, 2, 0.15, 2, 0.08),
('Roof Flashing', 'Roofing', 'Install chimney or valley flashing', 'linear_foot', 8.00, 5.00, 0.50, 2, 0.30, 3, 0.10),

-- DRYWALL
('Drywall Installation', 'Drywall', 'Hang and tape drywall', 'square_foot', 1.75, 0.50, 0.15, 2, 0.10, 2, 0.12),
('Drywall Finish - Level 4', 'Drywall', 'Finish drywall to Level 4', 'square_foot', 1.25, 0.30, 0.10, 1, 0.08, 3, 0.08),
('Drywall Repair', 'Drywall', 'Repair damaged drywall', 'square_foot', 3.50, 0.75, 0.20, 1, 0.20, 2, 0.10),
('Texture Application', 'Drywall', 'Apply orange peel or knockdown texture', 'square_foot', 0.95, 0.20, 0.15, 1, 0.05, 2, 0.05),

-- ELECTRICAL
('Electrical Outlet Install', 'Electrical', 'Install standard duplex outlet', 'each', 85.00, 15.00, 5.00, 1, 0.75, 3, 0.05),
('Light Fixture Install', 'Electrical', 'Install ceiling light fixture', 'each', 120.00, 25.00, 10.00, 1, 1.00, 3, 0.05),
('Electrical Panel Upgrade', 'Electrical', '200-amp panel replacement', 'each', 800.00, 600.00, 150.00, 2, 8.00, 5, 0.05),
('Ceiling Fan Installation', 'Electrical', 'Install ceiling fan with light', 'each', 150.00, 35.00, 15.00, 1, 1.50, 3, 0.05),
('Recessed Lighting', 'Electrical', 'Install recessed can light', 'each', 125.00, 45.00, 20.00, 1, 1.25, 3, 0.08),

-- PLUMBING
('Toilet Installation', 'Plumbing', 'Install standard toilet', 'each', 200.00, 50.00, 25.00, 1, 2.00, 3, 0.05),
('Faucet Installation', 'Plumbing', 'Install sink faucet', 'each', 150.00, 35.00, 15.00, 1, 1.50, 2, 0.05),
('Water Heater Install', 'Plumbing', 'Install 40-50 gallon water heater', 'each', 500.00, 200.00, 75.00, 1, 4.00, 4, 0.05),
('Drain Line Replacement', 'Plumbing', 'Replace drain line', 'linear_foot', 45.00, 15.00, 10.00, 2, 0.50, 3, 0.10),
('Shower Valve Install', 'Plumbing', 'Install shower mixing valve', 'each', 350.00, 150.00, 40.00, 1, 3.00, 4, 0.05),

-- HVAC
('AC Unit Installation', 'HVAC', 'Install 3-ton AC unit', 'each', 1200.00, 2500.00, 300.00, 2, 8.00, 4, 0.05),
('Furnace Installation', 'HVAC', 'Install gas furnace', 'each', 1500.00, 2000.00, 350.00, 2, 10.00, 4, 0.05),
('Ductwork Installation', 'HVAC', 'Install HVAC ductwork', 'linear_foot', 18.00, 12.00, 5.00, 2, 0.40, 3, 0.15),
('Thermostat Installation', 'HVAC', 'Install programmable thermostat', 'each', 125.00, 75.00, 15.00, 1, 1.00, 2, 0.05),

-- KITCHEN & BATH
('Kitchen Cabinet Install', 'Kitchen', 'Install base and wall cabinets', 'linear_foot', 65.00, 150.00, 15.00, 2, 1.50, 3, 0.05),
('Countertop Installation', 'Kitchen', 'Install laminate countertop', 'linear_foot', 45.00, 55.00, 10.00, 2, 1.00, 3, 0.08),
('Granite Countertop', 'Kitchen', 'Install granite countertop', 'square_foot', 25.00, 60.00, 15.00, 2, 0.50, 4, 0.05),
('Backsplash Tile', 'Kitchen', 'Install tile backsplash', 'square_foot', 12.00, 8.00, 2.00, 1, 0.60, 3, 0.12),
('Bathroom Vanity Install', 'Bathroom', 'Install bathroom vanity', 'each', 250.00, 100.00, 30.00, 1, 2.50, 3, 0.05),
('Shower Surround Install', 'Bathroom', 'Install acrylic shower surround', 'each', 600.00, 400.00, 80.00, 2, 6.00, 3, 0.08),
('Bathtub Installation', 'Bathroom', 'Install standard bathtub', 'each', 800.00, 350.00, 120.00, 2, 8.00, 4, 0.05),

-- FRAMING & STRUCTURAL
('Wall Framing', 'Framing', 'Frame interior wall', 'linear_foot', 12.00, 8.00, 2.00, 2, 0.40, 2, 0.10),
('Ceiling Joist Install', 'Framing', 'Install ceiling joists', 'linear_foot', 15.00, 10.00, 3.00, 2, 0.50, 3, 0.10),
('Door Frame Installation', 'Framing', 'Frame door opening', 'each', 85.00, 40.00, 10.00, 1, 1.25, 2, 0.08),
('Window Frame Installation', 'Framing', 'Frame window opening', 'each', 100.00, 50.00, 15.00, 2, 1.50, 2, 0.08),
('Load-Bearing Beam', 'Framing', 'Install load-bearing beam', 'linear_foot', 55.00, 45.00, 20.00, 3, 1.00, 4, 0.08),

-- EXTERIOR & SIDING
('Vinyl Siding Install', 'Exterior', 'Install vinyl siding', 'square_foot', 2.50, 2.00, 0.30, 2, 0.15, 2, 0.10),
('Hardie Board Siding', 'Exterior', 'Install fiber cement siding', 'square_foot', 3.50, 3.00, 0.40, 2, 0.20, 3, 0.10),
('Soffit and Fascia', 'Exterior', 'Install soffit and fascia', 'linear_foot', 8.00, 6.00, 1.00, 2, 0.30, 2, 0.10),
('Window Replacement', 'Exterior', 'Replace window (labor only)', 'each', 150.00, 300.00, 25.00, 2, 2.00, 3, 0.05),
('Door Installation', 'Exterior', 'Install exterior door', 'each', 275.00, 400.00, 40.00, 2, 3.00, 3, 0.05),

-- CONCRETE & MASONRY
('Concrete Slab', 'Concrete', 'Pour concrete slab (4" thick)', 'square_foot', 2.50, 3.00, 0.75, 3, 0.12, 3, 0.05),
('Concrete Driveway', 'Concrete', 'Install concrete driveway', 'square_foot', 3.00, 3.50, 1.00, 3, 0.15, 3, 0.08),
('Brick Veneer', 'Masonry', 'Install brick veneer', 'square_foot', 12.00, 8.00, 2.00, 2, 0.60, 4, 0.08),
('Stone Veneer', 'Masonry', 'Install manufactured stone veneer', 'square_foot', 15.00, 10.00, 2.50, 2, 0.70, 4, 0.10),
('Retaining Wall Block', 'Masonry', 'Install segmental block wall', 'square_foot', 18.00, 12.00, 3.00, 2, 0.80, 3, 0.10),

-- DECKING & OUTDOOR
('Pressure Treated Deck', 'Decking', 'Build pressure treated deck', 'square_foot', 8.00, 6.00, 1.50, 2, 0.40, 3, 0.12),
('Composite Decking', 'Decking', 'Install composite deck boards', 'square_foot', 10.00, 12.00, 2.00, 2, 0.45, 3, 0.08),
('Deck Railing', 'Decking', 'Install deck railing', 'linear_foot', 25.00, 20.00, 3.00, 2, 0.60, 3, 0.08),
('Fence Installation', 'Outdoor', 'Install wood privacy fence', 'linear_foot', 12.00, 15.00, 2.00, 2, 0.45, 2, 0.10),
('Patio Pavers', 'Outdoor', 'Install paver patio', 'square_foot', 8.00, 7.00, 1.50, 2, 0.40, 3, 0.08);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_regional_cost_zip ON regional_cost_data(zip_code);
CREATE INDEX IF NOT EXISTS idx_regional_cost_state ON regional_cost_data(state);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_cost_templates(task_category);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_cost_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_reported_task ON user_reported_costs(task_template_id);
CREATE INDEX IF NOT EXISTS idx_user_reported_zip ON user_reported_costs(zip_code);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_estimate ON cost_analysis_results(estimate_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE regional_cost_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_cost_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reported_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_analysis_results ENABLE ROW LEVEL SECURITY;

-- Everyone can view regional data
CREATE POLICY "Regional cost data is viewable by everyone"
ON regional_cost_data FOR SELECT
USING (true);

-- Everyone can view task templates
CREATE POLICY "Task templates are viewable by everyone"
ON task_cost_templates FOR SELECT
USING (is_active = true);

-- Users can insert their own reported costs
CREATE POLICY "Users can report their own costs"
ON user_reported_costs FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Users can view their own reported costs
CREATE POLICY "Users can view their own reported costs"
ON user_reported_costs FOR SELECT
USING (auth.uid() = profile_id OR verified = true);

-- Users can view cost analyses for their estimates
CREATE POLICY "Users can view their own cost analyses"
ON cost_analysis_results FOR SELECT
USING (true); -- Link to estimates table for proper RLS

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE regional_cost_data IS 'Zip code-based cost multipliers for regional pricing adjustments';
COMMENT ON TABLE task_cost_templates IS 'Base unit costs for common construction tasks';
COMMENT ON TABLE user_reported_costs IS 'Crowdsourced actual costs from completed projects';
COMMENT ON TABLE cost_analysis_results IS 'AI-generated cost analysis comparing user estimates to market rates';
COMMENT ON FUNCTION get_regional_multiplier IS 'Returns labor and material cost multipliers for a zip code';
COMMENT ON FUNCTION calculate_market_rate IS 'Calculates market-rate cost for a task based on zip code and quantity';

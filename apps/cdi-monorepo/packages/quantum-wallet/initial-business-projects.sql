-- =====================================================
-- INITIAL 4 TURNKEY BUSINESS PROJECTS
-- With Complete 5-Year Plans, EIN Setup, Equipment Lists
-- =====================================================

-- =====================================================
-- STEP 0: CHECK SCHEMA & CREATE PROJECTS TABLE IF NEEDED
-- =====================================================

-- Option A: If your projects table requires business_id, uncomment this:
-- CREATE TABLE IF NOT EXISTS businesses (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- PROJECT 1: SEASONAL GREETINGS - Holiday Pop-Up Shop
-- =====================================================

-- Insert Project (handles both schema variations)
DO $$
DECLARE
    v_project_id UUID;
    v_business_id UUID;
    v_has_business_id BOOLEAN;
BEGIN
    -- Check if projects table has business_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'business_id'
    ) INTO v_has_business_id;
    
    -- If business_id column exists, create a business first
    IF v_has_business_id THEN
        INSERT INTO businesses (name) 
        VALUES ('Seasonal Greetings LLC')
        RETURNING id INTO v_business_id;
        
        INSERT INTO projects (business_id, name, slug, tagline, description, image_url, status, funding_goal)
        VALUES (
            v_business_id,
            'Seasonal Greetings',
            'seasonal-greetings',
            'Holiday Pop-Up Shop',
            'A festive holiday experience featuring curated gifts, handmade decorations, seasonal treats, and a magical atmosphere that brings joy to the Dayton community during the holiday season.',
            'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800',
            'funding',
            2000.00
        )
        RETURNING id INTO v_project_id;
    ELSE
        -- Schema without business_id
        INSERT INTO projects (name, slug, tagline, description, image_url, status, funding_goal)
        VALUES (
            'Seasonal Greetings',
            'seasonal-greetings',
            'Holiday Pop-Up Shop',
            'A festive holiday experience featuring curated gifts, handmade decorations, seasonal treats, and a magical atmosphere that brings joy to the Dayton community during the holiday season.',
            'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800',
            'funding',
            2000.00
        )
        RETURNING id INTO v_project_id;
    END IF;
    
    -- Insert Merchant Coins Configuration
    INSERT INTO merchant_coins_config (
        project_id,
        coin_name,
        coin_symbol,
        brand_color,
        business_name,
        business_type,
        business_status,
        
        -- Earning & Redemption
        earn_rate,
        redemption_rate,
        max_redemption_pct,
        
        -- Fundraising
        fundraising_goal,
        current_funding,
        fundraising_start_date,
        fundraising_deadline,
        auction_trigger_enabled,
        
        -- Business Documentation
        business_plan_url,
        ein,
        ein_verified,
        
        -- Funding Breakdown
        funding_breakdown,
        equipment_checklist,
        
        -- Payment Info
        savings_account_type,
        paypal_donate_button_id,
        show_donor_names,
        show_transaction_history
    )
    VALUES (
        v_project_id, -- Use the variable instead of placeholder
        'Holiday Tokens',
        '🎄',
        '#c41e3a', -- Christmas red
        'Seasonal Greetings LLC',
        'turnkey_business',
        'fundraising',
        
        1.0, -- $1 = 1 coin
        0.01, -- 100 coins = $1
        50.00, -- Max 50% redemption per visit
        
        2000.00, -- Fundraising goal
        0.00, -- Current funding
        NOW(),
        NOW() + INTERVAL '60 days',
        true,
        
        'https://docs.google.com/document/d/seasonal-greetings-5yr-plan', -- 5-year business plan
        NULL, -- EIN to be registered
        false,
        
        -- Equipment/Materials breakdown
        '{
            "inventory": 800,
            "displayFixtures": 500,
            "pointOfSale": 400,
            "signageDecor": 200,
            "workingCapital": 100
        }'::jsonb,
        
        -- Detailed equipment checklist
        '[
            {"id": "sg-001", "name": "Square POS System", "category": "Point of Sale", "estimatedCost": 300, "quantity": 1, "vendor": "Square", "priority": "essential"},
            {"id": "sg-002", "name": "iPad for POS", "category": "Point of Sale", "estimatedCost": 100, "quantity": 1, "vendor": "Apple", "priority": "essential"},
            {"id": "sg-003", "name": "Display Tables (6ft)", "category": "Display", "estimatedCost": 80, "quantity": 3, "vendor": "Costco", "priority": "essential"},
            {"id": "sg-004", "name": "Wire Display Racks", "category": "Display", "estimatedCost": 40, "quantity": 5, "vendor": "Amazon", "priority": "essential"},
            {"id": "sg-005", "name": "Holiday Decorations Bulk", "category": "Inventory", "estimatedCost": 400, "quantity": 1, "vendor": "Wholesale Supplier", "priority": "essential"},
            {"id": "sg-006", "name": "Gift Items Inventory", "category": "Inventory", "estimatedCost": 400, "quantity": 1, "vendor": "Various", "priority": "essential"},
            {"id": "sg-007", "name": "Illuminated Signage", "category": "Signage", "estimatedCost": 150, "quantity": 1, "vendor": "Local Sign Shop", "priority": "important"},
            {"id": "sg-008", "name": "Gift Bags & Wrapping", "category": "Supplies", "estimatedCost": 50, "quantity": 1, "vendor": "Amazon", "priority": "important"}
        ]'::jsonb,
        
        'paypal',
        'SEASONAL_GREETINGS_BUTTON_ID', -- Replace with actual PayPal button ID
        true,
        true
    );

    -- Create Default Tier Structure
    INSERT INTO merchant_coins_tiers (merchant_config_id, tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color)
    SELECT 
        (SELECT id FROM merchant_coins_config WHERE project_id = v_project_id),
        tier_name,
        tier_level,
        min_coins_earned,
        earn_multiplier,
        badge_icon,
        badge_color
    FROM (VALUES
            ('Bronze', 1, 0, 1.0, '🥉', '#cd7f32'),
            ('Silver', 2, 100, 1.25, '🥈', '#c0c0c0'),
            ('Gold', 3, 500, 1.5, '🥇', '#ffd700'),
            ('Platinum', 4, 1000, 2.0, '💎', '#e5e4e2')
        ) AS tiers(tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color);
    
    RAISE NOTICE 'Created Seasonal Greetings project with ID: %', v_project_id;
END $$;

-- =====================================================
-- PROJECT 2: GEMSTONE TRAILS - Guided Nature Tours
-- =====================================================

INSERT INTO projects (name, slug, tagline, description, image_url, status)
VALUES (
    'Gemstone Trails',
    'gemstone-trails',
    'Guided Nature Tours',
    'Discover hidden natural gems with expert-led hiking experiences through Ohio''s most beautiful trails. Educational, adventurous, and perfect for families and nature enthusiasts.',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    'active'
)
RETURNING id;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, ein, ein_verified,
    funding_breakdown, equipment_checklist,
    savings_account_type, paypal_donate_button_id, show_donor_names, show_transaction_history
)
VALUES (
    'PROJECT_ID_2',
    'Trail Tokens',
    '💎',
    '#2e7d32', -- Nature green
    'Gemstone Trails LLC',
    'turnkey_business',
    'fundraising',
    1.0, 0.01, 50.00,
    1500.00, NOW(), NOW() + INTERVAL '45 days', true,
    'https://docs.google.com/document/d/gemstone-trails-5yr-plan',
    NULL, false,
    '{
        "equipment": 600,
        "insurance": 400,
        "marketing": 300,
        "permits": 150,
        "workingCapital": 50
    }'::jsonb,
    '[
        {"id": "gt-001", "name": "First Aid Kits (Professional)", "category": "Safety", "estimatedCost": 100, "quantity": 3, "vendor": "REI", "priority": "essential"},
        {"id": "gt-002", "name": "Two-Way Radios", "category": "Communication", "estimatedCost": 150, "quantity": 1, "vendor": "Best Buy", "priority": "essential"},
        {"id": "gt-003", "name": "Trail Guides & Maps", "category": "Educational", "estimatedCost": 50, "quantity": 100, "vendor": "Printing Service", "priority": "essential"},
        {"id": "gt-004", "name": "Business Liability Insurance (Annual)", "category": "Insurance", "estimatedCost": 400, "quantity": 1, "vendor": "State Farm", "priority": "essential"},
        {"id": "gt-005", "name": "Hiking Poles (Loaner Set)", "category": "Equipment", "estimatedCost": 200, "quantity": 10, "vendor": "REI", "priority": "important"},
        {"id": "gt-006", "name": "Branded Backpacks", "category": "Merchandise", "estimatedCost": 150, "quantity": 20, "vendor": "Custom Ink", "priority": "important"},
        {"id": "gt-007", "name": "Website & Booking System", "category": "Technology", "estimatedCost": 300, "quantity": 1, "vendor": "Squarespace", "priority": "essential"},
        {"id": "gt-008", "name": "Park Permits & Licenses", "category": "Permits", "estimatedCost": 150, "quantity": 1, "vendor": "Ohio DNR", "priority": "essential"}
    ]'::jsonb,
    'paypal', 'GEMSTONE_TRAILS_BUTTON_ID', true, true
);

-- =====================================================
-- PROJECT 3: PICNIC PERFECT - Luxury Pop-Up Events
-- =====================================================

INSERT INTO projects (name, slug, tagline, description, image_url, status)
VALUES (
    'Picnic Perfect',
    'picnic-perfect',
    'Luxury Pop-Up Events',
    'Premium picnic experiences featuring gourmet food, beautiful setups, and Instagram-worthy moments. Perfect for dates, proposals, birthdays, and special celebrations.',
    'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800',
    'active'
)
RETURNING id;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, ein, ein_verified,
    funding_breakdown, equipment_checklist,
    savings_account_type, paypal_donate_button_id, show_donor_names, show_transaction_history
)
VALUES (
    'PROJECT_ID_3',
    'Picnic Points',
    '🧺',
    '#d81b60', -- Elegant pink
    'Picnic Perfect LLC',
    'turnkey_business',
    'fundraising',
    1.0, 0.01, 25.00, -- Lower redemption (25%) for higher-end service
    2000.00, NOW(), NOW() + INTERVAL '60 days', true,
    'https://docs.google.com/document/d/picnic-perfect-5yr-plan',
    NULL, false,
    '{
        "picnicSets": 800,
        "decor": 500,
        "transport": 400,
        "marketing": 200,
        "workingCapital": 100
    }'::jsonb,
    '[
        {"id": "pp-001", "name": "Premium Picnic Baskets", "category": "Equipment", "estimatedCost": 80, "quantity": 5, "vendor": "Crate & Barrel", "priority": "essential"},
        {"id": "pp-002", "name": "Low Picnic Tables", "category": "Equipment", "estimatedCost": 150, "quantity": 3, "vendor": "Wayfair", "priority": "essential"},
        {"id": "pp-003", "name": "Luxury Blankets & Pillows", "category": "Decor", "estimatedCost": 200, "quantity": 5, "vendor": "HomeGoods", "priority": "essential"},
        {"id": "pp-004", "name": "String Lights & Lanterns", "category": "Decor", "estimatedCost": 150, "quantity": 1, "vendor": "Amazon", "priority": "important"},
        {"id": "pp-005", "name": "Tableware Set (Reusable)", "category": "Equipment", "estimatedCost": 200, "quantity": 1, "vendor": "Williams Sonoma", "priority": "essential"},
        {"id": "pp-006", "name": "Cargo Van Rental (3 months)", "category": "Transport", "estimatedCost": 400, "quantity": 1, "vendor": "Enterprise", "priority": "essential"},
        {"id": "pp-007", "name": "Photography Props", "category": "Decor", "estimatedCost": 150, "quantity": 1, "vendor": "Various", "priority": "important"},
        {"id": "pp-008", "name": "Social Media Marketing", "category": "Marketing", "estimatedCost": 200, "quantity": 1, "vendor": "Facebook/Instagram Ads", "priority": "important"}
    ]'::jsonb,
    'paypal', 'PICNIC_PERFECT_BUTTON_ID', true, true
);

-- =====================================================
-- PROJECT 4: DAYTON MICRO-FARMS - Indoor Microgreens
-- =====================================================

INSERT INTO projects (name, slug, tagline, description, image_url, status)
VALUES (
    'Dayton Micro-Farms',
    'dayton-micro-farms',
    'Superfoods in the City',
    'Indoor vertical microgreens farm delivering fresh, nutrient-dense produce to local restaurants, health-conscious families, and farmers markets. Sustainable urban agriculture at its finest.',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800',
    'active'
)
RETURNING id;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, ein, ein_verified,
    funding_breakdown, equipment_checklist,
    savings_account_type, paypal_donate_button_id, show_donor_names, show_transaction_history
)
VALUES (
    'PROJECT_ID_4',
    'MicroFarm Coins',
    '🌱',
    '#558b2f', -- Fresh green
    'Dayton Micro-Farms LLC',
    'turnkey_business',
    'fundraising',
    1.0, 0.01, 50.00,
    2200.00, NOW(), NOW() + INTERVAL '90 days', true,
    'https://docs.google.com/document/d/dayton-micro-farms-5yr-plan',
    NULL, false,
    '{
        "growSystems": 1000,
        "seeds": 300,
        "lighting": 400,
        "packaging": 200,
        "licenses": 200,
        "workingCapital": 100
    }'::jsonb,
    '[
        {"id": "dm-001", "name": "Vertical Grow Racks (4-tier)", "category": "Growing System", "estimatedCost": 400, "quantity": 2, "vendor": "Bootstrap Farmer", "priority": "essential"},
        {"id": "dm-002", "name": "LED Grow Lights", "category": "Lighting", "estimatedCost": 200, "quantity": 2, "vendor": "Amazon", "priority": "essential"},
        {"id": "dm-003", "name": "Growing Trays (10x20)", "category": "Growing System", "estimatedCost": 100, "quantity": 50, "vendor": "Bootstrap Farmer", "priority": "essential"},
        {"id": "dm-004", "name": "Organic Seed Variety Pack", "category": "Seeds", "estimatedCost": 200, "quantity": 1, "vendor": "Johnny Seeds", "priority": "essential"},
        {"id": "dm-005", "name": "Misting System", "category": "Growing System", "estimatedCost": 100, "quantity": 1, "vendor": "Amazon", "priority": "important"},
        {"id": "dm-006", "name": "Food Handler License", "category": "Licenses", "estimatedCost": 100, "quantity": 1, "vendor": "Montgomery County Health", "priority": "essential"},
        {"id": "dm-007", "name": "Business Permits", "category": "Licenses", "estimatedCost": 100, "quantity": 1, "vendor": "City of Dayton", "priority": "essential"},
        {"id": "dm-008", "name": "Compostable Packaging", "category": "Packaging", "estimatedCost": 200, "quantity": 1, "vendor": "EcoEnclose", "priority": "essential"},
        {"id": "dm-009", "name": "Growing Medium (Soil)", "category": "Seeds", "estimatedCost": 100, "quantity": 1, "vendor": "Gardeners Supply", "priority": "essential"}
    ]'::jsonb,
    'paypal', 'DAYTON_MICROFARMS_BUTTON_ID', true, true
);

-- =====================================================
-- NOTES FOR DEPLOYMENT
-- =====================================================
-- After running this script:
-- 1. Replace all PROJECT_ID_X placeholders with actual UUIDs from RETURNING clauses
-- 2. Update PayPal donate button IDs with real ones from PayPal account
-- 3. Create actual 5-year business plan documents and update URLs
-- 4. Register LLCs and obtain EINs, then update ein field and set ein_verified = true
-- 5. Adjust funding deadlines based on actual launch timeline

-- =====================================================
-- INITIAL 4 TURNKEY BUSINESS PROJECTS - SIMPLIFIED
-- Compatible with merchant_coins_config schema
-- =====================================================

-- This script uses the merchant_coins_config table which references projects via project_id
-- Make sure you've run supabase-merchant-coins-schema.sql first!

DO $$
DECLARE
    v_project_seasonal UUID;
    v_project_gemstone UUID;
    v_project_picnic UUID;
    v_project_microfarms UUID;
    v_business_seasonal UUID;
    v_business_gemstone UUID;
    v_business_picnic UUID;
    v_business_microfarms UUID;
    v_customer_seasonal UUID;
    v_customer_gemstone UUID;
    v_customer_picnic UUID;
    v_customer_microfarms UUID;
BEGIN

-- ============================================================================
-- PROJECT 1: SEASONAL GREETINGS
-- ============================================================================

-- Create business entity first
INSERT INTO businesses (name, created_at)
VALUES ('Seasonal Greetings LLC', NOW())
RETURNING id INTO v_business_seasonal;

-- Create customer entity (using auth.users or customers table)
-- Assuming there's a default customer or we create one
INSERT INTO customers (business_id, first_name, last_name, email, phone, address, created_at)
VALUES (v_business_seasonal, 'CDI', 'Platform', 'projects@cdiplatform.com', '937-555-0100', '123 Main St, Dayton, OH 45402', NOW())
RETURNING id INTO v_customer_seasonal;

-- Create project linked to business and customer
INSERT INTO projects (business_id, customer_id, name, slug, tagline, description, image_url, status, funding_goal)
VALUES (
    v_business_seasonal,
    v_customer_seasonal,
    'Seasonal Greetings',
    'seasonal-greetings',
    'Holiday Pop-Up Shop',
    'A festive holiday experience featuring curated gifts, handmade decorations, seasonal treats, and a magical atmosphere that brings joy to the Dayton community during the holiday season.',
    'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800',
    'funding',
    2000.00
)
RETURNING id INTO v_project_seasonal;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, current_funding, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, funding_breakdown, equipment_checklist,
    savings_account_type, show_donor_names, show_transaction_history
) VALUES (
    v_project_seasonal, 'Holiday Tokens', '🎄', '#c41e3a', 'Seasonal Greetings LLC', 'turnkey_business', 'fundraising',
    1.0, 0.01, 50.00,
    2000.00, 0.00, NOW(), NOW() + INTERVAL '60 days', true,
    'https://docs.google.com/document/d/seasonal-greetings-5yr-plan',
    '{"inventory": 800, "displayFixtures": 500, "pointOfSale": 400, "signageDecor": 200, "workingCapital": 100}'::jsonb,
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
    'paypal', true, true
);

INSERT INTO merchant_coins_tiers (merchant_config_id, tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color)
SELECT (SELECT id FROM merchant_coins_config WHERE project_id = v_project_seasonal), tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color
FROM (VALUES
    ('Bronze', 1, 0, 1.0, '🥉', '#cd7f32'),
    ('Silver', 2, 100, 1.25, '🥈', '#c0c0c0'),
    ('Gold', 3, 500, 1.5, '🥇', '#ffd700'),
    ('Platinum', 4, 1000, 2.0, '💎', '#e5e4e2')
) AS tiers(tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color);

RAISE NOTICE '✅ Created Seasonal Greetings (ID: %)', v_project_seasonal;

-- ============================================================================
-- PROJECT 2: GEMSTONE TRAILS
-- ============================================================================

INSERT INTO businesses (name, created_at)
VALUES ('Gemstone Trails LLC', NOW())
RETURNING id INTO v_business_gemstone;

INSERT INTO customers (business_id, first_name, last_name, email, phone, address, created_at)
VALUES (v_business_gemstone, 'CDI', 'Platform', 'projects@cdiplatform.com', '937-555-0100', '123 Main St, Dayton, OH 45402', NOW())
RETURNING id INTO v_customer_gemstone;

INSERT INTO projects (business_id, customer_id, name, slug, tagline, description, image_url, status, funding_goal)
VALUES (
    v_business_gemstone,
    v_customer_gemstone,
    'Gemstone Trails',
    'gemstone-trails',
    'Guided Nature Tours',
    'Discover hidden natural gems with expert-led hiking experiences through Ohio''s most beautiful trails. Educational, adventurous, and perfect for families and nature enthusiasts.',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    'funding',
    1500.00
)
RETURNING id INTO v_project_gemstone;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, current_funding, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, funding_breakdown, equipment_checklist,
    savings_account_type, show_donor_names, show_transaction_history
) VALUES (
    v_project_gemstone, 'Trail Tokens', '💎', '#2e7d32', 'Gemstone Trails LLC', 'turnkey_business', 'fundraising',
    1.0, 0.01, 50.00,
    1500.00, 0.00, NOW(), NOW() + INTERVAL '45 days', true,
    'https://docs.google.com/document/d/gemstone-trails-5yr-plan',
    '{"equipment": 600, "insurance": 400, "marketing": 300, "permits": 150, "workingCapital": 50}'::jsonb,
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
    'paypal', true, true
);

INSERT INTO merchant_coins_tiers (merchant_config_id, tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color)
SELECT (SELECT id FROM merchant_coins_config WHERE project_id = v_project_gemstone), tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color
FROM (VALUES
    ('Bronze', 1, 0, 1.0, '🥉', '#cd7f32'),
    ('Silver', 2, 100, 1.25, '🥈', '#c0c0c0'),
    ('Gold', 3, 500, 1.5, '🥇', '#ffd700'),
    ('Platinum', 4, 1000, 2.0, '💎', '#e5e4e2')
) AS tiers(tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color);

RAISE NOTICE '✅ Created Gemstone Trails (ID: %)', v_project_gemstone;

-- ============================================================================
-- PROJECT 3: PICNIC PERFECT
-- ============================================================================

INSERT INTO businesses (name, created_at)
VALUES ('Picnic Perfect LLC', NOW())
RETURNING id INTO v_business_picnic;

INSERT INTO customers (business_id, first_name, last_name, email, phone, address, created_at)
VALUES (v_business_picnic, 'CDI', 'Platform', 'projects@cdiplatform.com', '937-555-0100', '123 Main St, Dayton, OH 45402', NOW())
RETURNING id INTO v_customer_picnic;

INSERT INTO projects (business_id, customer_id, name, slug, tagline, description, image_url, status, funding_goal)
VALUES (
    v_business_picnic,
    v_customer_picnic,
    'Picnic Perfect',
    'picnic-perfect',
    'Luxury Pop-Up Events',
    'Premium picnic experiences featuring gourmet food, beautiful setups, and Instagram-worthy moments. Perfect for dates, proposals, birthdays, and special celebrations.',
    'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800',
    'funding',
    2000.00
)
RETURNING id INTO v_project_picnic;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, current_funding, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, funding_breakdown, equipment_checklist,
    savings_account_type, show_donor_names, show_transaction_history
) VALUES (
    v_project_picnic, 'Picnic Points', '🧺', '#d81b60', 'Picnic Perfect LLC', 'turnkey_business', 'fundraising',
    1.0, 0.01, 25.00, -- 25% redemption for premium service
    2000.00, 0.00, NOW(), NOW() + INTERVAL '60 days', true,
    'https://docs.google.com/document/d/picnic-perfect-5yr-plan',
    '{"picnicSets": 800, "decor": 500, "transport": 400, "marketing": 200, "workingCapital": 100}'::jsonb,
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
    'paypal', true, true
);

INSERT INTO merchant_coins_tiers (merchant_config_id, tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color)
SELECT (SELECT id FROM merchant_coins_config WHERE project_id = v_project_picnic), tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color
FROM (VALUES
    ('Bronze', 1, 0, 1.0, '🥉', '#cd7f32'),
    ('Silver', 2, 100, 1.25, '🥈', '#c0c0c0'),
    ('Gold', 3, 500, 1.5, '🥇', '#ffd700'),
    ('Platinum', 4, 1000, 2.0, '💎', '#e5e4e2')
) AS tiers(tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color);

RAISE NOTICE '✅ Created Picnic Perfect (ID: %)', v_project_picnic;

-- ============================================================================
-- PROJECT 4: DAYTON MICRO-FARMS
-- ============================================================================

INSERT INTO businesses (name, created_at)
VALUES ('Dayton Micro-Farms LLC', NOW())
RETURNING id INTO v_business_microfarms;

INSERT INTO customers (business_id, first_name, last_name, email, phone, address, created_at)
VALUES (v_business_microfarms, 'CDI', 'Platform', 'projects@cdiplatform.com', '937-555-0100', '123 Main St, Dayton, OH 45402', NOW())
RETURNING id INTO v_customer_microfarms;

INSERT INTO projects (business_id, customer_id, name, slug, tagline, description, image_url, status, funding_goal)
VALUES (
    v_business_microfarms,
    v_customer_microfarms,
    'Dayton Micro-Farms',
    'dayton-micro-farms',
    'Superfoods in the City',
    'Indoor vertical microgreens farm delivering fresh, nutrient-dense produce to local restaurants, health-conscious families, and farmers markets. Sustainable urban agriculture at its finest.',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800',
    'funding',
    2200.00
)
RETURNING id INTO v_project_microfarms;

INSERT INTO merchant_coins_config (
    project_id, coin_name, coin_symbol, brand_color, business_name, business_type, business_status,
    earn_rate, redemption_rate, max_redemption_pct,
    fundraising_goal, current_funding, fundraising_start_date, fundraising_deadline, auction_trigger_enabled,
    business_plan_url, funding_breakdown, equipment_checklist,
    savings_account_type, show_donor_names, show_transaction_history
) VALUES (
    v_project_microfarms, 'MicroFarm Coins', '🌱', '#558b2f', 'Dayton Micro-Farms LLC', 'turnkey_business', 'fundraising',
    1.0, 0.01, 50.00,
    2200.00, 0.00, NOW(), NOW() + INTERVAL '90 days', true,
    'https://docs.google.com/document/d/dayton-micro-farms-5yr-plan',
    '{"growSystems": 1000, "seeds": 300, "lighting": 400, "packaging": 200, "licenses": 200, "workingCapital": 100}'::jsonb,
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
    'paypal', true, true
);

INSERT INTO merchant_coins_tiers (merchant_config_id, tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color)
SELECT (SELECT id FROM merchant_coins_config WHERE project_id = v_project_microfarms), tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color
FROM (VALUES
    ('Bronze', 1, 0, 1.0, '🥉', '#cd7f32'),
    ('Silver', 2, 100, 1.25, '🥈', '#c0c0c0'),
    ('Gold', 3, 500, 1.5, '🥇', '#ffd700'),
    ('Platinum', 4, 1000, 2.0, '💎', '#e5e4e2')
) AS tiers(tier_name, tier_level, min_coins_earned, earn_multiplier, badge_icon, badge_color);

RAISE NOTICE '✅ Created Dayton Micro-Farms (ID: %)', v_project_microfarms;

-- Summary
RAISE NOTICE '=====================================';
RAISE NOTICE '✅ ALL 4 PROJECTS CREATED SUCCESSFULLY';
RAISE NOTICE '=====================================';
RAISE NOTICE '🎄 Seasonal Greetings: $2,000 goal';
RAISE NOTICE '💎 Gemstone Trails: $1,500 goal';
RAISE NOTICE '🧺 Picnic Perfect: $2,000 goal';
RAISE NOTICE '🌱 Dayton Micro-Farms: $2,200 goal';
RAISE NOTICE '=====================================';
RAISE NOTICE 'Total Fundraising Target: $7,700';

END $$;

-- ====================================================================
-- INTELLIGENT MARKETPLACE CATEGORY SYSTEM
-- ====================================================================
-- Auto-categorization for unified store experience
-- ====================================================================

-- Main product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    description TEXT,
    icon TEXT, -- Material icon name
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product listings with auto-categorization
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL, -- User who listed it
    category_id UUID REFERENCES product_categories(id),
    
    -- Product details
    title TEXT NOT NULL,
    description TEXT,
    condition TEXT, -- 'new', 'like-new', 'good', 'fair', 'salvage'
    
    -- Pricing
    price DECIMAL(10,2),
    auction_enabled BOOLEAN DEFAULT false,
    auction_start_price DECIMAL(10,2),
    auction_end_date TIMESTAMPTZ,
    
    -- Inventory
    quantity INT DEFAULT 1,
    sku TEXT,
    
    -- Media
    images TEXT[], -- Array of image URLs
    primary_image TEXT,
    
    -- Auto-categorization metadata
    ai_suggested_category UUID REFERENCES product_categories(id),
    ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_tags TEXT[], -- Auto-generated tags
    manual_tags TEXT[], -- User-added tags
    
    -- Dimensions (for shipping)
    weight_oz DECIMAL(10,2),
    length_in DECIMAL(10,2),
    width_in DECIMAL(10,2),
    height_in DECIMAL(10,2),
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'active', 'sold', 'removed'
    featured BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sold_at TIMESTAMPTZ
);

-- ====================================================================
-- SEED CATEGORY DATA
-- ====================================================================

-- Root categories
INSERT INTO product_categories (name, slug, description, icon, sort_order) VALUES
-- Apparel
('Women''s Clothing', 'womens-clothing', 'Clothing and accessories for women', 'woman', 10),
('Men''s Clothing', 'mens-clothing', 'Clothing and accessories for men', 'man', 20),
('Children''s Clothing', 'childrens-clothing', 'Clothing for kids and babies', 'child_care', 30),

-- Home & Living
('Furniture', 'furniture', 'Tables, chairs, sofas, beds, and more', 'chair', 40),
('Home Decor', 'home-decor', 'Wall art, vases, decorative items', 'home', 50),
('Kitchen & Dining', 'kitchen-dining', 'Cookware, dishware, utensils', 'restaurant', 60),
('Lighting', 'lighting', 'Lamps, chandeliers, fixtures', 'lightbulb', 70),

-- Building Materials
('Building Materials', 'building-materials', 'Lumber, drywall, roofing, etc.', 'construction', 80),
('Hardware', 'hardware', 'Nails, screws, hinges, handles', 'handyman', 90),
('Plumbing', 'plumbing', 'Pipes, fittings, fixtures', 'plumbing', 100),
('Electrical', 'electrical', 'Wiring, outlets, switches', 'electrical_services', 110),
('Flooring', 'flooring', 'Hardwood, tile, carpet, vinyl', 'layers', 120),

-- Outdoor
('Garden & Outdoor', 'garden-outdoor', 'Plants, tools, outdoor furniture', 'yard', 130),
('Tools & Equipment', 'tools-equipment', 'Power tools, hand tools, equipment', 'build', 140),

-- Electronics & Appliances
('Appliances', 'appliances', 'Major and small appliances', 'kitchen', 150),
('Electronics', 'electronics', 'TVs, audio, computers', 'devices', 160),

-- Specialty
('Antiques & Collectibles', 'antiques-collectibles', 'Vintage and collectible items', 'history', 170),
('Art & Crafts', 'art-crafts', 'Original art, craft supplies', 'palette', 180),
('Salvage & Reclaimed', 'salvage-reclaimed', 'Architectural salvage, reclaimed materials', 'recycling', 190),

-- Services (for future)
('Services', 'services', 'Professional services marketplace', 'work', 200)
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- SUBCATEGORIES (Examples)
-- ====================================================================

-- Women's Clothing subcategories
INSERT INTO product_categories (name, slug, parent_id, icon, sort_order)
SELECT 'Dresses', 'dresses', id, 'checkroom', 1 FROM product_categories WHERE slug = 'womens-clothing'
UNION ALL
SELECT 'Tops & Blouses', 'tops-blouses', id, 'checkroom', 2 FROM product_categories WHERE slug = 'womens-clothing'
UNION ALL
SELECT 'Pants & Jeans', 'pants-jeans-womens', id, 'checkroom', 3 FROM product_categories WHERE slug = 'womens-clothing'
UNION ALL
SELECT 'Shoes', 'shoes-womens', id, 'checkroom', 4 FROM product_categories WHERE slug = 'womens-clothing'
ON CONFLICT (slug) DO NOTHING;

-- Furniture subcategories
INSERT INTO product_categories (name, slug, parent_id, icon, sort_order)
SELECT 'Sofas & Couches', 'sofas-couches', id, 'weekend', 1 FROM product_categories WHERE slug = 'furniture'
UNION ALL
SELECT 'Tables', 'tables', id, 'table_restaurant', 2 FROM product_categories WHERE slug = 'furniture'
UNION ALL
SELECT 'Chairs', 'chairs', id, 'chair', 3 FROM product_categories WHERE slug = 'furniture'
UNION ALL
SELECT 'Beds & Mattresses', 'beds-mattresses', id, 'bed', 4 FROM product_categories WHERE slug = 'furniture'
UNION ALL
SELECT 'Storage & Organization', 'storage-organization', id, 'shelves', 5 FROM product_categories WHERE slug = 'furniture'
ON CONFLICT (slug) DO NOTHING;

-- Building Materials subcategories
INSERT INTO product_categories (name, slug, parent_id, icon, sort_order)
SELECT 'Lumber & Wood', 'lumber-wood', id, 'carpenter', 1 FROM product_categories WHERE slug = 'building-materials'
UNION ALL
SELECT 'Drywall & Insulation', 'drywall-insulation', id, 'construction', 2 FROM product_categories WHERE slug = 'building-materials'
UNION ALL
SELECT 'Roofing', 'roofing', id, 'roofing', 3 FROM product_categories WHERE slug = 'building-materials'
UNION ALL
SELECT 'Windows & Doors', 'windows-doors', id, 'door_front', 4 FROM product_categories WHERE slug = 'building-materials'
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON marketplace_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_products_created ON marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON marketplace_products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON marketplace_products(featured) WHERE featured = true;

-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_products_search ON marketplace_products 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ====================================================================
-- AI AUTO-CATEGORIZATION FUNCTION (Placeholder)
-- ====================================================================

CREATE OR REPLACE FUNCTION suggest_product_category(
    product_title TEXT,
    product_description TEXT
) RETURNS UUID AS $$
DECLARE
    suggested_category_id UUID;
BEGIN
    -- This is a placeholder for AI categorization
    -- In production, this would call your AI service (Gemini API)
    -- For now, return a default category based on keywords
    
    -- Simple keyword matching (replace with actual AI later)
    IF product_title ILIKE '%dress%' OR product_title ILIKE '%skirt%' THEN
        SELECT id INTO suggested_category_id FROM product_categories WHERE slug = 'womens-clothing';
    ELSIF product_title ILIKE '%sofa%' OR product_title ILIKE '%couch%' THEN
        SELECT id INTO suggested_category_id FROM product_categories WHERE slug = 'sofas-couches';
    ELSIF product_title ILIKE '%lumber%' OR product_title ILIKE '%wood%' THEN
        SELECT id INTO suggested_category_id FROM product_categories WHERE slug = 'lumber-wood';
    ELSE
        -- Default to general category
        SELECT id INTO suggested_category_id FROM product_categories WHERE slug = 'antiques-collectibles';
    END IF;
    
    RETURN suggested_category_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- TRIGGER FOR AUTO-CATEGORIZATION
-- ====================================================================

CREATE OR REPLACE FUNCTION auto_categorize_product()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category_id IS NULL THEN
        NEW.ai_suggested_category := suggest_product_category(NEW.title, NEW.description);
        NEW.category_id := NEW.ai_suggested_category;
        NEW.ai_confidence_score := 0.75; -- Placeholder confidence
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_categorize
    BEFORE INSERT ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION auto_categorize_product();

-- Disable RLS (nonprofit security approach)
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

SELECT 
    '✅ Marketplace Categories Created' as status,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
    COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM product_categories;

SELECT 
    '✅ Sample Category Tree' as info,
    name,
    slug,
    CASE WHEN parent_id IS NULL THEN 'ROOT' ELSE 'SUBCATEGORY' END as type
FROM product_categories
ORDER BY sort_order, parent_id NULLS FIRST
LIMIT 20;

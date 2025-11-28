-- Create estimate_materials table to store product selections
CREATE TABLE IF NOT EXISTS estimate_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    line_item_index INTEGER NOT NULL,
    category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    sku TEXT NOT NULL,
    retailer TEXT NOT NULL CHECK (retailer IN ('home_depot', 'lowes', 'menards')),
    price_per_unit DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('budget', 'mid', 'high')),
    product_url TEXT,
    image_url TEXT,
    specifications JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(estimate_id, line_item_index, category)
);

-- Create index for faster queries
CREATE INDEX idx_estimate_materials_estimate_id ON estimate_materials(estimate_id);
CREATE INDEX idx_estimate_materials_line_item ON estimate_materials(estimate_id, line_item_index);
CREATE INDEX idx_estimate_materials_category ON estimate_materials(category, grade);
CREATE INDEX idx_estimate_materials_usage ON estimate_materials(category, grade, usage_count DESC);

-- RLS Policies
ALTER TABLE estimate_materials ENABLE ROW LEVEL SECURITY;

-- Business owners can view their estimate materials
CREATE POLICY "Business owners can view estimate materials"
    ON estimate_materials
    FOR SELECT
    USING (
        estimate_id IN (
            SELECT id FROM estimates WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
            )
        )
    );

-- Business owners can insert estimate materials
CREATE POLICY "Business owners can insert estimate materials"
    ON estimate_materials
    FOR INSERT
    WITH CHECK (
        estimate_id IN (
            SELECT id FROM estimates WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
            )
        )
    );

-- Business owners can update estimate materials
CREATE POLICY "Business owners can update estimate materials"
    ON estimate_materials
    FOR UPDATE
    USING (
        estimate_id IN (
            SELECT id FROM estimates WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
            )
        )
    );

-- Business owners can delete estimate materials
CREATE POLICY "Business owners can delete estimate materials"
    ON estimate_materials
    FOR DELETE
    USING (
        estimate_id IN (
            SELECT id FROM estimates WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
            )
        )
    );

-- Create product_suggestions_cache table for caching API results
CREATE TABLE IF NOT EXISTS product_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query TEXT NOT NULL,
    category TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('budget', 'mid', 'high')),
    retailer TEXT NOT NULL CHECK (retailer IN ('home_depot', 'lowes', 'menards')),
    product_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for cache lookups
CREATE INDEX idx_product_cache_lookup ON product_suggestions_cache(search_query, category, grade, retailer);
CREATE INDEX idx_product_cache_expiry ON product_suggestions_cache(expires_at);

-- Auto-delete expired cache entries
CREATE OR REPLACE FUNCTION delete_expired_product_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM product_suggestions_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Update usage count when product is reused
CREATE OR REPLACE FUNCTION increment_product_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting a product that matches an existing one (same category, brand, sku)
    -- increment the usage count of the most popular matching product
    UPDATE estimate_materials
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE category = NEW.category
        AND brand = NEW.brand
        AND sku = NEW.sku
        AND grade = NEW.grade
        AND id != NEW.id
    ORDER BY usage_count DESC
    LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_product_usage
    AFTER INSERT ON estimate_materials
    FOR EACH ROW
    EXECUTE FUNCTION increment_product_usage();

-- View for popular products by category
CREATE OR REPLACE VIEW popular_products_by_category AS
SELECT 
    category,
    grade,
    retailer,
    product_name,
    brand,
    sku,
    AVG(price_per_unit) as avg_price,
    SUM(usage_count) as total_usage,
    COUNT(DISTINCT estimate_id) as used_in_estimates,
    MAX(image_url) as image_url,
    MAX(product_url) as product_url
FROM estimate_materials
GROUP BY category, grade, retailer, product_name, brand, sku
ORDER BY category, grade, total_usage DESC;

-- Function to get product recommendations based on project type
CREATE OR REPLACE FUNCTION get_product_recommendations(
    p_category TEXT,
    p_grade TEXT,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    product_name TEXT,
    brand TEXT,
    sku TEXT,
    retailer TEXT,
    avg_price DECIMAL,
    total_usage BIGINT,
    image_url TEXT,
    product_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ppc.product_name,
        ppc.brand,
        ppc.sku,
        ppc.retailer,
        ppc.avg_price,
        ppc.total_usage,
        ppc.image_url,
        ppc.product_url
    FROM popular_products_by_category ppc
    WHERE ppc.category = p_category
        AND ppc.grade = p_grade
    ORDER BY ppc.total_usage DESC, ppc.avg_price ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add materials_cost and labor_cost columns to estimates if not exists
DO $$ 
BEGIN
    -- Note: estimates table stores items as JSONB array
    -- Each item in the array can have: description, quantity, unit, labor_cost, materials_cost, total
    -- No schema changes needed - we'll update the JSONB structure in the application
END $$;

-- Create materials summary view per estimate
CREATE OR REPLACE VIEW estimate_materials_summary AS
SELECT 
    estimate_id,
    COUNT(*) as total_items,
    SUM(total_cost) as total_materials_cost,
    COUNT(DISTINCT category) as unique_categories,
    jsonb_agg(
        jsonb_build_object(
            'category', category,
            'product_name', product_name,
            'brand', brand,
            'retailer', retailer,
            'quantity', quantity,
            'unit', unit,
            'total_cost', total_cost,
            'grade', grade
        ) ORDER BY category
    ) as materials_breakdown
FROM estimate_materials
GROUP BY estimate_id;

-- Grant permissions
GRANT SELECT ON popular_products_by_category TO authenticated;
GRANT SELECT ON estimate_materials_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_recommendations TO authenticated;

COMMENT ON TABLE estimate_materials IS 'Stores product selections for estimate line items from major retailers';
COMMENT ON TABLE product_suggestions_cache IS 'Caches product API results to reduce external API calls';
COMMENT ON VIEW popular_products_by_category IS 'Shows most frequently used products by contractors';
COMMENT ON VIEW estimate_materials_summary IS 'Summary of all materials selected for each estimate';

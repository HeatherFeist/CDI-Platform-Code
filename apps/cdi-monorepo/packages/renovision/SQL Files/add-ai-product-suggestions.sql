-- =====================================================
-- AI PRODUCT SUGGESTIONS - DATABASE SETUP
-- =====================================================
-- This creates tables to track AI-suggested products and cache results
-- =====================================================

-- Create product_suggestions table
CREATE TABLE IF NOT EXISTS product_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    line_item_index INTEGER NOT NULL,
    line_item_description TEXT NOT NULL,
    
    -- AI Request Details
    search_query TEXT NOT NULL,
    requested_category TEXT, -- e.g., 'paint', 'flooring', 'plumbing'
    contractor_grade_only BOOLEAN DEFAULT true,
    
    -- Product Details (from AI)
    product_name TEXT NOT NULL,
    product_brand TEXT,
    product_model TEXT,
    product_url TEXT NOT NULL,
    product_price DECIMAL(10, 2),
    product_image_url TEXT,
    product_description TEXT,
    product_specs JSONB DEFAULT '{}'::jsonb,
    
    -- Ranking & Popularity
    popularity_rank INTEGER, -- 1 = most popular
    rating DECIMAL(3, 2), -- e.g., 4.5
    review_count INTEGER,
    contractor_preferred BOOLEAN DEFAULT false,
    
    -- Metadata
    suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    alternative_requested BOOLEAN DEFAULT false,
    
    -- AI Context
    ai_reasoning TEXT, -- Why this product was suggested
    alternative_products JSONB DEFAULT '[]'::jsonb, -- Other options if user wants alternatives
    
    CONSTRAINT fk_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- Create product_search_cache table (to avoid repeated API calls)
CREATE TABLE IF NOT EXISTS product_search_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query TEXT NOT NULL,
    category TEXT,
    contractor_grade BOOLEAN DEFAULT true,
    
    -- Cached Results
    products JSONB NOT NULL, -- Array of product objects
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Stats
    times_used INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_search_query UNIQUE (search_query, category, contractor_grade)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_suggestions_estimate ON product_suggestions(estimate_id);
CREATE INDEX IF NOT EXISTS idx_product_suggestions_line_item ON product_suggestions(estimate_id, line_item_index);
CREATE INDEX IF NOT EXISTS idx_product_suggestions_accepted ON product_suggestions(accepted);
CREATE INDEX IF NOT EXISTS idx_product_search_cache_query ON product_search_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_product_search_cache_expires ON product_search_cache(expires_at);

-- Create RLS policies
ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_search_cache ENABLE ROW LEVEL SECURITY;

-- Users can manage suggestions for their own estimates
DROP POLICY IF EXISTS "Users can manage their product suggestions" ON product_suggestions;
CREATE POLICY "Users can manage their product suggestions"
ON product_suggestions
FOR ALL
TO authenticated
USING (
    estimate_id IN (
        SELECT e.id FROM estimates e
        INNER JOIN profiles p ON p.business_id = e.business_id
        WHERE p.id = auth.uid()
    )
);

-- Cache is available to all authenticated users (shared resource)
DROP POLICY IF EXISTS "Authenticated users can read cache" ON product_search_cache;
CREATE POLICY "Authenticated users can read cache"
ON product_search_cache
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert cache" ON product_search_cache;
CREATE POLICY "Authenticated users can insert cache"
ON product_search_cache
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_product_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM product_search_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to get cached products or mark as needing refresh
CREATE OR REPLACE FUNCTION get_cached_products(
    p_search_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_contractor_grade BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cached_products JSONB;
    is_expired BOOLEAN;
BEGIN
    -- Try to get from cache
    SELECT 
        products,
        (expires_at < NOW()) INTO cached_products, is_expired
    FROM product_search_cache
    WHERE search_query = p_search_query
        AND (p_category IS NULL OR category = p_category)
        AND contractor_grade = p_contractor_grade
    ORDER BY fetched_at DESC
    LIMIT 1;
    
    -- If found and not expired, update usage stats and return
    IF cached_products IS NOT NULL AND NOT is_expired THEN
        UPDATE product_search_cache
        SET 
            times_used = times_used + 1,
            last_used_at = NOW()
        WHERE search_query = p_search_query
            AND (p_category IS NULL OR category = p_category)
            AND contractor_grade = p_contractor_grade;
        
        RETURN cached_products;
    END IF;
    
    -- Not found or expired
    RETURN NULL;
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_suggestion_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.accepted_at = CASE WHEN NEW.accepted = true THEN NOW() ELSE NEW.accepted_at END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_product_suggestions_timestamp ON product_suggestions;
CREATE TRIGGER update_product_suggestions_timestamp
    BEFORE UPDATE ON product_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_suggestion_updated_at();

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'AI Product Suggestions Database Setup Complete!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ product_suggestions - Tracks AI product recommendations';
    RAISE NOTICE '  ✓ product_search_cache - Caches product searches (7-day expiry)';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  ✓ cleanup_expired_product_cache() - Removes old cache entries';
    RAISE NOTICE '  ✓ get_cached_products() - Retrieves cached results';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  • Top 3 contractor-grade products per line item';
    RAISE NOTICE '  • Product links to Home Depot, Lowes, etc.';
    RAISE NOTICE '  • Accept/Reject with alternative suggestions';
    RAISE NOTICE '  • Custom search prompts for specific products';
    RAISE NOTICE '  • Smart caching to reduce API calls';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Create ProductSuggestionService and UI component';
    RAISE NOTICE '========================================================';
END $$;

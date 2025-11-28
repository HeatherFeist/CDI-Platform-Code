-- Custom Storefront System Schema
-- Enables sellers to create branded stores at custom domains

-- =====================================================
-- CUSTOM STORES TABLE
-- =====================================================
CREATE TABLE custom_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Domain Configuration
  domain VARCHAR(255) UNIQUE, -- e.g., HeatherFeist.shop
  subdomain VARCHAR(100) UNIQUE, -- e.g., heatherfeist (serves at heatherfeist.platform.com)
  domain_verified BOOLEAN DEFAULT false,
  domain_verification_token VARCHAR(100),
  ssl_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'failed'
  
  -- Store Identity
  store_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  banner_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#9333ea',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  accent_color VARCHAR(7) DEFAULT '#10b981',
  font_family VARCHAR(100) DEFAULT 'Inter',
  
  -- Layout Settings
  layout_style VARCHAR(20) DEFAULT 'modern', -- 'modern', 'classic', 'minimal', 'bold'
  show_search BOOLEAN DEFAULT true,
  show_categories BOOLEAN DEFAULT true,
  show_featured_products BOOLEAN DEFAULT true,
  products_per_page INTEGER DEFAULT 12,
  
  -- Contact & Social
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  business_address TEXT,
  social_links JSONB DEFAULT '{}', -- {facebook, instagram, twitter, tiktok, youtube}
  
  -- Store Policies
  shipping_policy TEXT,
  return_policy TEXT,
  privacy_policy TEXT,
  terms_of_service TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  google_analytics_id VARCHAR(50),
  facebook_pixel_id VARCHAR(50),
  
  -- Features
  enable_blog BOOLEAN DEFAULT false,
  enable_reviews BOOLEAN DEFAULT true,
  enable_wishlist BOOLEAN DEFAULT true,
  enable_newsletter BOOLEAN DEFAULT false,
  
  -- Integration
  show_marketplace_link BOOLEAN DEFAULT true, -- Link back to main marketplace
  allow_marketplace_sync BOOLEAN DEFAULT true, -- Sync inventory to marketplace
  
  -- Subscription & Billing
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'paused'
  stripe_subscription_id VARCHAR(100),
  billing_cycle_start TIMESTAMPTZ,
  billing_cycle_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false, -- Unpublish while building
  maintenance_mode BOOLEAN DEFAULT false,
  
  -- Stats (cached)
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'enterprise')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'paused')),
  CONSTRAINT domain_or_subdomain CHECK (domain IS NOT NULL OR subdomain IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_custom_stores_seller ON custom_stores(seller_id);
CREATE INDEX idx_custom_stores_domain ON custom_stores(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_custom_stores_subdomain ON custom_stores(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_custom_stores_tier ON custom_stores(tier);
CREATE INDEX idx_custom_stores_status ON custom_stores(subscription_status);

-- =====================================================
-- STORE PAGES TABLE (Custom pages like About, Contact)
-- =====================================================
CREATE TABLE store_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  slug VARCHAR(100) NOT NULL, -- URL-friendly name
  title VARCHAR(255) NOT NULL,
  content TEXT, -- HTML or Markdown
  excerpt TEXT, -- Short summary
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Display
  is_published BOOLEAN DEFAULT true,
  show_in_navigation BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  template VARCHAR(50) DEFAULT 'default', -- 'default', 'full-width', 'sidebar', 'contact'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, slug)
);

CREATE INDEX idx_store_pages_store ON store_pages(store_id);
CREATE INDEX idx_store_pages_published ON store_pages(is_published);

-- =====================================================
-- STORE COLLECTIONS (Product groupings)
-- =====================================================
CREATE TABLE store_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Display
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, slug)
);

CREATE INDEX idx_store_collections_store ON store_collections(store_id);
CREATE INDEX idx_store_collections_featured ON store_collections(is_featured);

-- =====================================================
-- COLLECTION LISTINGS (Many-to-many)
-- =====================================================
CREATE TABLE collection_listings (
  collection_id UUID REFERENCES store_collections(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (collection_id, listing_id)
);

CREATE INDEX idx_collection_listings_collection ON collection_listings(collection_id);
CREATE INDEX idx_collection_listings_listing ON collection_listings(listing_id);

-- =====================================================
-- STORE ANALYTICS (Daily aggregated stats)
-- =====================================================
CREATE TABLE store_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Traffic
  visits INTEGER DEFAULT 0, -- Page loads
  unique_visitors INTEGER DEFAULT 0, -- Unique IPs
  page_views INTEGER DEFAULT 0, -- Total page views
  bounce_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  avg_session_duration INTEGER DEFAULT 0, -- Seconds
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  
  -- Traffic Sources (JSON array)
  traffic_sources JSONB DEFAULT '[]', -- [{source: 'google', visits: 100}, ...]
  referrers JSONB DEFAULT '[]', -- [{url: 'facebook.com', visits: 50}, ...]
  
  -- Top Products (JSON array)
  top_products JSONB DEFAULT '[]', -- [{listing_id, title, views, sales}, ...]
  
  -- Geography
  top_countries JSONB DEFAULT '[]', -- [{country: 'US', visits: 200}, ...]
  top_cities JSONB DEFAULT '[]', -- [{city: 'New York', visits: 50}, ...]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, date)
);

CREATE INDEX idx_store_analytics_store ON store_analytics(store_id);
CREATE INDEX idx_store_analytics_date ON store_analytics(date DESC);

-- =====================================================
-- STORE BLOG POSTS (Optional - PRO/Enterprise only)
-- =====================================================
CREATE TABLE store_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  slug VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Markdown or HTML
  featured_image_url TEXT,
  
  -- Author (always the store owner for now)
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Categories/Tags
  categories TEXT[], -- Array of category names
  tags TEXT[], -- Array of tag names
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, slug)
);

CREATE INDEX idx_store_blog_posts_store ON store_blog_posts(store_id);
CREATE INDEX idx_store_blog_posts_published ON store_blog_posts(is_published, published_at DESC);
CREATE INDEX idx_store_blog_posts_slug ON store_blog_posts(store_id, slug);

-- =====================================================
-- STORE NAVIGATION MENUS (Custom navigation)
-- =====================================================
CREATE TABLE store_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  position VARCHAR(20) NOT NULL, -- 'header', 'footer', 'sidebar'
  label VARCHAR(100) NOT NULL,
  url TEXT NOT NULL, -- Can be internal (/about) or external
  
  parent_id UUID REFERENCES store_navigation(id) ON DELETE CASCADE, -- For submenus
  sort_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  open_in_new_tab BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_navigation_store ON store_navigation(store_id);
CREATE INDEX idx_store_navigation_position ON store_navigation(position, sort_order);

-- =====================================================
-- STORE DISCOUNTS (PRO/Enterprise only)
-- =====================================================
CREATE TABLE store_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  code VARCHAR(50) NOT NULL, -- Discount code (e.g., WELCOME10)
  description VARCHAR(255),
  
  -- Discount Type
  type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
  value DECIMAL(10,2) NOT NULL, -- 10 for 10%, or $10 for fixed
  
  -- Conditions
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2), -- Cap for percentage discounts
  applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'collection', 'product'
  applies_to_ids UUID[], -- Collection or product IDs
  
  -- Limits
  usage_limit INTEGER, -- Total times can be used
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  
  -- Timing
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, code),
  CONSTRAINT valid_discount_type CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping'))
);

CREATE INDEX idx_store_discounts_store ON store_discounts(store_id);
CREATE INDEX idx_store_discounts_code ON store_discounts(code);
CREATE INDEX idx_store_discounts_active ON store_discounts(is_active, starts_at, ends_at);

-- =====================================================
-- STORE EMAIL SUBSCRIBERS (Newsletter)
-- =====================================================
CREATE TABLE store_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_stores(id) ON DELETE CASCADE NOT NULL,
  
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  
  -- Source
  source VARCHAR(50) DEFAULT 'website', -- 'website', 'checkout', 'import'
  
  -- Engagement
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  
  UNIQUE(store_id, email)
);

CREATE INDEX idx_store_subscribers_store ON store_subscribers(store_id);
CREATE INDEX idx_store_subscribers_status ON store_subscribers(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE custom_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_subscribers ENABLE ROW LEVEL SECURITY;

-- Custom Stores Policies
CREATE POLICY "Anyone can view published stores"
  ON custom_stores FOR SELECT
  USING (is_published = true AND is_active = true);

CREATE POLICY "Sellers can manage their own stores"
  ON custom_stores FOR ALL
  USING (auth.uid() = seller_id);

-- Store Pages Policies
CREATE POLICY "Anyone can view published pages"
  ON store_pages FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_pages.store_id
      AND is_published = true
      AND is_active = true
    )
  );

CREATE POLICY "Sellers can manage their store pages"
  ON store_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_pages.store_id
      AND seller_id = auth.uid()
    )
  );

-- Store Collections Policies
CREATE POLICY "Anyone can view published collections"
  ON store_collections FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_collections.store_id
      AND is_published = true
      AND is_active = true
    )
  );

CREATE POLICY "Sellers can manage their collections"
  ON store_collections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_collections.store_id
      AND seller_id = auth.uid()
    )
  );

-- Collection Listings Policies
CREATE POLICY "Anyone can view collection listings"
  ON collection_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_collections sc
      JOIN custom_stores cs ON cs.id = sc.store_id
      WHERE sc.id = collection_listings.collection_id
      AND sc.is_published = true
      AND cs.is_published = true
      AND cs.is_active = true
    )
  );

CREATE POLICY "Sellers can manage their collection listings"
  ON collection_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM store_collections sc
      JOIN custom_stores cs ON cs.id = sc.store_id
      WHERE sc.id = collection_listings.collection_id
      AND cs.seller_id = auth.uid()
    )
  );

-- Blog Posts Policies
CREATE POLICY "Anyone can view published blog posts"
  ON store_blog_posts FOR SELECT
  USING (
    is_published = true
    AND published_at <= NOW()
    AND EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_blog_posts.store_id
      AND is_published = true
      AND is_active = true
    )
  );

CREATE POLICY "Authors can manage their blog posts"
  ON store_blog_posts FOR ALL
  USING (auth.uid() = author_id);

-- Analytics Policies (sellers only)
CREATE POLICY "Sellers can view their store analytics"
  ON store_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_analytics.store_id
      AND seller_id = auth.uid()
    )
  );

-- Navigation Policies
CREATE POLICY "Anyone can view active navigation"
  ON store_navigation FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_navigation.store_id
      AND is_published = true
      AND is_active = true
    )
  );

CREATE POLICY "Sellers can manage their navigation"
  ON store_navigation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_navigation.store_id
      AND seller_id = auth.uid()
    )
  );

-- Discounts Policies
CREATE POLICY "Sellers can manage their discounts"
  ON store_discounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_discounts.store_id
      AND seller_id = auth.uid()
    )
  );

-- Subscribers Policies
CREATE POLICY "Sellers can view their subscribers"
  ON store_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_stores
      WHERE id = store_subscribers.store_id
      AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can subscribe"
  ON store_subscribers FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_stores_updated_at
  BEFORE UPDATE ON custom_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_store_updated_at();

CREATE TRIGGER store_pages_updated_at
  BEFORE UPDATE ON store_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_store_updated_at();

CREATE TRIGGER store_collections_updated_at
  BEFORE UPDATE ON store_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_store_updated_at();

CREATE TRIGGER store_blog_posts_updated_at
  BEFORE UPDATE ON store_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_store_updated_at();

-- Update store product count when listings change
CREATE OR REPLACE FUNCTION update_store_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the store's total_products count
  UPDATE custom_stores
  SET total_products = (
    SELECT COUNT(*)
    FROM listings
    WHERE seller_id = custom_stores.seller_id
    AND status = 'active'
  )
  WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_stats_on_listing_change
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_store_product_count();

-- Generate unique subdomain from store name
CREATE OR REPLACE FUNCTION generate_store_subdomain()
RETURNS TRIGGER AS $$
DECLARE
  base_subdomain TEXT;
  counter INTEGER := 0;
  test_subdomain TEXT;
BEGIN
  -- Only generate if subdomain not provided and no custom domain
  IF NEW.subdomain IS NULL AND NEW.domain IS NULL THEN
    -- Convert store name to URL-friendly format
    base_subdomain := lower(regexp_replace(NEW.store_name, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Ensure it's not empty
    IF base_subdomain = '' THEN
      base_subdomain := 'store' || substring(NEW.id::text from 1 for 8);
    END IF;
    
    -- Check for uniqueness and append number if needed
    test_subdomain := base_subdomain;
    WHILE EXISTS (SELECT 1 FROM custom_stores WHERE subdomain = test_subdomain AND id != NEW.id) LOOP
      counter := counter + 1;
      test_subdomain := base_subdomain || counter::text;
    END LOOP;
    
    NEW.subdomain := test_subdomain;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_subdomain_trigger
  BEFORE INSERT OR UPDATE ON custom_stores
  FOR EACH ROW
  EXECUTE FUNCTION generate_store_subdomain();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get store by domain or subdomain
CREATE OR REPLACE FUNCTION get_store_by_domain(domain_input TEXT)
RETURNS TABLE (
  store_id UUID,
  seller_id UUID,
  store_name TEXT,
  is_published BOOLEAN,
  tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.seller_id,
    cs.store_name,
    cs.is_published,
    cs.tier
  FROM custom_stores cs
  WHERE 
    (cs.domain = domain_input OR cs.subdomain = domain_input)
    AND cs.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Verify domain ownership (for custom domains)
CREATE OR REPLACE FUNCTION verify_store_domain(store_id_input UUID, verification_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  store_record RECORD;
BEGIN
  SELECT * INTO store_record
  FROM custom_stores
  WHERE id = store_id_input;
  
  IF store_record.domain_verification_token = verification_code THEN
    UPDATE custom_stores
    SET 
      domain_verified = true,
      ssl_status = 'pending'
    WHERE id = store_id_input;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

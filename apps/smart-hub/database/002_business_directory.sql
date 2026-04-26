-- Public Business Directory
-- Stores community listings, external trust signals, and receptionist/booking eligibility.

CREATE TABLE IF NOT EXISTS business_directory_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NULL,
    member_profile_id UUID NULL,
    business_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT DEFAULT '',
    categories TEXT[] DEFAULT '{}',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    service_area TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website_url TEXT DEFAULT '',

    -- External reputation and profile sources
    google_business_url TEXT DEFAULT '',
    google_place_id TEXT DEFAULT '',
    google_rating NUMERIC(3,2),
    google_review_count INTEGER DEFAULT 0,
    facebook_page_url TEXT DEFAULT '',
    facebook_page_id TEXT DEFAULT '',
    facebook_rating NUMERIC(3,2),
    facebook_review_count INTEGER DEFAULT 0,

    -- Branding/media
    logo_url TEXT DEFAULT '',
    cover_image_url TEXT DEFAULT '',

    -- Listing controls
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_network_member BOOLEAN DEFAULT false,
    receptionist_enabled BOOLEAN DEFAULT false,
    booking_url TEXT DEFAULT '',
    receptionist_url TEXT DEFAULT '',
    listing_status TEXT DEFAULT 'draft'
        CHECK (listing_status IN ('draft', 'pending', 'active', 'paused', 'rejected')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_directory_slug
    ON business_directory_listings(slug);

CREATE INDEX IF NOT EXISTS idx_business_directory_status
    ON business_directory_listings(listing_status);

CREATE INDEX IF NOT EXISTS idx_business_directory_city_state
    ON business_directory_listings(city, state);

CREATE INDEX IF NOT EXISTS idx_business_directory_categories
    ON business_directory_listings
    USING GIN(categories);

ALTER TABLE business_directory_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active directory listings" ON business_directory_listings;
CREATE POLICY "Public can read active directory listings"
ON business_directory_listings
FOR SELECT
USING (listing_status = 'active');

CREATE OR REPLACE FUNCTION update_business_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_directory_updated_at ON business_directory_listings;
CREATE TRIGGER trg_business_directory_updated_at
BEFORE UPDATE ON business_directory_listings
FOR EACH ROW
EXECUTE FUNCTION update_business_directory_updated_at();

-- Seed examples to support the first public directory experience.
INSERT INTO business_directory_listings (
    business_name,
    slug,
    short_description,
    categories,
    city,
    state,
    service_area,
    phone,
    email,
    website_url,
    google_business_url,
    google_rating,
    google_review_count,
    facebook_page_url,
    facebook_rating,
    facebook_review_count,
    is_verified,
    is_featured,
    is_network_member,
    receptionist_enabled,
    booking_url,
    receptionist_url,
    listing_status
) VALUES
(
    'Elite Plumbing & Rooter',
    'elite-plumbing-rooter',
    'Emergency plumbing, leak diagnostics, fixture installs, and water heater replacement for homeowners and small businesses.',
    ARRAY['Plumbing', 'Emergency Repair'],
    'Columbus',
    'OH',
    'Columbus Metro',
    '(614) 555-0108',
    'hello@eliteplumbingrooter.com',
    'https://constructivedesignsinc.org',
    'https://www.google.com/search?q=elite+plumbing+rooter',
    4.80,
    214,
    'https://www.facebook.com',
    4.70,
    88,
    true,
    true,
    true,
    true,
    'https://renovision.constructivedesignsinc.org/book/CDI-00001',
    'https://renovision.constructivedesignsinc.org/book/CDI-00001',
    'active'
),
(
    'Pro-Flooring Specialists',
    'pro-flooring-specialists',
    'Hardwood, tile, laminate, and luxury vinyl installation with design support and estimate scheduling.',
    ARRAY['Flooring', 'Tile'],
    'Cleveland',
    'OH',
    'Cuyahoga County',
    '(216) 555-0145',
    'projects@proflooringspecialists.com',
    'https://constructivedesignsinc.org',
    'https://www.google.com/search?q=pro+flooring+specialists',
    4.90,
    156,
    'https://www.facebook.com',
    4.80,
    42,
    true,
    false,
    true,
    true,
    'https://renovision.constructivedesignsinc.org/book/CDI-00002',
    'https://renovision.constructivedesignsinc.org/book/CDI-00002',
    'active'
),
(
    'River City Electric',
    'river-city-electric',
    'Residential electrical upgrades, lighting plans, panel work, and inspections for remodels and service calls.',
    ARRAY['Electrical', 'Lighting'],
    'Dayton',
    'OH',
    'Dayton + Surrounding Communities',
    '(937) 555-0112',
    'team@rivercityelectric.co',
    'https://constructivedesignsinc.org',
    'https://www.google.com/search?q=river+city+electric+dayton',
    4.60,
    93,
    'https://www.facebook.com',
    4.50,
    27,
    false,
    true,
    false,
    false,
    '',
    '',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

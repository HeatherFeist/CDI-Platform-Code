-- Public directory RPC
-- Aggregates live CDI network businesses from Renovision tables
-- and standalone paid directory listings into a public result set.

CREATE OR REPLACE FUNCTION get_public_business_directory()
RETURNS TABLE (
    id UUID,
    business_name TEXT,
    slug TEXT,
    short_description TEXT,
    categories TEXT[],
    city TEXT,
    state TEXT,
    service_area TEXT,
    phone TEXT,
    email TEXT,
    website_url TEXT,
    google_business_url TEXT,
    google_rating NUMERIC,
    google_review_count INTEGER,
    facebook_page_url TEXT,
    facebook_rating NUMERIC,
    facebook_review_count INTEGER,
    logo_url TEXT,
    cover_image_url TEXT,
    is_verified BOOLEAN,
    is_featured BOOLEAN,
    is_network_member BOOLEAN,
    receptionist_enabled BOOLEAN,
    booking_url TEXT,
    receptionist_url TEXT,
    listing_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH network_profiles AS (
        SELECT
            p.id AS profile_id,
            p.business_id,
            p.workspace_email AS email,
            p.phone,
            p.member_id,
            p.is_verified_member,
            p.visible_in_directory
        FROM profiles p
        WHERE p.user_type = 'contractor'
          AND p.business_id IS NOT NULL
          AND p.visible_in_directory = true
    ),
    network_businesses AS (
        SELECT
            b.id,
            np.profile_id,
            b.name AS business_name,
            COALESCE(
                NULLIF(lower(regexp_replace(np.member_id, '[^a-zA-Z0-9]+', '-', 'g')), ''),
                NULLIF(lower(regexp_replace(b.name, '[^a-zA-Z0-9]+', '-', 'g')), ''),
                b.id::text
            ) AS slug,
            COALESCE(b.description, '') AS short_description,
            COALESCE(b.specialties, ARRAY[]::TEXT[]) AS categories,
            COALESCE(b.city, '') AS city,
            COALESCE(b.state, '') AS state,
            TRIM(BOTH ', ' FROM CONCAT_WS(', ', NULLIF(b.city, ''), NULLIF(b.state, ''), NULLIF(b.zip, ''))) AS service_area,
            COALESCE(np.phone, '') AS phone,
            COALESCE(np.email, '') AS email,
            COALESCE(b.website, '') AS website_url,
            COALESCE(b.logo_url, '') AS logo_url,
            np.is_verified_member AS is_verified,
            COALESCE(dp.accepts_dispatch_leads, false) AS accepts_dispatch_leads,
            COALESCE(ars.is_active, false) AS receptionist_enabled,
            np.member_id
        FROM businesses b
        INNER JOIN network_profiles np ON np.business_id = b.id
        LEFT JOIN contractor_dispatch_profiles dp ON dp.business_id = b.id
        LEFT JOIN ai_receptionist_settings ars ON ars.business_id = b.id
    ),
    standalone_listings AS (
        SELECT
            l.id,
            l.business_id,
            l.member_profile_id,
            l.business_name,
            l.slug,
            l.short_description,
            COALESCE(l.categories, ARRAY[]::TEXT[]) AS categories,
            COALESCE(l.city, '') AS city,
            COALESCE(l.state, '') AS state,
            COALESCE(l.service_area, '') AS service_area,
            COALESCE(l.phone, '') AS phone,
            COALESCE(l.email, '') AS email,
            COALESCE(l.website_url, '') AS website_url,
            COALESCE(l.google_business_url, '') AS google_business_url,
            l.google_rating,
            COALESCE(l.google_review_count, 0) AS google_review_count,
            COALESCE(l.facebook_page_url, '') AS facebook_page_url,
            l.facebook_rating,
            COALESCE(l.facebook_review_count, 0) AS facebook_review_count,
            COALESCE(l.logo_url, '') AS logo_url,
            COALESCE(l.cover_image_url, '') AS cover_image_url,
            COALESCE(l.is_verified, false) AS is_verified,
            COALESCE(l.is_featured, false) AS is_featured,
            COALESCE(l.is_network_member, false) AS is_network_member,
            COALESCE(l.receptionist_enabled, false) AS receptionist_enabled,
            COALESCE(l.booking_url, '') AS booking_url,
            COALESCE(l.receptionist_url, '') AS receptionist_url,
            l.listing_status
        FROM business_directory_listings l
        WHERE l.listing_status = 'active'
          AND l.business_id IS NULL
    ),
    overlaid_network AS (
        SELECT
            COALESCE(l.id, nb.id) AS id,
            COALESCE(NULLIF(l.business_name, ''), nb.business_name) AS business_name,
            COALESCE(NULLIF(l.slug, ''), nb.slug) AS slug,
            COALESCE(NULLIF(l.short_description, ''), nb.short_description) AS short_description,
            COALESCE(NULLIF(l.categories, ARRAY[]::TEXT[]), nb.categories) AS categories,
            COALESCE(NULLIF(l.city, ''), nb.city) AS city,
            COALESCE(NULLIF(l.state, ''), nb.state) AS state,
            COALESCE(NULLIF(l.service_area, ''), nb.service_area) AS service_area,
            COALESCE(NULLIF(l.phone, ''), nb.phone) AS phone,
            COALESCE(NULLIF(l.email, ''), nb.email) AS email,
            COALESCE(NULLIF(l.website_url, ''), nb.website_url) AS website_url,
            COALESCE(l.google_business_url, '') AS google_business_url,
            l.google_rating,
            COALESCE(l.google_review_count, 0) AS google_review_count,
            COALESCE(l.facebook_page_url, '') AS facebook_page_url,
            l.facebook_rating,
            COALESCE(l.facebook_review_count, 0) AS facebook_review_count,
            COALESCE(NULLIF(l.logo_url, ''), nb.logo_url) AS logo_url,
            COALESCE(l.cover_image_url, '') AS cover_image_url,
            COALESCE(l.is_verified, nb.is_verified) AS is_verified,
            COALESCE(l.is_featured, false) AS is_featured,
            true AS is_network_member,
            COALESCE(l.receptionist_enabled, nb.receptionist_enabled) AS receptionist_enabled,
            COALESCE(
                NULLIF(l.booking_url, ''),
                CASE
                    WHEN nb.member_id IS NOT NULL AND nb.member_id <> '' THEN
                        'https://renovision.constructivedesignsinc.org/book/' || nb.member_id
                    ELSE ''
                END
            ) AS booking_url,
            COALESCE(
                NULLIF(l.receptionist_url, ''),
                CASE
                    WHEN nb.member_id IS NOT NULL AND nb.member_id <> '' AND (COALESCE(l.receptionist_enabled, nb.receptionist_enabled)) THEN
                        'https://renovision.constructivedesignsinc.org/book/' || nb.member_id
                    ELSE ''
                END
            ) AS receptionist_url,
            COALESCE(l.listing_status, 'active') AS listing_status
        FROM network_businesses nb
        LEFT JOIN business_directory_listings l ON l.business_id = nb.id
        WHERE COALESCE(l.listing_status, 'active') = 'active'
    )
    SELECT * FROM overlaid_network
    UNION ALL
    SELECT * FROM standalone_listings
    ORDER BY is_featured DESC, is_verified DESC, receptionist_enabled DESC, business_name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_public_business_directory() TO anon;
GRANT EXECUTE ON FUNCTION get_public_business_directory() TO authenticated;

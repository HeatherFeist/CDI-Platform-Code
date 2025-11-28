-- Find your profile and listings to debug the storefront issue
-- First, get your user_id from auth.users
SELECT 
    'Your Auth User' as check_type,
    id,
    email,
    NULL as col3,
    NULL as col4,
    NULL as col5
FROM auth.users
WHERE email LIKE '%heather%'
UNION ALL
SELECT 
    'Your Profile Info' as check_type,
    p.id,
    p.username,
    p.store_slug,
    p.store_name,
    NULL
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%heather%'
UNION ALL
SELECT 
    'Your Listings' as check_type,
    l.id,
    l.title,
    CAST(l.seller_id AS TEXT),
    l.listing_type,
    CAST(l.stock_quantity AS TEXT)
FROM listings l
JOIN profiles p ON l.seller_id = p.id
JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%heather%';

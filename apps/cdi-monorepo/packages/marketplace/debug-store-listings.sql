-- Check your profile username and user_id
SELECT 
    id as user_id,
    username,
    email,
    store_name,
    store_slug
FROM profiles
WHERE email LIKE '%heather%'
ORDER BY created_at DESC;

-- Check your listings and what seller_id they have
SELECT 
    l.id,
    l.title,
    l.seller_id,
    l.listing_type,
    l.status,
    l.stock_quantity,
    p.username as seller_username,
    p.store_name
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
WHERE p.email LIKE '%heather%'
ORDER BY l.created_at DESC;

-- Check your member_stores
SELECT 
    ms.id,
    ms.store_name,
    ms.store_slug,
    ms.user_id,
    p.username,
    p.email
FROM member_stores ms
LEFT JOIN profiles p ON ms.user_id = p.id
WHERE p.email LIKE '%heather%'
ORDER BY ms.created_at DESC;

-- Check if store_slug matches username or if there's a mismatch
SELECT 
    'Profile' as source,
    username,
    store_slug,
    email
FROM profiles
WHERE email LIKE '%heather%'
UNION ALL
SELECT 
    'Member Store' as source,
    p.username,
    ms.store_slug,
    p.email
FROM member_stores ms
JOIN profiles p ON ms.user_id = p.id
WHERE p.email LIKE '%heather%';

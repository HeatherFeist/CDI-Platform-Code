-- First, let's see all your stores to identify which ones to keep/delete
SELECT 
    id,
    store_name,
    store_slug,
    user_id,
    created_at,
    status
FROM member_stores
WHERE user_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
ORDER BY created_at ASC;

-- After reviewing the results above, delete the duplicates
-- Keep the FIRST one (oldest) and delete the newer duplicates
-- Replace 'STORE_ID_TO_DELETE_1' and 'STORE_ID_TO_DELETE_2' with actual IDs from the query above

-- DELETE FROM member_stores WHERE id = 'STORE_ID_TO_DELETE_1';
-- DELETE FROM member_stores WHERE id = 'STORE_ID_TO_DELETE_2';

-- OR if you want to keep only the NEWEST one and delete the older ones:
-- DELETE FROM member_stores 
-- WHERE user_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
--   AND id NOT IN (
--     SELECT id FROM member_stores 
--     WHERE user_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0')
--     ORDER BY created_at DESC 
--     LIMIT 1
--   );

-- Verify only one store remains
SELECT 
    id,
    store_name,
    store_slug,
    user_id,
    created_at,
    status
FROM member_stores
WHERE user_id = (SELECT id FROM profiles WHERE username = 'heatherfeist0');

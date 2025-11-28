-- Check if Gemini API key exists in database
SELECT 
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ API key is NOT set'
        WHEN gemini_api_key = '' THEN '❌ API key is empty'
        WHEN LENGTH(gemini_api_key) < 20 THEN '⚠️ API key looks too short (might be invalid)'
        ELSE '✅ API key is set (length: ' || LENGTH(gemini_api_key) || ')'
    END as status,
    created_at,
    updated_at
FROM api_keys
LIMIT 1;

-- If no rows returned, the table might be empty
-- Run this to check:
SELECT COUNT(*) as row_count FROM api_keys;

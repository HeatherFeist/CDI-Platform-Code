-- =====================================================
-- DEBUG: Check if API key is in your profile
-- =====================================================

-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'gemini_api_key';

-- Check your specific profile
SELECT 
    id,
    email,
    first_name,
    last_name,
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ NULL'
        WHEN gemini_api_key = '' THEN '❌ EMPTY STRING'
        WHEN LENGTH(gemini_api_key) < 30 THEN '⚠️ Too short: ' || LENGTH(gemini_api_key)
        ELSE '✅ Valid: ' || LENGTH(gemini_api_key) || ' chars'
    END as key_status,
    LEFT(gemini_api_key, 25) || '...' as key_preview,
    '...ends with: ' || RIGHT(gemini_api_key, 10) as key_suffix
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- Check if there are any profiles WITH keys
SELECT 
    COUNT(*) as total_profiles,
    COUNT(gemini_api_key) as profiles_with_keys,
    COUNT(*) - COUNT(gemini_api_key) as profiles_without_keys
FROM profiles;

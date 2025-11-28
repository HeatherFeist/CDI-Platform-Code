-- =====================================================
-- USER-OWNED API KEYS: Correct Implementation
-- =====================================================
-- Each user brings their own Gemini API key
-- =====================================================

-- Drop the shared api_keys table (we don't need it)
DROP TABLE IF EXISTS api_keys CASCADE;

-- Add gemini_api_key to user profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_gemini_key 
ON profiles(gemini_api_key) 
WHERE gemini_api_key IS NOT NULL;

-- Update YOUR profile with your API key
UPDATE profiles
SET gemini_api_key = 'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM'
WHERE email = 'heatherfeist0@gmail.com';

-- Verify it's set
SELECT 
    first_name,
    last_name,
    email,
    CASE 
        WHEN gemini_api_key IS NOT NULL 
        THEN '✅ API Key Set (length: ' || LENGTH(gemini_api_key) || ')'
        ELSE '❌ No API Key'
    END as api_key_status,
    LEFT(gemini_api_key, 20) || '...' as key_preview
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- EXPECTED OUTPUT:
-- Your profile should show "✅ API Key Set (length: 39)"
-- =====================================================

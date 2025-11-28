-- Add store_slug column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS store_slug VARCHAR(255);

-- Update existing profiles to have a store_slug based on their username
UPDATE profiles 
SET store_slug = LOWER(REPLACE(username, ' ', '-'))
WHERE store_slug IS NULL;

-- For your specific profile, set the store_slug to match the member_store
UPDATE profiles p
SET store_slug = ms.store_slug
FROM member_stores ms
WHERE p.id = ms.user_id
  AND p.username = 'heatherfeist0';

-- Verify the update
SELECT 
    p.id,
    p.username,
    p.store_slug,
    ms.store_slug as member_store_slug
FROM profiles p
LEFT JOIN member_stores ms ON p.id = ms.user_id
WHERE p.username = 'heatherfeist0';

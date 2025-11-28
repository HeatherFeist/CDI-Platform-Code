-- Create your member store entry
-- First, let's check if you already have a profile
SELECT id, username, store_name, store_slug FROM profiles WHERE id = auth.uid();

-- If you have a username but no store, insert a store entry
-- First delete any existing store for this user to avoid duplicates
DELETE FROM member_stores WHERE user_id = auth.uid();

-- Now insert your store
INSERT INTO member_stores (user_id, store_name, store_slug, tier, status, description)
SELECT 
  id as user_id,
  COALESCE(store_name, username || '''s Store') as store_name,
  COALESCE(store_slug, LOWER(REPLACE(username, ' ', '-'))) as store_slug,
  'free' as tier,
  'active' as status,
  'Welcome to my store!' as description
FROM profiles
WHERE id = auth.uid();

-- Verify your store was created
SELECT * FROM member_stores WHERE user_id = auth.uid();

-- Also update your profile to mark you as a member
UPDATE profiles 
SET 
  is_nonprofit_member = true,
  member_tier = 'free',
  store_name = COALESCE(store_name, username || '''s Store'),
  store_slug = COALESCE(store_slug, LOWER(REPLACE(username, ' ', '-')))
WHERE id = auth.uid();

-- Verify everything
SELECT 
  p.username,
  p.store_name,
  p.store_slug,
  p.is_nonprofit_member,
  ms.id as store_id,
  ms.status as store_status
FROM profiles p
LEFT JOIN member_stores ms ON ms.user_id = p.id
WHERE p.id = auth.uid();

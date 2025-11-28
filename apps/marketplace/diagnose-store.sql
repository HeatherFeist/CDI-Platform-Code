-- Diagnostic: Check your current setup

-- 1. Check your profile
SELECT 
  id,
  username,
  store_name,
  store_slug,
  is_nonprofit_member,
  member_tier
FROM profiles 
WHERE id = auth.uid();

-- 2. Check if you have a store entry
SELECT 
  id,
  user_id,
  store_name,
  store_slug,
  tier,
  status,
  created_at
FROM member_stores 
WHERE user_id = auth.uid();

-- 3. Check your listings
SELECT 
  id,
  title,
  listing_type,
  status,
  stock_quantity,
  seller_id
FROM listings 
WHERE seller_id = auth.uid()
ORDER BY created_at DESC;

-- 4. Check what the StoreDirectory query would see
SELECT 
  ms.*,
  p.username,
  p.avatar_url,
  p.bio,
  p.city,
  p.state
FROM member_stores ms
LEFT JOIN profiles p ON p.id = ms.user_id
WHERE ms.status = 'active'
ORDER BY ms.created_at DESC;

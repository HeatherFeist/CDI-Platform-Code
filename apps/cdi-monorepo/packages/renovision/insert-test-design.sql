-- ====================================================================
-- MANUAL TEST INSERT FOR SAVED DESIGNS
-- ====================================================================
-- This inserts a test design to verify the picker works
-- Run this in Supabase SQL Editor
-- ====================================================================

-- Insert a test design with a public placeholder image
INSERT INTO saved_designs (
    user_id,
    name,
    storage_path,
    thumbnail_url,
    generation_prompt,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'Test Kitchen Design',
    'designs/test-image.png',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop', -- Public placeholder image
    'Modern kitchen with white cabinets, marble countertops, and stainless steel appliances',
    NOW(),
    NOW()
);

-- Verify the insert
SELECT 
    '✅ Test design inserted!' as status,
    COUNT(*) as total_designs
FROM saved_designs;

-- Show the test design
SELECT 
    id,
    name,
    thumbnail_url,
    generation_prompt,
    created_at
FROM saved_designs
ORDER BY created_at DESC;

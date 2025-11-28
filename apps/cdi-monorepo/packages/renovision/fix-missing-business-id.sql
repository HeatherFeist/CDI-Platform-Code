-- FIX MISSING BUSINESS_ID IN USER PROFILE
-- This creates a business for users who signed up before the trigger was fixed

-- Step 1: Check if user has a profile but no business
SELECT 
    p.id as profile_id,
    p.email,
    p.first_name,
    p.last_name,
    p.business_id,
    p.role
FROM profiles p
WHERE p.business_id IS NULL;

-- Step 2: Create businesses for users without one and link them
DO $$ 
DECLARE
    profile_record RECORD;
    new_business_id UUID;
BEGIN
    -- Loop through all profiles without a business_id
    FOR profile_record IN 
        SELECT id, email, first_name, last_name, role 
        FROM profiles 
        WHERE business_id IS NULL
    LOOP
        -- Create a new business for this user
        INSERT INTO businesses (name, description)
        VALUES (
            COALESCE(profile_record.first_name, 'User') || '''s Business',
            'Business account for ' || profile_record.email
        )
        RETURNING id INTO new_business_id;
        
        RAISE NOTICE 'Created business % for user %', new_business_id, profile_record.email;
        
        -- Update the profile with the new business_id
        UPDATE profiles 
        SET business_id = new_business_id
        WHERE id = profile_record.id;
        
        RAISE NOTICE 'Updated profile % with business_id %', profile_record.email, new_business_id;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No profiles found without business_id';
    END IF;
END $$;

-- Step 3: Verify all profiles now have a business_id
SELECT 
    p.id as profile_id,
    p.email,
    p.first_name,
    p.business_id,
    b.name as business_name,
    CASE 
        WHEN p.business_id IS NULL THEN '❌ MISSING'
        ELSE '✅ HAS BUSINESS'
    END as status
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Fixed missing business_id for all users!';
    RAISE NOTICE 'All profiles now have a business linked';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Users can now complete setup!';
END $$;

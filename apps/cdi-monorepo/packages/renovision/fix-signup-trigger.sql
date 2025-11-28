-- Fix signup trigger to properly create business and profile
-- This ensures the trigger has permission to insert into businesses table

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with SECURITY DEFINER
-- This allows the function to bypass RLS policies
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_business_id UUID;
BEGIN
    -- Check if business_id is provided in metadata
    IF NEW.raw_user_meta_data->>'business_id' IS NOT NULL AND NEW.raw_user_meta_data->>'business_id' != 'null' THEN
        new_business_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
        RAISE NOTICE 'Using provided business_id: %', new_business_id;
    ELSE
        -- Create a new business for this user
        RAISE NOTICE 'Creating new business for user: %', NEW.email;
        
        INSERT INTO public.businesses (name, description)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'New') || '''s Business',
            'Personal business account'
        )
        RETURNING id INTO new_business_id;
        
        RAISE NOTICE 'Created business with id: %', new_business_id;
    END IF;
    
    -- Create the profile
    RAISE NOTICE 'Creating profile for user: %', NEW.email;
    
    INSERT INTO public.profiles (id, email, first_name, last_name, business_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        new_business_id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    );
    
    RAISE NOTICE 'Profile created successfully';
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.businesses TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Verify trigger was created
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

RAISE NOTICE 'Signup trigger updated successfully!';

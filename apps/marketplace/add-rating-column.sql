-- Add missing rating column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'rating';

-- Check your profile
SELECT id, username, rating, store_name FROM profiles WHERE id = auth.uid();

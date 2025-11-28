-- Alternative: More Secure RLS Fix
-- Run this instead if you prefer tighter security

-- Drop the existing policy
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Create a policy that allows both authenticated users and the system to insert
CREATE POLICY "Users can insert their own profile or system can create" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);
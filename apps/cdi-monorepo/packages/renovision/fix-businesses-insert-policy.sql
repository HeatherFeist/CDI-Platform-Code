-- Fix: Add INSERT policy for businesses table to allow signup
-- This allows authenticated users to create a business during signup

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert business" ON businesses;

-- Create INSERT policy for businesses table
-- Allows any authenticated user to create a new business
CREATE POLICY "Users can insert business" 
ON businesses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'businesses';

-- Test query (should now work for authenticated users)
-- SELECT * FROM businesses;

-- ====================================================================
-- ADD WORKSPACE EMAIL TO PROFILES
-- ====================================================================
-- This migration adds workspace_email field to store the user's
-- @constructivedesignsinc.org email address alongside their personal email
-- ====================================================================

-- Add workspace_email column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workspace_email TEXT;

-- Add unique constraint (each workspace email should be unique)
ALTER TABLE profiles
ADD CONSTRAINT profiles_workspace_email_unique 
UNIQUE (workspace_email);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_email 
ON profiles(workspace_email);

-- Add comment
COMMENT ON COLUMN profiles.workspace_email IS 
'Google Workspace email (@constructivedesignsinc.org) - auto-generated on signup';

-- Verify the change
SELECT 
    '✅ WORKSPACE EMAIL FIELD ADDED' as "Status",
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'workspace_email';

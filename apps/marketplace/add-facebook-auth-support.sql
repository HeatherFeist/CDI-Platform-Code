-- Add Facebook Authentication Support to Profiles Table
-- Allows users to sign up with Facebook and optionally get workspace accounts

-- Add Facebook-specific columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS facebook_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS marketplace_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_joined_at TIMESTAMPTZ;

-- Create index for fast Facebook ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_facebook_id 
  ON profiles(facebook_id) WHERE facebook_id IS NOT NULL;

-- Create index for signup source filtering
CREATE INDEX IF NOT EXISTS idx_profiles_signup_source 
  ON profiles(signup_source);

-- Add comments for documentation
COMMENT ON COLUMN profiles.facebook_id IS 'Facebook user ID from OAuth authentication';
COMMENT ON COLUMN profiles.signup_source IS 'Source of signup: facebook, google, email';
COMMENT ON COLUMN profiles.marketplace_only IS 'True if user only uses marketplace (no workspace account)';
COMMENT ON COLUMN profiles.member_joined_at IS 'When user became a full member with workspace account';

-- Update existing workspace users to have correct signup_source
UPDATE profiles 
SET signup_source = 'google' 
WHERE workspace_email IS NOT NULL 
  AND signup_source = 'email';

-- Set marketplace_only = false for existing workspace users
UPDATE profiles 
SET marketplace_only = false 
WHERE workspace_email IS NOT NULL; 
























































 
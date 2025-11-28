-- Simple contact preferences for profiles
-- Users control their own contact visibility

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'app_message',
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS accepts_video_calls BOOLEAN DEFAULT FALSE;

-- Index for filtering users who accept video calls
CREATE INDEX IF NOT EXISTS idx_profiles_accepts_video_calls 
ON profiles(accepts_video_calls) WHERE accepts_video_calls = TRUE;

COMMENT ON COLUMN profiles.phone_visible IS 'User chose to make phone number visible to customers';
COMMENT ON COLUMN profiles.email_visible IS 'User chose to make email visible to customers';
COMMENT ON COLUMN profiles.preferred_contact_method IS 'phone, email, app_message, or any';
COMMENT ON COLUMN profiles.business_hours IS 'Free text business hours (e.g., "Mon-Fri 9am-5pm")';
COMMENT ON COLUMN profiles.accepts_video_calls IS 'User accepts video calls (FaceTime, WhatsApp, etc.) for product inspection';

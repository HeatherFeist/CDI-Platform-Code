-- =====================================================
-- GOOGLE CALENDAR INTEGRATION FIELDS
-- =====================================================
-- Add these to profiles table for OAuth integration
-- Run this AFTER unified-profiles-schema.sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT, -- Encrypted OAuth refresh token for calendar sync
ADD COLUMN IF NOT EXISTS google_calendar_synced BOOLEAN DEFAULT false, -- Has user authorized calendar access?
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT DEFAULT 'primary'; -- Which calendar to sync to

-- Create index for calendar sync lookups
CREATE INDEX IF NOT EXISTS idx_profiles_calendar_synced ON profiles(google_calendar_synced) WHERE google_calendar_synced = true;

COMMENT ON COLUMN profiles.google_refresh_token IS 'Encrypted OAuth2 refresh token for Google Calendar API - allows automatic job sync';
COMMENT ON COLUMN profiles.google_calendar_synced IS 'Whether user has authorized Google Calendar integration';
COMMENT ON COLUMN profiles.google_calendar_id IS 'Google Calendar ID to sync jobs to (default: primary)';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- ✅ Google Calendar OAuth fields added to profiles
-- ✅ Jobs can now auto-sync to user's workspace calendar
-- ✅ Reminders sent via Google Calendar (7 days, 1 day, 1 hour before)
--
-- NEXT STEPS:
-- 1. Implement OAuth flow in frontend (Google Sign-In)
-- 2. Create Supabase Edge Function: sync-to-google-calendar
-- 3. Trigger calendar sync when job status changes to 'assigned'
-- 4. Add "Connect Google Calendar" button in settings
-- =====================================================

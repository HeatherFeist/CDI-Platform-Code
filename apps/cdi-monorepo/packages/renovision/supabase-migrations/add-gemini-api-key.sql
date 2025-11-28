-- Add gemini_api_key column to businesses table
-- Run this migration in your Supabase SQL editor

-- Add the column if it doesn't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN businesses.gemini_api_key IS 'Google Gemini API key for AI-powered features (estimates, chat, photo analysis)';

-- Note: This column stores sensitive data. Ensure RLS policies are properly configured.
-- The existing RLS policies on businesses table will apply to this column automatically.

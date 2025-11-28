-- Add notes column to team_members table if it doesn't exist
-- Run this migration in your Supabase SQL editor

-- Add the column
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN team_members.notes IS 'Additional notes or information about the team member';

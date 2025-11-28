-- =====================================================
-- FIX: Team Members Table - Add missing columns
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add specialties column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

-- Add invite_status column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS invite_status VARCHAR(20) CHECK (invite_status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending';

-- Add invited_at column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add accepted_at column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Add notes column if it doesn't exist (might already exist from previous migration)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- If you have 'skills' column and want to migrate data to 'specialties':
-- UPDATE team_members SET specialties = skills WHERE specialties = '{}' OR specialties IS NULL;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
AND column_name IN ('specialties', 'invite_status', 'invited_at', 'accepted_at', 'notes')
ORDER BY column_name;

-- You should see 5 rows with the columns listed above

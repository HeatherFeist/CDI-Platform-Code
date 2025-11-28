-- =====================================================
-- FIX: Add notes column to team_members table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add notes column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
AND column_name = 'notes';

-- If you see a row with 'notes' and 'text', the migration was successful!

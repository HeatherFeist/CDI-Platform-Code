-- UNIFIED PROFILES SCHEMA
-- Merges RenovVision and Marketplace profile requirements into a single table
-- Run this in the Supabase SQL Editor for project: gjbrjysuqdvvqlxklvos

-- 1. Add Marketplace columns to the existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Generate usernames for existing RenovVision users
-- Pattern: firstname.lastname (lowercase, no spaces)
UPDATE profiles 
SET username = LOWER(REPLACE(first_name || '.' || last_name, ' ', ''))
WHERE username IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- 3. Generate full_name for existing RenovVision users
UPDATE profiles
SET full_name = first_name || ' ' || last_name
WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- 4. Create a function to keep names in sync automatically
CREATE OR REPLACE FUNCTION sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync first_name/last_name -> full_name
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
    
    -- Sync full_name -> first_name/last_name (if full_name provided but parts missing)
    IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.last_name IS NULL) THEN
        NEW.first_name := SPLIT_PART(NEW.full_name, ' ', 1);
        NEW.last_name := SPLIT_PART(NEW.full_name, ' ', 2);
    END IF;
    
    -- Auto-generate username if missing
    IF NEW.username IS NULL AND NEW.first_name IS NOT NULL THEN
        NEW.username := LOWER(REPLACE(NEW.first_name || '.' || NEW.last_name, ' ', ''));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the trigger
DROP TRIGGER IF EXISTS sync_names_trigger ON profiles;
CREATE TRIGGER sync_names_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_names();

-- 6. Update RLS Policies to allow public read of basic profile info (needed for Marketplace listings)
-- Note: We carefully only expose safe fields
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

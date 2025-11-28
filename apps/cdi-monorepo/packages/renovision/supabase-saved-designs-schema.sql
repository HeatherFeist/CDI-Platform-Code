-- ====================================================================
-- SAVED DESIGNS TABLE & STORAGE
-- ====================================================================
-- For AI-generated images from the Design App to be shared across
-- all platform apps (Marketplace, RenovisionPro, etc.)
-- ====================================================================

-- Create the saved_designs table
CREATE TABLE IF NOT EXISTS public.saved_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users or profiles
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT, -- Public URL for quick previews
  generation_prompt TEXT, -- The AI prompt used to generate this
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_saved_designs_user_id ON public.saved_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_created_at ON public.saved_designs(created_at DESC);

-- RLS is disabled per nonprofit security approach
ALTER TABLE public.saved_designs DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for design images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Verify setup
SELECT 
    '✅ Saved Designs Table Created' as "Status",
    COUNT(*) as "Current Designs"
FROM saved_designs;

SELECT 
    '✅ Storage Bucket Ready' as "Status",
    id,
    name,
    public as "Public Access"
FROM storage.buckets
WHERE id = 'designs';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SAVED DESIGNS INTEGRATION READY';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Setup Complete:';
    RAISE NOTICE '  ✅ saved_designs table created';
    RAISE NOTICE '  ✅ Indexes added for performance';
    RAISE NOTICE '  ✅ designs storage bucket created (public)';
    RAISE NOTICE '';
    RAISE NOTICE 'AI Design App can now:';
    RAISE NOTICE '  → Upload images to designs bucket';
    RAISE NOTICE '  → Save metadata to saved_designs table';
    RAISE NOTICE '  → Fetch user designs via public URLs';
    RAISE NOTICE '';
    RAISE NOTICE 'Other apps can now:';
    RAISE NOTICE '  → Query saved_designs table';
    RAISE NOTICE '  → Display images via thumbnail_url';
    RAISE NOTICE '  → Filter by user, date, prompt, etc.';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for end-to-end testing! 🎨';
    RAISE NOTICE '';
END $$;

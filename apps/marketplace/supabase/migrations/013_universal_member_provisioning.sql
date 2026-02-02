-- =====================================================
-- Universal Member Provisioning
-- Ensures organization members get a business profile
-- =====================================================

-- 1) Ensure shared profile flags exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_organization_member BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS membership_joined_at TIMESTAMPTZ;

-- 2) Ensure businesses table has company_name for cross-app use
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 3) Ensure profiles has business_id (for legacy schemas)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- 4) Allow authenticated users to create businesses (required for provisioning)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert business" ON businesses;
CREATE POLICY "Users can insert business"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5) RPC: create or link a business for a given profile
CREATE OR REPLACE FUNCTION ensure_business_profile(
    profile_id UUID,
    business_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_business_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_email TEXT;
    v_name TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF auth.uid() <> profile_id THEN
        RAISE EXCEPTION 'Cannot provision business for another user';
    END IF;

    SELECT business_id, first_name, last_name, email
    INTO v_business_id, v_first_name, v_last_name, v_email
    FROM profiles
    WHERE id = profile_id;

    IF v_business_id IS NOT NULL THEN
        RETURN v_business_id;
    END IF;

    v_name := NULLIF(TRIM(COALESCE(business_name, '')), '');
    IF v_name IS NULL THEN
        v_name := NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), '');
    END IF;
    IF v_name IS NULL OR v_name = '' THEN
        v_name := COALESCE(v_email, 'New Business');
    END IF;

    INSERT INTO businesses (id, name, company_name, created_at, updated_at)
    VALUES (gen_random_uuid(), v_name, v_name, NOW(), NOW())
    RETURNING id INTO v_business_id;

    UPDATE profiles
    SET business_id = v_business_id,
        updated_at = NOW()
    WHERE id = profile_id;

    RETURN v_business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_business_profile(UUID, TEXT) TO authenticated, service_role;

-- 6) Trigger: auto-provision business when org membership is set
CREATE OR REPLACE FUNCTION handle_org_member_provisioning()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    IF NEW.is_organization_member IS TRUE AND NEW.business_id IS NULL THEN
        v_business_id := ensure_business_profile(NEW.id, NEW.full_name);
        NEW.business_id := v_business_id;
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_member_provisioning ON profiles;
CREATE TRIGGER trg_org_member_provisioning
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_org_member_provisioning();

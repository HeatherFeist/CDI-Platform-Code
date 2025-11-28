-- =====================================================
-- GOOGLE WORKSPACE ACCOUNT PROVISIONING
-- =====================================================
-- This adds the ability to automatically create Google Workspace
-- accounts for verified contractors
-- =====================================================

-- Add column to track workspace account creation
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workspace_account_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workspace_account_created_at TIMESTAMPTZ;

-- Store Google Workspace configuration
CREATE TABLE IF NOT EXISTS google_workspace_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL DEFAULT 'constructivedesignsinc.org',
    service_account_email TEXT NOT NULL,
    admin_email TEXT NOT NULL, -- Email of admin who delegated authority
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log workspace account operations
CREATE TABLE IF NOT EXISTS workspace_account_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('create', 'suspend', 'delete', 'update')),
    workspace_email TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_log_profile ON workspace_account_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_log_status ON workspace_account_log(status, created_at DESC);

-- Function to generate workspace email from name
CREATE OR REPLACE FUNCTION generate_workspace_email(
    p_first_name TEXT,
    p_last_name TEXT,
    p_domain TEXT DEFAULT 'constructivedesignsinc.org'
)
RETURNS TEXT AS $$
DECLARE
    base_email TEXT;
    final_email TEXT;
    counter INT := 1;
BEGIN
    -- Create base: firstname.lastname@domain
    base_email := lower(regexp_replace(p_first_name, '[^a-zA-Z]', '', 'g')) || 
                  '.' || 
                  lower(regexp_replace(p_last_name, '[^a-zA-Z]', '', 'g'));
    
    final_email := base_email || '@' || p_domain;
    
    -- Check if email already exists in profiles
    WHILE EXISTS (SELECT 1 FROM profiles WHERE workspace_email = final_email) LOOP
        counter := counter + 1;
        final_email := base_email || counter || '@' || p_domain;
    END LOOP;
    
    RETURN final_email;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check configuration
SELECT * FROM google_workspace_config;

-- Check which profiles need workspace accounts
SELECT 
    id,
    first_name,
    last_name,
    email,
    workspace_email,
    workspace_account_created,
    is_verified_member
FROM profiles
WHERE 
    user_type = 'contractor'
    AND is_verified_member = true
    AND workspace_account_created = false
ORDER BY created_at;

-- Check workspace account creation log
SELECT 
    l.*,
    p.first_name || ' ' || p.last_name as name,
    p.email
FROM workspace_account_log l
LEFT JOIN profiles p ON l.profile_id = p.id
ORDER BY l.created_at DESC
LIMIT 20;

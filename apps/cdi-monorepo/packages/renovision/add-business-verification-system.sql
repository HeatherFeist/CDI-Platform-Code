-- =====================================================
-- BUSINESS VERIFICATION SYSTEM
-- =====================================================
-- Multi-stage verification with document uploads
-- =====================================================

-- Add verification status to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Business verification documents table
CREATE TABLE IF NOT EXISTS business_verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Document types
    document_type TEXT NOT NULL CHECK (document_type IN (
        'business_license',
        'insurance_certificate',
        'ein_letter',
        'llc_filing',
        'corp_filing',
        'other'
    )),
    
    -- File information
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size INTEGER, -- bytes
    mime_type TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For insurance, licenses that expire
    
    -- Extracted data (optional - can be filled by OCR or manual review)
    license_number TEXT,
    ein_number TEXT,
    insurance_policy_number TEXT,
    expiration_date DATE
);

CREATE INDEX IF NOT EXISTS idx_verification_docs_profile ON business_verification_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_business ON business_verification_documents(business_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_status ON business_verification_documents(status);

-- Admin verification queue view
CREATE OR REPLACE VIEW verification_queue AS
SELECT 
    p.id as profile_id,
    p.first_name || ' ' || p.last_name as contractor_name,
    p.email,
    p.phone,
    p.verification_status,
    p.verification_requested_at,
    b.id as business_id,
    b.name as business_name,
    b.city || ', ' || b.state as location,
    b.license_number,
    b.tax_id,
    -- Document counts
    COUNT(DISTINCT CASE WHEN d.document_type = 'business_license' THEN d.id END) as has_license,
    COUNT(DISTINCT CASE WHEN d.document_type = 'insurance_certificate' THEN d.id END) as has_insurance,
    COUNT(DISTINCT CASE WHEN d.document_type = 'ein_letter' THEN d.id END) as has_ein,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as pending_docs,
    COUNT(DISTINCT CASE WHEN d.status = 'approved' THEN d.id END) as approved_docs,
    COUNT(DISTINCT CASE WHEN d.status = 'rejected' THEN d.id END) as rejected_docs,
    MAX(d.uploaded_at) as last_document_upload
FROM profiles p
INNER JOIN businesses b ON p.business_id = b.id
LEFT JOIN business_verification_documents d ON p.id = d.profile_id
WHERE 
    p.user_type = 'contractor'
    AND p.verification_status IN ('pending', 'rejected')
GROUP BY 
    p.id, p.first_name, p.last_name, p.email, p.phone, 
    p.verification_status, p.verification_requested_at,
    b.id, b.name, b.city, b.state, b.license_number, b.tax_id
ORDER BY p.verification_requested_at DESC;

-- Function to submit verification request
CREATE OR REPLACE FUNCTION request_business_verification(
    p_profile_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET 
        verification_status = 'pending',
        verification_requested_at = NOW()
    WHERE id = p_profile_id;
    
    -- Log the request
    INSERT INTO member_verification (profile_id, verification_type, notes)
    VALUES (p_profile_id, 'admin_approval', 'Verification requested - documents uploaded')
    ON CONFLICT (profile_id, verification_type) DO UPDATE
    SET verified_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve verification (triggers workspace account creation)
CREATE OR REPLACE FUNCTION approve_business_verification(
    p_profile_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_workspace_email TEXT;
BEGIN
    -- Get contractor details
    SELECT first_name, last_name INTO v_first_name, v_last_name
    FROM profiles
    WHERE id = p_profile_id;
    
    -- Generate workspace email
    SELECT generate_workspace_email(v_first_name, v_last_name) INTO v_workspace_email;
    
    -- Update profile
    UPDATE profiles
    SET 
        verification_status = 'approved',
        verification_completed_at = NOW(),
        verified_by_admin_id = p_admin_id,
        verification_notes = p_notes,
        workspace_email = v_workspace_email,
        is_verified_member = true,
        visible_in_directory = true,
        member_since = COALESCE(member_since, NOW())
    WHERE id = p_profile_id;
    
    -- Approve all documents
    UPDATE business_verification_documents
    SET 
        status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW()
    WHERE profile_id = p_profile_id AND status = 'pending';
    
    -- Log verification
    INSERT INTO member_verification (profile_id, verification_type, verified_by, notes)
    VALUES (p_profile_id, 'admin_approval', p_admin_id, COALESCE(p_notes, 'Business verified and approved'))
    ON CONFLICT (profile_id, verification_type) DO UPDATE
    SET 
        verified_at = NOW(),
        verified_by = p_admin_id,
        notes = COALESCE(p_notes, 'Business verified and approved');
    
    -- TODO: Trigger Edge Function to create actual Google Workspace account
    -- This will be done via webhook or manual trigger after approval
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject verification
CREATE OR REPLACE FUNCTION reject_business_verification(
    p_profile_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET 
        verification_status = 'rejected',
        verification_completed_at = NOW(),
        verified_by_admin_id = p_admin_id,
        verification_notes = p_reason
    WHERE id = p_profile_id;
    
    -- User can re-submit after fixing issues
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket policy (run in Supabase Storage settings)
-- Bucket name: 'verification-documents'
-- Public: NO
-- Allowed MIME types: image/*, application/pdf

-- RLS for verification documents
ALTER TABLE business_verification_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload own verification documents"
    ON business_verification_documents FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
    );

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own verification documents"
    ON business_verification_documents FOR SELECT
    USING (
        profile_id = auth.uid()
        OR auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
    );

-- Policy: Admins can update document status
CREATE POLICY "Admins can review documents"
    ON business_verification_documents FOR UPDATE
    USING (
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check verification queue (admins)
SELECT * FROM verification_queue;

-- Check specific contractor's documents
SELECT 
    d.*,
    p.first_name || ' ' || p.last_name as contractor_name,
    b.name as business_name
FROM business_verification_documents d
INNER JOIN profiles p ON d.profile_id = p.id
INNER JOIN businesses b ON d.business_id = b.id
WHERE p.id = 'YOUR-PROFILE-ID-HERE'
ORDER BY d.uploaded_at DESC;

-- Check verification statistics
SELECT 
    verification_status,
    COUNT(*) as count
FROM profiles
WHERE user_type = 'contractor'
GROUP BY verification_status;

-- =====================================================
-- EXPECTED WORKFLOW:
-- 1. Contractor uploads documents → status = 'pending'
-- 2. Admin reviews in verification queue
-- 3. Admin calls approve_business_verification() → creates workspace email
-- 4. Contractor receives welcome email with @constructivedesignsinc.org credentials
-- 5. Contractor becomes visible in member directory
-- =====================================================

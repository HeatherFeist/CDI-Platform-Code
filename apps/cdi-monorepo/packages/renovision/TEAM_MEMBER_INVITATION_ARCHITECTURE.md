# Team Member Invitation System Architecture

## Overview
This document outlines the architecture for contractor team member invitations, ensuring proper separation between contractors (nonprofit members) and their employees.

---

## User Types

### 1. Contractors (Primary Members)
- **Email Format**: `firstname.lastname@constructivedesignsinc.org`
- **Provisioned Via**: Google Workspace API (free via Google for Nonprofits)
- **Access Level**: Full (owns business, creates estimates, manages customers)
- **Payment**: Optional donations only
- **Database**: Stored in `profiles` table with `user_type = 'contractor'`

### 2. Team Members (Employees)
- **Email Format**: Their personal email (e.g., `john.smith@gmail.com`)
- **Provisioned Via**: Self-registration after receiving invitation
- **Access Level**: Limited based on role (technician, sales, etc.)
- **Payment**: None (works for contractor)
- **Database**: Stored in `profiles` table with `user_type = 'team_member'`

---

## Database Schema Changes Needed

```sql
-- Add user_type to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'contractor'
CHECK (user_type IN ('contractor', 'team_member', 'admin'));

-- Add workspace_email for contractors only
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workspace_email TEXT UNIQUE;

-- Create team_member_invitations table
CREATE TABLE IF NOT EXISTS team_member_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invitation_code TEXT UNIQUE NOT NULL,
    
    -- Invitation details
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'technician', 'sales')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(business_id, email)
);

-- Index for faster lookups
CREATE INDEX idx_invitations_code ON team_member_invitations(invitation_code);
CREATE INDEX idx_invitations_email ON team_member_invitations(email);
CREATE INDEX idx_invitations_status ON team_member_invitations(status);

-- Create team_member_permissions table (for future granular permissions)
CREATE TABLE IF NOT EXISTS team_member_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Permission flags
    can_view_estimates BOOLEAN DEFAULT true,
    can_create_estimates BOOLEAN DEFAULT false,
    can_edit_estimates BOOLEAN DEFAULT false,
    can_delete_estimates BOOLEAN DEFAULT false,
    can_view_customers BOOLEAN DEFAULT true,
    can_create_customers BOOLEAN DEFAULT false,
    can_edit_customers BOOLEAN DEFAULT false,
    can_view_team BOOLEAN DEFAULT true,
    can_manage_team BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, business_id)
);
```

---

## Invitation Flow

### Step 1: Contractor Invites Team Member

**UI Location**: Team Members tab in Business Settings

```typescript
// components/business/TeamMembersView.tsx
const handleInviteTeamMember = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'manager' | 'technician' | 'sales';
}) => {
    // Generate unique invitation code
    const invitationCode = generateInvitationCode(); // e.g., "CONSTR-ABC123"
    
    // Create invitation in database
    const { data: invitation, error } = await supabase
        .from('team_member_invitations')
        .insert({
            business_id: userProfile.business_id,
            invited_by: userProfile.id,
            invitation_code: invitationCode,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        })
        .select()
        .single();
    
    // Send invitation email
    await sendInvitationEmail({
        to: data.email,
        invitationCode,
        businessName: business.business_name,
        inviterName: `${userProfile.first_name} ${userProfile.last_name}`,
        role: data.role
    });
};
```

### Step 2: Team Member Receives Email

**Email Template**:
```
Subject: You've been invited to join [Business Name] on Constructive Designs

Hi [First Name],

[Contractor Name] has invited you to join their team on Constructive Designs as a [Role].

To accept this invitation:
1. Click here: https://renovision.web.app/accept-invitation/[CODE]
2. Create your account (or sign in if you already have one)
3. Start collaborating!

Your invitation code: CONSTR-ABC123
This invitation expires in 7 days.

Questions? Reply to this email.

- Constructive Designs Team
```

### Step 3: Team Member Signs Up

**New Route**: `/accept-invitation/:code`

```typescript
// components/AcceptInvitationView.tsx
export default function AcceptInvitationView() {
    const { code } = useParams();
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Fetch invitation details
        const fetchInvitation = async () => {
            const { data } = await supabase
                .from('team_member_invitations')
                .select(`
                    *,
                    businesses:business_id(business_name),
                    inviter:invited_by(first_name, last_name)
                `)
                .eq('invitation_code', code)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .single();
            
            setInvitation(data);
            setLoading(false);
        };
        
        fetchInvitation();
    }, [code]);
    
    // Show invitation details and signup form
    // If user already logged in, just accept invitation
    // If not logged in, show signup form with pre-filled email
}
```

### Step 4: Link Account to Business

```typescript
const handleAcceptInvitation = async (userId: string, invitationId: string) => {
    // Update invitation status
    await supabase
        .from('team_member_invitations')
        .update({
            status: 'accepted',
            accepted_by: userId,
            accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);
    
    // Update user profile
    await supabase
        .from('profiles')
        .update({
            business_id: invitation.business_id,
            role: invitation.role,
            user_type: 'team_member'
        })
        .eq('id', userId);
    
    // Create permissions record with default permissions based on role
    await supabase
        .from('team_member_permissions')
        .insert({
            profile_id: userId,
            business_id: invitation.business_id,
            ...getDefaultPermissions(invitation.role)
        });
};
```

---

## Google Workspace Integration

**Only contractors get Workspace emails**:

```typescript
// services/googleWorkspaceService.ts
export const provisionWorkspaceAccount = async (contractor: {
    email: string; // Current email
    firstName: string;
    lastName: string;
    profileId: string;
}) => {
    // Generate workspace email
    const workspaceEmail = `${contractor.firstName.toLowerCase()}.${contractor.lastName.toLowerCase()}@constructivedesignsinc.org`;
    
    // Call Google Workspace Admin SDK to create user
    // (Only for contractors during signup)
    const workspaceUser = await googleWorkspaceAPI.createUser({
        primaryEmail: workspaceEmail,
        name: {
            givenName: contractor.firstName,
            familyName: contractor.lastName
        },
        password: generateSecurePassword(),
        changePasswordAtNextLogin: true
    });
    
    // Update profile with workspace email
    await supabase
        .from('profiles')
        .update({
            workspace_email: workspaceEmail,
            user_type: 'contractor'
        })
        .eq('id', contractor.profileId);
    
    // Send welcome email with credentials
    await sendWorkspaceWelcomeEmail({
        to: contractor.email,
        workspaceEmail,
        temporaryPassword: workspaceUser.password
    });
};
```

---

## Key Benefits

### ✅ Security & Privacy
- Each user controls their own credentials
- No shared accounts
- Clear audit trail of who did what

### ✅ Cost Efficiency
- Google Workspace accounts only for contractors (free via Google for Nonprofits)
- Team members use personal emails (no extra cost)

### ✅ Flexibility
- Team members can work for multiple contractors
- Easy to revoke access when someone leaves
- Invitation codes can be regenerated if compromised

### ✅ Compliance
- Clear data ownership (business owns data, not employees)
- Easy to comply with right-to-be-forgotten (just revoke access)
- Proper separation of contractor vs employee data

### ✅ User Experience
- Contractors: Get professional @constructivedesignsinc.org email
- Team members: Use familiar personal email
- Simple invitation flow (just click link and sign up)

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Add `user_type` column to profiles
- [ ] Add `workspace_email` column to profiles
- [ ] Create `team_member_invitations` table
- [ ] Create `team_member_permissions` table

### Phase 2: Invitation System
- [ ] Build Team Members tab UI
- [ ] Create invitation generation logic
- [ ] Build email template for invitations
- [ ] Create `/accept-invitation/:code` route
- [ ] Build invitation acceptance flow

### Phase 3: Google Workspace Integration
- [ ] Set up Google Workspace Admin SDK
- [ ] Create service account with domain-wide delegation
- [ ] Build `provisionWorkspaceAccount()` function
- [ ] Integrate into contractor signup flow
- [ ] Create welcome email with credentials

### Phase 4: Permissions & Access Control
- [ ] Implement role-based permissions
- [ ] Build permission check middleware
- [ ] Update UI to hide/show features based on permissions
- [ ] Add "Upgrade to Contractor" flow for team members

### Phase 5: Testing & Polish
- [ ] Test full invitation flow
- [ ] Test multiple team members per business
- [ ] Test team member working for multiple contractors
- [ ] Test invitation expiration and revocation
- [ ] Add invitation management UI for contractors

---

## Future Enhancements

### Multi-Business Support
- Team members can work for multiple contractors
- Profile shows list of businesses they're part of
- Switch between businesses in UI

### Advanced Permissions
- Granular permissions per team member
- Custom roles beyond manager/technician/sales
- Project-specific access (only see assigned projects)

### Team Collaboration Features
- Team chat/messaging
- Task assignments and tracking
- Time tracking per project
- Team performance analytics

---

## Questions to Consider

1. **Should team members be able to become contractors later?**
   - YES - Offer "Upgrade to Full Membership" button
   - Provision Workspace account when they upgrade
   - Transfer any existing customers/estimates to new business

2. **Should contractors pay for team member seats?**
   - NO - Keep it free (aligns with nonprofit mission)
   - Optional: Premium tier with unlimited team members

3. **Should team members see each other's work?**
   - YES - Transparency within business
   - But respect project assignments (only see assigned projects)

4. **How to handle team member leaving?**
   - Contractor clicks "Remove Access"
   - Sets invitation status to 'revoked'
   - Team member loses access to that business
   - Keep historical data (estimates they created, etc.)

---

## Technical Notes

### Email Validation
- Check if email already has invitation for this business
- Prevent duplicate invitations
- Allow re-sending expired invitations

### Security
- Invitation codes expire after 7 days
- Rate limit invitation sending (prevent spam)
- Validate invitation code server-side
- Prevent code guessing attacks (long random codes)

### Edge Cases
- Team member accepts invite but already part of another business → Allow (multi-business support)
- Invitation sent to existing user → Skip signup, just link to business
- Contractor deletes business → Auto-revoke all team member access
- Team member deletes account → Null foreign key in invitations (keep record)

---

**Ready to implement this architecture?** Let me know if you want me to start building the database schema and invitation flow! 🚀

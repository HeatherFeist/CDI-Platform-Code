# 🏗️ ROLE-BASED SYSTEM ARCHITECTURE

## 🎯 **The Vision:**

A unified system with **3 distinct roles**, each with their own dashboard and capabilities:

1. **Project Managers** (Nonprofit Org Members)
2. **Contractors** (Business Owners)
3. **Sub-Contractors** (Team Members)

---

## 👥 **Role Definitions:**

### **1. Project Manager** (Nonprofit Staff)
**Who:** Nonprofit organization members  
**Access:** Renovision + Marketplace Admin  
**Responsibilities:**
- ✅ Create turnkey businesses for auction
- ✅ Manage contractor relationships
- ✅ Oversee projects
- ✅ Connect businesses to Google Workspace
- ✅ Add businesses to directory
- ✅ Monitor performance

**Dashboard Capabilities:**
```
PROJECT MANAGER DASHBOARD
├─ 📊 Overview
│  ├─ Active Projects (all contractors)
│  ├─ Turnkey Businesses Created
│  ├─ Auction Performance
│  └─ Revenue Metrics
│
├─ 🏢 Turnkey Business Management
│  ├─ Create New Business
│  ├─ List on Auction
│  ├─ Monitor Bids
│  ├─ Transfer to Winner
│  └─ Google Workspace Setup
│
├─ 👷 Contractor Management
│  ├─ View All Contractors
│  ├─ Approve/Reject Applications
│  ├─ Monitor Performance
│  └─ Assign Projects
│
├─ 📋 Project Oversight
│  ├─ All Active Projects
│  ├─ Project Status
│  ├─ Budget Tracking
│  └─ Quality Control
│
└─ 📁 Directory Management
   ├─ Add to Google Directory
   ├─ Update Business Listings
   └─ Manage Categories
```

---

### **2. Contractor** (Business Owner)
**Who:** Auction winners / Business owners  
**Access:** Renovision (limited) + Marketplace (seller)  
**Responsibilities:**
- ✅ Manage their business
- ✅ Accept/decline projects
- ✅ Hire sub-contractors
- ✅ Submit estimates
- ✅ Track revenue

**Dashboard Capabilities:**
```
CONTRACTOR DASHBOARD
├─ 📊 My Business
│  ├─ Business Profile
│  ├─ Google Workspace Access
│  ├─ Google Business Profile
│  └─ Performance Metrics
│
├─ 📋 My Projects
│  ├─ Active Projects
│  ├─ Pending Estimates
│  ├─ Completed Projects
│  └─ Revenue Tracking
│
├─ 👥 My Team (Sub-Contractors)
│  ├─ Hire Sub-Contractors
│  ├─ Assign Tasks
│  ├─ Track Hours
│  └─ Manage Payments
│
├─ 💰 Financials
│  ├─ Revenue Dashboard
│  ├─ Expenses
│  ├─ Profit/Loss
│  └─ Tax Documents
│
└─ 🏪 Marketplace
   ├─ List Products/Services
   ├─ Manage Inventory
   └─ Customer Reviews
```

---

### **3. Sub-Contractor** (Team Member)
**Who:** Individual workers hired by contractors  
**Access:** Renovision (task-focused)  
**Responsibilities:**
- ✅ Accept/decline task assignments
- ✅ Track time
- ✅ Submit work
- ✅ Get paid

**Dashboard Capabilities:**
```
SUB-CONTRACTOR DASHBOARD
├─ 📋 My Tasks
│  ├─ Pending Invitations
│  ├─ Active Tasks
│  ├─ Completed Tasks
│  └─ Task Calendar
│
├─ ⏱️ Time Tracking
│  ├─ Clock In/Out
│  ├─ Hours This Week
│  └─ Time Reports
│
├─ 💰 Earnings
│  ├─ Pending Payments
│  ├─ Payment History
│  └─ Total Earnings
│
└─ 📱 Communication
   ├─ Messages from Contractor
   ├─ Project Updates
   └─ Google Voice SMS
```

---

## 🔐 **Role-Based Access Control:**

### Database Schema:

```sql
-- Users table (unified across all apps)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'contractor', 'sub_contractor')),
  org_member_id UUID REFERENCES org_members(id), -- For project managers
  business_id UUID REFERENCES businesses(id), -- For contractors
  team_member_id UUID REFERENCES team_members(id), -- For sub-contractors
  created_at TIMESTAMP DEFAULT NOW()
);

-- Org Members (Project Managers)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  org_email TEXT UNIQUE, -- firstname.l@constructivedesignsinc.org
  title TEXT, -- 'Project Manager', 'Director', etc.
  department TEXT,
  can_create_businesses BOOLEAN DEFAULT false,
  can_manage_contractors BOOLEAN DEFAULT false,
  can_access_marketplace_admin BOOLEAN DEFAULT false,
  google_workspace_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Businesses (Contractors)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID REFERENCES users(id),
  llc_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  google_workspace_email TEXT,
  google_business_location_id TEXT,
  created_by_org_member_id UUID REFERENCES org_members(id), -- Who created it
  auction_won_at TIMESTAMP,
  transferred_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team Members (Sub-Contractors)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id), -- Which contractor hired them
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  google_voice_number TEXT,
  hourly_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role, permission)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission) VALUES
-- Project Manager permissions
('project_manager', 'create_turnkey_business'),
('project_manager', 'list_on_auction'),
('project_manager', 'manage_contractors'),
('project_manager', 'view_all_projects'),
('project_manager', 'access_marketplace_admin'),
('project_manager', 'manage_google_directory'),

-- Contractor permissions
('contractor', 'manage_own_business'),
('contractor', 'accept_projects'),
('contractor', 'hire_sub_contractors'),
('contractor', 'submit_estimates'),
('contractor', 'access_marketplace_seller'),

-- Sub-Contractor permissions
('sub_contractor', 'view_assigned_tasks'),
('sub_contractor', 'accept_decline_tasks'),
('sub_contractor', 'track_time'),
('sub_contractor', 'view_earnings');
```

---

## 🔄 **The Complete Flow:**

### **Step 1: Project Manager Creates Business**

```typescript
// Marketplace Admin Panel (Project Manager only)
const CreateTurnkeyBusiness = () => {
  const { user } = useAuth(); // Must be project_manager role
  
  // Verify user is project manager
  if (user.role !== 'project_manager') {
    return <Redirect to="/unauthorized" />;
  }

  const handleCreateBusiness = async () => {
    // Create business
    const business = await createTurnkeyBusiness({
      llc_name: 'Dayton Ohio Painters LLC',
      category: 'Painters',
      city: 'Dayton',
      state: 'Ohio',
      created_by_org_member_id: user.org_member_id // Track who created it
    });

    // Create Google Workspace account
    const googleAccount = await createGoogleWorkspace({
      business_id: business.id,
      email: 'daytonohiopainters@constructivedesignsinc.org',
      org_unit: '/Turnkey Businesses'
    });

    // Add to Google Business Profile
    const businessProfile = await createGoogleBusinessProfile({
      business_id: business.id,
      name: business.llc_name,
      category: business.category,
      location: { city: business.city, state: business.state }
    });

    // List on auction
    await listOnAuction({
      business_id: business.id,
      starting_bid: 5000,
      auction_duration: 7 // days
    });
  };
};
```

---

### **Step 2: Contractor Wins Auction**

```typescript
// When auction ends
async function transferBusinessToWinner(auctionId: string, winnerId: string) {
  // Get winner's user account
  const { data: winner } = await supabase
    .from('users')
    .select('*, businesses(*)')
    .eq('id', winnerId)
    .single();

  // Update business ownership
  await supabase
    .from('businesses')
    .update({
      owner_user_id: winnerId,
      status: 'active',
      transferred_at: new Date().toISOString()
    })
    .eq('id', businessId);

  // Transfer Google Workspace ownership
  await transferGoogleWorkspace({
    business_id: businessId,
    new_owner_email: winner.email
  });

  // Grant contractor role access
  await supabase
    .from('users')
    .update({
      role: 'contractor',
      business_id: businessId
    })
    .eq('id', winnerId);

  // Send welcome email with credentials
  await sendWelcomeEmail({
    to: winner.email,
    business_name: business.llc_name,
    workspace_email: business.google_workspace_email,
    dashboard_url: 'https://renovision.app/contractor/dashboard'
  });
}
```

---

### **Step 3: Contractor Hires Sub-Contractors**

```typescript
// Contractor Dashboard
const HireSubContractor = () => {
  const { user } = useAuth(); // Must be contractor role
  
  if (user.role !== 'contractor') {
    return <Redirect to="/unauthorized" />;
  }

  const handleHire = async (subContractorData) => {
    // Create team member
    const teamMember = await supabase
      .from('team_members')
      .insert({
        business_id: user.business_id,
        first_name: subContractorData.firstName,
        last_name: subContractorData.lastName,
        phone: subContractorData.phone,
        hourly_rate: subContractorData.hourlyRate
      });

    // Create user account for sub-contractor
    await supabase
      .from('users')
      .insert({
        email: subContractorData.email,
        role: 'sub_contractor',
        team_member_id: teamMember.id
      });

    // Setup Google Voice (optional)
    if (subContractorData.wantsGoogleVoice) {
      await setupGoogleVoice({
        team_member_id: teamMember.id,
        business_id: user.business_id
      });
    }

    // Send invitation
    await sendSubContractorInvitation({
      to: subContractorData.email,
      contractor_name: user.business.llc_name,
      dashboard_url: 'https://renovision.app/sub-contractor/dashboard'
    });
  };
};
```

---

## 🗺️ **Google Workspace Directory Integration:**

### **Organizational Structure:**

```
constructivedesignsinc.org
├─ Org Members (Project Managers)
│  ├─ john.d@constructivedesignsinc.org
│  ├─ sarah.m@constructivedesignsinc.org
│  └─ mike.t@constructivedesignsinc.org
│
├─ Turnkey Businesses (Contractors)
│  ├─ daytonohiopainters@constructivedesignsinc.org
│  ├─ daytonohioplumbers@constructivedesignsinc.org
│  └─ daytonohioelectricians@constructivedesignsinc.org
│
└─ Shared Contacts
   ├─ All businesses visible to org members
   └─ Directory auto-updates when business added
```

### **Auto-Add to Directory:**

```typescript
// services/GoogleDirectoryService.ts
export class GoogleDirectoryService {
  
  /**
   * Add business to Google Workspace directory
   * (Called by Project Manager when creating business)
   */
  static async addBusinessToDirectory(businessData: {
    business_id: string;
    llc_name: string;
    workspace_email: string;
    category: string;
    city: string;
    state: string;
    phone_number?: string;
  }) {
    // Create contact in shared directory
    const contact = await google.people.people.createContact({
      requestBody: {
        names: [{
          displayName: businessData.llc_name,
          givenName: businessData.city,
          familyName: businessData.category
        }],
        emailAddresses: [{
          value: businessData.workspace_email,
          type: 'work'
        }],
        phoneNumbers: businessData.phone_number ? [{
          value: businessData.phone_number,
          type: 'work'
        }] : [],
        organizations: [{
          name: 'Constructive Designs Inc',
          title: businessData.category,
          department: 'Turnkey Businesses',
          location: `${businessData.city}, ${businessData.state}`
        }],
        metadata: {
          sources: [{
            type: 'CONTACT',
            id: businessData.business_id
          }]
        }
      }
    });

    // Add to shared directory (visible to all org members)
    await google.admin.directory.groups.members.insert({
      groupKey: 'turnkey-businesses@constructivedesignsinc.org',
      requestBody: {
        email: businessData.workspace_email,
        role: 'MEMBER'
      }
    });

    return contact.data;
  }

  /**
   * Update directory when business info changes
   */
  static async updateDirectoryListing(businessId: string, updates: any) {
    // Update contact in directory
    // ...
  }

  /**
   * Remove from directory when business closes
   */
  static async removeFromDirectory(businessId: string) {
    // Remove contact
    // ...
  }
}
```

---

## 🎨 **Role-Based Dashboard Routing:**

```typescript
// App.tsx
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // Route based on role
  switch (user.role) {
    case 'project_manager':
      return <ProjectManagerApp />;
    
    case 'contractor':
      return <ContractorApp />;
    
    case 'sub_contractor':
      return <SubContractorApp />;
    
    default:
      return <PublicApp />;
  }
};

// ProjectManagerApp.tsx
const ProjectManagerApp = () => {
  return (
    <Router>
      <Route path="/dashboard" element={<ProjectManagerDashboard />} />
      <Route path="/create-business" element={<CreateTurnkeyBusiness />} />
      <Route path="/contractors" element={<ManageContractors />} />
      <Route path="/projects" element={<AllProjects />} />
      <Route path="/directory" element={<GoogleDirectory />} />
    </Router>
  );
};

// ContractorApp.tsx
const ContractorApp = () => {
  return (
    <Router>
      <Route path="/dashboard" element={<ContractorDashboard />} />
      <Route path="/projects" element={<MyProjects />} />
      <Route path="/team" element={<MyTeam />} />
      <Route path="/financials" element={<Financials />} />
    </Router>
  );
};

// SubContractorApp.tsx
const SubContractorApp = () => {
  return (
    <Router>
      <Route path="/dashboard" element={<SubContractorDashboard />} />
      <Route path="/tasks" element={<MyTasks />} />
      <Route path="/time" element={<TimeTracking />} />
      <Route path="/earnings" element={<Earnings />} />
    </Router>
  );
};
```

---

## ✅ **Implementation Checklist:**

### Week 1: Role System
- [ ] Create role-based database schema
- [ ] Add role permissions table
- [ ] Update auth to check roles
- [ ] Create role-based routing

### Week 2: Project Manager Dashboard
- [ ] Create turnkey business form
- [ ] Google Workspace integration
- [ ] Google Directory integration
- [ ] Auction listing flow

### Week 3: Contractor Dashboard
- [ ] Business management
- [ ] Project acceptance
- [ ] Sub-contractor hiring
- [ ] Financial tracking

### Week 4: Sub-Contractor Dashboard
- [ ] Task management
- [ ] Time tracking
- [ ] Earnings view
- [ ] Communication

---

## 🎯 **Benefits:**

### **For the Nonprofit:**
- ✅ Clear accountability (who created each business)
- ✅ Centralized management
- ✅ Google Workspace organization
- ✅ Directory of all businesses

### **For Contractors:**
- ✅ Professional dashboard
- ✅ Team management tools
- ✅ Financial tracking
- ✅ Google integration

### **For Sub-Contractors:**
- ✅ Simple task-focused interface
- ✅ Clear earnings tracking
- ✅ Easy communication
- ✅ Professional tools

---

## 🚀 **Want Me To:**

1. Create the role-based database schema?
2. Build the Project Manager dashboard?
3. Create the Google Directory integration?
4. Set up role-based routing?

**This is a PERFECT organizational structure!** 🎯

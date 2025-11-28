# 🔄 Marketplace Integration Plan

## 🔍 Current State Analysis

### Schema Conflict Discovered

**RenovVision Profiles:**
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20), -- admin, manager, technician, sales
    business_id UUID REFERENCES businesses(id),
    -- Plus: workspace_email, is_verified_member (from member system)
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Marketplace Profiles:**
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    rating NUMERIC (0-5),
    total_reviews INTEGER,
    is_admin BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Critical Differences

| Field | RenovVision | Marketplace |
|-------|-------------|-------------|
| **Name** | `first_name` + `last_name` | `full_name` |
| **Identity** | Email-based | `username` (unique) |
| **Business** | `business_id` (FK) | Not tracked |
| **Member System** | `is_verified_member` | No concept |
| **Rating** | Not tracked | `rating` + `total_reviews` |
| **Role** | `role` (business roles) | `is_admin` only |
| **Workspace** | `workspace_email` | Not tracked |

---

## ✅ Recommended Solution: **Unified Profiles Schema**

### Merge Both Schemas into ONE Table

```sql
-- UNIFIED PROFILES TABLE
-- This combines RenovVision + Marketplace into single schema
-- Run this in your EXISTING Supabase project (gjbrjysuqdvvqlxklvos.supabase.co)

-- Step 1: Add marketplace fields to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Generate usernames from existing data
UPDATE profiles 
SET username = LOWER(REPLACE(first_name || '.' || last_name, ' ', ''))
WHERE username IS NULL;

-- Step 3: Generate full_name from existing data
UPDATE profiles
SET full_name = first_name || ' ' || last_name
WHERE full_name IS NULL;

-- Step 4: Create function to auto-sync names
CREATE OR REPLACE FUNCTION sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync first_name/last_name <-> full_name
    IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.last_name IS NULL) THEN
        NEW.first_name := SPLIT_PART(NEW.full_name, ' ', 1);
        NEW.last_name := SPLIT_PART(NEW.full_name, ' ', 2);
    ELSIF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL AND NEW.full_name IS NULL THEN
        NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
    
    -- Auto-generate username if not provided
    IF NEW.username IS NULL THEN
        NEW.username := LOWER(REPLACE(NEW.first_name || '.' || NEW.last_name, ' ', ''));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add trigger
DROP TRIGGER IF EXISTS sync_names_trigger ON profiles;
CREATE TRIGGER sync_names_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_names();

-- Step 6: Update RLS policies to work with both apps
-- (Marketplace uses username, RenovVision uses email)
```

---

## 📊 Database Migration Strategy

### Option A: Migrate Marketplace to RenovVision Project ✅ **RECOMMENDED**

**Pros:**
- RenovVision already has member system deployed ✅
- Google Workspace integration ready ✅
- Business verification system designed ✅
- Only one project to maintain
- Single source of truth

**Cons:**
- Need to migrate marketplace data
- May have existing marketplace users to transfer

**Steps:**
1. **Backup marketplace data** (if production)
2. **Run unified profiles schema** (SQL above)
3. **Update marketplace .env file:**
   ```bash
   VITE_SUPABASE_URL=https://gjbrjysuqdvvqlxklvos.supabase.co
   VITE_SUPABASE_ANON_KEY=[RenovVision's anon key]
   ```
4. **Run marketplace schema** in RenovVision project:
   - `supabase-setup.sql` (categories, listings, bids, reviews, transactions, notifications)
5. **Update marketplace TypeScript types** to match unified schema:
   ```typescript
   // OLD
   username: string;
   full_name: string;
   
   // NEW (both work now!)
   username?: string;
   full_name?: string;
   first_name?: string;
   last_name?: string;
   ```
6. **Test auth across both apps**
7. **Deploy**

### Option B: Keep Separate Projects ❌ **NOT RECOMMENDED**

This defeats the purpose of unified login and creates technical debt.

---

## 🔗 Integration Points

### 1. **List Leftover Materials** (RenovVision → Marketplace)

**Where:** After estimate is accepted/completed
**Button:** "List Leftover Materials to Marketplace"

**Flow:**
1. Customer accepts estimate with materials
2. Contractor completes job
3. Contractor has leftover materials
4. Click "List Leftovers" button
5. Auto-populate listing:
   - **Title:** Material name from estimate
   - **Description:** "Leftover from [Project Name]"
   - **Starting Bid:** Cost price from estimate
   - **Images:** Upload photos of actual leftovers
   - **Category:** Auto-detect (Lumber, Drywall, Paint, etc.)
6. Create marketplace listing with `source_estimate_id`
7. Show success: "Posted to Marketplace! View Listing →"

**SQL for linking:**
```sql
-- Add to marketplace listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS source_estimate_id UUID REFERENCES estimates(id),
ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('leftover', 'bulk_buy', 'new'));
```

### 2. **Add to Estimate** (Marketplace → RenovVision)

**Where:** Marketplace listing detail page
**Button:** "Add to Estimate"

**Flow:**
1. Contractor viewing marketplace listing
2. Click "Add to Estimate"
3. Modal shows:
   - **New Estimate:** Create new estimate with this item
   - **Existing Estimate:** Dropdown of their draft estimates
4. Select estimate
5. Add item to estimate_materials:
   - **Name:** Listing title
   - **Quantity:** From listing
   - **Unit Cost:** Current bid / Buy Now price
   - **Total:** Calculated
   - **Source:** Marketplace (track it came from marketplace)
6. Update estimate total
7. Show success: "Added to Estimate #[number]! View Estimate →"

**SQL for linking:**
```sql
-- Enhance estimate_materials to track source
ALTER TABLE estimate_materials
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('manual', 'marketplace', 'supplier_api', 'homewyse')),
ADD COLUMN IF NOT EXISTS source_listing_id UUID REFERENCES listings(id),
ADD COLUMN IF NOT EXISTS marketplace_seller_id UUID REFERENCES profiles(id);
```

### 3. **Unified Navigation** (Both Apps)

Add `<UnifiedAppSwitcher>` component to both apps:

**RenovVision:** `components/business/BusinessLayout.tsx`
**Marketplace:** Main layout component

### 4. **Shared Wallet** (Future - Quantum Wallet)

Track all financial transactions in one place:
- Estimate payments → Wallet
- Marketplace sales → Wallet  
- Marketplace purchases → Wallet
- Time tracking → Wallet (work hours = tradeable currency)

---

## 🛠️ Implementation Checklist

### Phase 1: Database Unification ⏳

- [ ] Backup marketplace data (if any exists)
- [ ] Run unified profiles schema SQL (adds marketplace fields to RenovVision)
- [ ] Update marketplace `.env` file to point to RenovVision Supabase
- [ ] Run marketplace database schema in RenovVision project
- [ ] Verify auth works in both apps with same login
- [ ] Test profile data appears correctly in both apps

### Phase 2: TypeScript Type Updates ⏳

- [ ] Update marketplace `src/lib/supabase.ts` Profile type to include:
  - `first_name?`, `last_name?`, `business_id?`
  - `is_verified_member?`, `workspace_email?`
- [ ] Update RenovVision types to include marketplace fields:
  - `username?`, `rating?`, `total_reviews?`
- [ ] Generate unified types from Supabase: `supabase gen types typescript`
- [ ] Replace both apps' type definitions with generated types

### Phase 3: Cross-App Integration ⏳

- [ ] Add `source_estimate_id` and `source_type` to marketplace listings table
- [ ] Add `source` and `source_listing_id` to estimate_materials table
- [ ] Create "List Leftover Materials" button in RenovVision estimates
- [ ] Create "Add to Estimate" button in Marketplace listings
- [ ] Build ListLeftoversModal.tsx component (RenovVision)
- [ ] Build AddToEstimateModal.tsx component (Marketplace)
- [ ] Test round-trip: Estimate → Marketplace → Estimate

### Phase 4: Unified Navigation ⏳

- [ ] Add `<UnifiedAppSwitcher currentApp="renovision" />` to RenovVision
- [ ] Add `<UnifiedAppSwitcher currentApp="marketplace" />` to Marketplace
- [ ] Test navigation between apps
- [ ] Verify auth session persists across domains
- [ ] Deploy both apps with unified nav

### Phase 5: Member-Only Marketplace ⏳

- [ ] Add verification badge to marketplace profiles
- [ ] Show "Verified Member" badge on listings from verified contractors
- [ ] Restrict certain features to verified members:
  - Post store listings (vs auctions)
  - Buy Now option
  - Higher bid limits
- [ ] Add member directory link in marketplace
- [ ] Promote @constructivedesignsinc.org emails in marketplace profiles

---

## 🚀 Quick Start: Next Immediate Steps

### STEP 1: Check Marketplace Supabase URL

**You need to do this NOW:**

1. Open `constructive-designs-marketplace` folder
2. Look for `.env` file (may be hidden)
3. If it doesn't exist, create it from `.env.example`
4. Check the `VITE_SUPABASE_URL` value

**Tell me what you find:**
- ❓ **If .env doesn't exist:** We'll create it pointing to RenovVision's project
- ✅ **If URL = `gjbrjysuqdvvqlxklvos.supabase.co`:** Already unified! Just need to merge schemas
- ❌ **If different URL:** Need to migrate marketplace data

### STEP 2: Run Unified Profiles Schema

Once we confirm the project, run the SQL above to merge profile schemas.

### STEP 3: Test Auth in Marketplace

Try logging into marketplace with your RenovVision credentials:
- Email: `heatherfeist0@gmail.com`
- Should work if same Supabase project ✅

---

## 📈 Success Metrics

After integration, you'll have:
- ✅ **ONE login** accesses both apps
- ✅ **ONE profile** with contractor info + marketplace rating
- ✅ **Circular economy:** Contractors can sell leftovers from estimates
- ✅ **Cost savings:** Buy materials cheaper from marketplace for new estimates
- ✅ **Professional branding:** @constructivedesignsinc.org emails everywhere
- ✅ **Member trust:** Verified members shown with badges
- ✅ **Zero fragmentation:** All data in one Supabase project

---

## 🎯 Your Vision Realized

```
┌─────────────────────────────────────────────────────┐
│  Constructive Designs Nonprofit Ecosystem          │
│  "100% Free Tools for Contractors"                 │
└─────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │RenovVision│  │Marketplace│ │  Wallet  │
   │ Estimates │  │Buy/Sell  │ │ Payments │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
              ┌────────▼────────┐
              │ ONE SUPABASE    │
              │ ONE LOGIN       │
              │ ONE PROFILE     │
              │ ONE COMMUNITY   │
              └─────────────────┘
```

---

## 💬 Questions to Answer

Before proceeding, tell me:

1. **Does marketplace `.env` file exist?** Check the folder
2. **If yes, what's the VITE_SUPABASE_URL?** Copy/paste it
3. **Does marketplace have existing users/data?** Or is it fresh?
4. **Do you want to proceed with unified schema?** (Recommended: YES)

Once you answer these, I'll give you the exact commands to run! 🚀

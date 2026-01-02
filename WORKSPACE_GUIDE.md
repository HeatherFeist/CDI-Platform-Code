# 🗂️ CDI Platform Code Workspace Guide

## 📍 Active Projects Location Map

### ✅ Shop'reneur (ACTIVE)
**Location:** `apps/cdi-monorepo/packages/shopreneur/`
**Status:** 🟢 Live & Deployed
**URL:** https://shopreneur.constructivedesignsinc.org

**Quick Start:**
```bash
cd apps/cdi-monorepo/packages/shopreneur
npm run dev
```

See: [README_ACTIVE_PROJECT.md](apps/cdi-monorepo/packages/shopreneur/README_ACTIVE_PROJECT.md)

---

### ❌ Deprecated Folders (DO NOT USE)
- `Shop-reneur/` - Old Shop'reneur version with errors
- `public/` - Legacy files

---

## 🏗️ Workspace Structure

```
CDI-Platform-Code/
├── apps/
│   └── cdi-monorepo/
│       └── packages/
│           └── shopreneur/     ✅ WORK HERE
│               ├── components/
│               ├── services/
│               ├── supabase/
│               ├── App.tsx
│               ├── package.json
│               └── firebase.json
│
├── Shop-reneur/                ❌ DEPRECATED - DO NOT USE
│   └── DEPRECATED_DO_NOT_USE.md
│
├── public/                     ❌ Legacy folder
│
└── WORKSPACE_GUIDE.md         📖 You are here
```

## 🎯 How to Know You're in the Right Place

### When Working on Shop'reneur
✅ **Correct Path:**
```
/workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/shopreneur/
```

✅ **Check for these files:**
- `README_ACTIVE_PROJECT.md` (should exist)
- `firebase.json` (should have `"public": "dist"`)
- `supabase/migration_fix_products.sql` (latest migration)

❌ **Wrong Path:**
```
/workspaces/CDI-Platform-Code/Shop-reneur/
```

## 🚀 Common Commands

### Development
```bash
# Navigate to active project
cd apps/cdi-monorepo/packages/shopreneur

# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Deploy
firebase deploy
```

### Git Operations
```bash
# Check status
git status

# Add changes
git add apps/cdi-monorepo/packages/shopreneur/

# Commit
git commit -m "Your message"

# Push
git push origin main
```

## 📝 Important Files

### Configuration
- `.env` - Environment variables (not in git)
- `firebase.json` - Deployment config
- `vite.config.ts` - Build config
- `tsconfig.json` - TypeScript config

### Database
- `supabase/schema.sql` - Initial database schema
- `supabase/migration_fix_products.sql` - Latest migration

### Core App
- `App.tsx` - Main application
- `index.tsx` - Entry point
- `types.ts` - Type definitions

## 🔧 Troubleshooting

### "I see 61 errors!"
Those are from the deprecated `Shop-reneur/` folder. Ignore them or delete that folder.

### "Products not saving!"
Run the migration: `supabase/migration_fix_products.sql` in your Supabase SQL Editor

### "Wrong files showing up!"
Make sure you're in: `apps/cdi-monorepo/packages/shopreneur/`

---

**Last Updated:** January 2, 2026

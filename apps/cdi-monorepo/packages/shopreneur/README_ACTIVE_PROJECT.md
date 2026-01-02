# ✅ THIS IS THE ACTIVE SHOP'RENEUR PROJECT

## 🎯 Current Working Directory
**Location:** `/workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/shopreneur/`

This is the **LIVE, DEPLOYED** version of Shop'reneur that is currently running at:
- **Production URL:** https://shopreneur.constructivedesignsinc.org
- **Firebase URL:** https://shopreneur-app.web.app

## 📁 Project Structure
```
apps/cdi-monorepo/packages/shopreneur/
├── components/           ✅ React components (AdminPanel, CartDrawer, etc.)
├── services/            ✅ Database and API services
│   ├── dbService.ts     ✅ Supabase integration
│   ├── geminiService.ts ✅ AI features
│   └── supabase.ts      ✅ Supabase client
├── supabase/            ✅ Database schemas and migrations
│   ├── schema.sql
│   ├── migration_fix_products.sql ✅ Latest migration
│   └── SUPABASE_SETUP.md
├── App.tsx              ✅ Main application component
├── index.tsx            ✅ Application entry point
├── index.html           ✅ HTML entry point
├── types.ts             ✅ TypeScript type definitions
├── package.json         ✅ Dependencies
├── vite.config.ts       ✅ Build configuration
├── firebase.json        ✅ Deployment configuration
└── .env                 ✅ Environment variables (gitignored)
```

## 🚀 Quick Commands
```bash
# Navigate to project
cd /workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/shopreneur

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Preview build locally
npm run preview
```

## 🔧 Recent Features Implemented
- ✅ Product edit functionality
- ✅ Temu marketplace support
- ✅ Shipping address management
- ✅ BYOK (Bring Your Own API Key) for Gemini
- ✅ AI-powered daily challenges with trend scanning
- ✅ Professional indigo/cyan theme
- ✅ Fixed product saving with Supabase upsert
- ✅ Database migration for TEXT IDs

## ⚠️ DO NOT USE These Folders
- ❌ `/workspaces/CDI-Platform-Code/Shop-reneur/` - Old version, not deployed
- ❌ `/workspaces/CDI-Platform-Code/public/` - Legacy folder

## 📝 Environment Setup
Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 🗄️ Database
- **Platform:** Supabase
- **Tables:** products, profiles, shop_settings, messages, sale_records
- **Latest Migration:** Run `migration_fix_products.sql` in Supabase SQL Editor

## 🔗 Related Documentation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide (if exists)

## 📅 Last Updated
January 2, 2026

---

**Always work from this directory for Shop'reneur development!** 🎯

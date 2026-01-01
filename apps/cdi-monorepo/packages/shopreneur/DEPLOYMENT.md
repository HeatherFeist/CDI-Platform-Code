# Shop'reneur Deployment Guide

## 🎯 Quick Deploy Options

Shop'reneur is ready to deploy to multiple platforms. Choose your preferred option:

### Option 1: Deploy to Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. **Connect Your Repository**
   - Click the Deploy button above or go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `HeatherFeist/Shop-reneur`
   - Vercel will auto-detect the Vite configuration

2. **Configure Environment Variables**
   - In your Vercel project settings, add these variables:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. **Connect Your Repository**
   - Go to [netlify.com](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select `HeatherFeist/Shop-reneur`

2. **Build Settings** (auto-configured via netlify.toml)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add the same variables as in Vercel option above

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://your-app.netlify.app`

### Option 3: Deploy to GitHub Pages

1. **Enable GitHub Pages**
   ```bash
   cd /workspaces/CDI-Platform-Code/Shop-reneur
   npm install --save-dev gh-pages
   ```

2. **Add deployment script to package.json**
   ```json
   "scripts": {
     "deploy": "vite build && gh-pages -d dist"
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Configure Repository**
   - Go to GitHub repository Settings > Pages
   - Source: Deploy from branch `gh-pages`
   - Your app will be live at `https://heatherfeist.github.io/Shop-reneur`

---

## 🔧 Pre-Deployment Checklist

- [x] Fixed Firebase import issues
- [x] Created environment configuration
- [x] Dependencies installed
- [x] Build tested successfully
- [x] Deployment configs created (vercel.json, netlify.toml)

## 📝 Environment Variables Needed

Before deploying, ensure you have:

1. **VITE_GEMINI_API_KEY** (Optional - for AI features)
   - Get from: https://makersuite.google.com/app/apikey
   - Used for: Business tips and AI-powered features

2. **VITE_SUPABASE_URL** (For future Supabase migration)
   - Get from: https://app.supabase.com/project/_/settings/api
   - Currently using Firebase, but prepared for Supabase

3. **VITE_SUPABASE_ANON_KEY** (For future Supabase migration)
   - Get from: Same place as Supabase URL
   - Public key safe to expose in frontend

## 🗄️ Database Setup (Firebase - Currently Active)

The app is currently configured to use Firebase:
- **Project ID**: shop-reneurgit-03846395-14409
- **Configuration**: Already set in `services/firebase.ts`
- **No additional setup needed** - credentials are in the code

### Collections in Firebase:
- `products` - Store products
- `settings` - Shop configuration
- `messages` - Direct messages between users

## 🔄 Future Migration to Supabase (Optional)

When ready to migrate from Firebase to Supabase:

1. Run the SQL schema in Supabase:
   - File: `supabase/schema.sql`
   - Follow: `supabase/SETUP_INSTRUCTIONS.md`

2. Update the app to use Supabase:
   - Replace imports in `services/dbService.ts`
   - Use `services/dbService-supabase.ts` instead

3. Update environment variables with real Supabase credentials

---

## 🚀 Deploy Now

**Recommended**: Use Vercel for fastest deployment with automatic SSL and global CDN.

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import repository
4. Add environment variables
5. Click Deploy!

Your Shop'reneur will be live in under 2 minutes! 🎉

---

## 🐛 Troubleshooting

### Build fails with module errors
- Run `npm install` to ensure all dependencies are installed
- Check Node version: `node --version` (should be 18+)

### Firebase connection errors
- Verify Firebase project is active in Firebase Console
- Check network connectivity
- Verify API keys in `services/firebase.ts`

### App loads but no data
- Check Firebase Console > Firestore Database
- Ensure collections exist: products, settings, messages
- Check browser console for detailed errors

### Environment variables not working
- Ensure variables start with `VITE_` prefix
- Restart dev server after changing .env
- For production: set in hosting platform dashboard

---

## 📞 Support

Need help? Check:
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

# Shop'reneur - Entrepreneurship Platform for Young Creators

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🎯 Overview

Shop'reneur is a social commerce platform designed to empower young entrepreneurs to build their own online stores, curate products, and learn business skills through an engaging, gamified experience.

### ✨ Features

- 🛍️ **Product Management** - Add and manage products from Amazon, Shein, and Temu
- 💬 **Community Features** - Direct messaging and community lobby
- 🎨 **Customizable Storefront** - Personalize colors, fonts, and branding
- 📊 **Admin Dashboard** - Track sales, inventory, and business metrics
- 🤖 **AI Business Mentor** - Get tips and advice powered by Google Gemini
- 👔 **Virtual Try-On** - AR features for fashion products (coming soon)
- 💰 **Wishlist to Business** - Turn product wishlists into revenue streams
- 🪙 **Merchant Coins** - Create branded loyalty coins integrated with Image Editor and Quantum Wallet

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key (optional)
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📦 Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Database:** Firebase Firestore (with Supabase migration ready)
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS (via inline styles)
- **Icons:** Lucide React

## 🌐 Deployment

Shop'reneur is ready to deploy! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
- ✅ Vercel (Recommended)
- ✅ Netlify
- ✅ GitHub Pages

All deployment configurations are pre-configured.

## 🗄️ Database

Currently using **Firebase Firestore** with these collections:
- `products` - Product catalog
- `settings` - Store configuration
- `messages` - User messages

**Future Migration:** Supabase schemas are ready in `/supabase/` folder.

## 📂 Project Structure

```
Shop-reneur/
├── components/           # React components
│   ├── AdminPanel.tsx   # Store management
│   ├── ProductCard.tsx  # Product display
│   ├── CartDrawer.tsx   # Shopping cart
│   └── ...
├── services/            # Backend services
│   ├── dbService.ts     # Database operations
│   ├── firebase.ts      # Firebase config
│   └── geminiService.ts # AI integration
├── supabase/           # Database schemas
│   ├── schema.sql      # Supabase schema
│   └── SETUP_INSTRUCTIONS.md
├── App.tsx             # Main app component
├── types.ts            # TypeScript definitions
└── vite.config.ts      # Vite configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

```env
VITE_GEMINI_API_KEY=          # Google Gemini AI (optional)
VITE_SUPABASE_URL=            # For future Supabase migration
VITE_SUPABASE_ANON_KEY=       # For future Supabase migration
```

## 🎨 Customization

Shop'reneur is fully customizable through the Admin Panel:

- **Store Name & Tagline** - Brand your shop
- **Color Scheme** - Primary, secondary, and background colors
- **Typography** - Choose from 8+ font combinations
- **Amazon Affiliate** - Add your affiliate tag

## 📱 AI Studio

This project was created with AI Studio. View the original app:
https://ai.studio/apps/drive/1jKqXIfMKONQtcaXO3cdD0wK2GYuHddV4

## 🤝 Contributing

Part of the CDI Platform ecosystem. See main repository for contribution guidelines.

## 📄 License

Part of Constructive Designs Inc. Platform

## 🆘 Troubleshooting

**Build Issues:**
- Ensure Node.js 18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install`

**Firebase Connection:**
- Verify Firebase project is active
- Check credentials in `services/firebase.ts`

**Environment Variables:**
- All Vite env vars must start with `VITE_`
- Restart dev server after changing `.env`

For more help, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🪙 Merchant Coin Integration

Shop'reneur integrates with **Image Editor** and **Quantum Wallet** for a complete merchant coin experience:

1. **Configure Coins** - Set up your branded loyalty coins in the Admin Panel
2. **Design Logo** - Use Image Editor to create professional coin graphics
3. **Manage Balances** - View customer coins in Quantum Wallet

See [MERCHANT_COIN_WORKFLOW.md](./MERCHANT_COIN_WORKFLOW.md) for the complete integration guide.

---

Built with ❤️ by Constructive Designs Inc.

# Shop'reneur Deployment Guide

## 📋 Current Features Status

### ✅ **Fully Implemented Features**

#### 1. **Affiliate Capabilities**
- ✅ Amazon affiliate link integration
- ✅ Product linking from Amazon, Shein, and Temu
- ✅ Automatic affiliate tracking in product URLs
- ✅ Cost tracking for profit margin calculations
- **Amazon Affiliate Tag**: Configured in settings (`amazonAffiliateTag: 'HeatherFeist1-20'`)

#### 2. **Daily Challenges & Gamification**
- ✅ Daily challenge system with XP and coin rewards
- ✅ Three difficulty levels: Beginner, Intermediate, Advanced
- ✅ Challenge categories: Product Showcase, Behind-the-Scenes, Testimonials
- ✅ Submission tracking and voting system
- ✅ User streaks and completion tracking
- ✅ Leaderboard system
- **Components**: `DailyChallenges.tsx`, `ChallengeSubmission.tsx`, `ChallengeVoting.tsx`, `Leaderboard.tsx`

#### 3. **Facebook/Social Media Integration**
- ✅ Facebook OAuth connection flow
- ✅ Instagram OAuth connection flow
- ✅ Social media permission management
- ✅ Auto-posting capabilities (framework ready)
- ✅ Connection status monitoring
- **Component**: `SocialConnect.tsx`
- **Service**: `socialService.ts`

#### 4. **Additional Features**
- ✅ Merchant Coins system (branded loyalty coins)
- ✅ Community Lobby & Direct Messaging
- ✅ AI Business Mentor (Google Gemini powered)
- ✅ Virtual Try-On (AR features)
- ✅ Customizable storefront (colors, fonts, branding)
- ✅ Real-time Firebase integration

---

## 🚀 Deployment Options

### **Option 1: Firebase Hosting (Recommended - Easiest)**

#### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

#### Steps
```bash
# 1. Navigate to Shop'reneur directory
cd /workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/shopreneur

# 2. Build the production version
npm run build

# 3. Initialize Firebase (if needed)
firebase init hosting
# Select: Use existing project -> shopreneur-app
# Public directory: dist
# Single-page app: Yes
# Overwrite index.html: No

# 4. Deploy
firebase deploy --only hosting

# 5. Your site will be live at:
# https://shopreneur-app.web.app
# https://shopreneur-app.firebaseapp.com
```

#### Custom Domain Setup (GoDaddy → Firebase)
```bash
# 1. Add custom domain in Firebase Console
firebase hosting:channel:deploy live --domain shopreneur.constructivedesignsinc.org

# 2. In GoDaddy DNS Settings, add:
# Type: A
# Name: shopreneur
# Value: 151.101.1.195 (Firebase IP)
# Value: 151.101.65.195 (Firebase IP)

# Type: TXT
# Name: shopreneur
# Value: [Firebase verification code from console]

# Wait 10-60 minutes for DNS propagation
```

---

### **Option 2: Self-Hosting on Your Server**

#### Server Requirements
- Node.js 18+ or web server (Nginx/Apache)
- 1GB+ RAM
- 10GB+ disk space

#### Method A: Static Hosting (Nginx/Apache)

**1. Build the app:**
```bash
cd /workspaces/CDI-Platform-Code/apps/cdi-monorepo/packages/shopreneur
npm install
npm run build
```

**2. Copy `dist` folder to your server:**
```bash
# Using SCP
scp -r dist/* user@your-server.com:/var/www/shopreneur/

# Or using SFTP/FTP via FileZilla
```

**3. Nginx Configuration** (`/etc/nginx/sites-available/shopreneur`):
```nginx
server {
    listen 80;
    server_name shopreneur.constructivedesignsinc.org;
    root /var/www/shopreneur;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**4. Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/shopreneur /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. SSL Certificate (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d shopreneur.constructivedesignsinc.org
```

#### Method B: Node.js Server (Express)

**1. Create server file** (`server.js`):
```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shop'reneur running on port ${PORT}`);
});
```

**2. Install Express:**
```bash
npm install express
```

**3. Run with PM2 (process manager):**
```bash
npm install -g pm2
pm2 start server.js --name shopreneur
pm2 startup
pm2 save
```

---

### **Option 3: Netlify (Alternative)**

#### Steps
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist

# 4. Set custom domain in Netlify dashboard
```

---

## 🌐 GoDaddy DNS Configuration

### For Firebase Hosting
```
Type: A
Host: shopreneur
Points to: 151.101.1.195
         151.101.65.195

Type: TXT
Host: shopreneur
TXT Value: [Firebase verification string]
```

### For Your Own Server
```
Type: A
Host: shopreneur
Points to: [Your Server IP]
TTL: 1 Hour

Type: CNAME (if using www)
Host: www.shopreneur
Points to: shopreneur.constructivedesignsinc.org
TTL: 1 Hour
```

---

## 📊 Deployment Comparison

| Feature | Firebase | Self-Host (Nginx) | Self-Host (Node) |
|---------|----------|-------------------|------------------|
| **Setup Time** | 5 mins | 30 mins | 20 mins |
| **Cost** | Free (125GB/mo) | Server cost only | Server cost only |
| **SSL** | Automatic | Manual (Certbot) | Manual (Certbot) |
| **CDN** | Built-in | Need CloudFlare | Need CloudFlare |
| **Scaling** | Automatic | Manual | Manual |
| **Complexity** | Easiest | Medium | Medium |
| **Control** | Limited | Full | Full |

---

## 🔧 Environment Variables

Create `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=shopreneur-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shopreneur-app
VITE_FIREBASE_STORAGE_BUCKET=shopreneur-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🎯 Recommended: Firebase Hosting

**Why?**
- ✅ Easiest setup (5 minutes)
- ✅ Free tier is generous (125GB/month)
- ✅ Automatic SSL certificates
- ✅ Global CDN included
- ✅ Easy rollbacks
- ✅ CI/CD integration
- ✅ Custom domain support

**When to self-host?**
- You need server-side processing (APIs)
- You want 100% control
- You already have a server
- You need custom server configurations

---

## 📝 Post-Deployment Checklist

- [ ] Test affiliate links work correctly
- [ ] Verify Facebook/Instagram OAuth redirects
- [ ] Check daily challenges load properly
- [ ] Test merchant coin creation
- [ ] Verify mobile responsiveness
- [ ] Test all navigation flows
- [ ] Check analytics integration
- [ ] Monitor performance (Lighthouse score)
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup strategy

---

## 🆘 Troubleshooting

### Firebase Deploy Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
firebase logout
firebase login
firebase deploy --debug
```

### Custom Domain Not Working
- Wait 24-48 hours for DNS propagation
- Clear browser cache (Ctrl+Shift+Del)
- Use DNS checker: https://dnschecker.org
- Verify DNS settings in GoDaddy

### Build Errors
```bash
# Check Node version
node -v  # Should be 18+

# Clear Vite cache
rm -rf dist node_modules/.vite
npm run build
```

---

## 📞 Support

Need help? Contact:
- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Email**: support@constructivedesignsinc.org

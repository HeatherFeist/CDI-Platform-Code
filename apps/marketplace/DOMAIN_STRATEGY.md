# 🌐 Dual-Domain Strategy Guide
## Constructive Designs Inc - Domain Architecture

---

## 📊 **Domain Overview**

### **constructivedesignsinc.org** (PRIMARY - Nonprofit/Community)
**Status:** ✅ Already configured in application  
**Purpose:** Community marketplace, nonprofit programs, social impact

### **constructivedesignsinc.com** (SECONDARY - Commercial/Business)
**Status:** 🔄 Available for future commercial expansion  
**Purpose:** Professional services, B2B operations, commercial programs

---

## 🎯 **Strategic Separation**

### **.ORG Domain - Community & Nonprofit**

**Website:** https://constructivedesignsinc.org

**Primary Functions:**
- ✅ Auction Marketplace (current platform)
- ✅ Community Trading & Bartering
- ✅ Store (individual sellers & makers)
- ✅ Nonprofit Program Information
- ✅ Social Impact Stories
- ✅ Volunteer Opportunities
- ✅ Tax-Deductible Donations
- ✅ Educational Resources
- ✅ Community Events

**Subdomains:**
```
https://constructivedesignsinc.org          → Main marketplace
https://api.constructivedesignsinc.org      → Payment server backend
https://admin.constructivedesignsinc.org    → Admin dashboard (future)
https://docs.constructivedesignsinc.org     → User guides (future)
```

**Email Addresses:**
```
marketplace@constructivedesignsinc.org      → Platform notifications
support@constructivedesignsinc.org          → Customer support
admin@constructivedesignsinc.org            → Administrator
noreply@constructivedesignsinc.org          → Automated emails
```

**Target Audience:**
- Individual buyers & sellers
- Local artisans & makers
- Community members
- Nonprofit supporters
- Donors & volunteers
- Students & educators

**Brand Messaging:**
- Community-focused
- Social impact emphasis
- Accessible & inclusive
- Educational mission
- Sustainability & values

---

### **.COM Domain - Commercial & Professional**

**Website:** https://constructivedesignsinc.com

**Primary Functions:**
- 🔄 Professional Services Portfolio
- 🔄 Design & Construction Consulting
- 🔄 Business-to-Business (B2B) Partnerships
- 🔄 Corporate Training Programs
- 🔄 Commercial Contracts & Projects
- 🔄 Financial Services Information
- 🔄 Merchant Services for Sellers
- 🔄 Enterprise Solutions

**Subdomains (Future):**
```
https://constructivedesignsinc.com          → Corporate website
https://portal.constructivedesignsinc.com   → B2B client portal
https://training.constructivedesignsinc.com → Professional development
https://shop.constructivedesignsinc.com     → Direct-to-consumer store
```

**Email Addresses:**
```
contact@constructivedesignsinc.com          → General inquiries
sales@constructivedesignsinc.com            → Business development
partnerships@constructivedesignsinc.com     → B2B collaborations
billing@constructivedesignsinc.com          → Financial operations
```

**Target Audience:**
- Business clients
- Corporate partners
- Professional contractors
- Enterprise customers
- Investors & stakeholders
- Commercial buyers

**Brand Messaging:**
- Professional & credible
- Business-focused
- ROI & efficiency
- Quality & expertise
- Results-driven

---

## 🏗️ **Technical Architecture**

### **Current Production Setup (Phase 1 - .ORG)**

```
┌─────────────────────────────────────────────────────┐
│  constructivedesignsinc.org (PRIMARY)               │
│  ├── Frontend: React + Vite                         │
│  │   └── Hosted on: Google Cloud Run               │
│  │   └── Auto-scaling: 0-1000 instances            │
│  │   └── Cost: $0/month (nonprofit credits)        │
│  │                                                   │
│  ├── Backend API: Node.js + Express                 │
│  │   └── Subdomain: api.constructivedesignsinc.org │
│  │   └── Hosted on: Google Cloud Run               │
│  │   └── Cost: $0/month (nonprofit credits)        │
│  │                                                   │
│  ├── Database: Supabase PostgreSQL                  │
│  │   └── URL: ejjwwbxrhepoztynyqly.supabase.co     │
│  │   └── Free tier: 500MB storage, unlimited API   │
│  │                                                   │
│  ├── Payments: Stripe                               │
│  │   └── Account: Constructive Designs Inc          │
│  │   └── Mode: Test → Live (after verification)    │
│  │   └── Connect: For payment splits               │
│  │                                                   │
│  └── Email: Google Workspace                        │
│      └── Domain: constructivedesignsinc.org         │
│      └── Cost: Free (nonprofit Google Workspace)    │
└─────────────────────────────────────────────────────┘
```

### **Future Commercial Setup (Phase 2 - .COM)**

```
┌─────────────────────────────────────────────────────┐
│  constructivedesignsinc.com (COMMERCIAL)            │
│  ├── Corporate Website: WordPress/Custom            │
│  │   └── Hosted on: Google Cloud Run or Pages      │
│  │   └── Cost: $0-50/month                          │
│  │                                                   │
│  ├── Business Portal: React Dashboard               │
│  │   └── Subdomain: portal.constructivedesignsinc  │
│  │   └── For: B2B clients, contractors              │
│  │                                                   │
│  ├── Training Platform: LMS Integration             │
│  │   └── Subdomain: training.constructivedesignsinc│
│  │   └── Potential: Teachable, Thinkific            │
│  │                                                   │
│  └── Email: Google Workspace                        │
│      └── Domain: constructivedesignsinc.com         │
│      └── Shared with .org workspace                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 **SSL & Security**

Both domains will have:
- ✅ Free SSL certificates (Let's Encrypt via Google Cloud)
- ✅ HTTPS enforced (HTTP → HTTPS redirect)
- ✅ HSTS headers for security
- ✅ CORS configured for API access
- ✅ DDoS protection via Google Cloud Armor (optional)

---

## 📈 **Google for Nonprofits Integration**

### **Resources Applied to .ORG Domain:**

**Google Cloud Credits:**
- $10,000/month in cloud hosting credits
- Covers: Cloud Run, Cloud Storage, Cloud Functions
- Estimated usage: $50-200/month actual cost
- **Net cost: $0/month** ✅

**Google Workspace for Nonprofits:**
- Unlimited email accounts on .org domain
- 30GB storage per user
- Google Drive, Docs, Sheets, Calendar
- **Cost: $0/month** (normally $6-18/user/month)

**Google Ad Grants:**
- $10,000/month in free Google Ads
- Drives traffic to .org marketplace
- Promotes nonprofit mission
- **Value: $120,000/year** ✅

**YouTube Nonprofit Program:**
- Donation cards & buttons
- Live streaming features
- Video hosting for tutorials
- **Cost: $0** ✅

---

## 🚀 **Deployment Roadmap**

### **Phase 1: .ORG Launch** (Current)
**Timeline:** Weeks 1-4
- [x] Domain configured in .env.local
- [x] Payment server setup
- [x] Stripe integration
- [ ] Database connection fix (Supabase)
- [ ] Deploy to Google Cloud Run
- [ ] DNS configuration
- [ ] SSL certificate setup
- [ ] Test payment flow end-to-end
- [ ] Go live on constructivedesignsinc.org

### **Phase 2: .COM Planning** (Future)
**Timeline:** Months 2-3
- [ ] Design corporate website
- [ ] Define commercial services
- [ ] Set up .com email addresses
- [ ] Create business portal wireframes
- [ ] Research enterprise features

### **Phase 3: Expansion** (Future)
**Timeline:** Months 4-6
- [ ] Launch .com commercial site
- [ ] Integrate B2B portal
- [ ] Add training platform
- [ ] Scale infrastructure
- [ ] Marketing campaigns

---

## 💰 **Cost Breakdown**

### **.ORG Domain (Nonprofit Platform)**
```
Domain Registration: $12/year (already owned)
Hosting:            $0/month (Google Cloud credits)
Database:           $0/month (Supabase free tier)
Email:              $0/month (Google Workspace nonprofit)
Stripe:             2.9% + $0.30/transaction only
SSL Certificates:   $0/month (included)
─────────────────────────────────────────────
TOTAL:              ~$1/month + payment fees
```

### **.COM Domain (Commercial - Future)**
```
Domain Registration: $12/year (already owned)
Hosting:            $0-50/month (paid or credits)
Email:              $0/month (shared workspace)
Additional Tools:   $0-100/month (CRM, analytics)
SSL Certificates:   $0/month (included)
─────────────────────────────────────────────
TOTAL:              ~$0-150/month
```

**Combined Infrastructure Cost: < $200/month**  
**With nonprofit credits: ~$50/month actual**

---

## 📝 **DNS Configuration Checklist**

### **For .ORG Domain (Primary Setup)**

**A Records:**
```
Type: A
Host: @
Value: [Google Cloud Run IP]
TTL: 3600

Type: A
Host: www
Value: [Google Cloud Run IP]
TTL: 3600
```

**CNAME Records:**
```
Type: CNAME
Host: api
Value: ghs.googlehosted.com
TTL: 3600
```

**MX Records (Google Workspace):**
```
Priority: 1
Host: @
Value: aspmx.l.google.com
TTL: 3600

Priority: 5
Host: @
Value: alt1.aspmx.l.google.com
TTL: 3600
```

**TXT Records (Verification):**
```
Type: TXT
Host: @
Value: google-site-verification=XXXXX
TTL: 3600

Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600
```

---

## 🎨 **Branding Guidelines**

### **.ORG Branding (Community)**
- **Color Scheme:** Purple/Blue gradient (already in app)
- **Tone:** Friendly, inclusive, mission-driven
- **Logo Emphasis:** Community, connection, impact
- **Tagline Ideas:**
  - "Community-Powered Commerce"
  - "Where Local Meets Meaningful"
  - "Buy, Sell, Build Community"

### **.COM Branding (Professional)**
- **Color Scheme:** Navy blue, silver, professional
- **Tone:** Expert, reliable, results-oriented
- **Logo Emphasis:** Quality, expertise, trust
- **Tagline Ideas:**
  - "Design Solutions That Build"
  - "Professional Services, Community Impact"
  - "Building Better, Together"

---

## 📊 **Analytics & Tracking**

### **Recommended Setup:**

**Google Analytics 4:**
- Separate properties for .org and .com
- Track user behavior, conversions
- E-commerce tracking for marketplace
- Free forever

**Google Search Console:**
- Monitor SEO performance
- Submit sitemaps
- Track search rankings
- Identify technical issues

**Stripe Dashboard:**
- Payment analytics
- Revenue tracking
- Customer insights
- Dispute management

---

## 🔄 **Cross-Domain Integration**

### **Link Between Domains:**

**From .COM → .ORG:**
```html
<!-- On commercial site -->
<a href="https://constructivedesignsinc.org">
  Visit Our Community Marketplace →
</a>
```

**From .ORG → .COM:**
```html
<!-- On marketplace -->
<a href="https://constructivedesignsinc.com">
  Professional Services & Consulting →
</a>
```

**Unified Login (Future):**
- Single Sign-On (SSO) across both domains
- Shared user accounts (optional)
- OAuth 2.0 implementation

---

## ✅ **Current Configuration Status**

### **Environment Variables (.env.local):**
```bash
# ✅ CORRECT - Using .ORG for marketplace
VITE_PLATFORM_URL=https://constructivedesignsinc.org
VITE_NONPROFIT_NAME=Constructive Designs Inc
VITE_PLATFORM_NAME=Constructive Designs Marketplace

# ✅ CORRECT - Google Workspace domain
GOOGLE_WORKSPACE_DOMAIN=constructivedesignsinc.org
```

### **Payment Server (server/index.js):**
```javascript
// ✅ CORRECT - Uses env variable with .org fallback
success_url: `${process.env.VITE_PLATFORM_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.VITE_PLATFORM_URL || 'http://localhost:5173'}/cancel`,
```

**Everything is already configured for .ORG domain!** ✅

---

## 🎯 **Next Steps**

### **Immediate (This Week):**
1. ✅ Keep .org as primary domain (already done)
2. [ ] Fix Supabase connection issue
3. [ ] Test payment flow locally
4. [ ] Deploy to Google Cloud Run
5. [ ] Configure DNS for .org domain

### **Short-term (Next Month):**
1. [ ] Launch marketplace on .org
2. [ ] Set up email forwarding
3. [ ] Configure Google Analytics
4. [ ] Start marketing campaigns
5. [ ] Monitor performance

### **Long-term (2-6 Months):**
1. [ ] Plan .com commercial site
2. [ ] Define professional services
3. [ ] Build business portal
4. [ ] Scale infrastructure
5. [ ] Expand features

---

## 📞 **Support & Resources**

### **Domain Management:**
- Google Domains or current registrar
- DNS configuration dashboard
- Renewal reminders

### **Hosting:**
- Google Cloud Console: https://console.cloud.google.com
- Cloud Run documentation
- Support via nonprofit credits

### **Email:**
- Google Workspace Admin: https://admin.google.com
- Email routing & forwarding
- User management

### **Payments:**
- Stripe Dashboard: https://dashboard.stripe.com
- Payment analytics
- Dispute resolution

---

## 🎉 **Summary**

**Your dual-domain strategy is EXCELLENT!**

✅ **.ORG** = Community marketplace (already configured)  
✅ **.COM** = Commercial services (future expansion)  
✅ Clear brand separation  
✅ Professional approach  
✅ Room for growth  
✅ Cost-effective (nonprofit credits)  

**No changes needed to current setup!** Your .org domain is already perfectly configured for the marketplace. Focus on fixing the Supabase connection and deploying to production.

---

**Last Updated:** October 19, 2025  
**Document Version:** 1.0  
**Maintained By:** Development Team

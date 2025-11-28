# PayPal Subscription Plan IDs

## 🎯 All Plan IDs Extracted

### **Quantum Wallet**

#### Premium Monthly
- **Plan ID**: `P-87H32227A0938135HNEQLN5Q`
- **Price**: $9.99/month
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Premium Annual
- **Plan ID**: `P-3BW179848A932372DNEQLLEQ`
- **Price**: $99/year
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

---

### **Marketplace**

#### Seller Basic - Monthly
- **Plan ID**: `P-8SN117578V952590JNEQLQ3Y`
- **Price**: $19.99/month
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Seller Basic - Annual
- **Plan ID**: `P-09A48292HP398024RNEQLUGY`
- **Price**: $199/year
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Seller Pro - Monthly
- **Plan ID**: `P-33T28179SY762323ENEQLYOA`
- **Price**: $49.99/month
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Seller Pro - Annual
- **Plan ID**: `P-20F33667JC077163GNEQL4FQ`
- **Price**: $499/year
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

---

### **Renovision**

#### Contractor Basic - Monthly
- **Plan ID**: `P-6FW20423FJ943074DNEQMAFA`
- **Price**: $29.99/month
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Contractor Basic - Annual
- **Plan ID**: `P-86Y85660WF768463CNEQMCQI`
- **Price**: $299/year
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Contractor Pro - Monthly
- **Plan ID**: `P-1SN994830T828530PNEQME7I`
- **Price**: $79.99/month
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

#### Contractor Pro - Annual
- **Plan ID**: (Missing - need to create)
- **Price**: $799/year
- **Client ID**: `AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630`

---

## 📋 Environment Variables Format

### Quantum Wallet `.env`
```
VITE_PAYPAL_CLIENT_ID=AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630
VITE_PAYPAL_PLAN_PREMIUM_MONTHLY=P-87H32227A0938135HNEQLN5Q
VITE_PAYPAL_PLAN_PREMIUM_ANNUAL=P-3BW179848A932372DNEQLLEQ
```

### Marketplace `.env`
```
VITE_PAYPAL_CLIENT_ID=AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630
VITE_PAYPAL_PLAN_BASIC_MONTHLY=P-8SN117578V952590JNEQLQ3Y
VITE_PAYPAL_PLAN_BASIC_ANNUAL=P-09A48292HP398024RNEQLUGY
VITE_PAYPAL_PLAN_PRO_MONTHLY=P-33T28179SY762323ENEQLYOA
VITE_PAYPAL_PLAN_PRO_ANNUAL=P-20F33667JC077163GNEQL4FQ
```

### Renovision `.env`
```
REACT_APP_PAYPAL_CLIENT_ID=AWBu2G2orx3u1xtW-46uQVOi6Q0jIDp75rukPBD5lGQtNxPFD-Lve2Q3UEDoDWLEMhxT9XncHiMbQ630
REACT_APP_PAYPAL_PLAN_BASIC_MONTHLY=P-6FW20423FJ943074DNEQMAFA
REACT_APP_PAYPAL_PLAN_BASIC_ANNUAL=P-86Y85660WF768463CNEQMCQI
REACT_APP_PAYPAL_PLAN_PRO_MONTHLY=P-1SN994830T828530PNEQME7I
REACT_APP_PAYPAL_PLAN_PRO_ANNUAL=(MISSING - NEED TO CREATE)
```

---

## ⚠️ **NOTICE: Missing Plan**

**Renovision Contractor Pro - Annual** plan is missing!

You need to create one more plan:
- **Name**: Renovision Contractor Pro - Annual
- **Price**: $799/year
- **Billing Cycle**: Annual

---

## 🚀 Next Steps

1. ✅ Create missing Renovision Pro Annual plan
2. ✅ Update `.env` files with Plan IDs
3. ✅ Build pricing pages for each app
4. ✅ Test subscription flows
5. ✅ Deploy!

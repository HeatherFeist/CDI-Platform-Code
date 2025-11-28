# GoDaddy DNS Setup - Quick Reference

## Your Domain: constructivedesignsinc.org

---

## DNS Records to Add

### 1. Root Domain (constructivedesignsinc.org)

**A Records** - Point to Firebase:
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 600 seconds
```

```
Type: A
Name: @
Value: 151.101.65.195
TTL: 600 seconds
```

---

### 2. Marketplace Subdomain (marketplace.constructivedesignsinc.org)

**CNAME Record:**
```
Type: CNAME
Name: marketplace
Value: marketplace.web.app
TTL: 600 seconds
```

*Replace `marketplace.web.app` with your actual Firebase hosting site URL*

---

### 3. RenoVision Subdomain (renovision.constructivedesignsinc.org)

**CNAME Record:**
```
Type: CNAME
Name: renovision
Value: renovision.web.app
TTL: 600 seconds
```

---

### 4. WWW Subdomain (Optional)

**CNAME Record:**
```
Type: CNAME
Name: www
Value: constructivedesignsinc.org
TTL: 600 seconds
```

---

## How to Add Records in GoDaddy

### Step-by-Step:

1. **Login to GoDaddy**
   - Go to https://godaddy.com
   - Click "Sign In" (top right)
   - Enter your credentials

2. **Navigate to DNS Management**
   - Click your profile icon → "My Products"
   - Find "constructivedesignsinc.org"
   - Click the three dots (⋯) → "Manage DNS"

3. **Add A Records** (for root domain)
   - Scroll to "Records" section
   - Click "Add New Record"
   - Select Type: **A**
   - Name: **@** (this means root domain)
   - Value: **151.101.1.195**
   - TTL: **600 seconds** (or "Custom" → 10 minutes)
   - Click "Save"
   - Repeat for second A record with **151.101.65.195**

4. **Add CNAME for Marketplace**
   - Click "Add New Record"
   - Select Type: **CNAME**
   - Name: **marketplace**
   - Value: **marketplace.web.app** (or your Firebase site URL)
   - TTL: **600 seconds**
   - Click "Save"

5. **Add CNAME for RenoVision**
   - Click "Add New Record"
   - Select Type: **CNAME**
   - Name: **renovision**
   - Value: **renovision.web.app**
   - TTL: **600 seconds**
   - Click "Save"

---

## Final DNS Configuration Table

| Type  | Name        | Value                           | TTL      |
|-------|-------------|---------------------------------|----------|
| A     | @           | 151.101.1.195                   | 600      |
| A     | @           | 151.101.65.195                  | 600      |
| CNAME | marketplace | marketplace.web.app             | 600      |
| CNAME | renovision  | renovision.web.app              | 600      |
| CNAME | www         | constructivedesignsinc.org      | 600      |

---

## Verification Commands

After adding DNS records, verify with:

```powershell
# Check root domain
nslookup constructivedesignsinc.org

# Check marketplace subdomain
nslookup marketplace.constructivedesignsinc.org

# Check renovision subdomain
nslookup renovision.constructivedesignsinc.org

# Alternative: Use dig (if available)
dig constructivedesignsinc.org
dig marketplace.constructivedesignsinc.org
dig renovision.constructivedesignsinc.org
```

---

## Important Notes

### DNS Propagation Time
- **Initial propagation**: 30 minutes to 2 hours
- **Full propagation**: Up to 24-48 hours
- **TTL effect**: 600 seconds = 10 minutes (records update faster)

### Firebase Hosting Site Names
Make sure these match your Firebase Console:
- Go to Firebase Console → Hosting
- Click "Add another site" if needed
- Note the exact site name (e.g., `renovision`, `marketplace`)
- Use that in CNAME records as `[sitename].web.app`

### Common Mistakes to Avoid
❌ Don't include `https://` in CNAME value
❌ Don't add trailing dot (.) in CNAME value (GoDaddy adds it automatically)
❌ Don't use A records for subdomains (use CNAME instead)
✅ Do use lowercase for subdomain names
✅ Do wait for DNS propagation before testing
✅ Do verify Firebase site names match exactly

---

## Troubleshooting

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Cause:** DNS records not yet propagated
**Solution:** Wait 1-2 hours and try again

### Issue: CNAME shows "@ is not allowed"
**Cause:** Trying to use CNAME for root domain
**Solution:** Use A records for root (@), CNAME for subdomains

### Issue: "This site can't be reached"
**Cause:** Firebase hosting not deployed or DNS not propagated
**Solution:** 
1. Verify Firebase deployment: `firebase deploy --only hosting:renovision`
2. Wait for DNS propagation
3. Clear browser cache (Ctrl+Shift+Del)

### Issue: "Your connection is not private" (SSL error)
**Cause:** Firebase SSL certificate not yet provisioned
**Solution:** Wait 1-2 hours for Firebase to provision SSL certificate

---

## Testing Checklist

After DNS setup, test these URLs (wait 1-2 hours first):

- [ ] http://constructivedesignsinc.org → Redirects to HTTPS
- [ ] https://constructivedesignsinc.org → Loads correctly
- [ ] https://marketplace.constructivedesignsinc.org → Loads marketplace app
- [ ] https://renovision.constructivedesignsinc.org → Loads reno vision app
- [ ] https://www.constructivedesignsinc.org → Redirects to root

---

## DNS Propagation Checker

Use online tools to check DNS propagation worldwide:
- https://www.whatsmydns.net/
- https://dnschecker.org/

Enter your domain and check if records are visible globally.

---

## Screenshot Guide

When in GoDaddy DNS Management, you should see:

```
┌─────────────────────────────────────────────────────┐
│ Records                                   [Add New] │
├─────────────────────────────────────────────────────┤
│ Type │ Name        │ Value              │ TTL  │ ✏️ │
├──────┼─────────────┼────────────────────┼──────┼────┤
│ A    │ @           │ 151.101.1.195      │ 600  │ ⋯  │
│ A    │ @           │ 151.101.65.195     │ 600  │ ⋯  │
│ CNAME│ marketplace │ marketplace.web... │ 600  │ ⋯  │
│ CNAME│ renovision  │ renovision.web.app │ 600  │ ⋯  │
│ CNAME│ www         │ construction...    │ 600  │ ⋯  │
└─────────────────────────────────────────────────────┘
```

---

**Status:** Ready to configure
**Time Required:** 10-15 minutes (setup) + 1-2 hours (propagation)
**Difficulty:** Easy

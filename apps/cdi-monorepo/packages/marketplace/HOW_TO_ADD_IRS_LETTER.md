# How to Add Your IRS Determination Letter

## ✅ New Page Created: `/nonprofit-status`

I've created a dedicated **501(c)(3) Tax-Exempt Status** page at:
**http://localhost:3003/nonprofit-status**

This page is specifically designed to showcase your IRS determination letter and verify your nonprofit credentials.

---

## 📄 Where to Upload Your IRS Letter

### **Option 1: Upload as PDF** (Recommended - Most Professional)

#### Step 1: Save Your PDF
1. Scan or save your IRS determination letter as a PDF
2. Name it: `IRS-Determination-Letter.pdf`

#### Step 2: Add to Public Folder
```
Auction Platform/
  public/
    documents/          ← Create this folder
      IRS-Determination-Letter.pdf   ← Put PDF here
```

#### Step 3: Create the documents folder
In your terminal, run:
```powershell
New-Item -Path "public\documents" -ItemType Directory
```

#### Step 4: Copy your PDF there
```powershell
Copy-Item "C:\path\to\your\IRS-letter.pdf" "public\documents\IRS-Determination-Letter.pdf"
```

#### Step 5: Uncomment the PDF viewer
Edit `src/components/nonprofit/NonprofitStatusPage.tsx` (lines ~50-55):

**Remove this:**
```tsx
{/* <iframe 
  src="/documents/IRS-Determination-Letter.pdf" 
  className="w-full h-96 border border-gray-300 rounded"
  title="IRS Determination Letter"
/> */}
```

**Replace with:**
```tsx
<iframe 
  src="/documents/IRS-Determination-Letter.pdf" 
  className="w-full h-96 border border-gray-300 rounded"
  title="IRS Determination Letter"
/>
```

---

### **Option 2: Upload as Image** (Alternative - For Scanned Documents)

#### Step 1: Convert to Image
1. Scan your IRS letter as JPG or PNG
2. Name it: `irs-determination-letter.jpg`

#### Step 2: Add to Public Folder
```
Auction Platform/
  public/
    images/            ← Create this folder
      irs-determination-letter.jpg   ← Put image here
```

#### Step 3: Create the images folder
```powershell
New-Item -Path "public\images" -ItemType Directory
```

#### Step 4: Uncomment the image code
Edit `src/components/nonprofit/NonprofitStatusPage.tsx` (lines ~57-62):

**Remove this:**
```tsx
{/* <img 
  src="/images/irs-determination-letter.jpg" 
  alt="IRS 501(c)(3) Determination Letter" 
  className="max-w-full h-auto border border-gray-300 rounded shadow-md mx-auto"
/> */}
```

**Replace with:**
```tsx
<img 
  src="/images/irs-determination-letter.jpg" 
  alt="IRS 501(c)(3) Determination Letter" 
  className="max-w-full h-auto border border-gray-300 rounded shadow-md mx-auto"
/>
```

---

## 🔗 Where the Page is Linked

Your new nonprofit status page is automatically linked from:

1. **Footer** - "501(c)(3) Status" link (on every page)
2. **Direct URL** - `/nonprofit-status`

### Optional: Add to Header Dropdown

Edit `src/components/layout/Header.tsx` to add it to the "About Us" dropdown:

```tsx
<Link
  to="/nonprofit-status"
  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
>
  501(c)(3) Status
</Link>
```

---

## 🎨 What the Page Includes

### ✅ Verification Box
- EIN: 86-3183952
- Date Recognized: April 4, 2021
- Classification: Public Charity
- Deductibility Status: Tax-Deductible

### ✅ IRS Determination Letter Display
- Embedded PDF viewer (or image)
- Download button
- Full-size view option

### ✅ Donor Information
- What tax-exempt status means
- How donations are tax-deductible
- IRS compliance information

### ✅ Verification Links
- IRS Tax Exempt Organization Search
- GuideStar profile
- Charity Navigator

---

## 📋 Quick Setup Checklist

- [ ] Create `public/documents` folder
- [ ] Copy IRS determination letter PDF to folder
- [ ] Uncomment PDF viewer code in NonprofitStatusPage.tsx
- [ ] Remove placeholder div
- [ ] Test at http://localhost:3003/nonprofit-status
- [ ] Verify download button works
- [ ] Check PDF displays correctly

---

## 🔒 Security & Privacy Considerations

### Safe to Publish:
✅ IRS determination letter (public record)
✅ EIN number (already required for donations)
✅ Organization name and address
✅ Date of recognition

### Keep Private:
❌ Social Security Numbers
❌ Financial account information
❌ Board member personal addresses
❌ Internal financial documents (beyond Form 990)

**Note:** Your IRS determination letter is a public document and is safe to display on your website. Many nonprofits do this to build credibility!

---

## 💡 Alternative: Link Instead of Embed

If you prefer NOT to embed the PDF directly, you can just link to it:

```tsx
<a
  href="/documents/IRS-Determination-Letter.pdf"
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:underline"
>
  View IRS Determination Letter (PDF)
</a>
```

---

## 🌟 Benefits of This Page

### For Donors:
- **Transparency:** See official IRS verification
- **Trust:** Verify legitimacy before donating
- **Tax Benefits:** Confirm donations are tax-deductible

### For Google Ad Grants:
- **Credibility:** Shows legitimate nonprofit status
- **Compliance:** Demonstrates transparency
- **Verification:** Easy for reviewers to confirm

### For Community:
- **Legitimacy:** Differentiates from scams
- **Confidence:** Official government recognition
- **Professionalism:** Shows organizational maturity

---

## 🚀 Test Your Page

1. **Refresh browser:** http://localhost:3003/nonprofit-status
2. **Check all sections:** Verification box, letter display, links
3. **Test download:** Click "Download PDF" button
4. **Verify links:** External verification links work
5. **Mobile test:** Resize browser to check responsive design

---

## 📱 Where Else to Mention Your Letter

### On the About Page
Add a callout box linking to nonprofit-status:

```tsx
<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
  <p className="text-green-900">
    ✓ IRS-Verified 501(c)(3) Nonprofit
    <a href="/nonprofit-status" className="text-green-600 underline ml-2">
      View Our Determination Letter
    </a>
  </p>
</div>
```

### On the Donate Page
Add trust badge:

```tsx
<div className="text-center p-4 bg-blue-50 rounded-lg">
  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
  <p className="text-sm text-gray-700">
    IRS-Verified 501(c)(3) • 
    <a href="/nonprofit-status" className="text-blue-600 underline ml-1">
      See Our Determination Letter
    </a>
  </p>
</div>
```

### In Email Signatures
```
Constructive Designs Inc.
501(c)(3) Nonprofit | EIN: 86-3183952
View our IRS determination letter: constructivedesignsinc.org/nonprofit-status
```

---

## 🎯 Next Steps

1. **Find your IRS letter** - Check email or TechSoup documents
2. **Save as PDF** - If it's a paper copy, scan it
3. **Upload to public/documents/** - Follow steps above
4. **Uncomment viewer code** - Enable PDF display
5. **Test the page** - Verify everything works
6. **Share the link** - Use in grant applications, emails, social media

---

## ❓ Don't Have Your Letter Yet?

If you can't find your IRS determination letter:

1. **Check TechSoup** - They may have sent it with your account activation
2. **Check IRS.gov** - Search Tax Exempt Organization database
3. **Request Copy from IRS:**
   - Call: 1-877-829-5500
   - Write: IRS Exempt Organizations
   - Include: EIN 86-3183952, organization name

4. **Use Placeholder** - Page works without the letter displayed
   - Just shows verification box and links
   - Add letter later when you find it

---

## 🎉 Your Nonprofit Status Page is Ready!

Visit: **http://localhost:3003/nonprofit-status**

This professional page showcases your legitimate 501(c)(3) status, builds donor trust, and helps with Google Ad Grants compliance. Upload your IRS letter when ready!

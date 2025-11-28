# Edit Listing Feature Guide

## 🎯 Overview
Sellers can now edit their auction listings after creation, with smart protections to prevent issues with active bidding.

## ✨ Key Features

### 1. **Smart Edit Access**
- ✅ Only sellers can edit their own listings
- ✅ Can only edit listings that haven't received bids yet
- ✅ Edit button automatically hidden once bids are placed
- ✅ Clear error messages if editing is not allowed

### 2. **Complete Form Pre-Population**
- All fields automatically filled with current listing data
- Images load from existing listing
- Pricing information pre-populated
- Category and condition selections retained

### 3. **Full AI Features Available**
Just like creating a new listing, you can use all AI tools when editing:
- 🖼️ **Analyze Image** - AI vision to identify items and suggest details
- ✍️ **Generate Description** - Create compelling descriptions
- 💰 **Suggest Pricing** - Get AI-powered pricing recommendations
- ✨ **Improve Description** - Enhance existing descriptions
- 🎨 **AI Photo Enhancement** - Chat with Gemini AI for photo editing guidance

### 4. **Important Safeguards**
- **Bid Reset Warning**: Changing the starting bid resets the current bid to the new starting price
- **No Editing with Bids**: Once someone bids, editing is disabled to protect bidders
- **Seller Verification**: System verifies you own the listing before allowing edits

## 📍 Where to Edit

### From Dashboard
1. Navigate to **Dashboard** from the menu
2. Click the **"Selling"** tab to see your active listings
3. Find the listing you want to edit
4. Click the green **"Edit"** button (only visible for active listings without bids)

### From Listing Detail Page
1. View your own listing
2. If the listing has no bids yet, you'll see a green **"Edit Listing"** button
3. Click to go directly to the edit page

## 🛠️ How to Edit a Listing

### Step 1: Access the Edit Page
- From Dashboard or Listing Detail, click the **Edit** button
- You'll be taken to the edit form with all current data loaded

### Step 2: Make Your Changes
Update any of these fields:
- **Title** - Make it more descriptive or fix typos
- **Description** - Add more details or improve clarity
- **Category** - Change if you initially selected wrong category
- **Condition** - Update: New, Used, or Handcrafted
- **Images** - Add new images or remove existing ones
- **Starting Bid** - ⚠️ Warning: This resets current bid!
- **Bid Increment** - Adjust minimum bid increases
- **Reserve Price** - Set or change minimum acceptable price
- **Buy Now Price** - Add or change instant purchase option

### Step 3: Use AI Tools (Optional)
- Click **"Analyze Image"** to get AI suggestions from your photos
- Click **"Generate Description"** to create a new description
- Click **"Suggest Pricing"** for AI-powered pricing recommendations
- Click **"Improve Description with AI"** to enhance what you've written
- Use **AI Photo Enhancement** chat for editing guidance

### Step 4: Save Changes
- Review your changes
- Click **"Save Changes"** to update the listing
- Or click **"Cancel"** to discard changes

## ⚠️ Important Limitations

### Cannot Edit If:
1. **Listing Has Received Bids**
   - Once anyone places a bid, editing is locked
   - This protects bidders from changing auction conditions
   - You'll see: "Cannot edit a listing that has received bids"

2. **You're Not the Owner**
   - Only the seller who created the listing can edit it
   - You'll see: "You do not have permission to edit this listing"

3. **Auction Has Ended**
   - Can only edit active auctions
   - Edit button doesn't appear for ended listings

### What Happens When You Edit:

#### Starting Bid Changes:
```
If you change the starting bid:
- Current bid resets to new starting bid
- This prevents situations where starting bid is higher than current bid
- ⚠️ Only do this if absolutely necessary!
```

#### Image Changes:
```
- New images are uploaded to listing-images storage bucket
- Old images remain unless you remove them
- You can have multiple images (recommended)
```

#### Duration/End Time:
```
- End time is NOT editable (set during creation)
- This prevents extending auctions indefinitely
- Plan your duration carefully when creating
```

## 🎨 AI Features in Edit Mode

All the same AI features from creating a listing work in edit mode:

### OpenAI Features (Requires VITE_OPENAI_API_KEY):
1. **Analyze Image** (GPT-4 Vision)
   - Identifies item type
   - Suggests title and category
   - Estimates condition and value
   - Detects key features

2. **Generate Description** (GPT-4)
   - Creates compelling, SEO-friendly descriptions
   - Highlights key features and benefits
   - Professional tone

3. **Suggest Pricing** (GPT-4)
   - Market research-based pricing
   - Considers category, condition, features
   - Suggests starting bid, reserve, buy now prices
   - Includes reasoning

4. **Improve Description** (GPT-4)
   - Enhances clarity and appeal
   - Fixes grammar and structure
   - Adds persuasive elements

### Gemini AI Features (Requires VITE_GEMINI_API_KEY):
5. **AI Photo Enhancement Chat** (Gemini Pro Vision)
   - Quality analysis and scoring
   - Photo coaching with grades
   - Custom edit guidance
   - Conversational interface
   - Tool recommendations for advanced edits

## 💡 Best Practices

### When to Edit:
- ✅ Fix typos or unclear descriptions immediately
- ✅ Add forgotten details or specifications
- ✅ Upload better quality photos
- ✅ Adjust pricing if no bids yet
- ✅ Change category if incorrectly classified

### When NOT to Edit:
- ❌ After receiving bids (not allowed anyway)
- ❌ Just to extend auction time (not possible)
- ❌ To dramatically change item (create new listing instead)
- ❌ To lower starting bid below current bid (system prevents this)

### Tips for Better Edits:
1. **Use AI to Improve** - Run "Improve Description" on your existing text
2. **Better Photos** - Use AI Photo Enhancement chat to get photography tips
3. **Check Spelling** - Review carefully before saving
4. **Pricing Strategy** - Use "Suggest Pricing" to validate your changes
5. **Complete Information** - Add all relevant details bidders might want

## 🔧 Technical Details

### Route:
```
/listings/:id/edit
```

### Component:
```typescript
EditListing.tsx
- Fetches existing listing data
- Validates seller ownership
- Checks for bids before allowing edits
- Pre-populates all form fields
- Uses UPDATE instead of INSERT
- All AI features included
```

### Security Checks:
1. **User Authentication**: Must be logged in
2. **Ownership Verification**: `listing.seller_id === user.id`
3. **Bid Check**: Query bids table, only allow edit if count = 0
4. **Automatic Redirect**: If checks fail, redirects to appropriate page

### Database Operations:
```typescript
// Update listing
supabase
  .from('listings')
  .update({
    title, description, category_id, condition,
    images, starting_bid, current_bid, // current_bid resets to starting_bid
    reserve_price, buy_now_price, bid_increment
  })
  .eq('id', listingId)
```

### What Gets Updated:
- ✅ All listing fields (title, description, etc.)
- ✅ Images array (add/remove)
- ✅ Pricing (resets current_bid to new starting_bid)
- ❌ NOT updated: end_time, created_at, seller_id, status

## 🚀 Quick Start

1. **Go to Dashboard**: Click "Dashboard" in header
2. **Find Your Listing**: Look in "Selling" tab
3. **Check for Edit Button**: Green "Edit" button appears if editable
4. **Make Changes**: Update whatever needs changing
5. **Use AI**: Optionally enhance with AI tools
6. **Save**: Click "Save Changes"

## ❓ Troubleshooting

### "Cannot edit a listing that has received bids"
- **Why**: Someone has already bid on your listing
- **Solution**: Cannot edit once bids are placed - this protects bidders
- **Alternative**: Contact support if critical error needs fixing

### "You do not have permission to edit this listing"
- **Why**: You're not the seller
- **Solution**: Only the original seller can edit their listings

### "Listing not found"
- **Why**: Invalid listing ID or listing was deleted
- **Solution**: Return to dashboard and verify listing exists

### Images not uploading
- **Why**: listing-images storage bucket not configured
- **Solution**: Run `QUICK_FIX.sql` in Supabase SQL Editor
- **See**: `FIX_IMAGE_UPLOAD.md` for detailed fix

### AI features not working
- **Why**: Missing API keys
- **Solution**: Add `VITE_OPENAI_API_KEY` and/or `VITE_GEMINI_API_KEY` to `.env`
- **See**: Phase guides for setup instructions

## 📊 Feature Status

- ✅ Edit form with pre-populated data
- ✅ Seller ownership verification
- ✅ Bid count checking
- ✅ All AI features (OpenAI + Gemini)
- ✅ Image upload/removal
- ✅ Edit button in Dashboard (Selling tab)
- ✅ Edit button in ListingDetail (for seller, no bids)
- ✅ Route: `/listings/:id/edit`
- ✅ Automatic redirects for unauthorized access
- ✅ Warning about bid reset
- ✅ Full form validation

## 🎉 Summary

The Edit Listing feature gives sellers control to improve their listings while protecting bidders with smart restrictions. Use it to fix mistakes, improve descriptions with AI, add better photos, and optimize your auction for success!

**Remember**: Once someone bids, editing is locked to ensure fair auctions for everyone. 🔒

---

*For more information about AI features, see:*
- `AI_LISTING_ASSISTANT_GUIDE.md` - OpenAI features
- `GEMINI_CHAT_GUIDE.md` - Image enhancement chat

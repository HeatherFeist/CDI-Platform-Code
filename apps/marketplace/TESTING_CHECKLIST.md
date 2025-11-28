# 🧪 Testing Checklist - Store/Auction Hybrid Platform

## ⚠️ IMPORTANT: Pre-Testing Setup

### 1. Database Migration (REQUIRED)
Before testing, you **MUST** run the database migration:

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `src/database/QUICK_FIX.sql`
4. Paste and **Run** the SQL
5. Verify success messages appear

**Why?** This adds the new columns (`listing_type`, `stock_quantity`, `compare_at_price`, `allow_offers`) to your database.

---

## 🎯 Testing Sequence

### ✅ Phase 1: Basic Setup (5 min)

#### Test 1.1: Application Loads
- [ ] Homepage loads without errors
- [ ] Header displays correctly
- [ ] "Store" link visible in navigation
- [ ] Cart icon visible (with 0 badge or no badge)

#### Test 1.2: Authentication
- [ ] Click "Sign In" 
- [ ] Enter credentials or sign up
- [ ] Successfully logged in
- [ ] Username appears in header
- [ ] "List Item" button appears

---

### ✅ Phase 2: Create Store Item (10 min)

#### Test 2.1: Access Creation Page
- [ ] Click "List Item" button
- [ ] CreateListing page loads
- [ ] See "Auction" and "Store" toggle options

#### Test 2.2: Toggle to Store Mode
- [ ] Click "Store" option (green card)
- [ ] Checkmark appears on Store
- [ ] Auction fields disappear (Duration, Bid Increment, etc.)
- [ ] Store fields appear (Stock Quantity, Compare Price, etc.)

#### Test 2.3: Fill Store Item Details
- [ ] **Title**: Enter "Test Store Item - Wireless Headphones"
- [ ] **Description**: Enter some description
- [ ] **Category**: Select "Electronics"
- [ ] **Condition**: Select "New"
- [ ] **Price**: Enter "49.99"
- [ ] **Stock Quantity**: Enter "10"
- [ ] **Compare At Price**: Enter "79.99" (optional)
- [ ] **Allow Offers**: Check the box (optional)
- [ ] Upload at least one image (or skip for testing)

#### Test 2.4: Preview & Create
- [ ] See savings preview: "Save $30.00 (38% off)"
- [ ] Click "Create Listing"
- [ ] Success message appears
- [ ] Redirects to Dashboard

---

### ✅ Phase 3: Dashboard Store Tab (5 min)

#### Test 3.1: View Store Tab
- [ ] Dashboard loads
- [ ] See tabs: "Auctions", "Store" (green icon), "Bidding", "Sold", "Won"
- [ ] Click "Store" tab
- [ ] Tab highlights in green

#### Test 3.2: Verify Store Item Display
- [ ] Your store item appears
- [ ] Green "STORE" badge visible
- [ ] Shows "Price" (not "Current Bid")
- [ ] Price displayed in green: "$49.99"
- [ ] Compare-at-price shown crossed out: "$79.99"
- [ ] Stock quantity shown: "10 in stock" (in green)
- [ ] View count displayed
- [ ] Category badge shown

#### Test 3.3: Edit Store Item
- [ ] Click "Edit" button (green)
- [ ] Edit page loads with pre-filled data
- [ ] Change price to "39.99"
- [ ] Change stock to "8"
- [ ] Click "Update Listing"
- [ ] Returns to Dashboard
- [ ] Changes reflected

---

### ✅ Phase 4: Browse Store Items (8 min)

#### Test 4.1: Navigate to Store
- [ ] Click "Store" link in header
- [ ] BrowseStore page loads at `/store/browse`
- [ ] Green gradient header displays
- [ ] Your store item appears in grid

#### Test 4.2: Test Search
- [ ] Type "Headphones" in search box
- [ ] Your item appears in results
- [ ] Type "xyz123" (non-existent)
- [ ] "No Items Found" message appears
- [ ] Clear search

#### Test 4.3: Test Category Filter
- [ ] Open category dropdown
- [ ] Select "Electronics"
- [ ] Only electronics items show
- [ ] Select "All Categories"
- [ ] All items show again

#### Test 4.4: Test Price Range Filter
- [ ] Enter Min: "30"
- [ ] Enter Max: "50"
- [ ] Only items in that range show
- [ ] Your $39.99 item should appear
- [ ] Clear filters

#### Test 4.5: Test Sorting
- [ ] Select "Price: Low to High"
- [ ] Items sorted by price ascending
- [ ] Select "Price: High to Low"
- [ ] Items sorted by price descending
- [ ] Select "Newest First"
- [ ] Items sorted by date

#### Test 4.6: Test View Mode
- [ ] Click Grid icon (default)
- [ ] Items show in grid layout
- [ ] Click List icon
- [ ] Items show in list layout (if implemented)

---

### ✅ Phase 5: Store Item Detail Page (8 min)

#### Test 5.1: Navigate to Item
- [ ] Click on your store item
- [ ] Detail page loads at `/listings/:id`
- [ ] Green "STORE ITEM" badge at top

#### Test 5.2: Verify Store UI Elements
- [ ] Price shows in large green: "$39.99"
- [ ] Compare-at-price crossed out: "$79.99"
- [ ] Savings shown: "Save $40.00 (50% off)"
- [ ] Stock display: "8 units in stock"
- [ ] Quantity selector visible (with +/- buttons)
- [ ] "Add to Cart" button (green)
- [ ] NO bidding section visible
- [ ] NO "Place Bid" button
- [ ] NO time countdown

#### Test 5.3: Test Quantity Selector
- [ ] Default quantity is 1
- [ ] Click "+" button → quantity becomes 2
- [ ] Click "+" button → quantity becomes 3
- [ ] Click "-" button → quantity becomes 2
- [ ] Type "5" directly → accepts
- [ ] Try to type "100" → should limit to 8 (max stock)
- [ ] Try to type "0" → should reset to 1

#### Test 5.4: Add to Cart
- [ ] Set quantity to 2
- [ ] Click "Add to Cart" (green button)
- [ ] Green toast notification appears: "Added to cart!"
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Cart icon badge updates: shows "2"
- [ ] Cart icon has green badge

---

### ✅ Phase 6: Shopping Cart (10 min)

#### Test 6.1: Open Cart
- [ ] Click cart icon in header
- [ ] Cart sidebar slides in from right
- [ ] Green gradient header: "Shopping Cart (2)"
- [ ] Your item appears with quantity 2

#### Test 6.2: Verify Cart Item Display
- [ ] Item image shows
- [ ] Item title shows
- [ ] Price per unit: "$39.99"
- [ ] Quantity selector: shows "2"
- [ ] Subtotal: "$79.98" (2 × $39.99)

#### Test 6.3: Update Quantity in Cart
- [ ] Click "+" button → quantity becomes 3
- [ ] Subtotal updates to "$119.97"
- [ ] Cart badge updates to "3"
- [ ] Click "-" button → quantity becomes 2
- [ ] Subtotal updates to "$79.98"

#### Test 6.4: Test Stock Validation
- [ ] Try to increase quantity to 9 (more than stock)
- [ ] Should be limited to 8 (max stock available)
- [ ] Error message or prevention should occur

#### Test 6.5: Remove Item
- [ ] Click "Remove" (trash icon) button
- [ ] Item disappears from cart
- [ ] Cart shows empty state
- [ ] Cart badge disappears or shows "0"
- [ ] Message: "Your cart is empty"

#### Test 6.6: Add Multiple Items (if you have more)
- [ ] Go back to browse
- [ ] Add another store item to cart
- [ ] Cart shows 2 different items
- [ ] Total calculates correctly

---

### ✅ Phase 7: Checkout Process (10 min)

#### Test 7.1: Prepare for Checkout
- [ ] Ensure cart has at least 1 item (quantity 2)
- [ ] Verify subtotal shows correctly
- [ ] Verify total shows correctly
- [ ] Note current stock (should be 8)

#### Test 7.2: Execute Checkout
- [ ] Click "Checkout" button (green)
- [ ] Loading spinner appears briefly
- [ ] Success message: "Order placed successfully!"
- [ ] Cart clears (empty state)
- [ ] Cart badge disappears
- [ ] Redirects to Dashboard

#### Test 7.3: Verify Transaction Created
- [ ] Go to Dashboard
- [ ] Check if transaction appears (depends on your transaction UI)
- [ ] Transaction should show:
  - Item title
  - Quantity: 2
  - Total: $79.98
  - Status: "completed" or similar

#### Test 7.4: Verify Stock Updated
- [ ] Go back to store item detail page
- [ ] Stock should now show: "6 units in stock" (8 - 2 = 6)
- [ ] Stock counter updates correctly

#### Test 7.5: Test Out of Stock
- [ ] Add 6 items to cart (all remaining stock)
- [ ] Checkout
- [ ] Stock should show: "0 units in stock" or "Out of Stock"
- [ ] "Add to Cart" button should be disabled or hidden
- [ ] Red "Out of Stock" message displays

---

### ✅ Phase 8: Seller Storefront (8 min)

#### Test 8.1: Navigate to Your Storefront
- [ ] Click your username anywhere in the app
- [ ] Navigates to `/store/:yourusername`
- [ ] StorefrontPage loads

#### Test 8.2: Verify Storefront Header
- [ ] Green gradient header
- [ ] Your avatar/initial displays
- [ ] Your username shows: "Your Username's Store"
- [ ] Rating and review count (if you have any)
- [ ] Member since date
- [ ] Item count shows correctly

#### Test 8.3: Verify Items Display
- [ ] Only YOUR store items appear
- [ ] Auction items do NOT appear here
- [ ] Items show in grid
- [ ] Each item shows:
  - Price
  - Stock quantity
  - Image
  - Title

#### Test 8.4: Test Storefront Filters
- [ ] Search within your store
- [ ] Filter by category
- [ ] Sort items
- [ ] Toggle grid/list view
- [ ] All filters work correctly

---

### ✅ Phase 9: Create Auction Item (Verify Separation) (5 min)

#### Test 9.1: Create Auction to Test Separation
- [ ] Click "List Item"
- [ ] Toggle to "Auction" (blue)
- [ ] Fill in auction details:
  - Title: "Test Auction Item"
  - Starting Bid: "10.00"
  - Duration: "7 days"
  - Bid Increment: "1.00"
- [ ] Click "Create Listing"

#### Test 9.2: Verify Dashboard Separation
- [ ] Go to Dashboard
- [ ] Click "Auctions" tab
- [ ] Auction item appears here
- [ ] Click "Store" tab
- [ ] Auction item does NOT appear here
- [ ] Only store items show

#### Test 9.3: Verify Browse Pages Separation
- [ ] Go to "Browse" (homepage)
- [ ] Auction items appear
- [ ] Go to "Store" (browse store)
- [ ] Only store items appear
- [ ] Auction items do NOT appear

---

### ✅ Phase 10: Edge Cases & Validation (10 min)

#### Test 10.1: Cart Persistence
- [ ] Add item to cart
- [ ] Refresh page (F5)
- [ ] Cart still has items
- [ ] Badge shows correct count

#### Test 10.2: Prevent Adding Auction to Cart
- [ ] Go to auction item detail page
- [ ] Should NOT see "Add to Cart" button
- [ ] Should see "Place Bid" button instead
- [ ] Try to manually add (shouldn't be possible)

#### Test 10.3: Out of Stock Handling
- [ ] Create store item with 0 stock
- [ ] Detail page shows "Out of Stock" message
- [ ] "Add to Cart" button disabled/hidden
- [ ] Can't add to cart

#### Test 10.4: Edit Restrictions
- [ ] Try to edit store item after someone purchases
- [ ] Should still be able to edit (or check your business logic)

#### Test 10.5: Mobile Responsiveness
- [ ] Resize browser to mobile width (375px)
- [ ] Header collapses to hamburger menu
- [ ] "Store" link in mobile menu
- [ ] Cart icon responsive
- [ ] Store items stack vertically
- [ ] Filters collapse/expand properly
- [ ] Add to cart button full-width

#### Test 10.6: Loading States
- [ ] Navigate to slow-loading page
- [ ] Loading spinner shows
- [ ] Content loads after spinner

#### Test 10.7: Empty States
- [ ] Dashboard Store tab with no items → Empty state with CTA
- [ ] Empty cart → "Your cart is empty" message
- [ ] Browse Store with no items → Empty state

---

### ✅ Phase 11: Cross-Feature Integration (5 min)

#### Test 11.1: Mixed Cart (if implemented)
- [ ] Verify auction items can't be added to cart
- [ ] Only store items allowed
- [ ] Multiple different store items in cart work

#### Test 11.2: Trade Proposals (if applicable)
- [ ] Store items still show "Propose Trade" button
- [ ] Trading functionality still works

#### Test 11.3: AI Features
- [ ] Create listing with AI suggestions
- [ ] Works for both auction and store types
- [ ] AI description generation works
- [ ] AI image analysis works

---

## ✅ Phase 12: Visual & UI Testing (5 min)

#### Test 12.1: Color Coding
- [ ] Auctions = Blue theme
- [ ] Store = Green theme
- [ ] Consistent throughout app

#### Test 12.2: Badges
- [ ] "STORE" badge = Green
- [ ] "BUY NOW" badge (auctions) = Orange/Green
- [ ] Badges clearly visible

#### Test 12.3: Icons
- [ ] Gavel = Auctions
- [ ] Store icon = Store features
- [ ] ShoppingCart = Cart/Add to cart
- [ ] Package = Stock/Inventory
- [ ] All icons display correctly

#### Test 12.4: Typography
- [ ] Prices readable and prominent
- [ ] Stock counts clear
- [ ] Headings hierarchical
- [ ] Body text legible

---

## 🐛 Bug Tracking Template

If you find issues, document them:

### Bug Report Format:
```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/etc.]
**Console Errors**: [Any errors in browser console]
**Screenshots**: [If applicable]
```

---

## 📊 Success Criteria

### Must Pass:
✅ All store items display correctly  
✅ Add to cart works  
✅ Checkout completes successfully  
✅ Stock updates after purchase  
✅ Dashboard tabs separate items correctly  
✅ Browse Store shows only store items  
✅ Storefront page works  
✅ No TypeScript errors in console  
✅ No React errors in console  
✅ Mobile responsive  

### Nice to Have:
✅ Smooth animations  
✅ Fast load times  
✅ Intuitive UX  
✅ Clear visual hierarchy  

---

## 🎯 Testing Priority

### 🔴 Critical (Test First):
1. Create store item
2. Add to cart
3. Checkout
4. Stock updates

### 🟡 Important (Test Second):
5. Dashboard Store tab
6. Browse Store page
7. Storefront page
8. Filters & search

### 🟢 Nice to Have (Test Last):
9. Edge cases
10. Mobile responsive
11. Visual polish
12. Performance

---

## 📝 Notes Section

Use this space to track:
- [ ] Issues found
- [ ] Performance observations
- [ ] UI/UX suggestions
- [ ] Feature ideas

---

## ✅ Sign-Off

Once all tests pass:
- [ ] All critical tests passed
- [ ] All important tests passed
- [ ] All nice-to-have tests passed
- [ ] No blocking bugs
- [ ] Ready for production

**Tested By**: _______________  
**Date**: _______________  
**Version**: 1.0.0  
**Status**: _______________

---

**Happy Testing!** 🧪🚀

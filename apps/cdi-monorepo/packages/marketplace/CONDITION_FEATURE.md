# Hand-crafted Goods & Item Condition Feature

## Overview
Added comprehensive item condition categorization to separate New, Used, and Hand-crafted goods throughout the auction platform.

## Database Changes

### 1. Updated Listings Table
- Added `condition` field with enum: `'new' | 'used' | 'handcrafted'`
- Default value: `'used'`
- Added database indexes for performance

### 2. New Categories
- **Hand-crafted Goods** 🤲 - Unique handmade items, artisan crafts, and custom creations
- **New Items** ✨ - Brand new, unused items in original packaging  
- **Used Items** ♻️ - Pre-owned items in good condition

## Frontend Changes

### 1. HomePage Filtering
- **New Condition Filter Section**: Displays tabs for All Items, New, Used, and Hand-crafted
- **Visual Icons**: Each condition has distinctive emoji icons for easy recognition
- **Filter Integration**: Works alongside existing category and sort filters

### 2. Create Listing Form
- **Condition Selector**: Dropdown with clear descriptions for each condition
- **User-Friendly Options**: 
  - ✨ New - Brand new, unused item
  - ♻️ Used - Pre-owned item in good condition
  - 🤲 Hand-crafted - Unique handmade item

### 3. Listing Display Updates

#### ListingCard Component
- **Condition Badges**: Color-coded badges on listing thumbnails
  - Blue badge for New items
  - Purple badge for Hand-crafted items
  - Gray badge for Used items

#### ListingDetail Component
- **Image Overlay**: Condition badge displayed prominently on main image
- **Info Section**: Condition tag alongside category information
- **Color Consistency**: Matches the badge colors from listing cards

## Color Scheme

### Condition Colors
- **New Items**: Blue (`bg-blue-500`, `bg-blue-100 text-blue-700`)
- **Hand-crafted**: Purple (`bg-purple-500`, `bg-purple-100 text-purple-700`)
- **Used Items**: Gray (`bg-gray-500`, `bg-gray-100 text-gray-700`)

## User Experience

### For Buyers
- **Easy Filtering**: Quickly find items by condition preference
- **Clear Identification**: Immediate visual recognition of item condition
- **Informed Decisions**: Better understanding of what they're bidding on

### For Sellers
- **Accurate Categorization**: Properly classify their items
- **Targeted Audience**: Reach buyers specifically looking for their item type
- **Hand-crafted Showcase**: Special category for artisan and handmade goods

## Technical Implementation

### TypeScript Types
```typescript
export type Listing = {
  // ... existing fields
  condition: 'new' | 'used' | 'handcrafted';
  // ... other fields
}
```

### Database Schema
```sql
ALTER TABLE listings 
ADD COLUMN condition TEXT CHECK (condition IN ('new', 'used', 'handcrafted')) DEFAULT 'used';
```

### Filtering Logic
```typescript
if (selectedCondition !== 'all') {
  query = query.eq('condition', selectedCondition);
}
```

## Files Modified

1. **Database**:
   - `add-condition-categories.sql` - Database migration script

2. **Backend Types**:
   - `src/lib/supabase.ts` - Updated Listing type definition

3. **Components**:
   - `src/components/home/HomePage.tsx` - Added condition filtering
   - `src/components/listings/CreateListing.tsx` - Added condition selector
   - `src/components/listings/ListingCard.tsx` - Added condition badges
   - `src/components/listings/ListingDetail.tsx` - Added condition display

## Deployment Steps

1. **Run Database Migration**:
   ```sql
   -- Execute add-condition-categories.sql in Supabase SQL editor
   ```

2. **Update Existing Data** (Optional):
   ```sql
   -- Run the UPDATE statements to categorize existing listings
   ```

3. **Deploy Frontend**: The TypeScript changes are ready for production

## Benefits

### For Hand-crafted Goods Sellers
- **Dedicated Category**: Special recognition for handmade items
- **Premium Positioning**: Purple badges make hand-crafted items stand out
- **Artisan Community**: Encourages local crafters and artists

### For All Users
- **Better Organization**: Items properly categorized by condition
- **Improved Search**: More granular filtering options
- **Enhanced Trust**: Clear condition labeling builds buyer confidence

## Future Enhancements

1. **Condition Descriptions**: Add detailed condition explanations
2. **Condition Images**: Allow multiple photos showing item condition
3. **Certification**: Verification system for hand-crafted claims
4. **Seller Profiles**: Special badges for verified artisans
5. **Condition History**: Track item condition changes over time
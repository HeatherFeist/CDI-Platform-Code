# 🔄 Shop'reneur → Marketplace Integration

## Overview

This integration automatically syncs eligible products from Shop'reneur to the CDI Marketplace, allowing you to sell verified products that have video reviews and adequate inventory.

## 📋 How It Works

### Eligibility Criteria

A product becomes eligible for Marketplace listing when it meets **BOTH** requirements:

1. ✅ **Has Video Review** - `videoReviewCompleted: true`
   - You must upload a TikTok/Reels review video
   - Click the video icon in the Admin Panel to attach the URL

2. ✅ **Has 2+ Units in Stock** - `stockCount >= 2`
   - 1 unit reserved for your personal use/review
   - 1+ units available for customer orders

### Publishing to Marketplace

#### Manual Sync
1. Go to Admin Panel → Inventory Ops tab
2. Look for the "Marketplace" column in your product table
3. Products that meet criteria will show a **"Publish"** button (cyan)
4. Click "Publish" to list the product on the Marketplace
5. Once synced, the button changes to **"Synced"** (green)

#### Auto-Sync (Coming Soon)
Products will automatically sync when they meet the criteria after:
- Uploading a video review
- Increasing stock count to 2+

### What Gets Synced

The following product information is published to the Marketplace:

| Field | Mapped As |
|-------|-----------|
| Product Name | Listing Title |
| Description | Listing Description |
| Image URL | Primary Image |
| Additional Images | Gallery Images |
| Price | Store Price |
| Stock Count | Available Quantity (minus 1 for personal use) |
| Product ID | Reference back to Shop'reneur |

**Listing Type:** `store` (fixed price, not auction)  
**Condition:** `new`  
**Allow Offers:** `true`

## 🔧 Technical Setup

### Environment Variables

Add to your `.env` file:

```bash
# Shop'reneur Database (Required)
VITE_SUPABASE_URL=your_shopreneur_supabase_url
VITE_SUPABASE_ANON_KEY=your_shopreneur_anon_key

# Marketplace Database (Optional - uses Shop'reneur credentials if not set)
VITE_MARKETPLACE_SUPABASE_URL=your_marketplace_supabase_url
VITE_MARKETPLACE_SUPABASE_ANON_KEY=your_marketplace_anon_key
```

**Note:** If both apps use the same Supabase project, you only need the first two variables.

### Database Schema

The integration expects these columns in the Marketplace `listings` table:

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[],
  starting_bid NUMERIC(10, 2), -- Used as price for store items
  current_bid NUMERIC(10, 2),
  stock_quantity INTEGER,
  listing_type TEXT CHECK (listing_type IN ('auction', 'store', 'trade')),
  condition TEXT CHECK (condition IN ('new', 'used', 'handcrafted')),
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'sold')),
  allow_offers BOOLEAN,
  shopreneur_product_id TEXT, -- Link back to Shop'reneur
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📦 API Reference

### Service Functions

#### `canPublishToMarketplace(product: Product): boolean`
Checks if a product meets marketplace eligibility criteria.

```typescript
import { canPublishToMarketplace } from '../services/marketplaceSync';

const eligible = canPublishToMarketplace(product);
// Returns true if video review exists AND stock >= 2
```

#### `publishToMarketplace(product: Product): Promise<{success: boolean; error?: string}>`
Publishes or updates a product on the Marketplace.

```typescript
import { publishToMarketplace } from '../services/marketplaceSync';

const result = await publishToMarketplace(product);
if (result.success) {
  console.log('Product published!');
} else {
  console.error(result.error);
}
```

#### `unpublishFromMarketplace(productId: string): Promise<{success: boolean; error?: string}>`
Removes a product from the Marketplace (sets status to 'cancelled').

```typescript
import { unpublishFromMarketplace } from '../services/marketplaceSync';

await unpublishFromMarketplace(product.id);
```

#### `isPublishedOnMarketplace(productId: string): Promise<boolean>`
Checks if a product is currently listed.

```typescript
import { isPublishedOnMarketplace } from '../services/marketplaceSync';

const isListed = await isPublishedOnMarketplace(product.id);
```

#### `autoSyncToMarketplace(product: Product): Promise<void>`
Auto-sync helper that publishes eligible products and unpublishes ineligible ones.

```typescript
import { autoSyncToMarketplace } from '../services/marketplaceSync';

// Call after updating stock or video status
await autoSyncToMarketplace(product);
```

## 🎯 Use Cases

### Scenario 1: New Product Workflow
1. Add product to Shop'reneur inventory
2. Purchase 2 units from supplier
3. Mark as received → Stock count = 2
4. Create and upload video review
5. Product automatically becomes eligible
6. Click "Publish" to list on Marketplace
7. Customers can now purchase from Marketplace
8. You keep 1 unit, sell the extra stock

### Scenario 2: Restocking
1. Product sells out on Marketplace
2. Purchase more units
3. Update stock count in Shop'reneur
4. Click "Publish" to update Marketplace listing
5. Product becomes available again

### Scenario 3: Removing from Marketplace
1. Product no longer available
2. Reduce stock count below 2
3. Or remove video review
4. Product becomes ineligible
5. Automatically or manually unpublish

## 🔍 Troubleshooting

### "Not Eligible" Status
**Problem:** Product shows "Not Eligible" in Marketplace column

**Solutions:**
- ✅ Upload video review (click Video icon)
- ✅ Ensure stock count is 2 or more
- ✅ Check both criteria are met

### Sync Button Not Working
**Problem:** "Publish" button doesn't do anything

**Check:**
1. Browser console for errors (F12)
2. Environment variables are set correctly
3. Supabase credentials are valid
4. Network tab shows API calls

### Product Not Appearing on Marketplace
**Problem:** Sync succeeded but product not visible

**Check:**
1. Marketplace database in Supabase Table Editor
2. Look for `shopreneur_product_id` matching your product ID
3. Verify `status = 'active'`
4. Check `listing_type = 'store'`

### Different Supabase Projects
**Problem:** Shop'reneur and Marketplace use different databases

**Solution:**
Add marketplace-specific credentials to `.env`:
```bash
VITE_MARKETPLACE_SUPABASE_URL=https://marketplace-project.supabase.co
VITE_MARKETPLACE_SUPABASE_ANON_KEY=your_marketplace_key
```

## 🚀 Future Enhancements

- [ ] Automatic sync on stock/video updates
- [ ] Bulk sync all eligible products
- [ ] Sync status dashboard
- [ ] Price sync (update Marketplace when Shop'reneur price changes)
- [ ] Inventory sync (reduce Marketplace stock when sold)
- [ ] Analytics (views, sales from Marketplace)
- [ ] Category mapping
- [ ] Custom marketplace settings per product

## 📝 Notes

- **Stock Reservation:** 1 unit is always reserved for personal use
- **Seller ID:** Uses Shop'reneur owner profile ID
- **Updates:** Updating a product in Shop'reneur requires clicking "Publish" again to sync changes
- **Deletions:** Deleting from Shop'reneur does not auto-remove from Marketplace
- **Pricing:** Marketplace uses the Shop'reneur retail price

---

**Last Updated:** January 2, 2026  
**Version:** 1.0.0

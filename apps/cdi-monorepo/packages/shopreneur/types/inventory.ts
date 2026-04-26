/**
 * Shared inventory types used by both the API handler and the front-end
 * ShopreneurLiveCheckout component.
 *
 * API response shape  ->  GET /api/shopreneur/inventory
 * Front-end consumer  ->  ShopreneurLiveCheckout.tsx  (mapInventoryResponse)
 */

export type InventoryApiRow = {
  /** Unique product identifier from your data source */
  product_id: string;
  /** Display name shown to customers */
  title: string;
  /** Marketplace: "Amazon" | "SHEIN" | "eBay" (or any casing – dashboard normalises it) */
  marketplace: string;
  /** Retail price in the configured currency */
  unit_price: number;
  /** Direct product URL on the marketplace */
  buy_url: string;
  /** Amazon ASIN or marketplace SKU (optional – falls back to product_id) */
  asin_or_sku?: string;
  /**
   * Affiliate/Associate ID for this specific product.
   * Leave blank to use the store-level affiliate ID from AFFILIATE_IDS.
   */
  affiliate_id?: string;
};

export type InventoryApiResponse = {
  items: InventoryApiRow[];
};

export type InventoryApiErrorResponse = {
  error: string;
};

import BusinessDashboard, {
  type InventoryItem,
  type AffiliateIdsByStore,
} from "./BusinessDashboard";
import type { InventoryApiRow, InventoryApiResponse } from "../types/inventory";

const AFFILIATE_IDS: AffiliateIdsByStore = {
  amazon: "shopreneur-20",
  shein: "shein_aff_7410",
  ebay: "5339118274",
};

function mapInventoryResponse(payload: unknown): InventoryItem[] {
  const data = payload as InventoryApiResponse;
  const rows = Array.isArray(data?.items) ? data.items : [];

  return rows
    .filter((row) => Boolean(row.product_id) && Boolean(row.title) && Boolean(row.buy_url))
    .map((row) => ({
      id: String(row.product_id),
      name: String(row.title),
      store: String(row.marketplace),
      price: Number(row.unit_price ?? 0),
      productUrl: String(row.buy_url),
      sku: row.asin_or_sku ? String(row.asin_or_sku) : undefined,
      affiliateId: row.affiliate_id ? String(row.affiliate_id) : undefined,
    }));
}

export default function ShopreneurLiveCheckout() {
  return (
    <BusinessDashboard
      title="Shop'reneur Live Checkout"
      currency="$"
      inventoryEndpoint="/api/shopreneur/inventory"
      inventoryRequestInit={{
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }}
      affiliateIds={AFFILIATE_IDS}
      mapInventoryResponse={mapInventoryResponse}
    />
  );
}

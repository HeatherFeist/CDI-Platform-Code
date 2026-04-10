import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

export type SupportedStore = "amazon" | "shein" | "ebay";

export type InventoryItem = {
	id: string;
	name: string;
	store: string;
	price: number;
	productUrl: string;
	sku?: string;
	affiliateId?: string;
};

type SelectedInventory = Record<string, number>;
type SelectedItem = InventoryItem & {
	quantity: number;
	normalizedStore: SupportedStore;
	displayStore: string;
	affiliateId: string;
	sku: string;
};

export type AffiliateIdsByStore = {
	amazon: string;
	shein: string;
	ebay: string;
};

export type BusinessDashboardProps = {
	inventory?: InventoryItem[];
	inventoryEndpoint?: string;
	inventoryRequestInit?: RequestInit;
	mapInventoryResponse?: (payload: unknown) => InventoryItem[];
	affiliateIds?: Partial<AffiliateIdsByStore>;
	title?: string;
	currency?: string;
};

const INVENTORY: InventoryItem[] = [
	{
		id: "amz-1",
		name: "Portable Ring Light",
		store: "Amazon",
		price: 24.99,
		productUrl: "https://www.amazon.com/dp/B09XYZ1234",
		sku: "B09XYZ1234",
		affiliateId: "shopreneur-20",
	},
	{
		id: "amz-2",
		name: "Tripod Stand",
		store: "Amazon",
		price: 34.5,
		productUrl: "https://www.amazon.com/dp/B08ABC5678",
		sku: "B08ABC5678",
		affiliateId: "shopreneur-20",
	},
	{
		id: "shn-1",
		name: "Women Knit Cardigan",
		store: "SHEIN",
		price: 28,
		productUrl: "https://us.shein.com/Women-Knit-Cardigan-p-12345678.html",
		sku: "12345678",
		affiliateId: "shein_aff_7410",
	},
	{
		id: "eby-1",
		name: "Wireless Earbuds",
		store: "eBay",
		price: 19.95,
		productUrl: "https://www.ebay.com/itm/385123456789",
		sku: "385123456789",
		affiliateId: "5339118274",
	},
];

const DEFAULT_AFFILIATE_IDS: AffiliateIdsByStore = {
	amazon: "shopreneur-20",
	shein: "shein_aff_7410",
	ebay: "5339118274",
};

function parseInventoryPayload(payload: unknown): InventoryItem[] {
	if (!Array.isArray(payload)) return [];

	return payload
		.filter((row) => typeof row === "object" && row !== null)
		.map((row) => {
			const value = row as Record<string, unknown>;
			return {
				id: String(value.id ?? ""),
				name: String(value.name ?? ""),
				store: String(value.store ?? "Amazon"),
				price: Number(value.price ?? 0),
				productUrl: String(value.productUrl ?? ""),
				sku: value.sku ? String(value.sku) : undefined,
				affiliateId: value.affiliateId ? String(value.affiliateId) : undefined,
			};
		})
		.filter((item) => Boolean(item.id) && Boolean(item.name) && Boolean(item.productUrl));
}

function normalizeStore(store: string): SupportedStore {
	const value = store.trim().toLowerCase();
	if (value.includes("amazon")) return "amazon";
	if (value.includes("shein")) return "shein";
	if (value.includes("ebay")) return "ebay";
	return "amazon";
}

function displayStore(store: SupportedStore): string {
	if (store === "amazon") return "Amazon";
	if (store === "shein") return "SHEIN";
	return "eBay";
}

function encodeQrUrl(value: string): string {
	return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
		value
	)}`;
}

function addOrReplaceParam(url: string, key: string, value: string): string {
	const parsed = new URL(url);
	parsed.searchParams.set(key, value);
	return parsed.toString();
}

function decorateProductUrl(item: SelectedItem): string {
	if (item.normalizedStore === "amazon") {
		return addOrReplaceParam(item.productUrl, "tag", item.affiliateId);
	}

	if (item.normalizedStore === "shein") {
		return addOrReplaceParam(item.productUrl, "affiliate_id", item.affiliateId);
	}

	return addOrReplaceParam(item.productUrl, "campid", item.affiliateId);
}

function buildAmazonCheckout(items: SelectedItem[]): string {
	const url = new URL("https://www.amazon.com/gp/aws/cart/add.html");
	const defaultAffiliate = items[0]?.affiliateId ?? "shopreneur-20";

	url.searchParams.set("AssociateTag", defaultAffiliate);

	items.forEach((item, index) => {
		const row = index + 1;
		url.searchParams.set(`ASIN.${row}`, item.sku);
		url.searchParams.set(`Quantity.${row}`, String(item.quantity));
	});

	return url.toString();
}

function buildSheinCheckout(items: SelectedItem[]): string {
	const firstItem = items[0];
	if (!firstItem) return "https://us.shein.com/cart";

	// SHEIN does not provide a stable public multi-item cart deep-link API.
	// Use a direct store cart link with affiliate context and selected product metadata.
	const withAffiliate = addOrReplaceParam(firstItem.productUrl, "affiliate_id", firstItem.affiliateId);
	const withSource = addOrReplaceParam(withAffiliate, "utm_source", "shopreneur_qr");

	const parsed = new URL(withSource);
	parsed.searchParams.set(
		"selected_items",
		items.map((item) => `${item.sku}:${item.quantity}`).join(",")
	);
	parsed.searchParams.set("redirect", "cart");

	return parsed.toString();
}

function buildEbayCheckout(items: SelectedItem[]): string {
	const firstItem = items[0];
	if (!firstItem) return "https://cart.ebay.com";

	const withCampId = addOrReplaceParam(firstItem.productUrl, "campid", firstItem.affiliateId);
	const withCustom = addOrReplaceParam(withCampId, "customid", "shopreneur_qr");

	const parsed = new URL(withCustom);
	parsed.searchParams.set("quantity", String(firstItem.quantity));
	parsed.searchParams.set(
		"bundle",
		items.map((item) => `${item.sku}:${item.quantity}`).join(",")
	);

	return parsed.toString();
}

function buildCheckoutByStore(store: SupportedStore, items: SelectedItem[]): string {
	switch (store) {
		case "amazon":
			return buildAmazonCheckout(items);
		case "shein":
			return buildSheinCheckout(items);
		case "ebay":
			return buildEbayCheckout(items);
		default:
			return items[0]?.productUrl ?? "#";
	}
}

export default function BusinessDashboard(props: BusinessDashboardProps) {
	const { title = "Shop'reneur Inventory Checkout QR", currency = "$" } = props;
	const [remoteInventory, setRemoteInventory] = useState<InventoryItem[]>([]);
	const [isLoadingInventory, setIsLoadingInventory] = useState<boolean>(false);
	const [inventoryError, setInventoryError] = useState<string>("");

	const hasPropInventory = Boolean(props.inventory && props.inventory.length > 0);
	const sourceInventory = hasPropInventory
		? (props.inventory as InventoryItem[])
		: remoteInventory.length > 0
			? remoteInventory
			: INVENTORY;
	const affiliateIds: AffiliateIdsByStore = {
		...DEFAULT_AFFILIATE_IDS,
		...(props.affiliateIds ?? {}),
	};

	useEffect(() => {
		if (!props.inventoryEndpoint || hasPropInventory) return;

		let cancelled = false;
		setIsLoadingInventory(true);
		setInventoryError("");

		fetch(props.inventoryEndpoint, props.inventoryRequestInit)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Inventory request failed (${response.status})`);
				}

				const payload = (await response.json()) as unknown;
				const mapped = props.mapInventoryResponse
					? props.mapInventoryResponse(payload)
					: parseInventoryPayload(payload);

				if (!cancelled) {
					setRemoteInventory(mapped);
				}
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				const message = error instanceof Error ? error.message : "Unable to load inventory";
				setInventoryError(message);
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoadingInventory(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [props.inventoryEndpoint, props.inventoryRequestInit, props.mapInventoryResponse, hasPropInventory]);

	const [selected, setSelected] = useState<SelectedInventory>({});

	const resolvedInventory = useMemo(
		() =>
			sourceInventory.map((item) => {
				const normalized = normalizeStore(item.store);
				return {
					...item,
					normalizedStore: normalized,
					displayStore: displayStore(normalized),
					affiliateId: item.affiliateId ?? affiliateIds[normalized],
					sku: item.sku ?? item.id,
				};
			}),
		[sourceInventory, affiliateIds]
	);

	const selectedItems = useMemo(
		() =>
			resolvedInventory.filter((item) => (selected[item.id] ?? 0) > 0).map((item) => ({
				...item,
				quantity: selected[item.id],
			})),
		[selected, resolvedInventory]
	);

	const groupedByStore = useMemo(() => {
		const groups: Record<SupportedStore, SelectedItem[]> = {
			amazon: [],
			shein: [],
			ebay: [],
		};

		selectedItems.forEach((item: SelectedItem) => {
			groups[item.normalizedStore].push(item);
		});

		return groups;
	}, [selectedItems]);

	const storeCheckoutLinks = useMemo(() => {
		return (Object.keys(groupedByStore) as SupportedStore[])
			.filter((store) => groupedByStore[store].length > 0)
			.map((store) => ({
				storeKey: store,
				store: displayStore(store),
				storeType: store,
				items: groupedByStore[store],
				checkoutUrl: buildCheckoutByStore(store, groupedByStore[store]),
				productLinks: groupedByStore[store].map((item) => ({
					id: item.id,
					name: item.name,
					quantity: item.quantity,
					affiliateUrl: decorateProductUrl(item),
				})),
			}));
	}, [groupedByStore]);

	const total = selectedItems.reduce((sum: number, item: SelectedItem) => sum + item.price * item.quantity, 0);

	const updateQuantity = (id: string, quantity: number) => {
		setSelected((prev: SelectedInventory) => {
			if (quantity <= 0) {
				const { [id]: _removed, ...rest } = prev;
				return rest;
			}

			return {
				...prev,
				[id]: quantity,
			};
		});
	};

	return (
		<div style={{ fontFamily: "'Segoe UI', sans-serif", maxWidth: 1000, margin: "0 auto", padding: 24, color: "#1f2937" }}>
			<h1>{title}</h1>
			<p>
				Choose customer items below. The system auto-groups by store and creates one QR code per store so
				buyers can scan and go straight to that store link with affiliate tracking.
			</p>

			{isLoadingInventory ? <div>Loading live inventory...</div> : null}
			{inventoryError ? (
				<div style={{ background: "#fff4e5", border: "1px solid #ffd591", borderRadius: 6, padding: 10, marginBottom: 12 }}>
					Unable to load live inventory: {inventoryError}. Showing available local inventory.
				</div>
			) : null}

			<div style={{ display: "grid", gap: 12 }}>
				{resolvedInventory.map((item) => {
					const quantity = selected[item.id] ?? 0;
					return (
						<div
							key={item.id}
							style={{
								border: "1px solid #d9d9d9",
								borderRadius: 8,
								padding: 12,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: 12,
							}}
						>
							<div>
								<strong>{item.name}</strong>
								<div>{item.displayStore}</div>
								<div>
									{currency}
									{item.price.toFixed(2)}
								</div>
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<button onClick={() => updateQuantity(item.id, Math.max(0, quantity - 1))}>-</button>
								<input
									type="number"
									min={0}
									value={quantity}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										updateQuantity(item.id, Number(event.target.value) || 0)
									}
									style={{ width: 64, textAlign: "center" }}
								/>
								<button onClick={() => updateQuantity(item.id, quantity + 1)}>+</button>
							</div>
						</div>
					);
				})}
			</div>

			<h2 style={{ marginTop: 20 }}>Order Summary</h2>
			<div>{selectedItems.length} selected product(s)</div>
			<div>
				Total: {currency}
				{total.toFixed(2)}
			</div>

			<h2 style={{ marginTop: 20 }}>Store QR Codes</h2>
			{storeCheckoutLinks.length === 0 ? (
				<div>Select at least one item to generate store checkout QR codes.</div>
			) : (
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
					{storeCheckoutLinks.map(({ storeKey, store, items, checkoutUrl, productLinks }) => (
						<div key={storeKey} style={{ border: "1px solid #d9d9d9", borderRadius: 10, padding: 16 }}>
							<h3>{store}</h3>
							<div style={{ marginBottom: 10 }}>
								{items.map((item: SelectedItem) => (
									<div key={item.id}>
										{item.name} x {item.quantity}
									</div>
								))}
							</div>

							<a href={checkoutUrl} target="_blank" rel="noreferrer">
								Open {store} checkout link
							</a>

							<div style={{ marginTop: 12 }}>
								<img
									src={encodeQrUrl(checkoutUrl)}
									alt={`${store} checkout QR`}
									width={220}
									height={220}
								/>
							</div>

							<div style={{ marginTop: 14 }}>
								<strong>Affiliate Product Links</strong>
								<div style={{ marginTop: 8, display: "grid", gap: 6 }}>
									{productLinks.map((link) => (
										<a key={link.id} href={link.affiliateUrl} target="_blank" rel="noreferrer">
											{link.name} x {link.quantity}
										</a>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

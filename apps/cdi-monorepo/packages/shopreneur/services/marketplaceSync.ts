import { Product } from '../types';
import { createClient } from '@supabase/supabase-js';

// Marketplace Supabase configuration
// These should match the marketplace database
const marketplaceSupabaseUrl = import.meta.env.VITE_MARKETPLACE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const marketplaceSupabaseKey = import.meta.env.VITE_MARKETPLACE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const marketplaceClient = createClient(marketplaceSupabaseUrl, marketplaceSupabaseKey);

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  images: string[];
  starting_bid: number; // Price for store items
  current_bid: number;
  stock_quantity: number;
  listing_type: 'store';
  condition: 'new' | 'used' | 'handcrafted';
  status: 'active';
  allow_offers: boolean;
  category_id?: string;
  shopreneur_product_id?: string; // Link back to Shop'reneur product
}

/**
 * Check if a product meets the criteria to be listed on the marketplace
 * Requirements:
 * - Has video review completed
 * - Has at least 2 units in stock (1 for review, 1+ for inventory)
 */
export const canPublishToMarketplace = (product: Product): boolean => {
  return product.videoReviewCompleted === true && (product.stockCount || 0) >= 2;
};

/**
 * Get the current user's ID for marketplace seller_id
 * This should be the Shop'reneur owner's ID
 */
const getSellerIdForMarketplace = (): string | null => {
  // Get from localStorage or auth context
  const profiles = localStorage.getItem('local_profiles');
  if (profiles) {
    const parsed = JSON.parse(profiles);
    const owner = parsed.find((p: any) => p.role === 'Owner');
    return owner?.id || null;
  }
  return null;
};

/**
 * Convert Shop'reneur product to Marketplace listing format
 */
const convertProductToListing = (product: Product, sellerId: string): MarketplaceListing => {
  return {
    id: product.id,
    seller_id: sellerId,
    title: product.name,
    description: product.description || `${product.name} - Available from Shop'reneur`,
    images: [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean),
    starting_bid: product.price,
    current_bid: product.price,
    stock_quantity: (product.stockCount || 0) - 1, // Reserve 1 unit for personal inventory
    listing_type: 'store',
    condition: 'new',
    status: 'active',
    allow_offers: true,
    shopreneur_product_id: product.id
  };
};

/**
 * Publish a Shop'reneur product to the Marketplace
 */
export const publishToMarketplace = async (product: Product): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!canPublishToMarketplace(product)) {
      return {
        success: false,
        error: 'Product does not meet marketplace requirements (needs video review and 2+ stock)'
      };
    }

    const sellerId = getSellerIdForMarketplace();
    if (!sellerId) {
      return {
        success: false,
        error: 'No seller ID found. Please ensure you are logged in.'
      };
    }

    const listingData = convertProductToListing(product, sellerId);

    // Check if already published
    const { data: existing } = await marketplaceClient
      .from('listings')
      .select('id')
      .eq('shopreneur_product_id', product.id)
      .single();

    if (existing) {
      // Update existing listing
      const { error } = await marketplaceClient
        .from('listings')
        .update({
          title: listingData.title,
          description: listingData.description,
          images: listingData.images,
          starting_bid: listingData.starting_bid,
          current_bid: listingData.current_bid,
          stock_quantity: listingData.stock_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
      return { success: true };
    }

    // Create new listing
    const { error } = await marketplaceClient
      .from('listings')
      .insert([listingData]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error publishing to marketplace:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish to marketplace'
    };
  }
};

/**
 * Unpublish a product from the Marketplace
 */
export const unpublishFromMarketplace = async (productId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await marketplaceClient
      .from('listings')
      .update({ status: 'cancelled' })
      .eq('shopreneur_product_id', productId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error unpublishing from marketplace:', error);
    return {
      success: false,
      error: error.message || 'Failed to unpublish from marketplace'
    };
  }
};

/**
 * Check if a product is currently published on the marketplace
 */
export const isPublishedOnMarketplace = async (productId: string): Promise<boolean> => {
  try {
    const { data } = await marketplaceClient
      .from('listings')
      .select('id, status')
      .eq('shopreneur_product_id', productId)
      .eq('status', 'active')
      .single();

    return !!data;
  } catch {
    return false;
  }
};

/**
 * Auto-sync products that meet marketplace criteria
 * Call this after updating product stock or video review status
 */
export const autoSyncToMarketplace = async (product: Product): Promise<void> => {
  if (canPublishToMarketplace(product)) {
    await publishToMarketplace(product);
  } else {
    // If product no longer meets criteria, unpublish it
    const isPublished = await isPublishedOnMarketplace(product.id);
    if (isPublished) {
      await unpublishFromMarketplace(product.id);
    }
  }
};

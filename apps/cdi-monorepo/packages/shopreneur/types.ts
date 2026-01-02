
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Product {
  id: string; 
  name: string;
  price: number; 
  costPrice?: number;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  additionalImages?: string[]; 
  videoUrl?: string; // Link to the user's review video
  videoReviewCompleted?: boolean; // Requirement 1
  affiliateLink: string; 
  platform: 'Amazon' | 'Shein' | 'eBay'; 
  isWishlist: boolean; 
  isReceived?: boolean; 
  stockCount: number; // Requirement 2: Must be >= 2 (1 personal + 1 inventory)
  isMarketplaceSynced?: boolean; 
  asin?: string; 
  marketplaceId?: string; 
}

export enum ProductCategory {
  BEAUTY = 'Beauty & Skincare',
  FASHION = 'Fashion & Apparel',
  ACCESSORIES = 'Accessories',
  HAIR = 'Hair Care',
  TECH = 'Tech & Gadgets',
  LIFESTYLE = 'Lifestyle'
}

export interface UserProfile {
  id: string; 
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  role: 'Owner' | 'Shopper' | 'Partner';
  password?: string; // For Owner access
  storeOwnerId?: string; // Links a shopper to a specific admin's store
  shippingAddress?: ShippingAddress;
}

export interface Message {
  id: string;
  senderId: string; 
  recipientId: string; 
  text: string;
  timestamp: number;
}

export interface ShopSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  heroHeadline: string;
  heroSubtext: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
  amazonAffiliateTag?: string;
  ebayAffiliateId?: string;
  sheinAffiliateId?: string;
}

export interface CreatorStats {
  tier: 'Starter' | 'Entrepreneur' | 'Empire'; 
  streak: number;
  points: number;
  level: 'Newbie' | 'Rising Star' | 'Influencer' | 'Viral Icon' | 'Empire Builder';
  inventoryCount: number; 
  subscriptionPlan: 'Free' | 'Pro' | 'Elite';
}

export interface CartItem extends Product {
  quantity: number;
  orderType: 'purchase' | 'gift';
}

export interface ContentPrompt {
  title: string;
  description: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  sources?: string[];
}

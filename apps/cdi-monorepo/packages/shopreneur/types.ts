export interface Product {
  id: string; // UUID from Supabase
  name: string;
  price: number; 
  costPrice?: number;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  additionalImages?: string[]; 
  videoUrl?: string; 
  affiliateLink: string; 
  platform: 'Amazon' | 'Shein' | 'Temu'; 
  asin?: string; 
  affiliateTag?: string; 
  isWishlist: boolean; 
  isReceived?: boolean; 
  stockCount?: number; 
}

export enum ProductCategory {
  BEAUTY = 'Beauty & Skincare',
  FASHION = 'Fashion & Apparel',
  ACCESSORIES = 'Accessories',
  HAIR = 'Hair Care',
  TECH = 'Tech & Gadgets',
  SHEIN = 'Shein Finds'
}

export interface CartItem extends Product {
  quantity: number;
  orderType: 'purchase' | 'gift'; 
}

export interface DailyContent {
  videoUrl: string;
  title: string;
  message: string;
  taggedUsers?: string[]; 
}

export interface CreatorStats {
  tier: 'Starter' | 'Entrepreneur' | 'Empire'; 
  streak: number;
  points: number;
  level: 'Newbie' | 'Rising Star' | 'Influencer' | 'Viral Icon' | 'Empire Builder';
  videosPostedThisWeek: number;
  weeklyGoal: number;
  nextLevelPoints: number;
  subscriptionPlan: 'Free' | 'Pro' | 'Elite'; 
  inventoryCount: number; 
}

export type SocialPlatform = 'TikTok' | 'Instagram' | 'Facebook' | 'YouTube';

export interface SocialPost {
  id: string;
  authorName: string;
  shopName: string;
  avatarUrl: string;
  caption: string;
  likes: number;
  views: number;
  platform: SocialPlatform;
  isChallengeEntry: boolean;
  hasVoted: boolean;
  taggedUsers?: string[];
}

export type ChallengeType = 'Daily' | 'Weekly' | 'Tournament';

export interface ContentPrompt {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  platform: SocialPlatform;
  expiresIn?: string; 
}

export interface ShopSettings {
  storeName: string;
  adminEmail?: string; 
  tagline: string;
  heroHeadline: string;
  heroSubtext: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontHeading: 'Playfair Display' | 'Lobster' | 'Oswald' | 'Quicksand' | 'Abril Fatface' | 'Bebas Neue' | 'Dancing Script' | 'Montserrat';
  fontBody: 'Inter' | 'Quicksand' | 'Open Sans' | 'Lato' | 'Merriweather';
  amazonAffiliateTag?: string; 
  amazonStoreId?: string; 
  amazonStorefrontUrl?: string; 
  logoUrl?: string; 
  backgroundImageUrl?: string; 
  customCss?: string; 
  socialHandles?: {
    tiktok?: string;
    instagram?: string;
    facebook?: string;
  };
  // Merchant Coin Configuration
  merchantCoinConfig?: MerchantCoinConfig;
}

export interface MerchantCoinConfig {
  enabled: boolean;
  coinName: string;          // e.g., "Shop Coins"
  coinSymbol: string;         // e.g., "🪙" or custom emoji
  brandColor: string;         // Primary brand color for coins
  logoUrl?: string;           // Brand logo/coin design from image editor
  earnRate: number;           // Coins earned per dollar spent (default: 1.0)
  redemptionRate: number;     // Coins needed per dollar discount (default: 10)
  redemptionRules?: string;   // e.g., "Max 50% of order total"
  minimumRedemption?: number; // Minimum coins to redeem
  businessType: string;       // e.g., "online_store", "marketplace_seller"
  businessStatus: 'active' | 'pending' | 'suspended';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserProfile {
  id: string; // UUID from Supabase Auth
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  role: 'Daughter' | 'Mother' | 'Sponsor';
  shippingAddress?: Address;
}

export interface SaleRecord {
  id: string;
  productName: string;
  salePrice: number;
  restockCost: number; 
  profit: number; 
  date: string;
}

export interface Message {
  id: string;
  senderId: string; 
  recipientId: string; 
  text: string;
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
}

// Daily Challenges & Gamification
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'post' | 'video' | 'story' | 'reel';
  category: 'product_showcase' | 'behind_scenes' | 'tutorial' | 'testimonial' | 'promotion';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  coinReward: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  isActive: boolean;
  prompt: string; // Specific challenge prompt
  tips: string[]; // Array of tips to help complete the challenge
  exampleUrls?: string[]; // Example posts/videos
  requiredPlatforms: ('facebook' | 'instagram' | 'tiktok' | 'youtube')[];
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string; // URL to uploaded image/video
  mediaType: 'image' | 'video';
  caption: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube';
  platformPostUrl?: string; // Link to actual social media post
  submittedAt: string; // ISO timestamp
  voteCount: number;
  isWinner?: boolean;
}

export interface Vote {
  id: string;
  submissionId: string;
  userId: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar: string;
  totalXP: number;
  totalCoins: number;
  level: number;
  streak: number; // Days in a row with submissions
  challengesCompleted: number;
  challengesWon: number;
  rank: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Social Media Integration
export interface SocialMediaConnection {
  platform: 'facebook' | 'instagram';
  isConnected: boolean;
  accessToken?: string;
  userId?: string;
  userName?: string;
  profileUrl?: string;
  connectedAt?: string;
  expiresAt?: string;
  permissions: string[];
}

export interface UserSocialProfile extends UserProfile {
  socialConnections: SocialMediaConnection[];
  gameStats: {
    level: number;
    xp: number;
    coins: number;
    streak: number;
    totalChallengesCompleted: number;
  };
}
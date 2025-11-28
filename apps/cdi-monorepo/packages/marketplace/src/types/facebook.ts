export interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
  first_name?: string;
  last_name?: string;
}

export interface FacebookLoginResponse {
  authResponse: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    signedRequest: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

export interface FacebookShareData {
  type: 'auction' | 'trade' | 'achievement';
  title: string;
  description: string;
  image_url?: string;
  link: string;
  price?: number;
  location?: string;
  ends_at?: string;
}

export interface FacebookMarketplacePost {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category_id: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: 'AVAILABLE' | 'PENDING' | 'SOLD';
  custom_label_0?: string; // Can be used for auction ID
}

export interface FacebookPagePost {
  message: string;
  link?: string;
  picture?: string;
  name?: string;
  caption?: string;
  description?: string;
  actions?: Array<{
    name: string;
    link: string;
  }>;
  scheduled_publish_time?: number;
  published?: boolean;
}

export interface FacebookSharingPreferences {
  auto_share_auctions: boolean;
  auto_share_trades: boolean;
  auto_share_achievements: boolean;
  share_to_timeline: boolean;
  share_to_marketplace: boolean;
  share_to_groups: boolean;
  selected_groups: string[];
  privacy_setting: 'public' | 'friends' | 'only_me';
}

export interface FacebookIntegrationSettings {
  connected: boolean;
  user_id?: string;
  access_token?: string;
  expires_at?: string;
  pages?: Array<{
    id: string;
    name: string;
    access_token: string;
  }>;
  groups?: Array<{
    id: string;
    name: string;
    privacy: string;
  }>;
  sharing_preferences: FacebookSharingPreferences;
}

export interface FacebookAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

// Facebook Marketing API Category IDs for Marketplace
export const FACEBOOK_MARKETPLACE_CATEGORIES = {
  'ANTIQUES': '26',
  'ELECTRONICS': '1404',
  'VEHICLES': '22',
  'CLOTHING': '28',
  'FURNITURE': '2001',
  'COLLECTIBLES': '2051',
  'JEWELRY': '231',
  'ART': '32',
  'BOOKS': '33',
  'SPORTS': '1408',
  'TOYS': '37',
  'OTHER': '1'
} as const;

export type FacebookMarketplaceCategory = keyof typeof FACEBOOK_MARKETPLACE_CATEGORIES;

// Facebook Graph API Permissions
export const FACEBOOK_PERMISSIONS = [
  'public_profile',
  'email',
  'pages_manage_posts', // For posting to pages
  'pages_read_engagement', // For reading page insights
  'publish_to_groups', // For posting to groups (requires approval)
  'user_posts', // For posting to timeline
] as const;

export interface FacebookShareResult {
  success: boolean;
  post_id?: string;
  error?: string;
  platform: 'timeline' | 'marketplace' | 'group' | 'page';
}

export interface FacebookAnalytics {
  post_id: string;
  platform: string;
  reach: number;
  impressions: number;
  clicks: number;
  shares: number;
  likes: number;
  comments: number;
  created_at: string;
}
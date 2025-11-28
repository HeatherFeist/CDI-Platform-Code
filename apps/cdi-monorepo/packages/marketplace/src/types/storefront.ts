// Custom Storefront System Types

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'paused';
export type SSLStatus = 'pending' | 'active' | 'failed';
export type LayoutStyle = 'modern' | 'classic' | 'minimal' | 'bold';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced';

export interface CustomStore {
  id: string;
  seller_id: string;
  
  // Domain Configuration
  domain?: string; // e.g., HeatherFeist.shop
  subdomain?: string; // e.g., heatherfeist
  domain_verified: boolean;
  domain_verification_token?: string;
  ssl_status: SSLStatus;
  
  // Store Identity
  store_name: string;
  tagline?: string;
  description?: string;
  
  // Branding
  logo_url?: string;
  favicon_url?: string;
  banner_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  
  // Layout Settings
  layout_style: LayoutStyle;
  show_search: boolean;
  show_categories: boolean;
  show_featured_products: boolean;
  products_per_page: number;
  
  // Contact & Social
  contact_email?: string;
  contact_phone?: string;
  business_address?: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  
  // Store Policies
  shipping_policy?: string;
  return_policy?: string;
  privacy_policy?: string;
  terms_of_service?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  
  // Features
  enable_blog: boolean;
  enable_reviews: boolean;
  enable_wishlist: boolean;
  enable_newsletter: boolean;
  
  // Integration
  show_marketplace_link: boolean;
  allow_marketplace_sync: boolean;
  
  // Subscription & Billing
  tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_subscription_id?: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  trial_ends_at?: string;
  
  // Status
  is_active: boolean;
  is_published: boolean;
  maintenance_mode: boolean;
  
  // Cached Stats
  total_products: number;
  total_sales: number;
  total_revenue: number;
  
  created_at: string;
  updated_at: string;
}

export interface StorePage {
  id: string;
  store_id: string;
  
  slug: string;
  title: string;
  content?: string;
  excerpt?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  
  // Display
  is_published: boolean;
  show_in_navigation: boolean;
  sort_order: number;
  template: 'default' | 'full-width' | 'sidebar' | 'contact';
  
  created_at: string;
  updated_at: string;
}

export interface StoreCollection {
  id: string;
  store_id: string;
  
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  
  // Display
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CollectionListing {
  collection_id: string;
  listing_id: string;
  sort_order: number;
  added_at: string;
}

export interface StoreAnalytics {
  id: string;
  store_id: string;
  date: string;
  
  // Traffic
  visits: number;
  unique_visitors: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  
  // Sales
  sales_count: number;
  revenue: number;
  average_order_value: number;
  conversion_rate: number;
  
  // Traffic Sources
  traffic_sources: Array<{
    source: string;
    visits: number;
  }>;
  referrers: Array<{
    url: string;
    visits: number;
  }>;
  
  // Top Products
  top_products: Array<{
    listing_id: string;
    title: string;
    views: number;
    sales: number;
  }>;
  
  // Geography
  top_countries: Array<{
    country: string;
    visits: number;
  }>;
  top_cities: Array<{
    city: string;
    visits: number;
  }>;
  
  created_at: string;
}

export interface StoreBlogPost {
  id: string;
  store_id: string;
  
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  
  // Author
  author_id: string;
  
  // Categories/Tags
  categories?: string[];
  tags?: string[];
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  
  // Publishing
  is_published: boolean;
  published_at?: string;
  
  // Engagement
  view_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface StoreNavigation {
  id: string;
  store_id: string;
  
  position: 'header' | 'footer' | 'sidebar';
  label: string;
  url: string;
  
  parent_id?: string;
  sort_order: number;
  
  is_active: boolean;
  open_in_new_tab: boolean;
  
  created_at: string;
  
  // For nested menus
  children?: StoreNavigation[];
}

export interface StoreDiscount {
  id: string;
  store_id: string;
  
  code: string;
  description?: string;
  
  // Discount Type
  type: DiscountType;
  value: number;
  
  // Conditions
  minimum_purchase: number;
  maximum_discount?: number;
  applies_to: 'all' | 'collection' | 'product';
  applies_to_ids?: string[];
  
  // Limits
  usage_limit?: number;
  usage_count: number;
  per_customer_limit: number;
  
  // Timing
  starts_at: string;
  ends_at?: string;
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface StoreSubscriber {
  id: string;
  store_id: string;
  
  email: string;
  name?: string;
  
  status: SubscriberStatus;
  
  // Source
  source: 'website' | 'checkout' | 'import';
  
  // Engagement
  open_rate: number;
  click_rate: number;
  last_opened_at?: string;
  last_clicked_at?: string;
  
  subscribed_at: string;
  unsubscribed_at?: string;
}

// Form types for creating/updating
export interface CreateStoreData {
  store_name: string;
  domain?: string;
  subdomain?: string;
  description?: string;
  tier?: SubscriptionTier;
}

export interface UpdateStoreData {
  store_name?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  contact_email?: string;
  contact_phone?: string;
  social_links?: CustomStore['social_links'];
  shipping_policy?: string;
  return_policy?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
}

export interface CreatePageData {
  slug: string;
  title: string;
  content?: string;
  template?: StorePage['template'];
  show_in_navigation?: boolean;
}

export interface CreateCollectionData {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
}

export interface CreateBlogPostData {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  categories?: string[];
  tags?: string[];
  is_published?: boolean;
}

export interface CreateDiscountData {
  code: string;
  type: DiscountType;
  value: number;
  description?: string;
  minimum_purchase?: number;
  usage_limit?: number;
  starts_at?: string;
  ends_at?: string;
}

// Subscription tier features
export interface TierFeatures {
  name: string;
  price: number;
  features: string[];
  limits: {
    custom_domain: boolean;
    products: number | 'unlimited';
    pages: number | 'unlimited';
    blog_posts: number | 'unlimited';
    collections: number | 'unlimited';
    discounts: number | 'unlimited';
    api_access: boolean;
    white_label: boolean;
    priority_support: boolean;
  };
  marketplace_fee: number; // Percentage
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    name: 'Starter',
    price: 0,
    features: [
      'Unlimited marketplace listings',
      'All 4 delivery options',
      'Basic analytics',
      'Community support',
      'Same-day local delivery'
    ],
    limits: {
      custom_domain: false,
      products: 'unlimited',
      pages: 0,
      blog_posts: 0,
      collections: 0,
      discounts: 0,
      api_access: false,
      white_label: false,
      priority_support: false
    },
    marketplace_fee: 10
  },
  pro: {
    name: 'Professional',
    price: 39,
    features: [
      'Everything in Starter',
      'Custom domain store (yourname.shop)',
      'Custom branding (logo, colors, fonts)',
      'Up to 20 custom pages',
      'Product collections',
      'Basic blog (10 posts/month)',
      'Advanced analytics & SEO tools',
      'Email forwarding (sales@yourdomain.shop)',
      'Priority support (24hr response)',
      'Social media integration'
    ],
    limits: {
      custom_domain: true,
      products: 'unlimited',
      pages: 20,
      blog_posts: 10,
      collections: 'unlimited',
      discounts: 10,
      api_access: false,
      white_label: false,
      priority_support: true
    },
    marketplace_fee: 5
  },
  enterprise: {
    name: 'Business',
    price: 99,
    features: [
      'Everything in Professional',
      'Up to 3 custom domains',
      'Unlimited pages & blog posts',
      'Advanced discount codes',
      'Abandoned cart recovery',
      'Email marketing (500 subscribers)',
      'Bulk import/export tools',
      'API access',
      'Phone support & monthly strategy calls',
      'Facebook/Instagram shop integration',
      'Google Shopping feed'
    ],
    limits: {
      custom_domain: true,
      products: 'unlimited',
      pages: 'unlimited',
      blog_posts: 'unlimited',
      collections: 'unlimited',
      discounts: 'unlimited',
      api_access: true,
      white_label: false,
      priority_support: true
    },
    marketplace_fee: 3
  }
};

// Domain verification
export interface DomainVerification {
  domain: string;
  verification_token: string;
  verified: boolean;
  dns_records: {
    type: 'CNAME' | 'A';
    name: string;
    value: string;
  }[];
}

// Store statistics summary
export interface StoreStats {
  total_visits: number;
  total_revenue: number;
  total_sales: number;
  avg_order_value: number;
  conversion_rate: number;
  top_product: {
    listing_id: string;
    title: string;
    sales: number;
  } | null;
  growth_rate: number; // Percentage change from previous period
}

// Analytics time period
export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface AnalyticsFilter {
  period: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}

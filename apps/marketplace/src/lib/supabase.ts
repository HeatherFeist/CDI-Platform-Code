import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

export type DeliveryMethod = 'pickup' | 'local_delivery' | 'shipping' | 'seller_delivery';

export type DeliveryOption = {
  method: DeliveryMethod;
  enabled: boolean;
  fee: number;
  description: string;
  radius_miles?: number;
  available_hours?: string;
  carrier?: string;
  estimated_days?: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  rating: number;
  total_reviews: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  category_id?: string;
  title: string;
  description: string;
  images: string[];
  starting_bid: number;
  current_bid: number;
  reserve_price?: number;
  buy_now_price?: number;
  bid_increment: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled' | 'sold';
  condition: 'new' | 'used' | 'handcrafted';
  winner_id?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  category?: Category;
  // Store/Auction hybrid fields
  listing_type?: 'auction' | 'store' | 'trade';
  stock_quantity?: number;
  compare_at_price?: number;
  allow_offers?: boolean;
  // Trade-specific fields
  trade_for?: string;
  trade_preferences?: string;
  // Delivery options
  delivery_options?: DeliveryOption[];
  seller_address?: string;
  pickup_instructions?: string;
};

export type Bid = {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  bidder?: Profile;
  listing?: Listing;
};

export type Review = {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  type: 'buyer_to_seller' | 'seller_to_buyer';
  created_at: string;
  reviewer?: Profile;
};

export type Transaction = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_id?: string;
  created_at: string;
  completed_at?: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'outbid' | 'won_auction' | 'new_bid' | 'listing_ended' | 'payment_received';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
};

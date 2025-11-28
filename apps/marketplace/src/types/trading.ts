// Trading system TypeScript types and interfaces

export type TradeStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected'
  | 'cancelled' 
  | 'completed'
  | 'counter_proposed'
  | 'disputed';

export type TradeMessageType = 'message' | 'counter_offer' | 'acceptance' | 'decline' | 'system';

export type DisputeReason = 
  | 'item_not_as_described' 
  | 'item_not_received' 
  | 'damaged_item' 
  | 'incorrect_item' 
  | 'communication_issues' 
  | 'other';

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface TradeProposal {
  id: string;
  proposer_id: string;
  recipient_id: string;
  status: TradeStatus;
  message?: string;
  proposed_cash_amount: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Additional properties for UI
  offered_listing_ids?: string[];
  desired_listing_ids?: string[];
  estimated_values?: { [listingId: string]: number };
  
  // Populated relations
  proposer?: Profile;
  recipient?: Profile;
  proposer_profile?: Profile;
  recipient_profile?: Profile;
  trade_items?: TradeItem[];
  trade_messages?: TradeMessage[];
  trade_balance?: TradeBalance;
}

export interface TradeItem {
  id: string;
  trade_proposal_id: string;
  listing_id: string;
  offered_by: string;
  item_condition_notes?: string;
  estimated_value?: number;
  created_at: string;
  
  // Populated relations
  listing?: Listing;
  offered_by_user?: Profile;
}

export interface TradeMessage {
  id: string;
  trade_proposal_id: string;
  sender_id: string;
  message: string;
  message_type: TradeMessageType;
  proposed_cash_adjustment: number;
  created_at: string;
  is_read: boolean;
  
  // Populated relations
  sender?: Profile;
}

export interface TradeReview {
  id: string;
  trade_proposal_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  
  // Populated relations
  reviewer?: Profile;
  reviewee?: Profile;
}

export interface TradeDispute {
  id: string;
  trade_proposal_id: string;
  disputed_by: string;
  dispute_reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  
  // Populated relations
  disputed_by_user?: Profile;
  resolved_by_user?: Profile;
  trade_proposal?: TradeProposal;
}

export interface TradeWishlist {
  id: string;
  user_id: string;
  category_id?: string;
  desired_item_description: string;
  max_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  category?: Category;
}

export interface TradeMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_listing_id: string;
  user2_listing_id: string;
  compatibility_score: number;
  match_reasons: string[];
  is_viewed_by_user1: boolean;
  is_viewed_by_user2: boolean;
  created_at: string;
  
  // Populated relations
  user1?: Profile;
  user2?: Profile;
  user1_listing?: Listing;
  user2_listing?: Listing;
}

export interface TradeBalance {
  proposer_value: number;
  recipient_value: number;
  cash_component: number;
  proposer_total: number;
  recipient_total: number;
  balance_difference: number;
  is_balanced: boolean;
}

export interface CreateTradeProposal {
  recipient_id: string;
  message?: string;
  proposed_cash_amount?: number;
  offered_listing_ids: string[];
  desired_listing_ids: string[];
  item_notes?: { [listing_id: string]: string };
  estimated_values?: { [listing_id: string]: number };
}

export interface TradeProposalFilters {
  status?: TradeStatus[];
  user_type?: 'proposer' | 'recipient' | 'all';
  date_range?: {
    start: string;
    end: string;
  };
  min_value?: number;
  max_value?: number;
  category_id?: string;
}

export interface TradeStats {
  total_trades: number;
  completed_trades: number;
  pending_trades: number;
  average_trade_value: number;
  success_rate: number;
  average_completion_time_days: number;
  top_trading_categories: {
    category: string;
    count: number;
  }[];
}

// Trading system configuration
export const TRADE_CONFIG = {
  MAX_ITEMS_PER_TRADE: 5,
  DEFAULT_EXPIRATION_DAYS: 7,
  MAX_CASH_COMPONENT: 1000,
  BALANCE_TOLERANCE: 50, // $50 tolerance for "balanced" trades
  AUTO_MATCH_THRESHOLD: 80, // Minimum compatibility score for auto-suggestions
  
  // Trade value estimation helpers
  VALUE_CATEGORIES: {
    'Electronics': { depreciation: 0.8, volatility: 'high' },
    'Collectibles': { depreciation: 1.2, volatility: 'medium' },
    'Art & Crafts': { depreciation: 1.0, volatility: 'low' },
    'Hand-crafted Goods': { depreciation: 1.1, volatility: 'low' },
    'Fashion & Accessories': { depreciation: 0.6, volatility: 'high' },
    'Home & Garden': { depreciation: 0.9, volatility: 'medium' },
    'Sports & Recreation': { depreciation: 0.8, volatility: 'medium' },
    'Books & Media': { depreciation: 0.7, volatility: 'low' },
    'Automotive': { depreciation: 0.9, volatility: 'high' }
  }
};

// Helper functions for trade logic
export const TradeHelpers = {
  calculateTradeValue: (items: TradeItem[]): number => {
    return items.reduce((total, item) => total + (item.estimated_value || 0), 0);
  },

  calculateTotalValue: (estimatedValues: { [listingId: string]: number }, listingIds: string[], cashAmount: number = 0): number => {
    const itemsValue = listingIds.reduce((total, id) => total + (estimatedValues[id] || 0), 0);
    return itemsValue + cashAmount;
  },
  
  isTradeBalanced: (proposerValue: number, recipientValue: number): boolean => {
    return Math.abs(proposerValue - recipientValue) <= TRADE_CONFIG.BALANCE_TOLERANCE;
  },
  
  getTradeStatusColor: (status: TradeStatus): string => {
    const colors = {
      pending: 'yellow',
      accepted: 'green',
      rejected: 'red',
      cancelled: 'gray',
      completed: 'blue',
      counter_proposed: 'purple',
      disputed: 'orange'
    };
    return colors[status] || 'gray';
  },
  
  getTradeStatusIcon: (status: TradeStatus): string => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      rejected: '❌',
      cancelled: '⚪',
      completed: '🎉',
      counter_proposed: '🔄',
      disputed: '⚠️'
    };
    return icons[status] || '❓';
  },
  
  canUserRespondToTrade: (trade: TradeProposal, userId: string): boolean => {
    return trade.recipient_id === userId && trade.status === 'pending';
  },
  
  canUserCancelTrade: (trade: TradeProposal, userId: string): boolean => {
    return (trade.proposer_id === userId || trade.recipient_id === userId) && 
           trade.status === 'pending';
  },
  
  isTradeExpired: (trade: TradeProposal): boolean => {
    return new Date(trade.expires_at) < new Date();
  },
  
  estimateItemValue: (listing: Listing): number => {
    // Simple estimation based on starting bid and category
    const categoryConfig = TRADE_CONFIG.VALUE_CATEGORIES[listing.category?.name as keyof typeof TRADE_CONFIG.VALUE_CATEGORIES];
    const baseValue = listing.current_bid > 0 ? listing.current_bid : listing.starting_bid;
    const multiplier = categoryConfig?.depreciation || 1.0;
    
    return Math.round(baseValue * multiplier);
  },
  
  generateTradeReasons: (userListing: Listing, otherListing: Listing): string[] => {
    const reasons: string[] = [];
    
    if (userListing.category_id === otherListing.category_id) {
      reasons.push('Same category items');
    }
    
    const userValue = TradeHelpers.estimateItemValue(userListing);
    const otherValue = TradeHelpers.estimateItemValue(otherListing);
    
    if (Math.abs(userValue - otherValue) <= TRADE_CONFIG.BALANCE_TOLERANCE) {
      reasons.push('Similar estimated values');
    }
    
    if (userListing.condition === 'handcrafted' && otherListing.condition === 'handcrafted') {
      reasons.push('Both handcrafted items');
    }
    
    if (userListing.condition === 'new' && otherListing.condition === 'new') {
      reasons.push('Both brand new items');
    }
    
    return reasons;
  }
};

// Import types from existing files
import { Profile, Listing, Category } from '../lib/supabase';
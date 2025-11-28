// Notification system TypeScript types and interfaces

export type NotificationType = 
  | 'bid_outbid'
  | 'auction_ending' 
  | 'auction_won'
  | 'auction_lost'
  | 'listing_sold'
  | 'new_bid'
  | 'payment_received'
  | 'watchlist_alert'
  | 'price_drop'
  | 'new_listing_category'
  | 'system_announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  
  // Browser push notifications
  push_enabled: boolean;
  push_bid_alerts: boolean;
  push_auction_ending: boolean;
  push_auction_results: boolean;
  push_payment_updates: boolean;
  push_watchlist_alerts: boolean;
  
  // Email notifications
  email_enabled: boolean;
  email_bid_alerts: boolean;
  email_auction_ending: boolean;
  email_auction_results: boolean;
  email_payment_updates: boolean;
  email_weekly_summary: boolean;
  
  // Sound preferences
  sound_enabled: boolean;
  sound_volume: number;
  
  // Timing preferences
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationData {
  listing_id?: string;
  bid_amount?: number;
  auction_title?: string;
  seller_name?: string;
  time_remaining?: string;
  warning_type?: '5_minutes' | '1_minute' | '30_seconds';
  transaction_id?: string;
  payment_amount?: number;
  [key: string]: any;
}

export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
}

export interface NotificationSound {
  type: NotificationType;
  audioFile: string;
  volume: number;
}

// Notification configuration for different types
export const NOTIFICATION_CONFIG: Record<NotificationType, {
  title: (data: NotificationData) => string;
  message: (data: NotificationData) => string;
  sound: string;
  priority: NotificationPriority;
  icon: string;
  color: string;
}> = {
  bid_outbid: {
    title: (_data) => 'You\'ve been outbid!',
    message: (data) => `Someone outbid you on "${data.auction_title}"`,
    sound: '/sounds/outbid.mp3',
    priority: 'high',
    icon: '🏷️',
    color: 'orange'
  },
  auction_ending: {
    title: (_data) => 'Auction ending soon!',
    message: (data) => `"${data.auction_title}" ends in ${data.time_remaining}`,
    sound: '/sounds/auction-ending.mp3',
    priority: 'high',
    icon: '⏰',
    color: 'red'
  },
  auction_won: {
    title: (data) => 'Congratulations! You won!',
    message: (data) => `You won "${data.auction_title}" for $${data.bid_amount}`,
    sound: '/sounds/win.mp3',
    priority: 'urgent',
    icon: '🎉',
    color: 'green'
  },
  auction_lost: {
    title: (data) => 'Auction ended',
    message: (data) => `"${data.auction_title}" sold to another bidder`,
    sound: '/sounds/lose.mp3',
    priority: 'medium',
    icon: '😔',
    color: 'gray'
  },
  listing_sold: {
    title: (data) => 'Your item sold!',
    message: (data) => `"${data.auction_title}" sold for $${data.bid_amount}`,
    sound: '/sounds/sold.mp3',
    priority: 'high',
    icon: '💰',
    color: 'green'
  },
  new_bid: {
    title: (data) => 'New bid on your item',
    message: (data) => `New bid of $${data.bid_amount} on "${data.auction_title}"`,
    sound: '/sounds/new-bid.mp3',
    priority: 'medium',
    icon: '💰',
    color: 'blue'
  },
  payment_received: {
    title: (data) => 'Payment received',
    message: (data) => `Received $${data.payment_amount} payment`,
    sound: '/sounds/payment.mp3',
    priority: 'medium',
    icon: '💳',
    color: 'green'
  },
  watchlist_alert: {
    title: (data) => 'Watchlist item update',
    message: (data) => `"${data.auction_title}" has been updated`,
    sound: '/sounds/watchlist.mp3',
    priority: 'low',
    icon: '👀',
    color: 'blue'
  },
  price_drop: {
    title: (data) => 'Price drop alert!',
    message: (data) => `"${data.auction_title}" price dropped to $${data.bid_amount}`,
    sound: '/sounds/price-drop.mp3',
    priority: 'medium',
    icon: '📉',
    color: 'orange'
  },
  new_listing_category: {
    title: (data) => 'New listing in your category',
    message: (data) => `New item: "${data.auction_title}"`,
    sound: '/sounds/new-listing.mp3',
    priority: 'low',
    icon: '🆕',
    color: 'purple'
  },
  system_announcement: {
    title: (data) => 'System announcement',
    message: (data) => data.message || 'System update available',
    sound: '/sounds/system.mp3',
    priority: 'medium',
    icon: '📢',
    color: 'blue'
  }
};

// Browser notification permission status
export type NotificationPermission = 'default' | 'granted' | 'denied';

// Notification service worker message types
export interface ServiceWorkerMessage {
  type: 'SHOW_NOTIFICATION' | 'UPDATE_BADGE' | 'CLEAR_NOTIFICATIONS';
  payload?: any;
}
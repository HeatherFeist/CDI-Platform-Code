import { supabase } from '../lib/supabase';
import { 
  NotificationType, 
  NotificationPreferences, 
  RealtimeNotification, 
  NotificationData,
  NOTIFICATION_CONFIG,
  NotificationPermission
} from '../types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private volume = 0.5;
  private userId: string | null = null;
  private realtimeChannel: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.initializeAudio();
    this.requestNotificationPermission();
  }

  // Initialize the notification service for a user
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserPreferences();
    this.setupRealtimeSubscription();
    this.registerServiceWorker();
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission as NotificationPermission;
  }

  // Load user notification preferences
  private async loadUserPreferences(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        this.soundEnabled = data.sound_enabled;
        this.volume = data.sound_volume / 100;
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  // Setup Supabase realtime subscription
  private setupRealtimeSubscription(): void {
    if (!this.userId) return;

    // Subscribe to notifications for this user
    this.realtimeChannel = supabase
      .channel(`notifications:${this.userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${this.userId}`
      }, (payload) => {
        this.handleRealtimeNotification(payload.new as RealtimeNotification);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
      }, (payload) => {
        this.handleNewBid(payload.new);
      })
      .subscribe();
  }

  // Handle incoming realtime notifications
  private async handleRealtimeNotification(notification: RealtimeNotification): Promise<void> {
    const config = NOTIFICATION_CONFIG[notification.type];
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      this.showBrowserNotification(
        config.title(notification.data),
        config.message(notification.data),
        {
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          tag: notification.type,
          data: notification.data,
          requireInteraction: config.priority === 'urgent'
        }
      );
    }

    // Play sound
    this.playNotificationSound(notification.type);

    // Update UI badge
    this.updateNotificationBadge();

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('notification-received', {
      detail: notification
    }));
  }

  // Handle new bid events
  private async handleNewBid(bid: any): Promise<void> {
    if (!this.userId) return;

    // Check if this bid affects the current user
    const { data: listing } = await supabase
      .from('listings')
      .select('seller_id, title')
      .eq('id', bid.listing_id)
      .single();

    if (!listing) return;

    // If user is the seller, notify about new bid
    if (listing.seller_id === this.userId) {
      this.createNotification('new_bid', {
        listing_id: bid.listing_id,
        bid_amount: bid.amount,
        auction_title: listing.title
      });
    } else {
      // Check if user was outbid
      const { data: userBids } = await supabase
        .from('bids')
        .select('amount')
        .eq('listing_id', bid.listing_id)
        .eq('bidder_id', this.userId)
        .order('amount', { ascending: false })
        .limit(1);

      if (userBids && userBids.length > 0 && userBids[0].amount < bid.amount) {
        this.createNotification('bid_outbid', {
          listing_id: bid.listing_id,
          bid_amount: bid.amount,
          auction_title: listing.title
        });
      }
    }
  }

  // Create a new notification
  async createNotification(
    type: NotificationType, 
    data: NotificationData
  ): Promise<void> {
    if (!this.userId) return;

    const config = NOTIFICATION_CONFIG[type];
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: this.userId,
          type,
          title: config.title(data),
          message: config.message(data),
          data,
          notification_type: type,
          priority: config.priority,
          is_read: false
        }]);

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Show browser notification
  private showBrowserNotification(
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): void {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
      body: message,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      ...options
    });

    // Auto-close after 5 seconds for non-urgent notifications
    if (options.requireInteraction !== true) {
      setTimeout(() => notification.close(), 5000);
    }

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to relevant page based on notification data
      if (options.data?.listing_id) {
        window.location.href = `/listing/${options.data.listing_id}`;
      }
    };
  }

  // Initialize audio context for sound notifications
  private initializeAudio(): void {
    try {
      // Create audio context on user interaction
      document.addEventListener('click', () => {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
      }, { once: true });
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Play notification sound
  private async playNotificationSound(type: NotificationType): Promise<void> {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      const config = NOTIFICATION_CONFIG[type];
      const response = await fetch(config.sound);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  // Update notification badge count
  private async updateNotificationBadge(): Promise<void> {
    if (!this.userId) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('is_read', false);

      // Update browser badge (if supported)
      if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(count || 0);
      }

      // Update UI badge
      window.dispatchEvent(new CustomEvent('notification-count-updated', {
        detail: { count: count || 0 }
      }));
    } catch (error) {
      console.error('Error updating notification badge:', error);
    }
  }

  // Register service worker for background notifications
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', this.userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get user notifications
  async getNotifications(limit = 20, offset = 0): Promise<RealtimeNotification[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: this.userId,
          ...preferences
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
      } else {
        await this.loadUserPreferences();
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
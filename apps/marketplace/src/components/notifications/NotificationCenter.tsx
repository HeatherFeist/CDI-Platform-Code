import { useState, useEffect } from 'react';
import { Bell, BellRing, X, Check, Settings } from 'lucide-react';
import { NotificationService } from '../../services/NotificationService';
import { RealtimeNotification, NOTIFICATION_CONFIG } from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Listen for new notifications
      const handleNewNotification = (event: CustomEvent) => {
        const notification = event.detail as RealtimeNotification;
        setNotifications(prev => [notification, ...prev]);
        updateUnreadCount();
      };

      // Listen for badge updates
      const handleBadgeUpdate = (event: CustomEvent) => {
        setUnreadCount(event.detail.count);
      };

      window.addEventListener('notification-received', handleNewNotification as EventListener);
      window.addEventListener('notification-count-updated', handleBadgeUpdate as EventListener);

      return () => {
        window.removeEventListener('notification-received', handleNewNotification as EventListener);
        window.removeEventListener('notification-count-updated', handleBadgeUpdate as EventListener);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(20);
      setNotifications(data);
      updateUnreadCount();
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = () => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      updateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const config = NOTIFICATION_CONFIG[type as keyof typeof NOTIFICATION_CONFIG];
    return config?.icon || '📢';
  };

  const getNotificationColor = (type: string) => {
    const config = NOTIFICATION_CONFIG[type as keyof typeof NOTIFICATION_CONFIG];
    const colorMap: Record<string, string> = {
      'red': 'bg-red-100 text-red-800',
      'orange': 'bg-orange-100 text-orange-800',
      'green': 'bg-green-100 text-green-800',
      'blue': 'bg-blue-100 text-blue-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gray': 'bg-gray-100 text-gray-800'
    };
    return colorMap[config?.color || 'blue'];
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        {unreadCount > 0 ? (
          <BellRing size={24} className="text-blue-600" />
        ) : (
          <Bell size={24} />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Check size={16} className="mr-1" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications yet</p>
                <p className="text-sm">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      // Handle navigation based on notification type
                      if (notification.data.listing_id) {
                        window.location.href = `/listing/${notification.data.listing_id}`;
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <div className="mt-2">
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications settings or full notifications page
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center"
              >
                <Settings size={16} className="mr-1" />
                Notification Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Clock, Mail, Smartphone, Save } from 'lucide-react';
import { NotificationService } from '../../services/NotificationService';
import { NotificationPreferences } from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    push_enabled: true,
    push_bid_alerts: true,
    push_auction_ending: true,
    push_auction_results: true,
    push_payment_updates: true,
    push_watchlist_alerts: true,
    email_enabled: true,
    email_bid_alerts: false,
    email_auction_ending: true,
    email_auction_results: true,
    email_payment_updates: true,
    email_weekly_summary: true,
    sound_enabled: true,
    sound_volume: 50,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: 'America/New_York'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      // This would load from the database
      // For now, we'll use the default values
      setLoading(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(preferences);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    const permission = await notificationService.requestNotificationPermission();
    if (permission === 'granted') {
      setPreferences(prev => ({ ...prev, push_enabled: true }));
      setMessage('Browser notifications enabled!');
    } else {
      setMessage('Browser notifications blocked. Enable in browser settings.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const testSound = () => {
    // Play a test notification sound
    const audio = new Audio('/sounds/new-bid.mp3');
    audio.volume = (preferences.sound_volume || 50) / 100;
    audio.play().catch(console.error);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please sign in to manage notification settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell size={24} className="mr-3" />
            Notification Settings
          </h2>
          <p className="text-gray-600 mt-2">
            Customize how and when you receive notifications about your auctions.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Browser Push Notifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Smartphone size={20} className="mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Browser Push Notifications</h3>
                </div>
                {Notification.permission !== 'granted' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Enable Notifications
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.push_bid_alerts}
                    onChange={(e) => setPreferences(prev => ({ ...prev, push_bid_alerts: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Bid alerts (outbid notifications)</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.push_auction_ending}
                    onChange={(e) => setPreferences(prev => ({ ...prev, push_auction_ending: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Auction ending warnings</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.push_auction_results}
                    onChange={(e) => setPreferences(prev => ({ ...prev, push_auction_results: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Auction results (won/lost)</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.push_payment_updates}
                    onChange={(e) => setPreferences(prev => ({ ...prev, push_payment_updates: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Payment updates</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.push_watchlist_alerts}
                    onChange={(e) => setPreferences(prev => ({ ...prev, push_watchlist_alerts: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Watchlist updates</span>
                </label>
              </div>
            </div>

            {/* Email Notifications */}
            <div>
              <div className="flex items-center mb-4">
                <Mail size={20} className="mr-2 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.email_auction_ending}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_auction_ending: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Auction ending reminders</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.email_auction_results}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_auction_results: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Auction results</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.email_payment_updates}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_payment_updates: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Payment confirmations</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.email_weekly_summary}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_weekly_summary: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Weekly activity summary</span>
                </label>
              </div>
            </div>

            {/* Sound Settings */}
            <div>
              <div className="flex items-center mb-4">
                {preferences.sound_enabled ? (
                  <Volume2 size={20} className="mr-2 text-purple-600" />
                ) : (
                  <VolumeX size={20} className="mr-2 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">Sound Notifications</h3>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.sound_enabled}
                    onChange={(e) => setPreferences(prev => ({ ...prev, sound_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable notification sounds</span>
                </label>

                {preferences.sound_enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volume: {preferences.sound_volume}%
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={preferences.sound_volume}
                          onChange={(e) => setPreferences(prev => ({ ...prev, sound_volume: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <button
                          onClick={testSound}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <div className="flex items-center mb-4">
                <Clock size={20} className="mr-2 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start quiet hours
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End quiet hours
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                During quiet hours, you'll only receive urgent notifications like auction wins.
              </p>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Save size={20} className="mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
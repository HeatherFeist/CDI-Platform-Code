import { useState, useEffect } from 'react';
import { 
  Facebook, 
  Share2, 
  Settings, 
  Users, 
  Globe, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { FacebookService } from '../../services/FacebookService';
import { 
  FacebookIntegrationSettings, 
  FacebookSharingPreferences,
  FacebookLoginResponse,
  FacebookProfile 
} from '../../types/facebook';
import { useAuth } from '../../contexts/AuthContext';

interface FacebookConnectProps {
  onConnect?: (settings: FacebookIntegrationSettings) => void;
  onDisconnect?: () => void;
}

export default function FacebookConnect({ onConnect, onDisconnect }: FacebookConnectProps) {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<FacebookIntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const facebookService = FacebookService.getInstance();

  useEffect(() => {
    if (user) {
      loadIntegration();
    }
  }, [user]);

  const loadIntegration = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const settings = await facebookService.getFacebookIntegration(user.id);
      setIntegration(settings);
    } catch (error) {
      console.error('Failed to load Facebook integration:', error);
      setError('Failed to load Facebook settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    
    try {
      setConnecting(true);
      setError(null);

      // Initialize Facebook SDK
      await facebookService.initialize();

      // Login to Facebook
      const loginResponse: FacebookLoginResponse = await facebookService.login();
      
      if (loginResponse.status !== 'connected') {
        throw new Error('Facebook login failed');
      }

      // Get user profile
      const profile: FacebookProfile = await facebookService.getProfile(
        loginResponse.authResponse.accessToken
      );

      // Get user pages and groups
      const [pages, groups] = await Promise.all([
        facebookService.getUserPages(loginResponse.authResponse.accessToken),
        facebookService.getUserGroups(loginResponse.authResponse.accessToken)
      ]);

      // Create integration settings
      const integrationSettings: FacebookIntegrationSettings = {
        connected: true,
        user_id: profile.id,
        access_token: loginResponse.authResponse.accessToken,
        expires_at: new Date(Date.now() + loginResponse.authResponse.expiresIn * 1000).toISOString(),
        pages: pages.map(page => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token
        })),
        groups: groups.map(group => ({
          id: group.id,
          name: group.name,
          privacy: group.privacy
        })),
        sharing_preferences: {
          auto_share_auctions: false,
          auto_share_trades: false,
          auto_share_achievements: false,
          share_to_timeline: true,
          share_to_marketplace: false,
          share_to_groups: false,
          selected_groups: [],
          privacy_setting: 'friends'
        }
      };

      // Save to database
      await facebookService.saveFacebookIntegration(user.id, integrationSettings);
      
      setIntegration(integrationSettings);
      onConnect?.(integrationSettings);
      
    } catch (error: any) {
      console.error('Facebook connection failed:', error);
      setError(error.message || 'Failed to connect to Facebook');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !integration) return;
    
    try {
      // Logout from Facebook
      await facebookService.logout();
      
      // Remove from database
      await facebookService.removeFacebookIntegration(user.id);
      
      setIntegration(null);
      onDisconnect?.();
      
    } catch (error: any) {
      console.error('Facebook disconnection failed:', error);
      setError(error.message || 'Failed to disconnect from Facebook');
    }
  };

  const updateSharingPreferences = async (preferences: Partial<FacebookSharingPreferences>) => {
    if (!user || !integration) return;
    
    try {
      const updatedIntegration = {
        ...integration,
        sharing_preferences: {
          ...integration.sharing_preferences,
          ...preferences
        }
      };

      await facebookService.saveFacebookIntegration(user.id, updatedIntegration);
      setIntegration(updatedIntegration);
      
    } catch (error: any) {
      console.error('Failed to update sharing preferences:', error);
      setError(error.message || 'Failed to update preferences');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Facebook size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Facebook Integration</h3>
            <p className="text-sm text-gray-600">
              Share your auctions and trades with friends and groups
            </p>
          </div>
        </div>
        
        {integration?.connected && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Connection Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!integration?.connected ? (
        /* Not Connected State */
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Facebook size={32} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Facebook Account</h4>
            <p className="text-gray-600 mb-6">
              Share your auctions and trades with your Facebook network to reach more potential buyers and traders.
            </p>
            
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Facebook size={20} />
                  <span>Connect Facebook</span>
                </>
              )}
            </button>
          </div>

          {/* Benefits */}
          <div className="border-t border-gray-200 pt-6">
            <h5 className="text-sm font-medium text-gray-900 mb-4">What you can do:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Share2 size={16} className="text-blue-600 mt-1" />
                <div>
                  <h6 className="text-sm font-medium text-gray-900">Auto-share auctions</h6>
                  <p className="text-xs text-gray-600">Automatically post new auctions to your timeline</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users size={16} className="text-green-600 mt-1" />
                <div>
                  <h6 className="text-sm font-medium text-gray-900">Share to groups</h6>
                  <p className="text-xs text-gray-600">Post to relevant Facebook groups</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Zap size={16} className="text-purple-600 mt-1" />
                <div>
                  <h6 className="text-sm font-medium text-gray-900">Cross-promote trades</h6>
                  <p className="text-xs text-gray-600">Share trade offers with your network</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Globe size={16} className="text-orange-600 mt-1" />
                <div>
                  <h6 className="text-sm font-medium text-gray-900">Reach more buyers</h6>
                  <p className="text-xs text-gray-600">Expand your audience beyond the platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Connected State */
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 size={20} className="text-green-600" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Facebook Connected</h4>
                  <p className="text-sm text-green-700">
                    Connected to {integration.pages?.length || 0} pages and {integration.groups?.length || 0} groups
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-green-700 hover:text-green-800 p-1"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Quick Sharing Toggles */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-900">Quick Settings</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Share2 size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-700">Auto-share auctions</span>
                </div>
                <input
                  type="checkbox"
                  checked={integration.sharing_preferences.auto_share_auctions}
                  onChange={(e) => updateSharingPreferences({ auto_share_auctions: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Zap size={16} className="text-purple-600" />
                  <span className="text-sm text-gray-700">Auto-share trades</span>
                </div>
                <input
                  type="checkbox"
                  checked={integration.sharing_preferences.auto_share_trades}
                  onChange={(e) => updateSharingPreferences({ auto_share_trades: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Globe size={16} className="text-green-600" />
                  <span className="text-sm text-gray-700">Share to timeline</span>
                </div>
                <input
                  type="checkbox"
                  checked={integration.sharing_preferences.share_to_timeline}
                  onChange={(e) => updateSharingPreferences({ share_to_timeline: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Users size={16} className="text-orange-600" />
                  <span className="text-sm text-gray-700">Share to groups</span>
                </div>
                <input
                  type="checkbox"
                  checked={integration.sharing_preferences.share_to_groups}
                  onChange={(e) => updateSharingPreferences({ share_to_groups: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Advanced Settings */}
          {showSettings && (
            <div className="border-t border-gray-200 pt-6 space-y-6">
              <h5 className="text-sm font-medium text-gray-900">Advanced Settings</h5>
              
              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Privacy
                </label>
                <select
                  value={integration.sharing_preferences.privacy_setting}
                  onChange={(e) => updateSharingPreferences({ 
                    privacy_setting: e.target.value as 'public' | 'friends' | 'only_me' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="only_me">Only Me</option>
                </select>
              </div>

              {/* Selected Groups */}
              {integration.sharing_preferences.share_to_groups && integration.groups && integration.groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Groups ({integration.sharing_preferences.selected_groups.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {integration.groups.map((group) => (
                      <label key={group.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={integration.sharing_preferences.selected_groups.includes(group.id)}
                          onChange={(e) => {
                            const selected = integration.sharing_preferences.selected_groups;
                            const newSelected = e.target.checked
                              ? [...selected, group.id]
                              : selected.filter(id => id !== group.id);
                            updateSharingPreferences({ selected_groups: newSelected });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{group.name}</span>
                        <span className="text-xs text-gray-500">({group.privacy})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disconnect */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-2"
            >
              <XCircle size={16} />
              <span>Disconnect Facebook</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { SocialMediaConnection, UserProfile } from '../types';
import { Instagram, Facebook, CheckCircle, XCircle, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { socialService } from '../services/socialService';

interface SocialConnectProps {
  currentUser: UserProfile;
  onConnect: (platform: 'facebook' | 'instagram') => Promise<void>;
  onDisconnect: (platform: 'facebook' | 'instagram') => Promise<void>;
}

const SocialConnect: React.FC<SocialConnectProps> = ({
  currentUser,
  onConnect,
  onDisconnect
}) => {
  const [connections, setConnections] = useState<SocialMediaConnection[]>([
    {
      platform: 'facebook',
      isConnected: false,
      permissions: []
    },
    {
      platform: 'instagram',
      isConnected: false,
      permissions: []
    }
  ]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing connections on mount
  useEffect(() => {
    loadConnections();
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      const platform = urlParams.get('success') as 'facebook' | 'instagram';
      setMessage({ type: 'success', text: `Successfully connected to ${platform}!` });
      loadConnections();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('error')) {
      setMessage({ type: 'error', text: `Failed to connect: ${urlParams.get('error')}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadConnections = async () => {
    try {
      const apiConnections = await socialService.getConnections(currentUser.id);
      if (apiConnections.length > 0) {
        setConnections(prev => prev.map(conn => {
          const apiConn = apiConnections.find(c => c.platform === conn.platform);
          return apiConn ? { ...conn, ...apiConn } : conn;
        }));
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleConnect = async (platform: 'facebook' | 'instagram') => {
    setIsConnecting(platform);
    setMessage(null);
    
    try {
      // Initiate OAuth flow (redirects to backend)
      if (platform === 'facebook') {
        socialService.connectFacebook();
      } else {
        socialService.connectInstagram();
      }
      
      // Note: User will be redirected, so this code won't execute
      // The connection will be saved when they return from OAuth
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      setMessage({ type: 'error', text: `Failed to connect to ${platform}` });
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (platform: 'facebook' | 'instagram') => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      await socialService.disconnect(currentUser.id, platform);
      await onDisconnect(platform);
      
      setConnections(prev =>
        prev.map(conn =>
          conn.platform === platform
            ? {
                platform,
                isConnected: false,
                permissions: []
              }
            : conn
        )
      );
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      alert(`Failed to disconnect from ${platform}. Please try again.`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-8 h-8" />;
      case 'facebook':
        return <Facebook className="w-8 h-8" />;
      default:
        return <LinkIcon className="w-8 h-8" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return {
          gradient: 'from-purple-600 to-pink-600',
          bg: 'bg-gradient-to-r from-purple-50 to-pink-50',
          text: 'text-purple-600'
        };
      case 'facebook':
        return {
          gradient: 'from-blue-600 to-blue-700',
          bg: 'bg-blue-50',
          text: 'text-blue-600'
        };
      default:
        return {
          gradient: 'from-gray-600 to-gray-700',
          bg: 'bg-gray-50',
          text: 'text-gray-600'
        };
    }
  };

  const facebookConnection = connections.find(c => c.platform === 'facebook');
  const instagramConnection = connections.find(c => c.platform === 'instagram');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-4xl font-bold mb-2">Connect Social Media</h1>
        <p className="text-purple-100 text-lg">
          Link your Facebook and Instagram accounts to share your challenge submissions and grow your reach!
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-2 border-green-200 text-green-800' 
            : 'bg-red-50 border-2 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-1">Why connect your social media?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Automatically share challenge submissions to your accounts</li>
            <li>• Track engagement and insights from your posts</li>
            <li>• Build your brand presence across multiple platforms</li>
            <li>• Earn bonus XP for cross-platform posting</li>
          </ul>
        </div>
      </div>

      {/* Connection Cards */}
      <div className="space-y-6">
        {/* Facebook Card */}
        {facebookConnection && (
          <div className={`${getPlatformColor('facebook').bg} rounded-xl border-2 ${
            facebookConnection.isConnected ? 'border-green-300' : 'border-gray-200'
          } overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`bg-gradient-to-r ${getPlatformColor('facebook').gradient} p-3 rounded-xl text-white`}>
                    {getPlatformIcon('facebook')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Facebook</h3>
                    <p className="text-gray-600">Connect your Facebook account</p>
                  </div>
                </div>
                
                {facebookConnection.isConnected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold">Not Connected</span>
                  </div>
                )}
              </div>

              {facebookConnection.isConnected ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Account</div>
                        <div className="font-semibold">{facebookConnection.userName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">User ID</div>
                        <div className="font-semibold text-sm">{facebookConnection.userId}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Permissions</div>
                      <div className="flex flex-wrap gap-2">
                        {facebookConnection.permissions.map(perm => (
                          <span key={perm} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {perm.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {facebookConnection.profileUrl && (
                      <a
                        href={facebookConnection.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Profile
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDisconnect('facebook')}
                    className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    Disconnect Facebook
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-4">
                    Connect your Facebook account to automatically share your challenge posts and track engagement.
                  </p>
                  <button
                    onClick={() => handleConnect('facebook')}
                    disabled={isConnecting === 'facebook'}
                    className={`w-full bg-gradient-to-r ${getPlatformColor('facebook').gradient} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                      isConnecting === 'facebook' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isConnecting === 'facebook' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="w-5 h-5" />
                        Connect Facebook
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instagram Card */}
        {instagramConnection && (
          <div className={`${getPlatformColor('instagram').bg} rounded-xl border-2 ${
            instagramConnection.isConnected ? 'border-green-300' : 'border-gray-200'
          } overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`bg-gradient-to-r ${getPlatformColor('instagram').gradient} p-3 rounded-xl text-white`}>
                    {getPlatformIcon('instagram')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Instagram</h3>
                    <p className="text-gray-600">Connect your Instagram account</p>
                  </div>
                </div>
                
                {instagramConnection.isConnected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold">Not Connected</span>
                  </div>
                )}
              </div>

              {instagramConnection.isConnected ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Account</div>
                        <div className="font-semibold">{instagramConnection.userName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">User ID</div>
                        <div className="font-semibold text-sm">{instagramConnection.userId}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Permissions</div>
                      <div className="flex flex-wrap gap-2">
                        {instagramConnection.permissions.map(perm => (
                          <span key={perm} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {perm.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {instagramConnection.profileUrl && (
                      <a
                        href={instagramConnection.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Profile
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDisconnect('instagram')}
                    className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    Disconnect Instagram
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-4">
                    Connect your Instagram account to automatically share your challenge posts and reels.
                  </p>
                  <button
                    onClick={() => handleConnect('instagram')}
                    disabled={isConnecting === 'instagram'}
                    className={`w-full bg-gradient-to-r ${getPlatformColor('instagram').gradient} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                      isConnecting === 'instagram' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isConnecting === 'instagram' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Instagram className="w-5 h-5" />
                        Connect Instagram
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
        <h3 className="text-xl font-bold text-green-900 mb-4">✨ Benefits of Connecting</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Auto-Post Challenges</h4>
              <p className="text-sm text-green-800">Share submissions directly from the app</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Track Engagement</h4>
              <p className="text-sm text-green-800">See likes, comments, and reach metrics</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Bonus Rewards</h4>
              <p className="text-sm text-green-800">Earn 2x XP for cross-platform posts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Build Your Brand</h4>
              <p className="text-sm text-green-800">Consistent presence across platforms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>🔒 Your data is secure. We only access what's needed for posting and analytics.</p>
        <p className="mt-1">You can disconnect at any time.</p>
      </div>
    </div>
  );
};

export default SocialConnect;

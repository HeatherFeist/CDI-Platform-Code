import { useState, useEffect } from 'react';
import { 
  Facebook, 
  Instagram, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ConnectMetaButton from './ConnectMetaButton';

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  is_active: boolean;
  connected_at: string;
  last_synced_at: string;
  token_expires_at: string;
  metadata: {
    facebook_pages?: Array<{
      id: string;
      name: string;
    }>;
    instagram_accounts?: Array<{
      id: string;
      username: string;
    }>;
  };
}

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('profile_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      setDisconnecting(connectionId);
      
      const { error } = await supabase
        .from('social_connections')
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
          revocation_reason: 'User disconnected'
        })
        .eq('id', connectionId);

      if (error) throw error;

      // Refresh list
      await loadConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect account. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  const isTokenExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) <= new Date();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
        </div>
      </div>
    );
  }

  const metaConnection = connections.find(c => c.platform === 'meta' && c.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
        <p className="text-sm text-gray-600 mt-1">
          Connect your social media accounts to auto-share listings
        </p>
      </div>

      {/* Meta (Facebook + Instagram) Connection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Icons */}
            <div className="flex items-center space-x-1 pt-1">
              <Facebook size={24} className="text-blue-600" />
              <Instagram size={24} className="text-pink-600" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="text-base font-medium text-gray-900 mb-1">
                Facebook & Instagram
              </h4>

              {!metaConnection ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Connect your Facebook and Instagram accounts to automatically share listings
                  </p>
                  <ConnectMetaButton onSuccess={loadConnections} />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {isTokenExpired(metaConnection.token_expires_at) ? (
                      <>
                        <AlertCircle size={16} className="text-yellow-600" />
                        <span className="text-sm text-yellow-700 font-medium">Token Expired</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Connected</span>
                      </>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Account:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {metaConnection.platform_username}
                      </span>
                    </div>

                    {/* Facebook Pages */}
                    {metaConnection.metadata.facebook_pages && 
                     metaConnection.metadata.facebook_pages.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Facebook Pages:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {metaConnection.metadata.facebook_pages.length}
                        </span>
                        <div className="mt-1 space-y-1">
                          {metaConnection.metadata.facebook_pages.map((page) => (
                            <div key={page.id} className="flex items-center space-x-2 text-xs text-gray-700">
                              <Facebook size={12} className="text-blue-600" />
                              <span>{page.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instagram Accounts */}
                    {metaConnection.metadata.instagram_accounts && 
                     metaConnection.metadata.instagram_accounts.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Instagram Accounts:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {metaConnection.metadata.instagram_accounts.length}
                        </span>
                        <div className="mt-1 space-y-1">
                          {metaConnection.metadata.instagram_accounts.map((account) => (
                            <div key={account.id} className="flex items-center space-x-2 text-xs text-gray-700">
                              <Instagram size={12} className="text-pink-600" />
                              <span>@{account.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <div>Connected: {formatDate(metaConnection.connected_at)}</div>
                      <div>Last synced: {formatDate(metaConnection.last_synced_at)}</div>
                      <div>Expires: {formatDate(metaConnection.token_expires_at)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-2">
                    {isTokenExpired(metaConnection.token_expires_at) && (
                      <ConnectMetaButton onSuccess={loadConnections} />
                    )}
                    
                    <button
                      onClick={() => handleDisconnect(metaConnection.id)}
                      disabled={disconnecting === metaConnection.id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      {!metaConnection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Why connect?</h5>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Auto-share new listings to Facebook and Instagram</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Reach more potential buyers on your social networks</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Track engagement metrics (likes, comments, shares)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Post to Facebook Marketplace with one click</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

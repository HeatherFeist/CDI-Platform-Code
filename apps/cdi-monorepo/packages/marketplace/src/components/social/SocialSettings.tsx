import { useState, useEffect } from 'react';
import { Share2, BarChart3, Facebook, Instagram, Twitter } from 'lucide-react';
import FacebookConnect from './FacebookConnect';
import { FacebookService } from '../../services/FacebookService';
import { FacebookIntegrationSettings } from '../../types/facebook';
import { useAuth } from '../../contexts/AuthContext';

export default function SocialSettings() {
  const { user } = useAuth();
  const [facebookIntegration, setFacebookIntegration] = useState<FacebookIntegrationSettings | null>(null);
  const [shareHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const facebookService = FacebookService.getInstance();

  useEffect(() => {
    if (user) {
      loadSocialData();
    }
  }, [user]);

  const loadSocialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load Facebook integration
      const integration = await facebookService.getFacebookIntegration(user.id);
      setFacebookIntegration(integration);
      
      // Load share history (would need to implement this query)
      // const history = await facebookService.getShareHistory(user.id);
      // setShareHistory(history);
      
    } catch (error) {
      console.error('Failed to load social data:', error);
      setMessage({ type: 'error', text: 'Failed to load social settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookConnect = (settings: FacebookIntegrationSettings) => {
    setFacebookIntegration(settings);
    setMessage({ type: 'success', text: 'Facebook connected successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFacebookDisconnect = () => {
    setFacebookIntegration(null);
    setMessage({ type: 'success', text: 'Facebook disconnected' });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Please sign in to manage social settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Share2 size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Social Media Settings</h1>
        </div>
        <p className="text-gray-600">
          Connect your social media accounts to share auctions and trades with your network.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Facebook Integration */}
        <FacebookConnect 
          onConnect={handleFacebookConnect}
          onDisconnect={handleFacebookDisconnect}
        />

        {/* Other Social Platforms (Coming Soon) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Platforms</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instagram */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                    <Instagram size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Instagram</h4>
                    <p className="text-sm text-gray-600">Share visual content</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
              </div>
            </div>

            {/* Twitter */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Twitter size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Twitter</h4>
                    <p className="text-sm text-gray-600">Quick updates and announcements</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics & Insights */}
        {facebookIntegration?.connected && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 size={24} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Social Analytics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Shares */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{shareHistory.length}</div>
                <div className="text-sm text-blue-800">Total Shares</div>
              </div>

              {/* Successful Shares */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {shareHistory.filter(share => share.success).length}
                </div>
                <div className="text-sm text-green-800">Successful</div>
              </div>

              {/* This Week */}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {shareHistory.filter(share => 
                    new Date(share.shared_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <div className="text-sm text-purple-800">This Week</div>
              </div>
            </div>

            {/* Recent Shares */}
            {shareHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Shares</h4>
                <div className="space-y-2">
                  {shareHistory.slice(0, 5).map((share, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Facebook size={16} className="text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{share.content_title}</div>
                          <div className="text-xs text-gray-600">
                            {share.platform} • {new Date(share.shared_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        share.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {share.success ? 'Success' : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-sharing Tips */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Auto-sharing Tips</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <h4 className="font-medium">Best Practices:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Use high-quality images for better engagement</li>
                <li>• Write compelling descriptions</li>
                <li>• Share during peak hours (evening/weekend)</li>
                <li>• Engage with comments and questions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Privacy & Safety:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Review privacy settings regularly</li>
                <li>• Be cautious with personal information</li>
                <li>• Only share to trusted groups</li>
                <li>• Monitor share results and engagement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
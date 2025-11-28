import { useState } from 'react';
import { Facebook, Share2, Users, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FacebookService } from '../../services/FacebookService';
import { FacebookShareData, FacebookShareResult } from '../../types/facebook';
import { useAuth } from '../../contexts/AuthContext';

interface FacebookShareButtonProps {
  shareData: FacebookShareData;
  variant?: 'button' | 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  showResults?: boolean;
  onShare?: (results: FacebookShareResult[]) => void;
}

export default function FacebookShareButton({
  shareData,
  variant = 'button',
  size = 'md',
  showResults = true,
  onShare
}: FacebookShareButtonProps) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [results, setResults] = useState<FacebookShareResult[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const facebookService = FacebookService.getInstance();

  const handleShare = async (platforms: string[] = ['timeline']) => {
    if (!user) return;

    try {
      setSharing(true);
      setResults([]);

      // Get Facebook integration settings
      const integration = await facebookService.getFacebookIntegration(user.id);
      
      if (!integration?.connected || !integration.access_token) {
        throw new Error('Facebook not connected. Please connect your Facebook account first.');
      }

      const shareResults: FacebookShareResult[] = [];

      // Share to selected platforms
      for (const platform of platforms) {
        try {
          let result: FacebookShareResult;

          switch (platform) {
            case 'timeline':
              result = await facebookService.shareToTimeline(shareData, integration.access_token);
              break;

            case 'marketplace':
              result = await facebookService.shareToMarketplace(
                shareData, 
                {
                  title: shareData.title,
                  description: shareData.description,
                  price: shareData.price || 0,
                  currency: 'USD',
                  images: shareData.image_url ? [shareData.image_url] : [],
                  category_id: facebookService.getMarketplaceCategory('other'),
                  location: {
                    latitude: 0,
                    longitude: 0,
                    address: shareData.location || ''
                  },
                  availability: 'AVAILABLE'
                },
                integration.access_token
              );
              break;

            case 'groups':
              // Share to all selected groups
              if (integration.sharing_preferences.selected_groups.length > 0) {
                for (const groupId of integration.sharing_preferences.selected_groups) {
                  const groupResult = await facebookService.shareToGroup(
                    shareData, 
                    groupId, 
                    integration.access_token
                  );
                  shareResults.push(groupResult);
                }
                continue; // Skip adding a single result for groups
              } else {
                result = {
                  success: false,
                  error: 'No groups selected',
                  platform: 'group'
                };
              }
              break;

            default:
              result = {
                success: false,
                error: 'Unsupported platform',
                platform: platform as any
              };
          }

          shareResults.push(result);
        } catch (error: any) {
          shareResults.push({
            success: false,
            error: error.message,
            platform: platform as any
          });
        }
      }

      setResults(shareResults);
      onShare?.(shareResults);

      // Log the share results
      await facebookService.logFacebookShare(user.id, shareData, shareResults);

    } catch (error: any) {
      const errorResult: FacebookShareResult = {
        success: false,
        error: error.message,
        platform: 'timeline'
      };
      setResults([errorResult]);
      onShare?.([errorResult]);
    } finally {
      setSharing(false);
      setShowShareOptions(false);
    }
  };

  const getButtonContent = () => {
    if (sharing) {
      return (
        <>
          <Loader2 size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="animate-spin" />
          <span>Sharing...</span>
        </>
      );
    }

    switch (variant) {
      case 'icon':
        return <Facebook size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />;
      
      case 'button':
        return (
          <>
            <Facebook size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
            <span>Share</span>
          </>
        );
      
      case 'full':
        return (
          <>
            <Facebook size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
            <span>Share on Facebook</span>
          </>
        );
      
      default:
        return (
          <>
            <Share2 size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
            <span>Share</span>
          </>
        );
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={() => setShowShareOptions(!showShareOptions)}
        disabled={sharing}
        className={`
          bg-blue-600 text-white rounded-lg hover:bg-blue-700 
          disabled:opacity-50 disabled:cursor-not-allowed 
          transition-colors flex items-center space-x-2 font-medium
          ${getButtonSize()}
        `}
      >
        {getButtonContent()}
      </button>

      {/* Share Options Dropdown */}
      {showShareOptions && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Share to:</h4>
            
            <button
              onClick={() => handleShare(['timeline'])}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
            >
              <Globe size={16} className="text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Timeline</div>
                <div className="text-xs text-gray-600">Share to your Facebook timeline</div>
              </div>
            </button>

            <button
              onClick={() => handleShare(['groups'])}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
            >
              <Users size={16} className="text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Groups</div>
                <div className="text-xs text-gray-600">Share to selected Facebook groups</div>
              </div>
            </button>

            <button
              onClick={() => handleShare(['timeline', 'groups'])}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
            >
              <Share2 size={16} className="text-purple-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">All Platforms</div>
                <div className="text-xs text-gray-600">Share to timeline and groups</div>
              </div>
            </button>

            <div className="border-t border-gray-200 pt-3">
              <button
                onClick={() => setShowShareOptions(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Results */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Share Results</h4>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  
                  <div className="flex-1">
                    <div className={`text-sm font-medium capitalize ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.platform}
                    </div>
                    
                    {result.success ? (
                      <div className="text-xs text-green-700">
                        Successfully shared
                        {result.post_id && (
                          <span className="ml-1">• ID: {result.post_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-red-700">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setResults([])}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {(showShareOptions || (showResults && results.length > 0)) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowShareOptions(false);
            setResults([]);
          }}
        />
      )}
    </div>
  );
}
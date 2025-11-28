import { useState } from 'react';
import { Facebook, Instagram, ExternalLink } from 'lucide-react';

interface ConnectMetaButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ConnectMetaButton({ onSuccess, onError }: ConnectMetaButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);

    try {
      // Meta App ID from environment
      const metaAppId = import.meta.env.VITE_META_APP_ID;
      const redirectUri = `${window.location.origin}/auth/meta/callback`;
      
      // Permissions needed for Facebook Pages and Instagram Business
      const scopes = [
        'pages_manage_posts',           // Post to Facebook Pages
        'instagram_content_publish',    // Post to Instagram
        'pages_read_engagement',        // Read engagement metrics
        'business_management',          // Manage Business accounts
        'instagram_basic',              // Basic Instagram access
        'pages_show_list'               // List user's pages
      ].join(',');

      // Store current path to return to after OAuth
      sessionStorage.setItem('meta_oauth_return_path', window.location.pathname);

      // Redirect to Meta OAuth
      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${metaAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `state=${crypto.randomUUID()}`; // CSRF protection

      window.location.href = oauthUrl;
      
    } catch (error: any) {
      setIsConnecting(false);
      onError?.(error.message || 'Failed to start Meta connection');
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-3 shadow-sm"
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-1">
            <Facebook size={20} />
            <Instagram size={20} />
          </div>
          <span>Connect Facebook & Instagram</span>
          <ExternalLink size={16} />
        </>
      )}
    </button>
  );
}

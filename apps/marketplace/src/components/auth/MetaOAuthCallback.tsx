import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Facebook, Instagram, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function MetaOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Facebook & Instagram...');
  const [details, setDetails] = useState<{ pages?: number; instagram?: number } | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get authorization code from URL
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw new Error(errorDescription || errorReason || 'OAuth authorization failed');
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      if (!user) {
        throw new Error('You must be logged in to connect Meta');
      }

      setMessage('Exchanging authorization code...');

      // Call our Edge Function to handle the OAuth exchange
      const { data, error: functionError } = await supabase.functions.invoke(
        'meta-oauth-callback',
        {
          body: {
            code,
            redirect_uri: `${window.location.origin}/auth/meta/callback`,
            profile_id: user.id
          }
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to complete Meta connection');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to save Meta connection');
      }

      // Show success with details
      setStatus('success');
      setMessage('Successfully connected to Meta!');
      setDetails({
        pages: data.facebook_pages?.length || 0,
        instagram: data.instagram_accounts?.length || 0
      });

      // Return to original page after 2 seconds
      setTimeout(() => {
        const returnPath = sessionStorage.getItem('meta_oauth_return_path') || '/settings/social';
        sessionStorage.removeItem('meta_oauth_return_path');
        navigate(returnPath);
      }, 2000);

    } catch (error: any) {
      console.error('Meta OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect Meta account');

      // Return to settings after 3 seconds
      setTimeout(() => {
        navigate('/settings/social');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center space-x-2">
            <Facebook size={32} className="text-blue-600" />
            <Instagram size={32} className="text-pink-600" />
          </div>

          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 size={48} className="text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 size={48} className="text-green-600" />
            )}
            {status === 'error' && (
              <XCircle size={48} className="text-red-600" />
            )}
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {status === 'loading' && 'Connecting...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Connection Failed'}
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Success Details */}
          {status === 'success' && details && (
            <div className="bg-green-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Facebook Pages:</span>
                <span className="font-medium text-gray-900">{details.pages}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Instagram Accounts:</span>
                <span className="font-medium text-gray-900">{details.instagram}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center text-sm text-gray-500">
              Please wait while we connect your accounts...
            </div>
          )}

          {/* Redirect Notice */}
          {status !== 'loading' && (
            <div className="text-center text-sm text-gray-500">
              Redirecting you back...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

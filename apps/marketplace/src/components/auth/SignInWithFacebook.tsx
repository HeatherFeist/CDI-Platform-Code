import { useState } from 'react';
import { Facebook } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SignInWithFacebookProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  label?: string;
}

export default function SignInWithFacebook({ 
  onSuccess, 
  onError,
  redirectTo,
  label = "Continue with Facebook"
}: SignInWithFacebookProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);

      // Store redirect path for after auth
      if (redirectTo) {
        sessionStorage.setItem('facebook_auth_redirect', redirectTo);
      }

      // Sign in with Facebook OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/facebook/callback`,
          scopes: 'email,public_profile'
        }
      });

      if (error) throw error;

      // Redirect happens automatically
      onSuccess?.();

    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      setLoading(false);
      onError?.(error.message || 'Failed to sign in with Facebook');
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full bg-[#1877F2] text-white px-6 py-3 rounded-lg hover:bg-[#0C63D4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3 font-medium shadow-sm"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Facebook size={20} fill="white" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

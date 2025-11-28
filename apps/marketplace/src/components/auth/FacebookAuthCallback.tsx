import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Facebook, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import MembershipOfferModal from './MembershipOfferModal';

export default function FacebookAuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing sign-in...');
  const [showMembershipOffer, setShowMembershipOffer] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the session from URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');

      const user = session.user;
      const facebookId = user.user_metadata.provider_id;
      const email = user.email;
      const name = user.user_metadata.full_name || user.user_metadata.name;
      const profilePicture = user.user_metadata.avatar_url || user.user_metadata.picture?.data?.url;

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // New user - create profile
        setIsNewUser(true);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: email,
            username: email?.split('@')[0] || `user_${facebookId}`,
            facebook_id: facebookId,
            signup_source: 'facebook',
            marketplace_only: true, // Default to marketplace only
            profile_picture_url: profilePicture
          });

        if (profileError) throw profileError;

        setMessage('Account created successfully!');
        setStatus('success');

        // Show membership offer after a brief delay
        setTimeout(() => {
          setShowMembershipOffer(true);
        }, 1000);

      } else {
        // Existing user - update Facebook ID if not set
        if (!existingProfile.facebook_id) {
          await supabase
            .from('profiles')
            .update({ 
              facebook_id: facebookId,
              profile_picture_url: profilePicture || existingProfile.profile_picture_url
            })
            .eq('id', user.id);
        }

        setMessage('Welcome back!');
        setStatus('success');

        // Redirect to stored path or dashboard
        setTimeout(() => {
          const redirectPath = sessionStorage.getItem('facebook_auth_redirect') || '/dashboard';
          sessionStorage.removeItem('facebook_auth_redirect');
          navigate(redirectPath);
        }, 1500);
      }

    } catch (error: any) {
      console.error('Facebook auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to complete sign-in');

      // Redirect to home after error
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  };

  const handleMembershipDecision = (becomeMember: boolean) => {
    setShowMembershipOffer(false);

    if (becomeMember) {
      // Redirect to membership setup
      navigate('/members/register');
    } else {
      // Continue to marketplace
      const redirectPath = sessionStorage.getItem('facebook_auth_redirect') || '/dashboard';
      sessionStorage.removeItem('facebook_auth_redirect');
      navigate(redirectPath);
    }
  };

  if (showMembershipOffer) {
    return (
      <MembershipOfferModal
        onAccept={() => handleMembershipDecision(true)}
        onDecline={() => handleMembershipDecision(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <Loader2 size={48} className="text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 size={48} className="text-green-600" />
            )}
            {status === 'error' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-2xl">!</span>
              </div>
            )}
          </div>

          {/* Facebook Logo */}
          <div className="flex justify-center mb-4">
            <Facebook size={32} className="text-[#1877F2]" />
          </div>

          {/* Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'processing' && 'Signing you in...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Sign-in Failed'}
          </h2>
          <p className="text-gray-600">{message}</p>

          {/* Processing indicator */}
          {status === 'processing' && (
            <div className="mt-4 text-sm text-gray-500">
              Please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

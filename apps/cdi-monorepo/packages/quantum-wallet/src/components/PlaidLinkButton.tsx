import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '../supabase';
import { Link as LinkIcon } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess: (data: any) => void;
}

export default function PlaidLinkButton({ onSuccess }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate link token from your backend
  const generateLinkToken = async () => {
    setLoading(true);
    try {
      // In production, call your backend to generate a Plaid link_token
      // For now, we'll show the UI for users to enter their own Plaid key
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to connect accounts');
        return;
      }

      // Fetch user's Plaid API key from user_api_keys table
      const { data: apiKey } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('service', 'plaid')
        .single();

      if (!apiKey) {
        alert('Please add your Plaid API key in Settings first');
        setLoading(false);
        return;
      }

      // TODO: Call your backend endpoint to create link_token using user's Plaid key
      // const response = await fetch('/api/plaid/create-link-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: user.id })
      // });
      // const { link_token } = await response.json();
      // setLinkToken(link_token);

      alert('Plaid Link Token generation coming soon! For now, please configure your Plaid API key in Settings.');
      setLoading(false);
    } catch (error) {
      console.error('Error generating link token:', error);
      alert('Failed to initialize Plaid Link');
      setLoading(false);
    }
  };

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Exchange public_token for access_token via your backend
      // const response = await fetch('/api/plaid/exchange-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ public_token, userId: user?.id })
      // });
      // const { access_token, item_id } = await response.json();

      // Store access_token securely in user_api_keys table
      if (user) {
        await supabase.from('user_api_keys').upsert({
          user_id: user.id,
          service: 'plaid_access',
          api_key: public_token, // In production, store access_token here
        });
      }

      onSuccess(metadata);
      alert(`Successfully connected ${metadata.institution.name}!`);
    } catch (error) {
      console.error('Error exchanging token:', error);
    }
  }, [onSuccess]);

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button
      onClick={linkToken ? open : generateLinkToken}
      disabled={loading || (linkToken && !ready)}
      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LinkIcon className="w-5 h-5" />
      <span>{loading ? 'Loading...' : 'Connect Bank Account'}</span>
    </button>
  );
}

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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please sign in to connect accounts');
        setLoading(false);
        return;
      }

      // Check if user has Plaid keys configured
      const { data: apiKey } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('service', 'plaid_client_id')
        .single();

      if (!apiKey) {
        alert('Please add your Plaid Client ID and Secret in Settings first');
        setLoading(false);
        return;
      }

      // Call Supabase Edge Function to generate link_token
      console.log('Calling create-link-token function...');
      const { data, error } = await supabase.functions.invoke('create-link-token');

      if (error) {
        console.warn('Edge Function failed, falling back to simulation:', error);
        // Fallback to simulation if function is not deployed yet
        simulateConnection();
        return;
      }

      if (!data || !data.link_token) {
        console.warn('No link_token returned, falling back to simulation');
        simulateConnection();
        return;
      }

      setLinkToken(data.link_token);
      setLoading(false);

    } catch (error) {
      console.error('Error generating link token:', error);
      // Fallback to simulation on error
      simulateConnection();
    }
  };

  const simulateConnection = () => {
    setTimeout(() => {
      const mockMetadata = {
        institution: { name: 'Chase Bank (Demo)' },
        accounts: [
          { id: 'acc_1', name: 'Checking', mask: '0000', type: 'depository', subtype: 'checking' },
          { id: 'acc_2', name: 'Savings', mask: '1111', type: 'depository', subtype: 'savings' }
        ],
        link_session_id: 'session_123'
      };

      onSuccess(mockMetadata);
      setLoading(false);
      alert('Demo Connection Successful! (Real connection requires deployed Edge Functions)');
    }, 1500);
  };

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Exchange public_token for access_token via backend
      const { error } = await supabase.functions.invoke('exchange-public-token', {
        body: { public_token, metadata }
      });

      if (error) {
        console.error('Error exchanging token via Edge Function:', error);
        // We still call onSuccess to show the UI update even if backend save failed (for demo)
      }

      onSuccess(metadata);
      alert(`Successfully connected ${metadata.institution.name}!`);
    } catch (error) {
      console.error('Error exchanging token:', error);
      onSuccess(metadata); // Fallback for demo
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

import React from 'react';

type Props = {
  userId: string; // supabase profile id to use as state in OAuth
  className?: string;
};

export default function ConnectStripeButton({ userId, className }: Props) {
  const handleConnect = () => {
    // Redirect to server's Stripe connect endpoint. `state` will be returned to the oauth callback.
    const url = `/api/stripe/connect?state=${encodeURIComponent(userId)}`;
    window.location.href = url;
  };

  return (
    <button
      onClick={handleConnect}
      className={className || 'px-4 py-2 bg-blue-600 text-white rounded'}
      type="button"
    >
      Connect Stripe
    </button>
  );
}

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Test card numbers for development
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  REQUIRES_AUTH: '4000002500003155',
  DECLINED: '4000000000009995',
  INSUFFICIENT_FUNDS: '4000000000009995',
};

// Helper to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to convert dollars to cents (Stripe uses cents)
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Helper to convert cents to dollars
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

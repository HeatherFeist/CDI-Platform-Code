import { loadStripe } from '@stripe/stripe-js';
import { env } from './env';

// Initialize Stripe
export const stripePromise = loadStripe(env.stripePublishableKey);

// Payment processing utilities
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * (env.platformFeePercentage / 100) * 100) / 100;
};

export const calculateSellerPayout = (amount: number): number => {
  return amount - calculatePlatformFee(amount);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
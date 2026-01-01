import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export const paymentService = {
  /**
   * Create a payment intent on the backend
   */
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  },

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(clientSecret: string, paymentMethod: any) {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to load');

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  },

  /**
   * Process a full checkout flow
   */
  async processCheckout(items: any[], userId: string, merchantCoinConfig?: any) {
    try {
      // Calculate total
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create payment intent
      const { clientSecret, paymentIntentId } = await this.createPaymentIntent(subtotal, 'usd', {
        userId,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });

      return { clientSecret, paymentIntentId, amount: subtotal };
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  },

  /**
   * Award merchant coins after successful payment
   */
  async awardCoinsForPurchase(
    userId: string,
    merchantId: string,
    purchaseAmount: number,
    earnRate: number,
    coinConfig: any
  ) {
    const coinsEarned = Math.floor(purchaseAmount * earnRate);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/award-coins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        merchantId,
        coins: coinsEarned,
        coinConfig,
        purchaseAmount
      }),
    });

    if (!response.ok) {
      console.error('Failed to award coins');
      return null;
    }

    return response.json();
  },

  /**
   * Calculate discount from redeemed coins
   */
  calculateCoinDiscount(coinsToRedeem: number, redemptionRate: number): number {
    return coinsToRedeem / redemptionRate;
  },

  /**
   * Get payment methods for user
   */
  async getPaymentMethods(userId: string) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/methods/${userId}`);
    
    if (!response.ok) {
      return [];
    }

    return response.json();
  },

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId: string, amount?: number) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process refund');
    }

    return response.json();
  }
};

import { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePlatformFee, formatCurrency } from '../../lib/stripe';
import { env } from '../../lib/env';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
  saveForFuture?: boolean;
}

export default function PaymentForm({ amount, onSuccess, onCancel, saveForFuture = false }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveCard, setSaveCard] = useState(saveForFuture);

  const platformFee = calculatePlatformFee(amount);
  const sellerAmount = amount - platformFee;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError('');

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setError('Card information is incomplete');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          email: user.email,
        },
      });

      if (pmError) {
        setError(pmError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      // Here you would typically call your backend to:
      // 1. Create a payment intent
      // 2. Process the payment
      // 3. Save the card if requested
      // 4. Handle the transaction in your database

      // For now, we'll simulate success
      console.log('Payment Method Created:', paymentMethod);
      
      // In a real implementation, you'd call your Supabase Edge Function
      // that handles the payment processing with Stripe
      onSuccess(paymentMethod.id);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Item Total:</span>
          <span>{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Platform Fee ({env.platformFeePercentage}%):</span>
          <span>{formatCurrency(platformFee)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Seller Receives:</span>
          <span>{formatCurrency(sellerAmount)}</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between font-medium">
          <span>You Pay:</span>
          <span>{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Card Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <CardNumberElement options={cardElementOptions} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white">
              <CardExpiryElement options={cardElementOptions} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white">
              <CardCvcElement options={cardElementOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Save Card Option */}
      <div className="flex items-center">
        <input
          id="save-card"
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="save-card" className="ml-2 block text-sm text-gray-700">
          Save this card for future purchases
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
        </button>
      </div>
    </form>
  );
}
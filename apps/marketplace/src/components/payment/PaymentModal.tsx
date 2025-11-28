import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';
import PaymentForm from './PaymentForm';
import CardManager from './CardManager';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemTitle: string;
  onPaymentSuccess: (paymentMethodId: string) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  itemTitle, 
  onPaymentSuccess 
}: PaymentModalProps) {
  const [useNewCard, setUseNewCard] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string>('');

  if (!isOpen) return null;

  const handleSavedCardPayment = async (paymentMethodId: string) => {
    // Here you would process payment with the saved card
    // This would typically involve calling your backend
    console.log('Processing payment with saved card:', paymentMethodId);
    onPaymentSuccess(paymentMethodId);
  };

  const handleNewCardPayment = (paymentMethodId: string) => {
    onPaymentSuccess(paymentMethodId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{itemTitle}</h3>
            <p className="text-sm text-gray-600">
              You're about to purchase this item for <span className="font-medium">${amount.toFixed(2)}</span>
            </p>
          </div>

          <Elements stripe={stripePromise}>
            {!useNewCard ? (
              <div className="space-y-4">
                <CardManager
                  onSelectCard={handleSavedCardPayment}
                  selectedCardId={selectedSavedCard}
                  onSelectedCardChange={setSelectedSavedCard}
                  showPayButton={true}
                  paymentAmount={amount}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setUseNewCard(true)}
                  className="w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Use a new card
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={() => setUseNewCard(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to saved cards
                  </button>
                </div>

                <PaymentForm
                  amount={amount}
                  onSuccess={handleNewCardPayment}
                  onCancel={onClose}
                  saveForFuture={true}
                />
              </div>
            )}
          </Elements>
        </div>
      </div>
    </div>
  );
}
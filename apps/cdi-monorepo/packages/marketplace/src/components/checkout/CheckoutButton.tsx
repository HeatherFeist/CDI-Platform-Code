import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import { Truck, Package, MapPin, Home, X } from 'lucide-react';
import { getStripe, formatCurrency, TEST_CARDS } from '../../services/StripeService';
import { DeliveryOption } from '../../lib/supabase';

interface CheckoutButtonProps {
  listingId: string;
  title: string;
  price: number;
  sellerId: string;
  imageUrl?: string;
  deliveryOptions?: DeliveryOption[];
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  listingId,
  title,
  price,
  sellerId,
  imageUrl,
  deliveryOptions,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const navigate = useNavigate();

  const handleBuyNowClick = () => {
    // If there are delivery options, show the picker modal
    const enabledOptions = deliveryOptions?.filter(opt => opt.enabled) || [];
    if (enabledOptions.length > 0) {
      setShowDeliveryModal(true);
    } else {
      // No delivery options, proceed directly to checkout
      handleCheckout(null);
    }
  };

  const handleDeliverySelect = (option: DeliveryOption) => {
    setSelectedDelivery(option);
  };

  const handleConfirmDelivery = () => {
    if (selectedDelivery) {
      setShowDeliveryModal(false);
      handleCheckout(selectedDelivery);
    }
  };

  const handleCheckout = async (deliveryOption: DeliveryOption | null) => {
    setLoading(true);
    setError(null);

    try {
      // Get Stripe instance
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Calculate total with delivery fee
      const deliveryFee = deliveryOption?.fee || 0;
      const totalPrice = price + deliveryFee;

      // Create checkout session via local payment server
      const response = await fetch('http://localhost:3002/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          title,
          price: totalPrice,
          sellerId,
          imageUrl,
          deliveryMethod: deliveryOption?.method || null,
          deliveryFee: deliveryFee,
          deliveryDescription: deliveryOption?.description || null,
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout using the session URL
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const enabledDeliveryOptions = deliveryOptions?.filter(opt => opt.enabled) || [];

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'pickup': return Home;
      case 'local_delivery': return MapPin;
      case 'seller_delivery': return Truck;
      case 'shipping': return Package;
      default: return Truck;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'pickup': return '🏠 Local Pickup';
      case 'local_delivery': return '🚗 Local Delivery';
      case 'seller_delivery': return '🚚 Seller Delivers';
      case 'shipping': return '📦 Ship via Carrier';
      default: return method;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'pickup': return { bg: 'bg-emerald-500/10', border: 'border-emerald-400/20', text: 'text-emerald-300', hover: 'hover:bg-emerald-500/15' };
      case 'local_delivery': return { bg: 'bg-cyan-500/10', border: 'border-cyan-400/20', text: 'text-cyan-300', hover: 'hover:bg-cyan-500/15' };
      case 'seller_delivery': return { bg: 'bg-indigo-500/10', border: 'border-indigo-400/20', text: 'text-indigo-300', hover: 'hover:bg-indigo-500/15' };
      case 'shipping': return { bg: 'bg-amber-500/10', border: 'border-amber-400/20', text: 'text-amber-300', hover: 'hover:bg-amber-500/15' };
      default: return { bg: 'bg-slate-900/70', border: 'border-slate-700', text: 'text-slate-300', hover: 'hover:bg-slate-800' };
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleBuyNowClick}
        disabled={loading}
        className="market-button-primary flex w-full items-center justify-center space-x-2 px-6 py-3 font-semibold transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FaCreditCard className="text-xl" />
            <span>Buy Now - {formatCurrency(price)}</span>
          </>
        )}
      </button>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-200">
          <p className="font-semibold">Payment Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
        <div className="flex items-center space-x-1">
          <FaLock className="text-emerald-300" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center space-x-1">
          <FaShieldAlt className="text-cyan-300" />
          <span>Buyer Protection</span>
        </div>
      </div>

      {/* Test mode indicator */}
      {import.meta.env.MODE === 'development' && (
        <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">🧪 Test Mode</p>
          <p className="mb-2">Use these test card numbers:</p>
          <ul className="space-y-1 text-xs">
            <li>
              <strong>Success:</strong> {TEST_CARDS.SUCCESS}
            </li>
            <li>
              <strong>Requires Auth:</strong> {TEST_CARDS.REQUIRES_AUTH}
            </li>
            <li>
              <strong>Declined:</strong> {TEST_CARDS.DECLINED}
            </li>
          </ul>
          <p className="mt-2 text-xs">Any future expiration date, any 3-digit CVC</p>
        </div>
      )}

      {/* Delivery Method Selection Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="market-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Choose Delivery Method</h3>
                <p className="mt-1 text-sm text-slate-400">Select how you'd like to receive this item</p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="rounded-full p-2 transition-colors hover:bg-slate-900/40"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {enabledDeliveryOptions.map((option, index) => {
                const colors = getMethodColor(option.method);
                const Icon = getDeliveryIcon(option.method);
                const isSelected = selectedDelivery?.method === option.method;

                return (
                  <button
                    key={index}
                    onClick={() => handleDeliverySelect(option)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ring-2 ring-indigo-400/40 ring-offset-0`
                        : `${colors.border} ${colors.bg} ${colors.hover}`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon size={24} className={colors.text} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${colors.text}`}>
                              {getMethodLabel(option.method)}
                            </span>
                            <span className={`font-bold ${option.fee === 0 ? 'text-green-600' : colors.text}`}>
                              {option.fee === 0 ? 'FREE' : `+${formatCurrency(option.fee)}`}
                            </span>
                          </div>
                          
                          {option.description && (
                            <p className="mb-2 text-sm text-slate-300">{option.description}</p>
                          )}

                          <div className="space-y-1 text-xs text-slate-400">
                            {option.method === 'local_delivery' && option.radius_miles && (
                              <p>• Delivers within {option.radius_miles} miles</p>
                            )}
                            {option.method === 'pickup' && option.available_hours && (
                              <p>• Available: {option.available_hours}</p>
                            )}
                            {option.method === 'shipping' && option.carrier && (
                              <p>• Carrier: {option.carrier}</p>
                            )}
                            {option.method === 'shipping' && option.estimated_days && (
                              <p>• Estimated delivery: {option.estimated_days} days</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className={`ml-3 w-6 h-6 rounded-full ${colors.text.replace('text-', 'bg-')} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
              {selectedDelivery && (
                <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Item Price:</span>
                    <span className="font-semibold text-slate-100">{formatCurrency(price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-300">Delivery Fee:</span>
                    <span className={`font-semibold ${selectedDelivery.fee === 0 ? 'text-emerald-300' : 'text-slate-100'}`}>
                      {selectedDelivery.fee === 0 ? 'FREE' : formatCurrency(selectedDelivery.fee)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-cyan-400/20 pt-2 text-base font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-cyan-300">{formatCurrency(price + selectedDelivery.fee)}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="market-button-secondary flex-1 px-6 py-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={!selectedDelivery}
                  className="market-button-primary flex-1 px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

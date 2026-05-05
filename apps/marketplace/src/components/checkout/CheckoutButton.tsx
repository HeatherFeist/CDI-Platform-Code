import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Truck, Package, MapPin, Home, X, ShieldCheck, Lock } from 'lucide-react';
import { DeliveryOption } from '../../lib/supabase';

interface CheckoutButtonProps {
  listingId: string;
  title: string;
  price: number;
  sellerId: string;
  imageUrl?: string;
  deliveryOptions?: DeliveryOption[];
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  listingId,
  title,
  price,
  sellerId,
  imageUrl,
  deliveryOptions,
}) => {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const enabledDeliveryOptions = deliveryOptions?.filter(opt => opt.enabled) || [];
  const totalPrice = price + (selectedDelivery?.fee || 0);

  const handleBuyNowClick = () => {
    if (enabledDeliveryOptions.length > 0) {
      setShowDeliveryModal(true);
    } else {
      setShowPayPal(true);
    }
  };

  const handleConfirmDelivery = () => {
    setShowDeliveryModal(false);
    setShowPayPal(true);
  };

  if (paymentSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-800">Payment Successful!</p>
        <p className="text-sm text-green-700 mt-1">Thank you for your purchase. The seller will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
      <div className="space-y-3">
        {!showPayPal ? (
          <>
            <button
              onClick={handleBuyNowClick}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>Buy Now — {formatCurrency(price)}</span>
            </button>

            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Lock size={12} /> Secure Checkout</span>
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Buyer Protection</span>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">Item:</span>
                <span className="font-medium">{formatCurrency(price)}</span>
              </div>
              {selectedDelivery && selectedDelivery.fee > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">Delivery:</span>
                  <span className="font-medium">{formatCurrency(selectedDelivery.fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1">
                <span>Total:</span>
                <span className="text-blue-700">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
              createOrder={(_data, actions) =>
                actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      amount: {
                        currency_code: 'USD',
                        value: totalPrice.toFixed(2),
                      },
                      description: title,
                      custom_id: listingId,
                    },
                  ],
                })
              }
              onApprove={async (_data, actions) => {
                await actions.order!.capture();
                setPaymentSuccess(true);
                setShowPayPal(false);
              }}
              onError={(err) => {
                console.error('PayPal error:', err);
                setPaymentError('Payment failed. Please try again.');
              }}
              onCancel={() => {
                setShowPayPal(false);
                setPaymentError(null);
              }}
            />

            <button
              onClick={() => { setShowPayPal(false); setPaymentError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              ← Back
            </button>
          </div>
        )}

        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {paymentError}
          </div>
        )}

        {/* Delivery Selection Modal */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Delivery Method</h3>
                  <p className="text-sm text-gray-600 mt-1">Select how you'd like to receive this item</p>
                </div>
                <button onClick={() => setShowDeliveryModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {enabledDeliveryOptions.map((option, index) => {
                  const Icon = getDeliveryIcon(option.method);
                  const isSelected = selectedDelivery?.method === option.method;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDelivery(option)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon size={20} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                          <div>
                            <p className="font-medium text-gray-900">{getMethodLabel(option.method)}</p>
                            {option.description && <p className="text-sm text-gray-500">{option.description}</p>}
                            {option.method === 'local_delivery' && option.radius_miles && (
                              <p className="text-xs text-gray-400">Within {option.radius_miles} miles</p>
                            )}
                            {option.method === 'shipping' && option.estimated_days && (
                              <p className="text-xs text-gray-400">Est. {option.estimated_days} days</p>
                            )}
                          </div>
                        </div>
                        <span className={`font-bold ${option.fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {option.fee === 0 ? 'FREE' : `+${formatCurrency(option.fee)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={!selectedDelivery}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
};

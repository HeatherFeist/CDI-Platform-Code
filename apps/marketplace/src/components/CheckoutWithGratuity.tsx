import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CheckoutWithGratuityProps {
  sellerId: string;
  itemPrice: number;
  itemName: string;
  shippingFee?: number;
  onCheckout: (totalAmount: number, feeBreakdown: FeeBreakdown) => void;
}

interface FeeBreakdown {
  itemPrice: number;
  shippingFee: number;
  subtotal: number;
  platformGratuityPercentage: number;
  platformGratuityAmount: number;
  total: number;
}

export const CheckoutWithGratuity: React.FC<CheckoutWithGratuityProps> = ({
  sellerId,
  itemPrice,
  itemName,
  shippingFee = 0,
  onCheckout,
}) => {
  const [gratuityPercentage, setGratuityPercentage] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSellerGratuity();
  }, [sellerId]);

  const loadSellerGratuity = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('platform_gratuity_percentage')
        .eq('id', sellerId)
        .single();

      if (error) throw error;

      setGratuityPercentage(data?.platform_gratuity_percentage || 15);
    } catch (error) {
      console.error('Error loading seller gratuity:', error);
      setGratuityPercentage(15); // Default fallback
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = (): FeeBreakdown => {
    const subtotal = itemPrice + shippingFee;
    const platformGratuityAmount = Math.round((subtotal * gratuityPercentage) / 100 * 100) / 100;
    const total = subtotal + platformGratuityAmount;

    return {
      itemPrice,
      shippingFee,
      subtotal,
      platformGratuityPercentage: gratuityPercentage,
      platformGratuityAmount,
      total,
    };
  };

  const fees = calculateFees();

  const handleCheckout = () => {
    onCheckout(fees.total, fees);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

      {/* Item Details */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Item</p>
        <p className="font-semibold text-gray-900">{itemName}</p>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Item Price:</span>
          <span className="font-medium text-gray-900">${fees.itemPrice.toFixed(2)}</span>
        </div>

        {shippingFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping & Handling:</span>
            <span className="font-medium text-gray-900">${fees.shippingFee.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold text-gray-900">${fees.subtotal.toFixed(2)}</span>
        </div>

        {/* Platform Gratuity - Highlighted like DoorDash */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <span className="text-sm font-semibold text-blue-900">
                Platform Gratuity ({fees.platformGratuityPercentage}%)
              </span>
              <p className="text-xs text-blue-700 mt-1">
                Supports platform infrastructure and features. Seller set this rate.
              </p>
            </div>
            <span className="text-sm font-bold text-blue-900 ml-2">
              ${fees.platformGratuityAmount.toFixed(2)}
            </span>
          </div>
          
          {/* Info tooltip */}
          <details className="text-xs text-blue-600 cursor-pointer">
            <summary className="font-medium hover:text-blue-800">Why am I seeing this?</summary>
            <p className="mt-2 text-blue-700">
              Like DoorDash driver tips, this gratuity helps maintain the platform and keep it free for sellers. 
              The seller has chosen a {fees.platformGratuityPercentage}% gratuity rate. 100% of the item price goes to the seller.
            </p>
          </details>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gray-900 text-white p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total Due:</span>
          <span className="text-2xl font-bold">${fees.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105"
      >
        Proceed to Payment
      </button>

      {/* Trust Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>Buyer Protection</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💳</span>
            <span>Safe Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

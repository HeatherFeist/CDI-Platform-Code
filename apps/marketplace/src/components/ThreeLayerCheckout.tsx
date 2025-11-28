import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ThreeLayerCheckoutProps {
  sellerId: string;
  itemName: string;
  itemPrice: number;
  shippingFee?: number;
  onCheckout: (grandTotal: number, feeBreakdown: FeeBreakdown) => void;
}

interface FeeBreakdown {
  itemPrice: number;
  shippingFee: number;
  subtotal: number;
  sellerDonationEnabled: boolean;
  sellerDonationPercentage: number;
  sellerDonationAmount: number;
  buyerDonationPercentage: number;
  buyerDonationAmount: number;
  totalDonations: number;
  grandTotal: number;
  sellerIsBoard: boolean;
  sellerIsTaxExempt: boolean;
}

interface SellerInfo {
  is_board_volunteer: boolean;
  tax_exempt_status: boolean;
  seller_optional_donation_percentage: number;
  full_name: string;
  board_role_group: string;
}

export const ThreeLayerCheckout: React.FC<ThreeLayerCheckoutProps> = ({
  sellerId,
  itemName,
  itemPrice,
  shippingFee = 0,
  onCheckout,
}) => {
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [buyerDonationPct, setBuyerDonationPct] = useState<number>(15);
  const [showBuyerDonation, setShowBuyerDonation] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSellerInfo();
  }, [sellerId]);

  const loadSellerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_board_volunteer, tax_exempt_status, seller_optional_donation_percentage, full_name, board_role_group')
        .eq('id', sellerId)
        .single();

      if (error) throw error;
      setSellerInfo(data);
    } catch (error) {
      console.error('Error loading seller info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = (): FeeBreakdown => {
    const subtotal = itemPrice + shippingFee;
    
    // Layer 1: Seller's optional "sales tax replacement" donation
    const sellerDonationEnabled = (sellerInfo?.seller_optional_donation_percentage || 0) > 0;
    const sellerDonationPercentage = sellerInfo?.seller_optional_donation_percentage || 0;
    const sellerDonationAmount = sellerDonationEnabled 
      ? Math.round((subtotal * sellerDonationPercentage / 100) * 100) / 100
      : 0;
    
    // Layer 2: Buyer's optional platform donation
    const buyerDonationAmount = showBuyerDonation
      ? Math.round((subtotal * buyerDonationPct / 100) * 100) / 100
      : 0;
    
    const totalDonations = sellerDonationAmount + buyerDonationAmount;
    const grandTotal = subtotal + totalDonations;

    return {
      itemPrice,
      shippingFee,
      subtotal,
      sellerDonationEnabled,
      sellerDonationPercentage,
      sellerDonationAmount,
      buyerDonationPercentage: buyerDonationPct,
      buyerDonationAmount,
      totalDonations,
      grandTotal,
      sellerIsBoard: sellerInfo?.is_board_volunteer || false,
      sellerIsTaxExempt: sellerInfo?.tax_exempt_status || false,
    };
  };

  const fees = calculateFees();
  const estimatedBuyerTaxSavings = Math.round((fees.buyerDonationAmount * 0.25) * 100) / 100; // 25% bracket estimate

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-8">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>
        <p className="text-blue-100 text-sm">Tax-optimized nonprofit marketplace</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Item Details */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-semibold text-gray-900 mb-2">{itemName}</h3>
          {sellerInfo?.is_board_volunteer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                ✓ Board Volunteer Seller
              </span>
              {sellerInfo.board_role_group && (
                <span className="text-gray-600">• {sellerInfo.board_role_group}</span>
              )}
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-gray-700">Item Price:</span>
            <span className="font-semibold text-gray-900">${fees.itemPrice.toFixed(2)}</span>
          </div>

          {fees.shippingFee > 0 && (
            <div className="flex justify-between text-base">
              <span className="text-gray-700">Shipping:</span>
              <span className="font-semibold text-gray-900">${fees.shippingFee.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-base pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Subtotal:</span>
            <span className="font-bold text-gray-900">${fees.subtotal.toFixed(2)}</span>
          </div>

          {/* Layer 1: Seller Donation */}
          {fees.sellerDonationEnabled && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-900">
                      Support Seller ({fees.sellerDonationPercentage}%)
                    </span>
                    <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      Seller gets tax receipt
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    This optional donation goes to the seller as a tax-deductible contribution. 
                    Similar to sales tax amount, but better for the seller!
                  </p>
                </div>
                <span className="text-base font-bold text-amber-900 ml-3">
                  ${fees.sellerDonationAmount.toFixed(2)}
                </span>
              </div>
              <details className="text-xs text-amber-600 cursor-pointer mt-2">
                <summary className="font-medium hover:text-amber-800">Why does the seller get a tax receipt?</summary>
                <p className="mt-2 text-amber-700">
                  As a board volunteer, this seller is tax-exempt on resales (they already paid tax when purchasing). 
                  This optional charge allows them to receive a tax-deductible receipt for charitable contribution, 
                  creating a tax benefit that can offset their business expenses.
                </p>
              </details>
            </div>
          )}

          {/* Sales Tax - ZERO! */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-green-800 font-semibold">Sales Tax:</span>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  Tax-Exempt Transaction!
                </span>
              </div>
              <span className="text-base font-bold text-green-900 line-through">
                ${(fees.subtotal * 0.075).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              You save <strong>${(fees.subtotal * 0.075).toFixed(2)}</strong> in sales tax! 
              {sellerInfo?.is_board_volunteer 
                ? ' Board volunteer sellers are tax-exempt.' 
                : ' Nonprofit marketplace benefits.'}
            </p>
          </div>

          {/* Layer 2: Buyer Platform Donation */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="buyer-donation-toggle"
                    checked={showBuyerDonation}
                    onChange={(e) => setShowBuyerDonation(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="buyer-donation-toggle" className="font-semibold text-blue-900 cursor-pointer">
                    Support Platform (Optional)
                  </label>
                  <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                    You get tax receipt
                  </span>
                </div>
                <p className="text-xs text-blue-700 ml-6">
                  Your tax-deductible donation helps maintain the platform. Like tipping on DoorDash, 
                  but better - you get a tax deduction!
                </p>
              </div>
              {showBuyerDonation && (
                <span className="text-base font-bold text-blue-900 ml-3">
                  ${fees.buyerDonationAmount.toFixed(2)}
                </span>
              )}
            </div>

            {showBuyerDonation && (
              <div className="ml-6 space-y-3">
                {/* Percentage Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-blue-800 font-medium">Amount:</span>
                  {[0, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setBuyerDonationPct(pct)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        buyerDonationPct === pct
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={buyerDonationPct}
                    onChange={(e) => setBuyerDonationPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 border border-blue-300 rounded text-xs text-center font-semibold"
                  />
                  <span className="text-xs text-blue-700">%</span>
                </div>

                {/* Tax Savings Preview */}
                <div className="bg-blue-100 rounded p-2">
                  <div className="text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span>Your donation:</span>
                      <span className="font-semibold">${fees.buyerDonationAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. tax savings (25% bracket):</span>
                      <span className="font-semibold text-green-700">-${estimatedBuyerTaxSavings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 mt-1 pt-1">
                      <span className="font-bold">Effective cost:</span>
                      <span className="font-bold">${(fees.buyerDonationAmount - estimatedBuyerTaxSavings).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <details className="text-xs text-blue-600 cursor-pointer mt-3 ml-6">
              <summary className="font-medium hover:text-blue-800">How does my tax deduction work?</summary>
              <p className="mt-2 text-blue-700">
                This is a charitable contribution to our 501(c)(3) nonprofit. You'll receive an instant 
                tax receipt via email. The donation is fully tax-deductible, reducing your taxable income. 
                In the 25% tax bracket, a $15 donation effectively costs you only $11.25 after tax savings!
              </p>
            </details>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl font-bold">Total Due:</span>
            <span className="text-3xl font-bold">${fees.grandTotal.toFixed(2)}</span>
          </div>
          {showBuyerDonation && fees.buyerDonationAmount > 0 && (
            <div className="text-xs text-gray-300 text-right">
              Includes ${fees.buyerDonationAmount.toFixed(2)} tax-deductible donation
            </div>
          )}
        </div>

        {/* Summary Box */}
        <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-4">
          <div className="text-sm font-semibold text-purple-900 mb-2">📊 Your Tax Benefits Summary:</div>
          <div className="space-y-1 text-xs text-purple-800">
            {fees.sellerDonationEnabled && (
              <div className="flex items-start gap-2">
                <span>✓</span>
                <span>Seller receives tax receipt for ${fees.sellerDonationAmount.toFixed(2)}</span>
              </div>
            )}
            {showBuyerDonation && fees.buyerDonationAmount > 0 && (
              <div className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  You receive tax receipt for ${fees.buyerDonationAmount.toFixed(2)} 
                  (~${estimatedBuyerTaxSavings.toFixed(2)} tax savings)
                </span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span>✓</span>
              <span>
                You saved ${(fees.subtotal * 0.075).toFixed(2)} in sales tax (no tax on this transaction!)
              </span>
            </div>
            <div className="flex items-start gap-2 font-semibold text-purple-900 mt-2 pt-2 border-t border-purple-300">
              <span>💰</span>
              <span>
                Combined benefit: ~${(fees.subtotal * 0.075 + estimatedBuyerTaxSavings).toFixed(2)} in savings & deductions
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => onCheckout(fees.grandTotal, fees)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-[1.02] shadow-lg"
        >
          Complete Purchase
        </button>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>Buyer Protection</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📧</span>
            <span>Instant Tax Receipts</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏛️</span>
            <span>501(c)(3) Nonprofit</span>
          </div>
        </div>

        {/* Nonprofit Transparency */}
        <div className="text-center text-xs text-gray-500 pt-2">
          <p>
            Constructive Designs Inc. is a registered 501(c)(3) nonprofit organization.
            All donations are tax-deductible to the fullest extent allowed by law.
          </p>
        </div>
      </div>
    </div>
  );
};

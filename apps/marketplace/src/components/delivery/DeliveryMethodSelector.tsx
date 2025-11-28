import { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiMapPin, FiDollarSign, FiClock, FiCheck } from 'react-icons/fi';
import type { DeliveryType, Address } from '../../types/delivery';
import { DeliveryService } from '../../services/DeliveryService';

interface DeliveryMethodSelectorProps {
  availableOptions: DeliveryType[];
  selectedMethod: DeliveryType | null;
  onMethodChange: (method: DeliveryType) => void;
  
  // Item details
  itemPrice: number;
  itemWeight?: number;
  itemValue?: number;
  
  // Seller delivery details
  sellerDeliveryFee?: number;
  sellerDeliveryRadius?: number;
  
  // Addresses
  pickupAddress?: Address;
  deliveryAddress?: Address;
  onDeliveryAddressChange?: (address: Address) => void;
  
  // Tip for platform delivery
  deliveryTip?: number;
  onDeliveryTipChange?: (tip: number) => void;
}

export function DeliveryMethodSelector({
  availableOptions,
  selectedMethod,
  onMethodChange,
  itemPrice,
  itemWeight,
  itemValue,
  sellerDeliveryFee = 0,
  sellerDeliveryRadius = 25,
  pickupAddress,
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryTip = 0,
  onDeliveryTipChange
}: DeliveryMethodSelectorProps) {
  const [platformDeliveryFee, setPlatformDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Calculate platform delivery fee when addresses are available
  useEffect(() => {
    if (
      pickupAddress?.lat &&
      pickupAddress?.lon &&
      deliveryAddress?.lat &&
      deliveryAddress?.lon
    ) {
      const dist = DeliveryService.calculateDistance(
        pickupAddress.lat,
        pickupAddress.lon,
        deliveryAddress.lat,
        deliveryAddress.lon
      );
      setDistance(dist);

      const feeCalc = DeliveryService.calculateDeliveryFee(
        dist,
        itemWeight,
        itemValue
      );
      setPlatformDeliveryFee(feeCalc.total_fee);
    }
  }, [pickupAddress, deliveryAddress, itemWeight, itemValue]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    const updated = { ...deliveryAddress, [field]: value } as Address;
    onDeliveryAddressChange?.(updated);
  };

  const getTotalCost = (method: DeliveryType): number => {
    let total = itemPrice;
    
    if (method === 'seller_delivery') {
      total += sellerDeliveryFee;
    } else if (method === 'platform_delivery') {
      total += platformDeliveryFee + deliveryTip;
    }
    
    return total;
  };

  const suggestedTips = [0, 3, 5, 10];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Delivery Method</h3>
        <p className="text-sm text-gray-600">
          Select how you'd like to receive this item
        </p>
      </div>

      {/* Self-Pickup */}
      {availableOptions.includes('self_pickup') && (
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'self_pickup'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => onMethodChange('self_pickup')}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMethod === 'self_pickup' ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <FiMapPin className={`w-5 h-5 ${
                  selectedMethod === 'self_pickup' ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">Self-Pickup</h4>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    FREE
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Pick up directly from the seller
                </p>
                {pickupAddress && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                    <p className="font-medium">Pickup Location:</p>
                    <p>{pickupAddress.street}</p>
                    <p>{pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}</p>
                    {pickupAddress.instructions && (
                      <p className="mt-1 text-gray-600">📝 {pickupAddress.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">FREE</div>
              <div className="text-xs text-gray-500">No delivery fee</div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Delivery */}
      {availableOptions.includes('seller_delivery') && (
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'seller_delivery'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => {
            onMethodChange('seller_delivery');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMethod === 'seller_delivery' ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <FiTruck className={`w-5 h-5 ${
                  selectedMethod === 'seller_delivery' ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Seller Delivers</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Seller will deliver to your address
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FiMapPin className="w-3 h-3" />
                  <span>Within {sellerDeliveryRadius} miles</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">
                ${sellerDeliveryFee.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Delivery fee</div>
            </div>
          </div>

          {selectedMethod === 'seller_delivery' && showAddressForm && (
            <div className="mt-4 pt-4 border-t border-purple-200" onClick={(e) => e.stopPropagation()}>
              <h5 className="font-medium text-gray-900 mb-3">Your Delivery Address</h5>
              <div className="space-y-3">
                <input
                  type="text"
                  value={deliveryAddress?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Street Address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={deliveryAddress?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={deliveryAddress?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={deliveryAddress?.zip || ''}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  placeholder="ZIP Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <textarea
                  value={deliveryAddress?.instructions || ''}
                  onChange={(e) => handleAddressChange('instructions', e.target.value)}
                  placeholder="Delivery instructions (gate code, apartment number, etc.)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platform Delivery */}
      {availableOptions.includes('platform_delivery') && (
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'platform_delivery'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => {
            onMethodChange('platform_delivery');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMethod === 'platform_delivery' ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <FiTruck className={`w-5 h-5 ${
                  selectedMethod === 'platform_delivery' ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">Platform Delivery</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    TRACKED
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Professional driver pickup & delivery
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    <span>Same day</span>
                  </div>
                  {distance > 0 && (
                    <div className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      <span>{distance.toFixed(1)} miles</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">
                ${platformDeliveryFee > 0 ? platformDeliveryFee.toFixed(2) : '---'}
              </div>
              <div className="text-xs text-gray-500">
                {platformDeliveryFee > 0 ? '+ optional tip' : 'Enter address'}
              </div>
            </div>
          </div>

          {selectedMethod === 'platform_delivery' && (
            <div className="mt-4 pt-4 border-t border-purple-200 space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* Address Form */}
              {showAddressForm && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Your Delivery Address</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={deliveryAddress?.street || ''}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Street Address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={deliveryAddress?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={deliveryAddress?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="State"
                        maxLength={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress?.zip || ''}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                      placeholder="ZIP Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <textarea
                      value={deliveryAddress?.instructions || ''}
                      onChange={(e) => handleAddressChange('instructions', e.target.value)}
                      placeholder="Delivery instructions (gate code, apartment number, etc.)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Tip Selection */}
              {platformDeliveryFee > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Tip Your Driver (Optional)</h5>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {suggestedTips.map(tip => (
                      <button
                        key={tip}
                        type="button"
                        onClick={() => onDeliveryTipChange?.(tip)}
                        className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                          deliveryTip === tip
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-700 hover:border-purple-300'
                        }`}
                      >
                        {tip === 0 ? 'No Tip' : `$${tip}`}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={deliveryTip}
                      onChange={(e) => onDeliveryTipChange?.(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.50"
                      placeholder="Custom tip"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 100% of your tip goes directly to the driver
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Shipping */}
      {availableOptions.includes('shipping') && (
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'shipping'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => {
            onMethodChange('shipping');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedMethod === 'shipping' ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <FiPackage className={`w-5 h-5 ${
                  selectedMethod === 'shipping' ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Shipping</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Traditional carrier (USPS, UPS, FedEx)
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FiClock className="w-3 h-3" />
                  <span>3-7 business days</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-600">TBD</div>
              <div className="text-xs text-gray-500">Calculated at checkout</div>
            </div>
          </div>
        </div>
      )}

      {/* Total Summary */}
      {selectedMethod && (
        <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Order Summary</h4>
            <FiCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Item Price</span>
              <span>${itemPrice.toFixed(2)}</span>
            </div>
            {selectedMethod === 'seller_delivery' && (
              <div className="flex justify-between">
                <span>Seller Delivery</span>
                <span>${sellerDeliveryFee.toFixed(2)}</span>
              </div>
            )}
            {selectedMethod === 'platform_delivery' && platformDeliveryFee > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Platform Delivery</span>
                  <span>${platformDeliveryFee.toFixed(2)}</span>
                </div>
                {deliveryTip > 0 && (
                  <div className="flex justify-between">
                    <span>Driver Tip</span>
                    <span>${deliveryTip.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="border-t border-purple-400 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${getTotalCost(selectedMethod).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

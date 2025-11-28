import { useState } from 'react';
import { FiPackage, FiTruck, FiMapPin, FiDollarSign, FiInfo } from 'react-icons/fi';
import type { DeliveryType, Address } from '../../types/delivery';

interface DeliveryOptionsSelectorProps {
  selectedOptions: DeliveryType[];
  onOptionsChange: (options: DeliveryType[]) => void;
  sellerDeliveryFee?: number;
  onSellerDeliveryFeeChange?: (fee: number) => void;
  sellerDeliveryRadius?: number;
  onSellerDeliveryRadiusChange?: (radius: number) => void;
  pickupLocation?: Address;
  onPickupLocationChange?: (location: Address) => void;
  shippingWeight?: number;
  onShippingWeightChange?: (weight: number) => void;
}

export function DeliveryOptionsSelector({
  selectedOptions,
  onOptionsChange,
  sellerDeliveryFee = 0,
  onSellerDeliveryFeeChange,
  sellerDeliveryRadius = 25,
  onSellerDeliveryRadiusChange,
  pickupLocation,
  onPickupLocationChange,
  shippingWeight = 0,
  onShippingWeightChange
}: DeliveryOptionsSelectorProps) {
  const [showPickupForm, setShowPickupForm] = useState(false);

  const toggleOption = (option: DeliveryType) => {
    if (option === 'self_pickup') return; // Always enabled
    
    if (selectedOptions.includes(option)) {
      onOptionsChange(selectedOptions.filter(o => o !== option));
    } else {
      onOptionsChange([...selectedOptions, option]);
    }
  };

  const handlePickupLocationChange = (field: keyof Address, value: string) => {
    const updated = { ...pickupLocation, [field]: value } as Address;
    onPickupLocationChange?.(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Options</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select how buyers can receive this item. You can offer multiple options for flexibility.
        </p>
      </div>

      {/* Self-Pickup (Always Available) */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Self-Pickup (Free)</h4>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Always Available
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Buyer picks up the item directly from you. No delivery fee. Like Craigslist/Facebook Marketplace.
            </p>

            <button
              type="button"
              onClick={() => setShowPickupForm(!showPickupForm)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {showPickupForm ? 'Hide' : 'Set'} Pickup Location
            </button>

            {showPickupForm && (
              <div className="mt-4 space-y-3 bg-white rounded-lg p-4 border border-purple-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={pickupLocation?.street || ''}
                      onChange={(e) => handlePickupLocationChange('street', e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={pickupLocation?.city || ''}
                      onChange={(e) => handlePickupLocationChange('city', e.target.value)}
                      placeholder="Denver"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={pickupLocation?.state || ''}
                      onChange={(e) => handlePickupLocationChange('state', e.target.value)}
                      placeholder="CO"
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={pickupLocation?.zip || ''}
                      onChange={(e) => handlePickupLocationChange('zip', e.target.value)}
                      placeholder="80201"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Instructions (Optional)
                    </label>
                    <textarea
                      value={pickupLocation?.instructions || ''}
                      onChange={(e) => handlePickupLocationChange('instructions', e.target.value)}
                      placeholder="Ring doorbell, parking available in driveway..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seller Delivery */}
      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedOptions.includes('seller_delivery')
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
        onClick={() => toggleOption('seller_delivery')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedOptions.includes('seller_delivery')
                ? 'bg-purple-600'
                : 'bg-gray-200'
            }`}>
              <FiTruck className={`w-5 h-5 ${
                selectedOptions.includes('seller_delivery') ? 'text-white' : 'text-gray-500'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">I'll Deliver</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('seller_delivery')}
                onChange={() => toggleOption('seller_delivery')}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              You deliver the item yourself. Set your own delivery fee and service area.
            </p>

            {selectedOptions.includes('seller_delivery') && (
              <div className="mt-4 space-y-3 bg-white rounded-lg p-4 border border-purple-200" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={sellerDeliveryFee}
                        onChange={(e) => onSellerDeliveryFeeChange?.(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="10.00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Radius
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={sellerDeliveryRadius}
                        onChange={(e) => onSellerDeliveryRadiusChange?.(parseInt(e.target.value) || 25)}
                        min="1"
                        max="100"
                        placeholder="25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">miles</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                  <span>You keep 100% of your delivery fee. Platform fee applies to item price only.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Delivery */}
      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedOptions.includes('platform_delivery')
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
        onClick={() => toggleOption('platform_delivery')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedOptions.includes('platform_delivery')
                ? 'bg-purple-600'
                : 'bg-gray-200'
            }`}>
              <FiTruck className={`w-5 h-5 ${
                selectedOptions.includes('platform_delivery') ? 'text-white' : 'text-gray-500'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Platform Delivery</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('platform_delivery')}
                onChange={() => toggleOption('platform_delivery')}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Professional drivers pick up and deliver. Fee calculated by distance. Like DoorDash for items.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Safe</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Convenient</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedOptions.includes('shipping')
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
        onClick={() => toggleOption('shipping')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedOptions.includes('shipping')
                ? 'bg-purple-600'
                : 'bg-gray-200'
            }`}>
              <FiPackage className={`w-5 h-5 ${
                selectedOptions.includes('shipping') ? 'text-white' : 'text-gray-500'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Shipping (USPS/UPS/FedEx)</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('shipping')}
                onChange={() => toggleOption('shipping')}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Ship via traditional carriers. Best for distant buyers or small items.
            </p>

            {selectedOptions.includes('shipping') && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Weight (for shipping calculation)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={shippingWeight}
                    onChange={(e) => onShippingWeightChange?.(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    placeholder="5.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">lbs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg p-4 text-white">
        <h4 className="font-semibold mb-2">Selected Options Summary</h4>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            Self-Pickup (Always available)
          </li>
          {selectedOptions.includes('seller_delivery') && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              I'll Deliver - ${sellerDeliveryFee.toFixed(2)} within {sellerDeliveryRadius} miles
            </li>
          )}
          {selectedOptions.includes('platform_delivery') && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Platform Delivery - Fee calculated by distance
            </li>
          )}
          {selectedOptions.includes('shipping') && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Shipping - Buyer pays actual shipping cost
            </li>
          )}
        </ul>
        <p className="text-xs text-purple-100 mt-3">
          💡 Offering multiple options increases your chances of selling!
        </p>
      </div>
    </div>
  );
}

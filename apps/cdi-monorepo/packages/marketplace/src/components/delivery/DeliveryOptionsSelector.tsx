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

  const optionCardBase = 'rounded-3xl border p-4 transition-all backdrop-blur-sm';
  const optionCardSelected = 'border-cyan-400/60 bg-slate-900/90 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.55)]';
  const optionCardUnselected = 'border-white/10 bg-slate-950/70 hover:border-cyan-400/30 hover:bg-slate-900/85';
  const iconBase = 'flex h-10 w-10 items-center justify-center rounded-2xl border';
  const checkboxClass = 'h-5 w-5 rounded border-white/20 bg-slate-950/80 text-cyan-400 focus:ring-cyan-400';
  const inputClass = 'market-input w-full';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Delivery Options</h3>
        <p className="mb-4 text-sm text-slate-300">
          Select how buyers can receive this item. You can offer multiple options for flexibility.
        </p>
      </div>

      {/* Self-Pickup (Always Available) */}
      <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-cyan-950/80 p-4 text-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.45)]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/20">
              <FiMapPin className="h-5 w-5 text-cyan-100" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Self-Pickup (Free)</h4>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
                Always Available
              </span>
            </div>
            <p className="mb-3 text-sm text-slate-300">
              Buyer picks up the item directly from you. No delivery fee. Like Craigslist/Facebook Marketplace.
            </p>

            <button
              type="button"
              onClick={() => setShowPickupForm(!showPickupForm)}
              className="text-sm font-medium text-cyan-200 transition-colors hover:text-white"
            >
              {showPickupForm ? 'Hide' : 'Set'} Pickup Location
            </button>

            {showPickupForm && (
              <div className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-200">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={pickupLocation?.street || ''}
                      onChange={(e) => handlePickupLocationChange('street', e.target.value)}
                      placeholder="123 Main Street"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">City</label>
                    <input
                      type="text"
                      value={pickupLocation?.city || ''}
                      onChange={(e) => handlePickupLocationChange('city', e.target.value)}
                      placeholder="Denver"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">State</label>
                    <input
                      type="text"
                      value={pickupLocation?.state || ''}
                      onChange={(e) => handlePickupLocationChange('state', e.target.value)}
                      placeholder="CO"
                      maxLength={2}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-200">ZIP Code</label>
                    <input
                      type="text"
                      value={pickupLocation?.zip || ''}
                      onChange={(e) => handlePickupLocationChange('zip', e.target.value)}
                      placeholder="80201"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-200">
                      Pickup Instructions (Optional)
                    </label>
                    <textarea
                      value={pickupLocation?.instructions || ''}
                      onChange={(e) => handlePickupLocationChange('instructions', e.target.value)}
                      placeholder="Ring doorbell, parking available in driveway..."
                      rows={2}
                      className={inputClass}
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
        className={`${optionCardBase} cursor-pointer ${
          selectedOptions.includes('seller_delivery')
            ? optionCardSelected
            : optionCardUnselected
        }`}
        onClick={() => toggleOption('seller_delivery')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`${iconBase} ${
              selectedOptions.includes('seller_delivery')
                ? 'border-indigo-400/50 bg-indigo-500/20'
                : 'border-white/10 bg-white/5'
            }`}>
              <FiTruck className={`w-5 h-5 ${
                selectedOptions.includes('seller_delivery') ? 'text-indigo-200' : 'text-slate-400'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">I'll Deliver</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('seller_delivery')}
                onChange={() => toggleOption('seller_delivery')}
                className={checkboxClass}
              />
            </div>
            <p className="mb-3 text-sm text-slate-300">
              You deliver the item yourself. Set your own delivery fee and service area.
            </p>

            {selectedOptions.includes('seller_delivery') && (
              <div className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">
                      Delivery Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={sellerDeliveryFee}
                        onChange={(e) => onSellerDeliveryFeeChange?.(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="10.00"
                        className="market-input w-full pl-8 pr-3"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">
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
                        className={inputClass}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">miles</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                  <FiInfo className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                  <span>You keep 100% of your delivery fee. Platform fee applies to item price only.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Delivery */}
      <div 
        className={`${optionCardBase} cursor-pointer ${
          selectedOptions.includes('platform_delivery')
            ? optionCardSelected
            : optionCardUnselected
        }`}
        onClick={() => toggleOption('platform_delivery')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`${iconBase} ${
              selectedOptions.includes('platform_delivery')
                ? 'border-cyan-400/50 bg-cyan-500/20'
                : 'border-white/10 bg-white/5'
            }`}>
              <FiTruck className={`w-5 h-5 ${
                selectedOptions.includes('platform_delivery') ? 'text-cyan-200' : 'text-slate-400'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Platform Delivery</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('platform_delivery')}
                onChange={() => toggleOption('platform_delivery')}
                className={checkboxClass}
              />
            </div>
            <p className="mb-2 text-sm text-slate-300">
              Professional drivers pick up and deliver. Fee calculated by distance. Like DoorDash for items.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-emerald-200">Safe</span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-1 text-cyan-200">Convenient</span>
              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-1 text-violet-200">Tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div 
        className={`${optionCardBase} cursor-pointer ${
          selectedOptions.includes('shipping')
            ? optionCardSelected
            : optionCardUnselected
        }`}
        onClick={() => toggleOption('shipping')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`${iconBase} ${
              selectedOptions.includes('shipping')
                ? 'border-violet-400/50 bg-violet-500/20'
                : 'border-white/10 bg-white/5'
            }`}>
              <FiPackage className={`w-5 h-5 ${
                selectedOptions.includes('shipping') ? 'text-violet-200' : 'text-slate-400'
              }`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Shipping (USPS/UPS/FedEx)</h4>
              <input
                type="checkbox"
                checked={selectedOptions.includes('shipping')}
                onChange={() => toggleOption('shipping')}
                className={checkboxClass}
              />
            </div>
            <p className="mb-3 text-sm text-slate-300">
              Ship via traditional carriers. Best for distant buyers or small items.
            </p>

            {selectedOptions.includes('shipping') && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4" onClick={(e) => e.stopPropagation()}>
                <label className="mb-1 block text-sm font-medium text-slate-200">
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
                    className={inputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">lbs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950 p-4 text-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.45)]">
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
        <p className="mt-3 text-xs text-cyan-100/80">
          Offering multiple options increases your chances of selling.
        </p>
      </div>
    </div>
  );
}

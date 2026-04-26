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
  const optionCardBase = 'rounded-3xl border p-4 transition-all backdrop-blur-sm';
  const optionCardSelected = 'border-cyan-400/60 bg-slate-900/90 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.55)]';
  const optionCardUnselected = 'border-white/10 bg-slate-950/70 hover:border-cyan-400/30 hover:bg-slate-900/85';
  const iconBase = 'flex h-10 w-10 items-center justify-center rounded-2xl border';
  const inputClass = 'market-input w-full';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Choose Delivery Method</h3>
        <p className="text-sm text-slate-300">
          Select how you'd like to receive this item
        </p>
      </div>

      {/* Self-Pickup */}
      {availableOptions.includes('self_pickup') && (
        <div
          className={`${optionCardBase} cursor-pointer ${
            selectedMethod === 'self_pickup'
              ? optionCardSelected
              : optionCardUnselected
          }`}
          onClick={() => onMethodChange('self_pickup')}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`${iconBase} ${
                selectedMethod === 'self_pickup'
                  ? 'border-cyan-400/50 bg-cyan-500/20'
                  : 'border-white/10 bg-white/5'
              }`}>
                <FiMapPin className={`w-5 h-5 ${
                  selectedMethod === 'self_pickup' ? 'text-cyan-200' : 'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">Self-Pickup</h4>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200">
                    FREE
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-300">
                  Pick up directly from the seller
                </p>
                {pickupAddress && (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300">
                    <p className="font-medium text-slate-100">Pickup Location:</p>
                    <p>{pickupAddress.street}</p>
                    <p>{pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}</p>
                    {pickupAddress.instructions && (
                      <p className="mt-1 text-slate-400">Notes: {pickupAddress.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-300">FREE</div>
              <div className="text-xs text-slate-400">No delivery fee</div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Delivery */}
      {availableOptions.includes('seller_delivery') && (
        <div
          className={`${optionCardBase} cursor-pointer ${
            selectedMethod === 'seller_delivery'
              ? optionCardSelected
              : optionCardUnselected
          }`}
          onClick={() => {
            onMethodChange('seller_delivery');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`${iconBase} ${
                selectedMethod === 'seller_delivery'
                  ? 'border-indigo-400/50 bg-indigo-500/20'
                  : 'border-white/10 bg-white/5'
              }`}>
                <FiTruck className={`w-5 h-5 ${
                  selectedMethod === 'seller_delivery' ? 'text-indigo-200' : 'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-white">Seller Delivers</h4>
                <p className="mb-2 text-sm text-slate-300">
                  Seller will deliver to your address
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FiMapPin className="w-3 h-3" />
                  <span>Within {sellerDeliveryRadius} miles</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-cyan-300">
                ${sellerDeliveryFee.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Delivery fee</div>
            </div>
          </div>

          {selectedMethod === 'seller_delivery' && showAddressForm && (
            <div className="mt-4 border-t border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
              <h5 className="mb-3 font-medium text-slate-100">Your Delivery Address</h5>
              <div className="space-y-3">
                <input
                  type="text"
                  value={deliveryAddress?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Street Address"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={deliveryAddress?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="City"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={deliveryAddress?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State"
                    maxLength={2}
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  value={deliveryAddress?.zip || ''}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  placeholder="ZIP Code"
                  className={inputClass}
                />
                <textarea
                  value={deliveryAddress?.instructions || ''}
                  onChange={(e) => handleAddressChange('instructions', e.target.value)}
                  placeholder="Delivery instructions (gate code, apartment number, etc.)"
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platform Delivery */}
      {availableOptions.includes('platform_delivery') && (
        <div
          className={`${optionCardBase} cursor-pointer ${
            selectedMethod === 'platform_delivery'
              ? optionCardSelected
              : optionCardUnselected
          }`}
          onClick={() => {
            onMethodChange('platform_delivery');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`${iconBase} ${
                selectedMethod === 'platform_delivery'
                  ? 'border-cyan-400/50 bg-cyan-500/20'
                  : 'border-white/10 bg-white/5'
              }`}>
                <FiTruck className={`w-5 h-5 ${
                  selectedMethod === 'platform_delivery' ? 'text-cyan-200' : 'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">Platform Delivery</h4>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-200">
                    TRACKED
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-300">
                  Professional driver pickup & delivery
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
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
              <div className="text-xl font-bold text-cyan-300">
                ${platformDeliveryFee > 0 ? platformDeliveryFee.toFixed(2) : '---'}
              </div>
              <div className="text-xs text-slate-400">
                {platformDeliveryFee > 0 ? '+ optional tip' : 'Enter address'}
              </div>
            </div>
          </div>

          {selectedMethod === 'platform_delivery' && (
            <div className="mt-4 space-y-4 border-t border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
              {/* Address Form */}
              {showAddressForm && (
                <div>
                  <h5 className="mb-3 font-medium text-slate-100">Your Delivery Address</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={deliveryAddress?.street || ''}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Street Address"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={deliveryAddress?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={deliveryAddress?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="State"
                        maxLength={2}
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress?.zip || ''}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                      placeholder="ZIP Code"
                      className={inputClass}
                    />
                    <textarea
                      value={deliveryAddress?.instructions || ''}
                      onChange={(e) => handleAddressChange('instructions', e.target.value)}
                      placeholder="Delivery instructions (gate code, apartment number, etc.)"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Tip Selection */}
              {platformDeliveryFee > 0 && (
                <div>
                  <h5 className="mb-3 font-medium text-slate-100">Tip Your Driver (Optional)</h5>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {suggestedTips.map(tip => (
                      <button
                        key={tip}
                        type="button"
                        onClick={() => onDeliveryTipChange?.(tip)}
                        className={`rounded-2xl border px-3 py-2 font-medium transition-all ${
                          deliveryTip === tip
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                            : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-400/30'
                        }`}
                      >
                        {tip === 0 ? 'No Tip' : `$${tip}`}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      value={deliveryTip}
                      onChange={(e) => onDeliveryTipChange?.(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.50"
                      placeholder="Custom tip"
                      className="market-input w-full pl-8 pr-3"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    100% of your tip goes directly to the driver
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
          className={`${optionCardBase} cursor-pointer ${
            selectedMethod === 'shipping'
              ? optionCardSelected
              : optionCardUnselected
          }`}
          onClick={() => {
            onMethodChange('shipping');
            setShowAddressForm(true);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`${iconBase} ${
                selectedMethod === 'shipping'
                  ? 'border-violet-400/50 bg-violet-500/20'
                  : 'border-white/10 bg-white/5'
              }`}>
                <FiPackage className={`w-5 h-5 ${
                  selectedMethod === 'shipping' ? 'text-violet-200' : 'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-white">Shipping</h4>
                <p className="mb-2 text-sm text-slate-300">
                  Traditional carrier (USPS, UPS, FedEx)
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FiClock className="w-3 h-3" />
                  <span>3-7 business days</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-200">TBD</div>
              <div className="text-xs text-slate-400">Calculated at checkout</div>
            </div>
          </div>
        </div>
      )}

      {/* Total Summary */}
      {selectedMethod && (
        <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950 p-4 text-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.45)]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Order Summary</h4>
            <FiCheck className="h-5 w-5 text-cyan-200" />
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
            <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
              <span>Total</span>
              <span>${getTotalCost(selectedMethod).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Package, Truck, Home, DollarSign, MapPin, Clock, Info } from 'lucide-react';
import { DeliveryMethod, DeliveryOption } from '../../lib/supabase';

interface DeliveryOptionsProps {
  options: DeliveryOption[];
  onChange: (options: DeliveryOption[]) => void;
  sellerAddress?: string;
  onAddressChange?: (address: string) => void;
  pickupInstructions?: string;
  onInstructionsChange?: (instructions: string) => void;
}

export default function DeliveryOptions({
  options,
  onChange,
  sellerAddress,
  onAddressChange,
  pickupInstructions,
  onInstructionsChange
}: DeliveryOptionsProps) {
  const [expandedMethod, setExpandedMethod] = useState<DeliveryMethod | null>(null);

  const deliveryMethods = [
    {
      method: 'pickup' as DeliveryMethod,
      icon: Home,
      title: 'Pickup at Seller Location',
      description: 'Buyer picks up item at your location',
      defaultFee: 0,
      color: 'green'
    },
    {
      method: 'local_delivery' as DeliveryMethod,
      icon: Truck,
      title: 'Local Delivery',
      description: 'You deliver to buyer within your area',
      defaultFee: 15,
      color: 'blue'
    },
    {
      method: 'seller_delivery' as DeliveryMethod,
      icon: MapPin,
      title: 'Seller Delivers',
      description: 'Custom delivery arrangement with buyer',
      defaultFee: 20,
      color: 'purple'
    },
    {
      method: 'shipping' as DeliveryMethod,
      icon: Package,
      title: 'Ship via Carrier',
      description: 'Ship via USPS, UPS, FedEx, etc.',
      defaultFee: 12.50,
      color: 'orange'
    }
  ];

  const toggleMethod = (method: DeliveryMethod) => {
    const existing = options.find(opt => opt.method === method);
    const methodConfig = deliveryMethods.find(m => m.method === method);
    
    if (existing) {
      // Toggle enabled state
      const updated = options.map(opt =>
        opt.method === method ? { ...opt, enabled: !opt.enabled } : opt
      );
      onChange(updated);
    } else {
      // Add new method
      const newOption: DeliveryOption = {
        method,
        enabled: true,
        fee: methodConfig?.defaultFee || 0,
        description: methodConfig?.description || ''
      };
      onChange([...options, newOption]);
    }
  };

  const updateOption = (method: DeliveryMethod, updates: Partial<DeliveryOption>) => {
    const updated = options.map(opt =>
      opt.method === method ? { ...opt, ...updates } : opt
    );
    onChange(updated);
  };

  const getOption = (method: DeliveryMethod): DeliveryOption | undefined => {
    return options.find(opt => opt.method === method);
  };

  const getColorClasses = (color: string, enabled: boolean) => {
    if (!enabled) return 'border-white/10 bg-slate-950/70 hover:border-cyan-400/25 hover:bg-slate-900/80';
    
    const colors: Record<string, string> = {
      green: 'border-emerald-400/45 bg-emerald-500/10',
      blue: 'border-cyan-400/45 bg-cyan-500/10',
      purple: 'border-violet-400/45 bg-violet-500/10',
      orange: 'border-amber-400/45 bg-amber-500/10'
    };
    return colors[color] || 'bg-gray-100 border-gray-300';
  };

  const getIconClasses = (color: string, enabled: boolean) => {
    if (!enabled) return 'text-slate-500';

    const colors: Record<string, string> = {
      green: 'text-emerald-300',
      blue: 'text-cyan-300',
      purple: 'text-violet-300',
      orange: 'text-amber-300'
    };

    return colors[color] || 'text-cyan-300';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
          <Truck className="mr-2 text-cyan-300" size={20} />
          Delivery & Fulfillment Options
        </h3>
        <p className="mb-4 text-sm text-slate-300">
          Select how buyers can receive this item. You can offer multiple options.
        </p>
      </div>

      {/* Delivery Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryMethods.map(({ method, icon: Icon, title, description, color }) => {
          const option = getOption(method);
          const isEnabled = option?.enabled || false;
          const isExpanded = expandedMethod === method;

          return (
            <div key={method} className="space-y-3">
              {/* Method Card */}
              <div
                className={`cursor-pointer rounded-3xl border p-4 transition-all backdrop-blur-sm ${getColorClasses(color, isEnabled)}`}
                onClick={() => toggleMethod(method)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Icon size={24} className={getIconClasses(color, isEnabled)} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{title}</h4>
                      <p className="text-sm text-slate-300">{description}</p>
                      {isEnabled && option && (
                        <p className="mt-2 text-sm font-medium text-slate-100">
                          {option.fee === 0 ? 'FREE' : `$${option.fee.toFixed(2)} fee`}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleMethod(method)}
                    className="h-5 w-5 rounded border-white/20 bg-slate-950/80 text-cyan-400 focus:ring-2 focus:ring-cyan-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {isEnabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedMethod(isExpanded ? null : method);
                    }}
                    className="mt-3 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    {isExpanded ? 'Hide Details' : 'Configure Details →'}
                  </button>
                )}
              </div>

              {/* Expanded Configuration */}
              {isEnabled && isExpanded && option && (
                <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-sm">
                  {/* Fee */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      <DollarSign size={16} className="inline mr-1" />
                      Fee Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={option.fee}
                      onChange={(e) => updateOption(method, { fee: parseFloat(e.target.value) || 0 })}
                      className="market-input w-full"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Set to $0 for free. This fee will be added at checkout.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      <Info size={16} className="inline mr-1" />
                      Description for Buyers
                    </label>
                    <textarea
                      value={option.description}
                      onChange={(e) => updateOption(method, { description: e.target.value })}
                      rows={2}
                      className="market-input w-full"
                      placeholder={`e.g., "${method === 'pickup' ? 'Pick up at my workshop, Mon-Fri 9am-5pm' : method === 'shipping' ? 'USPS Priority Mail, 3-5 business days' : 'I can deliver within 10 miles of Dayton'}"`}
                    />
                  </div>

                  {/* Method-specific fields */}
                  {method === 'local_delivery' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">
                        Delivery Radius (miles)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.radius_miles || 10}
                        onChange={(e) => updateOption(method, { radius_miles: parseInt(e.target.value) || 10 })}
                        className="market-input w-full"
                        placeholder="10"
                      />
                    </div>
                  )}

                  {method === 'pickup' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">
                        <Clock size={16} className="inline mr-1" />
                        Available Hours
                      </label>
                      <input
                        type="text"
                        value={option.available_hours || ''}
                        onChange={(e) => updateOption(method, { available_hours: e.target.value })}
                        className="market-input w-full"
                        placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                      />
                    </div>
                  )}

                  {method === 'shipping' && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Carrier
                        </label>
                        <select
                          value={option.carrier || 'USPS'}
                          onChange={(e) => updateOption(method, { carrier: e.target.value })}
                          className="market-input w-full"
                        >
                          <option value="USPS">USPS</option>
                          <option value="UPS">UPS</option>
                          <option value="FedEx">FedEx</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Estimated Delivery Time
                        </label>
                        <input
                          type="text"
                          value={option.estimated_days || ''}
                          onChange={(e) => updateOption(method, { estimated_days: e.target.value })}
                          className="market-input w-full"
                          placeholder="e.g., 3-5 business days"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pickup Address (only show if pickup is enabled) */}
      {options.some(opt => opt.method === 'pickup' && opt.enabled) && (
        <div className="rounded-3xl border border-amber-400/25 bg-amber-500/10 p-4 backdrop-blur-sm">
          <h4 className="mb-2 flex items-center font-semibold text-amber-100">
            <Home size={18} className="mr-2 text-amber-300" />
            Pickup Address
          </h4>
          <p className="mb-3 text-sm text-amber-100/85">
            This address will only be shared with buyers after they purchase. It won't be public.
          </p>
          <input
            type="text"
            value={sellerAddress || ''}
            onChange={(e) => onAddressChange?.(e.target.value)}
            className="market-input mb-3 w-full"
            placeholder="e.g., 123 Main St, Dayton, OH 45402"
          />
          <label className="mb-2 block text-sm font-medium text-amber-100/90">
            Pickup Instructions (Optional)
          </label>
          <textarea
            value={pickupInstructions || ''}
            onChange={(e) => onInstructionsChange?.(e.target.value)}
            rows={2}
            className="market-input w-full"
            placeholder="e.g., Ring doorbell, workshop entrance is around back"
          />
        </div>
      )}

      {/* Summary */}
      <div className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 p-4 backdrop-blur-sm">
        <h4 className="mb-2 font-semibold text-cyan-100">Delivery Options Summary</h4>
        {options.filter(opt => opt.enabled).length === 0 ? (
          <p className="text-sm text-cyan-100/85">
            Please select at least one delivery option for buyers.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-cyan-100/90">
            {options.filter(opt => opt.enabled).map(opt => (
              <li key={opt.method} className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-cyan-300"></span>
                <strong className="capitalize">{opt.method.replace('_', ' ')}:</strong>
                <span className="ml-1">
                  {opt.fee === 0 ? 'FREE' : `$${opt.fee.toFixed(2)}`}
                  {opt.description && ` - ${opt.description.substring(0, 50)}${opt.description.length > 50 ? '...' : ''}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

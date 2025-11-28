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
    if (!enabled) return 'bg-gray-100 border-gray-300';
    
    const colors: Record<string, string> = {
      green: 'bg-green-50 border-green-500',
      blue: 'bg-blue-50 border-blue-500',
      purple: 'bg-purple-50 border-purple-500',
      orange: 'bg-orange-50 border-orange-500'
    };
    return colors[color] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Truck className="mr-2" size={20} />
          Delivery & Fulfillment Options
        </h3>
        <p className="text-sm text-gray-600 mb-4">
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
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${getColorClasses(color, isEnabled)}`}
                onClick={() => toggleMethod(method)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Icon size={24} className={isEnabled ? `text-${color}-600` : 'text-gray-400'} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{title}</h4>
                      <p className="text-sm text-gray-600">{description}</p>
                      {isEnabled && option && (
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {option.fee === 0 ? 'FREE' : `$${option.fee.toFixed(2)} fee`}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleMethod(method)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
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
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? 'Hide Details' : 'Configure Details →'}
                  </button>
                )}
              </div>

              {/* Expanded Configuration */}
              {isEnabled && isExpanded && option && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign size={16} className="inline mr-1" />
                      Fee Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={option.fee}
                      onChange={(e) => updateOption(method, { fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set to $0 for free. This fee will be added at checkout.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Info size={16} className="inline mr-1" />
                      Description for Buyers
                    </label>
                    <textarea
                      value={option.description}
                      onChange={(e) => updateOption(method, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`e.g., "${method === 'pickup' ? 'Pick up at my workshop, Mon-Fri 9am-5pm' : method === 'shipping' ? 'USPS Priority Mail, 3-5 business days' : 'I can deliver within 10 miles of Dayton'}"`}
                    />
                  </div>

                  {/* Method-specific fields */}
                  {method === 'local_delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Radius (miles)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.radius_miles || 10}
                        onChange={(e) => updateOption(method, { radius_miles: parseInt(e.target.value) || 10 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                      />
                    </div>
                  )}

                  {method === 'pickup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock size={16} className="inline mr-1" />
                        Available Hours
                      </label>
                      <input
                        type="text"
                        value={option.available_hours || ''}
                        onChange={(e) => updateOption(method, { available_hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                      />
                    </div>
                  )}

                  {method === 'shipping' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Carrier
                        </label>
                        <select
                          value={option.carrier || 'USPS'}
                          onChange={(e) => updateOption(method, { carrier: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USPS">USPS</option>
                          <option value="UPS">UPS</option>
                          <option value="FedEx">FedEx</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Delivery Time
                        </label>
                        <input
                          type="text"
                          value={option.estimated_days || ''}
                          onChange={(e) => updateOption(method, { estimated_days: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Home size={18} className="mr-2 text-yellow-600" />
            Pickup Address
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            This address will only be shared with buyers after they purchase. It won't be public.
          </p>
          <input
            type="text"
            value={sellerAddress || ''}
            onChange={(e) => onAddressChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 mb-3"
            placeholder="e.g., 123 Main St, Dayton, OH 45402"
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Instructions (Optional)
          </label>
          <textarea
            value={pickupInstructions || ''}
            onChange={(e) => onInstructionsChange?.(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            placeholder="e.g., Ring doorbell, workshop entrance is around back"
          />
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Delivery Options Summary</h4>
        {options.filter(opt => opt.enabled).length === 0 ? (
          <p className="text-sm text-gray-600">
            ⚠️ Please select at least one delivery option for buyers.
          </p>
        ) : (
          <ul className="text-sm text-gray-700 space-y-1">
            {options.filter(opt => opt.enabled).map(opt => (
              <li key={opt.method} className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
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

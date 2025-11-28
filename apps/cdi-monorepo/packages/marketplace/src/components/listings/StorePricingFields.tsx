import React from 'react';
import { DollarSign, Package, Tag, MessageSquare, Store } from 'lucide-react';

interface StorePricingFieldsProps {
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  allowOffers: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export default function StorePricingFields({
  price,
  compareAtPrice,
  stockQuantity,
  allowOffers,
  onChange,
}: StorePricingFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2 flex items-center">
          <Store size={18} className="mr-2" />
          Store Item Pricing
        </h3>
        <p className="text-sm text-green-700">
          Set a fixed price for instant purchase. Buyers can add to cart and checkout immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign size={16} className="inline mr-1" />
            Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => onChange('price', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="29.99"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">The price buyers will pay for this item</p>
        </div>

        {/* Stock Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package size={16} className="inline mr-1" />
            Stock Quantity *
          </label>
          <input
            type="number"
            min="1"
            value={stockQuantity}
            onChange={(e) => onChange('stockQuantity', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="10"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            How many units are available for sale
          </p>
        </div>

        {/* Compare At Price (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag size={16} className="inline mr-1" />
            Compare At Price (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => onChange('compareAtPrice', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="39.99"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Original price to show as crossed out (displays savings)
          </p>
        </div>

        {/* Allow Offers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare size={16} className="inline mr-1" />
            Offers
          </label>
          <label className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={allowOffers}
              onChange={(e) => onChange('allowOffers', e.target.checked)}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Allow buyers to make offers</span>
              <p className="text-xs text-gray-500 mt-1">
                Buyers can propose a different price, which you can accept or decline
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Pricing Preview */}
      {price && parseFloat(price) > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
          <div className="flex items-baseline space-x-2">
            {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ${parseFloat(compareAtPrice).toFixed(2)}
                </span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                  Save ${(parseFloat(compareAtPrice) - parseFloat(price)).toFixed(2)}
                </span>
              </>
            )}
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${parseFloat(price).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {stockQuantity && parseInt(stockQuantity) > 0
              ? `${stockQuantity} units available`
              : 'Out of stock'}
          </div>
        </div>
      )}
    </div>
  );
}

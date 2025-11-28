import React from 'react';
import { Gavel, Store, Repeat } from 'lucide-react';

interface ListingTypeSelectorProps {
  value: 'auction' | 'store' | 'trade';
  onChange: (type: 'auction' | 'store' | 'trade') => void;
}

export default function ListingTypeSelector({ value, onChange }: ListingTypeSelectorProps) {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        How do you want to list this item?
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onChange('auction')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            value === 'auction'
              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-md'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-lg ${
                value === 'auction' ? 'bg-gradient-primary' : 'bg-gray-100'
              }`}
            >
              <Gavel
                size={24}
                className={value === 'auction' ? 'text-white' : 'text-gray-600'}
              />
            </div>
            <div className="flex-1 text-left">
              <h3
                className={`font-semibold text-lg mb-1 ${
                  value === 'auction' ? 'text-purple-900' : 'text-gray-900'
                }`}
              >
                🔨 Auction
              </h3>
              <p className="text-sm text-gray-600">
                Time-limited competitive bidding. Perfect for unique items or creating urgency.
              </p>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>✓ Buyers compete with bids</li>
                <li>✓ Set starting price & duration</li>
                <li>✓ Optional reserve price</li>
              </ul>
            </div>
          </div>
          {value === 'auction' && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange('store')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            value === 'store'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-lg ${
                value === 'store' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Store
                size={24}
                className={value === 'store' ? 'text-green-600' : 'text-gray-600'}
              />
            </div>
            <div className="flex-1 text-left">
              <h3
                className={`font-semibold text-lg mb-1 ${
                  value === 'store' ? 'text-green-900' : 'text-gray-900'
                }`}
              >
                🏪 Store Item
              </h3>
              <p className="text-sm text-gray-600">
                Fixed price with instant purchase. Best for new items or consistent inventory.
              </p>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>✓ Set your price</li>
                <li>✓ Manage stock levels</li>
                <li>✓ Instant checkout</li>
              </ul>
            </div>
          </div>
          {value === 'store' && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange('trade')}
          className={`relative p-6 border-2 rounded-lg transition-all ${
            value === 'trade'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-lg ${
                value === 'trade' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <Repeat
                size={24}
                className={value === 'trade' ? 'text-blue-600' : 'text-gray-600'}
              />
            </div>
            <div className="flex-1 text-left">
              <h3
                className={`font-semibold text-lg mb-1 ${
                  value === 'trade' ? 'text-blue-900' : 'text-gray-900'
                }`}
              >
                🔄 Trade/Barter
              </h3>
              <p className="text-sm text-gray-600">
                Exchange items without money. Perfect for swaps and community sharing.
              </p>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>✓ Specify what you want</li>
                <li>✓ No money involved</li>
                <li>✓ Community trading</li>
              </ul>
            </div>
          </div>
          {value === 'trade' && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

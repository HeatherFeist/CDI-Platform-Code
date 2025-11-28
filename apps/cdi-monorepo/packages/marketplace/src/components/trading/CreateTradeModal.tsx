import { useState, useEffect } from 'react';
import { ArrowLeftRight, X, Check, AlertCircle } from 'lucide-react';
import { TradingService } from '../../services/TradingService';
import { TradeHelpers } from '../../types/trading';
import { useAuth } from '../../contexts/AuthContext';
import { Listing } from '../../lib/supabase';

interface CreateTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
  targetUserId: string;
  userListings: Listing[];
}

export default function CreateTradeModal({ 
  isOpen, 
  onClose, 
  targetListing, 
  targetUserId,
  userListings 
}: CreateTradeModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [cashAmount, setCashAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [itemValues, setItemValues] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tradingService = TradingService.getInstance();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStep(1);
      setSelectedListings([]);
      setCashAmount(0);
      setMessage('');
      setItemValues({
        [targetListing.id]: TradeHelpers.estimateItemValue(targetListing)
      });
      setError('');
    }
  }, [isOpen, targetListing]);

  const handleListingToggle = (listingId: string) => {
    setSelectedListings(prev => {
      const newSelection = prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId];
      
      // Auto-estimate values for newly selected items
      if (!prev.includes(listingId)) {
        const listing = userListings.find(l => l.id === listingId);
        if (listing) {
          setItemValues(prevValues => ({
            ...prevValues,
            [listingId]: TradeHelpers.estimateItemValue(listing)
          }));
        }
      }
      
      return newSelection;
    });
  };

  const calculateUserTotal = () => {
    const itemsValue = selectedListings.reduce((total, listingId) => {
      return total + (itemValues[listingId] || 0);
    }, 0);
    return itemsValue + cashAmount;
  };

  const calculateTargetValue = () => {
    return itemValues[targetListing.id] || 0;
  };

  const getBalanceDifference = () => {
    return calculateUserTotal() - calculateTargetValue();
  };

  const isTradeBalanced = () => {
    return TradeHelpers.isTradeBalanced(calculateUserTotal(), calculateTargetValue());
  };

  const handleCreateTrade = async () => {
    if (!user || selectedListings.length === 0) return;

    setLoading(true);
    setError('');

    try {
      await tradingService.createTradeProposal({
        recipient_id: targetUserId,
        message,
        proposed_cash_amount: cashAmount,
        offered_listing_ids: selectedListings,
        desired_listing_ids: [targetListing.id],
        estimated_values: itemValues
      });

      onClose();
      // Show success message or redirect
    } catch (err: any) {
      setError(err.message || 'Failed to create trade proposal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <ArrowLeftRight size={24} className="mr-2 text-blue-600" />
            Propose Trade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-8rem)]">
          {/* Steps Sidebar */}
          <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="font-medium">Select Items</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="font-medium">Set Values</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className="font-medium">Add Message</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  4
                </div>
                <span className="font-medium">Review</span>
              </div>
            </div>

            {/* Trade Balance Preview */}
            <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Trade Balance</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Your offer:</span>
                  <span className="font-medium">${calculateUserTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Their item:</span>
                  <span className="font-medium">${calculateTargetValue().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className={`flex justify-between font-medium ${
                  isTradeBalanced() ? 'text-green-600' : 'text-orange-600'
                }`}>
                  <span>Difference:</span>
                  <span>${Math.abs(getBalanceDifference()).toFixed(2)}</span>
                </div>
              </div>
              
              {isTradeBalanced() ? (
                <div className="mt-2 text-xs text-green-600 flex items-center">
                  <Check size={12} className="mr-1" />
                  Well balanced trade
                </div>
              ) : (
                <div className="mt-2 text-xs text-orange-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  Consider adjusting values
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {step === 1 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Select items to offer</h3>
                <p className="text-gray-600 mb-6">
                  Choose which of your items you'd like to trade for "{targetListing.title}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userListings.filter(listing => listing.status === 'active').map((listing) => (
                    <div
                      key={listing.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedListings.includes(listing.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleListingToggle(listing.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={listing.images?.[0] || '/placeholder-image.jpg'}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {listing.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Current bid: ${listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2)}
                          </p>
                          <div className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                            listing.condition === 'new' ? 'bg-blue-100 text-blue-700' :
                            listing.condition === 'handcrafted' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.condition === 'new' ? '✨ New' :
                             listing.condition === 'handcrafted' ? '🤲 Hand-crafted' :
                             '♻️ Used'}
                          </div>
                        </div>
                        {selectedListings.includes(listing.id) && (
                          <div className="flex-shrink-0">
                            <Check size={20} className="text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {userListings.filter(listing => listing.status === 'active').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You don't have any active listings to trade.</p>
                    <button
                      onClick={() => window.location.href = '/create-listing'}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Create a listing first
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Set item values</h3>
                <p className="text-gray-600 mb-6">
                  Adjust the estimated values to ensure a fair trade
                </p>

                <div className="space-y-4">
                  {/* Target item */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">They're offering:</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">{targetListing.title}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          value={itemValues[targetListing.id] || 0}
                          onChange={(e) => setItemValues(prev => ({
                            ...prev,
                            [targetListing.id]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* User's items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">You're offering:</h4>
                    <div className="space-y-2">
                      {selectedListings.map(listingId => {
                        const listing = userListings.find(l => l.id === listingId);
                        if (!listing) return null;

                        return (
                          <div key={listingId} className="flex items-center justify-between py-2">
                            <span className="text-gray-700">{listing.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">$</span>
                              <input
                                type="number"
                                value={itemValues[listingId] || 0}
                                onChange={(e) => setItemValues(prev => ({
                                  ...prev,
                                  [listingId]: parseFloat(e.target.value) || 0
                                }))}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Cash component */}
                      <div className="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                        <span className="text-gray-700">+ Cash</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add a message</h3>
                <p className="text-gray-600 mb-6">
                  Include a personal message to explain your trade proposal
                </p>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I'd love to trade my items for yours. Let me know if you're interested!"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                <div className="mt-4 text-sm text-gray-500">
                  <p>Tips for a good trade message:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Be friendly and polite</li>
                    <li>Explain why you want their item</li>
                    <li>Mention the condition of your items</li>
                    <li>Be open to negotiation</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Review your trade</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Trade summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Trade Summary</h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">You give:</h5>
                        <div className="space-y-1">
                          {selectedListings.map(listingId => {
                            const listing = userListings.find(l => l.id === listingId);
                            return listing ? (
                              <div key={listingId} className="text-sm text-gray-600">
                                {listing.title} - ${(itemValues[listingId] || 0).toFixed(2)}
                              </div>
                            ) : null;
                          })}
                          {cashAmount > 0 && (
                            <div className="text-sm text-gray-600">
                              Cash - ${cashAmount.toFixed(2)}
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900 pt-1 border-t border-gray-200">
                            Total: ${calculateUserTotal().toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">You get:</h5>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            {targetListing.title} - ${(itemValues[targetListing.id] || 0).toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 pt-1 border-t border-gray-200">
                            Total: ${calculateTargetValue().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 p-3 rounded ${
                      isTradeBalanced() 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      <div className="flex items-center">
                        {isTradeBalanced() ? (
                          <Check size={16} className="mr-2" />
                        ) : (
                          <AlertCircle size={16} className="mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {isTradeBalanced() 
                            ? 'This appears to be a fair trade!' 
                            : `Trade difference: $${Math.abs(getBalanceDifference()).toFixed(2)}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message preview */}
                  {message && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Your message:</h4>
                      <p className="text-gray-700 text-sm">{message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && selectedListings.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateTrade}
                disabled={loading || selectedListings.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Send Trade Proposal'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
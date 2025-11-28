import { useState, useEffect } from 'react';
import { ArrowLeftRight, MessageCircle, Clock, Check, X, Eye, DollarSign, Package } from 'lucide-react';
import { TradingService } from '../../services/TradingService';
import { TradeProposal, TradeStatus, TradeHelpers } from '../../types/trading';
import { useAuth } from '../../contexts/AuthContext';

interface TradeListProps {
  filter: 'sent' | 'received' | 'active' | 'completed';
}

export default function TradeList({ filter }: TradeListProps) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeProposal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const tradingService = TradingService.getInstance();

  useEffect(() => {
    loadTrades();
  }, [filter, user]);

  const loadTrades = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let tradeData: TradeProposal[] = [];
      
      switch (filter) {
        case 'sent':
          tradeData = await tradingService.getUserSentProposals(user.id);
          break;
        case 'received':
          tradeData = await tradingService.getUserReceivedProposals(user.id);
          break;
        case 'active':
          const [sent, received] = await Promise.all([
            tradingService.getUserSentProposals(user.id),
            tradingService.getUserReceivedProposals(user.id)
          ]);
          tradeData = [...sent, ...received].filter(trade => 
            ['pending', 'counter_proposed', 'accepted'].includes(trade.status)
          );
          break;
        case 'completed':
          const [sentCompleted, receivedCompleted] = await Promise.all([
            tradingService.getUserSentProposals(user.id),
            tradingService.getUserReceivedProposals(user.id)
          ]);
          tradeData = [...sentCompleted, ...receivedCompleted].filter(trade => 
            ['completed', 'rejected', 'cancelled'].includes(trade.status)
          );
          break;
      }
      
      setTrades(tradeData);
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await tradingService.updateProposalStatus(tradeId, 'accepted');
      await loadTrades();
    } catch (error) {
      console.error('Failed to accept trade:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await tradingService.updateProposalStatus(tradeId, 'rejected');
      await loadTrades();
    } catch (error) {
      console.error('Failed to reject trade:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await tradingService.updateProposalStatus(tradeId, 'cancelled');
      await loadTrades();
    } catch (error) {
      console.error('Failed to cancel trade:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: TradeStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'accepted':
        return <Check className="text-green-500" size={16} />;
      case 'rejected':
        return <X className="text-red-500" size={16} />;
      case 'cancelled':
        return <X className="text-gray-500" size={16} />;
      case 'completed':
        return <Check className="text-green-600" size={16} />;
      case 'counter_proposed':
        return <ArrowLeftRight className="text-blue-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status: TradeStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      case 'counter_proposed':
        return 'Counter Proposal';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'counter_proposed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const tradeDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const isSentByUser = (trade: TradeProposal) => {
    return trade.proposer_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowLeftRight size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {filter} trades
        </h3>
        <p className="text-gray-500">
          {filter === 'sent' ? "You haven't sent any trade proposals yet." :
           filter === 'received' ? "You haven't received any trade proposals yet." :
           filter === 'active' ? "You don't have any active trades." :
           "You don't have any completed trades."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(trade.status)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Trade with {isSentByUser(trade) ? trade.recipient_profile?.full_name : trade.proposer_profile?.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isSentByUser(trade) ? 'Sent' : 'Received'} {formatTimeAgo(trade.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                  {getStatusText(trade.status)}
                </span>
                <button
                  onClick={() => setSelectedTrade(selectedTrade === trade ? null : trade)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>

            {/* Trade Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Package size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {trade.offered_listing_ids?.length || 0} items offered
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Package size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {trade.desired_listing_ids?.length || 0} items requested
                </span>
              </div>
              
              {trade.proposed_cash_amount > 0 && (
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    +${trade.proposed_cash_amount.toFixed(2)} cash
                  </span>
                </div>
              )}
            </div>

            {/* Trade Balance */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {isSentByUser(trade) ? 'Your offer' : 'Their offer'}:
                </span>
                <span className="font-medium">
                  ${TradeHelpers.calculateTotalValue(trade.estimated_values || {}, trade.offered_listing_ids || [], trade.proposed_cash_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">
                  {isSentByUser(trade) ? 'Their items' : 'Your items'}:
                </span>
                <span className="font-medium">
                  ${TradeHelpers.calculateTotalValue(trade.estimated_values || {}, trade.desired_listing_ids || [], 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Message */}
            {trade.message && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <MessageCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{trade.message}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {trade.status === 'pending' && !isSentByUser(trade) && (
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAcceptTrade(trade.id)}
                  disabled={actionLoading === trade.id}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {actionLoading === trade.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      Accept Trade
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleRejectTrade(trade.id)}
                  disabled={actionLoading === trade.id}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <X size={16} className="mr-2" />
                  Reject
                </button>
              </div>
            )}

            {trade.status === 'pending' && isSentByUser(trade) && (
              <button
                onClick={() => handleCancelTrade(trade.id)}
                disabled={actionLoading === trade.id}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {actionLoading === trade.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <X size={16} className="mr-2" />
                    Cancel Trade
                  </>
                )}
              </button>
            )}

            {trade.status === 'accepted' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Trade accepted! Please coordinate with the other party to complete the exchange.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {selectedTrade === trade && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-4">Trade Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    {isSentByUser(trade) ? 'Items you offered:' : 'Items they offered:'}
                  </h5>
                  <div className="space-y-2">
                    {trade.offered_listing_ids?.map(listingId => (
                      <div key={listingId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Listing #{listingId.slice(-8)}</span>
                        <span className="font-medium">
                          ${(trade.estimated_values?.[listingId] || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {trade.proposed_cash_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cash</span>
                        <span className="font-medium">
                          ${trade.proposed_cash_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    {isSentByUser(trade) ? 'Items you requested:' : 'Items they requested:'}
                  </h5>
                  <div className="space-y-2">
                    {trade.desired_listing_ids?.map(listingId => (
                      <div key={listingId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Listing #{listingId.slice(-8)}</span>
                        <span className="font-medium">
                          ${(trade.estimated_values?.[listingId] || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Trade ID:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">{trade.id}</code>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(trade.created_at).toLocaleDateString()}</span>
                </div>
                {trade.updated_at !== trade.created_at && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600">Last updated:</span>
                    <span>{new Date(trade.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
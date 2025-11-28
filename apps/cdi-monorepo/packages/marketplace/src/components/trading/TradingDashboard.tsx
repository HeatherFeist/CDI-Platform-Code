import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Package, TrendingUp, Clock, Check, Users } from 'lucide-react';
import TradeList from './TradeList';
import { TradingService } from '../../services/TradingService';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'sent' | 'received' | 'active' | 'completed';

export default function TradingDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [stats, setStats] = useState({
    totalTrades: 0,
    activeTrades: 0,
    completedTrades: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const tradingService = TradingService.getInstance();

  useEffect(() => {
    loadTradingStats();
  }, [user]);

  const loadTradingStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [sent, received] = await Promise.all([
        tradingService.getUserSentProposals(user.id),
        tradingService.getUserReceivedProposals(user.id)
      ]);

      const allTrades = [...sent, ...received];
      const activeTrades = allTrades.filter(trade => 
        ['pending', 'counter_proposed', 'accepted'].includes(trade.status)
      );
      const completedTrades = allTrades.filter(trade => 
        trade.status === 'completed'
      );
      const totalCompleted = allTrades.filter(trade => 
        ['completed', 'rejected', 'cancelled'].includes(trade.status)
      );

      setStats({
        totalTrades: allTrades.length,
        activeTrades: activeTrades.length,
        completedTrades: completedTrades.length,
        successRate: totalCompleted.length > 0 
          ? Math.round((completedTrades.length / totalCompleted.length) * 100)
          : 0
      });
    } catch (error) {
      console.error('Failed to load trading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
    { key: 'received', label: 'Received', icon: Package },
    { key: 'sent', label: 'Sent', icon: TrendingUp },
    { key: 'active', label: 'Active', icon: Clock },
    { key: 'completed', label: 'Completed', icon: Check }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <ArrowLeftRight size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Manage your item trades and swap with other users
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalTrades}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowLeftRight size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trades</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.activeTrades}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.completedTrades}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${stats.successRate}%`}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Trading Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Trading Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Set fair values for your items to get more trade offers</li>
              <li>• Include detailed photos and descriptions in your listings</li>
              <li>• Be responsive to trade messages and negotiations</li>
              <li>• Consider adding a small cash amount to balance uneven trades</li>
              <li>• Always verify item condition before completing a trade</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trade Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.key === 'active' && stats.activeTrades > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                      {stats.activeTrades}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <TradeList filter={activeTab} />
        </div>
      </div>
    </div>
  );
}
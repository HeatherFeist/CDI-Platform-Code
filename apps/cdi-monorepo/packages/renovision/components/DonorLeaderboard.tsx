import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface DonorStats {
  member_id: string;
  member_name: string;
  member_avatar?: string;
  business_name?: string;
  total_donated_this_month: number;
  total_donated_all_time: number;
  donation_count_this_month: number;
  average_gratuity_percentage: number;
  tier_type: string;
}

export const DonorLeaderboard: React.FC = () => {
  const [monthlyLeaders, setMonthlyLeaders] = useState<DonorStats[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<DonorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'monthly' | 'all-time'>('monthly');

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Get current month's top donors
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyData, error: monthlyError } = await supabase
        .from('transactions')
        .select(`
          user_id,
          voluntary_amount,
          is_voluntary,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url,
            business_name
          )
        `)
        .eq('is_voluntary', true)
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (monthlyError) throw monthlyError;

      // Aggregate monthly donations by user
      const monthlyAggregated = aggregateDonations(monthlyData || []);
      setMonthlyLeaders(monthlyAggregated.slice(0, 10)); // Top 10

      // Get all-time top donors
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('transactions')
        .select(`
          user_id,
          voluntary_amount,
          is_voluntary,
          base_amount,
          profiles (
            id,
            full_name,
            avatar_url,
            business_name
          )
        `)
        .eq('is_voluntary', true);

      if (allTimeError) throw allTimeError;

      const allTimeAggregated = aggregateDonations(allTimeData || []);
      setAllTimeLeaders(allTimeAggregated.slice(0, 10));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
      setLoading(false);
    }
  };

  const aggregateDonations = (transactions: any[]): DonorStats[] => {
    const userMap = new Map<string, DonorStats>();

    transactions.forEach((txn) => {
      const userId = txn.user_id;
      const profile = txn.profiles;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          member_id: userId,
          member_name: profile?.full_name || 'Anonymous',
          member_avatar: profile?.avatar_url,
          business_name: profile?.business_name,
          total_donated_this_month: 0,
          total_donated_all_time: 0,
          donation_count_this_month: 0,
          average_gratuity_percentage: 0,
          tier_type: 'nonprofit_member' // Would fetch from membership_tiers
        });
      }

      const stats = userMap.get(userId)!;
      const donationAmount = txn.voluntary_amount || 0;
      const baseAmount = txn.base_amount || 0;
      
      stats.total_donated_all_time += donationAmount;
      stats.total_donated_this_month += donationAmount;
      stats.donation_count_this_month += 1;
      
      // Calculate average gratuity percentage
      if (baseAmount > 0) {
        const percentage = (donationAmount / baseAmount) * 100;
        stats.average_gratuity_percentage = 
          (stats.average_gratuity_percentage * (stats.donation_count_this_month - 1) + percentage) 
          / stats.donation_count_this_month;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => 
      b.total_donated_this_month - a.total_donated_this_month
    );
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentLeaders = selectedView === 'monthly' ? monthlyLeaders : allTimeLeaders;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
          <i className="material-icons text-4xl text-white">emoji_events</i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Leaderboard</h1>
        <p className="text-gray-600">
          Celebrating our generous members who support our mission through voluntary donations
        </p>
      </div>

      {/* View Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setSelectedView('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              selectedView === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedView('all-time')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              selectedView === 'all-time'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Impact Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <i className="material-icons text-blue-600 text-3xl">volunteer_activism</i>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Your Donations Fund These Programs:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ <strong>Phone Rental Program</strong> - Crew phones at wholesale prices</li>
              <li>✅ <strong>Tool Rental Library</strong> - Professional equipment access</li>
              <li>✅ <strong>Financial Education</strong> - Credit building & budgeting workshops</li>
              <li>✅ <strong>Sweepstakes Prizes</strong> - New phones, tools, and equipment</li>
              <li>✅ <strong>Emergency Fund</strong> - Support for members facing hardship</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {currentLeaders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="material-icons text-6xl mb-4">sentiment_satisfied</i>
            <p>No donations yet this period. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y">
            {currentLeaders.map((donor, index) => (
              <div
                key={donor.member_id}
                className={`p-6 flex items-center gap-4 transition hover:bg-gray-50 ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="text-2xl font-bold">
                    {getMedalEmoji(index + 1)}
                  </span>
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {donor.member_avatar ? (
                    <img
                      src={donor.member_avatar}
                      alt={donor.member_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {donor.member_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {donor.member_name}
                  </h3>
                  {donor.business_name && (
                    <p className="text-sm text-gray-600 truncate">{donor.business_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {donor.donation_count_this_month} {donor.donation_count_this_month === 1 ? 'donation' : 'donations'}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      Avg {donor.average_gratuity_percentage.toFixed(0)}% gratuity
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      selectedView === 'monthly' 
                        ? donor.total_donated_this_month 
                        : donor.total_donated_all_time
                    )}
                  </div>
                  {selectedView === 'monthly' && donor.total_donated_all_time > donor.total_donated_this_month && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(donor.total_donated_all_time)} all-time
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Thank you to all our donors! Your generosity makes our programs possible. 🙏
        </p>
        <p className="text-xs text-gray-500">
          All donations are 100% voluntary and tax-deductible for 501(c)(3) nonprofit members.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface DonorStats {
    profile_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    total_donated: number;
    donation_count: number;
    avg_percentage: number;
    year: number;
    rank: number;
}

type TimeFrame = 'current_year' | 'all_time' | 'month' | 'quarter';

export default function DonorLeaderboard() {
    const [donors, setDonors] = useState<DonorStats[]>([]);
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('current_year');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [timeFrame]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('donation_history')
                .select(`
                    profile_id,
                    donation_amount,
                    donation_percentage,
                    created_at,
                    profiles!inner(username, display_name, avatar_url)
                `)
                .gt('donation_amount', 0);

            // Apply time filter
            const now = new Date();
            if (timeFrame === 'current_year') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                query = query.gte('created_at', startOfYear.toISOString());
            } else if (timeFrame === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                query = query.gte('created_at', startOfMonth.toISOString());
            } else if (timeFrame === 'quarter') {
                const quarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                query = query.gte('created_at', startOfQuarter.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            // Aggregate by user
            const userMap = new Map<string, DonorStats>();
            
            data?.forEach((record: any) => {
                const profile = record.profiles;
                const key = record.profile_id;

                if (userMap.has(key)) {
                    const existing = userMap.get(key)!;
                    existing.total_donated += record.donation_amount;
                    existing.donation_count += 1;
                    existing.avg_percentage = (existing.avg_percentage * (existing.donation_count - 1) + record.donation_percentage) / existing.donation_count;
                } else {
                    userMap.set(key, {
                        profile_id: record.profile_id,
                        username: profile.username,
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url,
                        total_donated: record.donation_amount,
                        donation_count: 1,
                        avg_percentage: record.donation_percentage,
                        year: now.getFullYear(),
                        rank: 0
                    });
                }
            });

            // Sort by total donated and assign ranks
            const sorted = Array.from(userMap.values())
                .sort((a, b) => b.total_donated - a.total_donated)
                .map((donor, index) => ({
                    ...donor,
                    rank: index + 1
                }));

            setDonors(sorted);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) {
            return {
                icon: '🏆',
                color: 'from-yellow-400 to-yellow-600',
                textColor: 'text-yellow-900',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-400',
                title: 'Champion'
            };
        } else if (rank === 2) {
            return {
                icon: '🥈',
                color: 'from-gray-300 to-gray-400',
                textColor: 'text-gray-900',
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-400',
                title: 'Hero'
            };
        } else if (rank === 3) {
            return {
                icon: '🥉',
                color: 'from-orange-400 to-orange-600',
                textColor: 'text-orange-900',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-400',
                title: 'Supporter'
            };
        } else if (rank <= 10) {
            return {
                icon: '⭐',
                color: 'from-blue-400 to-blue-600',
                textColor: 'text-blue-900',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-300',
                title: 'Top 10'
            };
        } else {
            return {
                icon: '💚',
                color: 'from-green-400 to-green-600',
                textColor: 'text-green-900',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-300',
                title: 'Contributor'
            };
        }
    };

    const getTimeFrameLabel = () => {
        switch (timeFrame) {
            case 'current_year': return `${new Date().getFullYear()} Leaderboard`;
            case 'all_time': return 'All-Time Champions';
            case 'month': return 'This Month';
            case 'quarter': return 'This Quarter';
        }
    };

    const getTotalImpact = () => {
        return donors.reduce((sum, donor) => sum + donor.total_donated, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    🏆 Community Champions
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Celebrating our generous contributors who make it all possible
                </p>

                {/* Total Impact */}
                <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white shadow-2xl mb-6">
                    <p className="text-sm uppercase tracking-wide opacity-90 mb-2">Total Community Impact</p>
                    <p className="text-6xl font-bold mb-2">${getTotalImpact().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm opacity-90">Contributed by {donors.length} amazing people</p>
                </div>

                {/* Time Frame Selector */}
                <div className="flex justify-center gap-2">
                    {[
                        { value: 'month' as TimeFrame, label: 'This Month' },
                        { value: 'quarter' as TimeFrame, label: 'This Quarter' },
                        { value: 'current_year' as TimeFrame, label: '2025' },
                        { value: 'all_time' as TimeFrame, label: 'All-Time' }
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setTimeFrame(value)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                timeFrame === value
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top 3 Podium */}
            {donors.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-12">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-gray-200">
                                {donors[1].display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -top-2 -right-2 text-4xl">🥈</div>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">@{donors[1].username}</p>
                        <p className="text-3xl font-bold text-gray-700 mt-2">
                            ${donors[1].total_donated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">{donors[1].donation_count} donations</p>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center -mt-8">
                        <div className="relative mb-4">
                            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-yellow-300 animate-pulse">
                                {donors[0].display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -top-3 -right-3 text-5xl">🏆</div>
                        </div>
                        <p className="font-bold text-gray-900 text-xl">@{donors[0].username}</p>
                        <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-semibold text-xs mb-2">
                            👑 CHAMPION
                        </div>
                        <p className="text-4xl font-bold text-yellow-600 mt-2">
                            ${donors[0].total_donated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">{donors[0].donation_count} donations</p>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-orange-200">
                                {donors[2].display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -top-2 -right-2 text-4xl">🥉</div>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">@{donors[2].username}</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                            ${donors[2].total_donated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">{donors[2].donation_count} donations</p>
                    </div>
                </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">{getTimeFrameLabel()}</h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {donors.map((donor) => {
                        const badge = getRankBadge(donor.rank);
                        const isTopThree = donor.rank <= 3;

                        return (
                            <div
                                key={donor.profile_id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${
                                    isTopThree ? `${badge.bgColor} border-l-4 ${badge.borderColor}` : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left: Rank + Avatar + Name */}
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Rank */}
                                        <div className={`text-3xl font-bold w-12 text-center ${
                                            isTopThree ? badge.textColor : 'text-gray-400'
                                        }`}>
                                            {donor.rank <= 3 ? badge.icon : `#${donor.rank}`}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                                            {donor.display_name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Name & Stats */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-gray-900 text-lg">
                                                    @{donor.username}
                                                </p>
                                                {isTopThree && (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.bgColor} ${badge.textColor}`}>
                                                        {badge.title}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>{donor.donation_count} donations</span>
                                                <span>•</span>
                                                <span>Avg {donor.avg_percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Donation Amount */}
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${
                                            isTopThree ? badge.textColor : 'text-green-600'
                                        }`}>
                                            ${donor.total_donated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">contributed</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Empty State */}
            {donors.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <span className="material-icons text-gray-400 text-6xl mb-4">emoji_events</span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Be the First Champion!
                    </h3>
                    <p className="text-gray-600">
                        Start contributing to see your name on the leaderboard
                    </p>
                </div>
            )}

            {/* Impact Statement */}
            <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <span className="material-icons text-blue-600 text-4xl">volunteer_activism</span>
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                            Your Contributions Make a Real Difference
                        </h3>
                        <p className="text-blue-800 mb-4">
                            Every dollar contributed goes directly to funding:
                        </p>
                        <ul className="space-y-2 text-blue-800">
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm">check_circle</span>
                                <strong>Earn While You Learn</strong> - Training 50+ new trades workers this year
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm">check_circle</span>
                                <strong>Buy1:Give1</strong> - Providing wholesale access to 200+ families
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm">check_circle</span>
                                <strong>Home Reno Assistance</strong> - Completing 30+ essential home repairs
                            </li>
                        </ul>
                        <p className="text-sm text-blue-700 mt-4 italic">
                            Thank you to everyone who makes this community thrive! 💙
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

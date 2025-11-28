import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import BadgeDisplay from './BadgeDisplay';
import { useNavigate } from 'react-router-dom';

interface LeaderboardUser {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    tier_name: string;
    tier_level: number;
    badge_icon: string;
    badge_color: string;
    rating: number;
    completed_projects: number;
    total_reviews: number;
    badge_earned_at: string;
    times_earned: number;
    is_comeback_story: boolean;
}

const BadgeLeaderboard: React.FC = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTier, setFilterTier] = useState<string | null>(null);
    const navigate = useNavigate();

    const tiers = [
        { name: 'Platinum', level: 4, icon: '💎', color: '#E5E4E2' },
        { name: 'Gold', level: 3, icon: '🥇', color: '#FFD700' },
        { name: 'Silver', level: 2, icon: '🥈', color: '#C0C0C0' },
        { name: 'Bronze', level: 1, icon: '🥉', color: '#CD7F32' }
    ];

    useEffect(() => {
        fetchLeaderboard();
    }, [filterTier]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('badge_leaderboard')
                .select('*');

            if (filterTier) {
                query = query.eq('tier_name', filterTier);
            }

            const { data, error } = await query;

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching badge leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTierStats = () => {
        const stats = tiers.map(tier => ({
            ...tier,
            count: users.filter(u => u.tier_name === tier.name).length
        }));
        return stats;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <span className="material-icons-outlined text-3xl">emoji_events</span>
                    Badge Leaderboard
                </h2>
                <p className="text-purple-100">
                    Community members ranked by their achievement badges. Earn your way up through excellent work!
                </p>
            </div>

            {/* Tier Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getTierStats().map(tier => (
                    <button
                        key={tier.name}
                        onClick={() => setFilterTier(filterTier === tier.name ? null : tier.name)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            filterTier === tier.name
                                ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="text-3xl mb-2">{tier.icon}</div>
                        <div className="font-semibold text-gray-800">{tier.name}</div>
                        <div className="text-2xl font-bold text-gray-900">{tier.count}</div>
                        <div className="text-xs text-gray-500">members</div>
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3">
                {users.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                        <span className="material-icons-outlined text-6xl text-gray-300 mb-4">badge</span>
                        <p className="text-lg">No users found in this tier.</p>
                        <p className="text-sm mt-2">Complete projects and earn reviews to appear on the leaderboard!</p>
                    </div>
                ) : (
                    users.map((user, index) => (
                        <div
                            key={user.id}
                            className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer border-2 ${
                                user.tier_level === 4 ? 'border-purple-300' :
                                user.tier_level === 3 ? 'border-yellow-300' :
                                user.tier_level === 2 ? 'border-gray-300' :
                                'border-orange-300'
                            }`}
                            onClick={() => navigate(`/profile/${user.username}`)}
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank Number */}
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {user.avatar_url ? (
                                        <img 
                                            src={user.avatar_url} 
                                            alt={user.display_name}
                                            className="w-16 h-16 rounded-full object-cover border-2"
                                            style={{ borderColor: user.badge_color }}
                                        />
                                    ) : (
                                        <div 
                                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2"
                                            style={{ 
                                                backgroundColor: user.badge_color,
                                                borderColor: user.badge_color
                                            }}
                                        >
                                            {user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">
                                            {user.display_name || user.username}
                                        </h3>
                                        <BadgeDisplay
                                            tierName={user.tier_name}
                                            tierLevel={user.tier_level}
                                            badgeIcon={user.badge_icon}
                                            badgeColor={user.badge_color}
                                            size="small"
                                            showLabel={false}
                                        />
                                        {user.is_comeback_story && (
                                            <span 
                                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold"
                                                title="Re-earned this badge after improvement"
                                            >
                                                🔄 Comeback
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">@{user.username}</div>
                                    
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="font-semibold text-gray-700">
                                                {user.rating?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <span className="material-icons-outlined text-sm">rate_review</span>
                                            <span>{user.total_reviews} reviews</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <span className="material-icons-outlined text-sm">construction</span>
                                            <span>{user.completed_projects} projects</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge Display (Large) */}
                                <div className="hidden md:flex flex-shrink-0">
                                    <BadgeDisplay
                                        tierName={user.tier_name}
                                        tierLevel={user.tier_level}
                                        badgeIcon={user.badge_icon}
                                        badgeColor={user.badge_color}
                                        size="medium"
                                        showLabel={true}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Info Footer */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="material-icons-outlined text-blue-600 text-2xl">info</span>
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-2">How Badge Tiers Work:</p>
                        <ul className="space-y-1">
                            <li><strong>Bronze 🥉:</strong> Everyone starts here - Welcome!</li>
                            <li><strong>Silver 🥈:</strong> 4.0+ rating, 5+ reviews, 3+ completed projects</li>
                            <li><strong>Gold 🥇:</strong> 4.5+ rating, 15+ reviews, 10+ completed projects</li>
                            <li><strong>Platinum 💎:</strong> 4.8+ rating, 30+ reviews, 25+ completed projects</li>
                        </ul>
                        <p className="mt-3 text-xs text-gray-600">
                            <strong>Accountability:</strong> Your badge can go up OR down based on performance. 
                            Maintain excellence to keep your tier, or improve to level back up if demoted!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeLeaderboard;

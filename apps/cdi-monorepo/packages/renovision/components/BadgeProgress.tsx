import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import BadgeDisplay from './BadgeDisplay';

interface BadgeInfo {
    current_badge: {
        tier_name: string;
        tier_level: number;
        badge_icon: string;
        badge_color: string;
        earned_at: string;
        times_earned: number;
    };
    performance: {
        rating: number;
        total_projects: number;
        completed_projects: number;
        total_reviews: number;
    };
    next_tier?: {
        tier_name: string;
        tier_level: number;
        required_rating: number;
        required_reviews: number;
        required_projects: number;
        rating_gap: number;
        reviews_gap: number;
        projects_gap: number;
    };
    history: Array<{
        from_tier: string;
        to_tier: string;
        reason: string;
        date: string;
    }>;
}

interface BadgeProgressProps {
    userId: string;
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({ userId }) => {
    const [badgeInfo, setBadgeInfo] = useState<BadgeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchBadgeInfo();
    }, [userId]);

    const fetchBadgeInfo = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_user_badge_info', { user_id: userId });

            if (error) throw error;
            setBadgeInfo(data);
        } catch (error) {
            console.error('Error fetching badge info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!badgeInfo?.current_badge) {
        return null;
    }

    const { current_badge, performance, next_tier, history } = badgeInfo;

    // Calculate progress percentages to next tier
    const getProgress = (current: number, required: number, gap: number): number => {
        if (gap <= 0) return 100;
        return Math.min(100, Math.max(0, ((required - gap) / required) * 100));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Current Badge Display */}
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Current Badge</h3>
                <div className="flex justify-center mb-3">
                    <BadgeDisplay
                        tierName={current_badge.tier_name}
                        tierLevel={current_badge.tier_level}
                        badgeIcon={current_badge.badge_icon}
                        badgeColor={current_badge.badge_color}
                        size="large"
                        showLabel={true}
                    />
                </div>
                <p className="text-sm text-gray-600">
                    Earned on {new Date(current_badge.earned_at).toLocaleDateString()}
                </p>
                {current_badge.times_earned > 1 && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        <span>🔄</span>
                        <span>Comeback Story! Earned {current_badge.times_earned}x</span>
                    </div>
                )}
            </div>

            {/* Current Performance */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                        {performance.rating?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Rating</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                        {performance.total_reviews || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Reviews</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                        {performance.completed_projects || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Projects</div>
                </div>
            </div>

            {/* Progress to Next Tier */}
            {next_tier && (
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">Progress to {next_tier.tier_name}</h4>
                        <BadgeDisplay
                            tierName={next_tier.tier_name}
                            tierLevel={next_tier.tier_level}
                            badgeIcon="⭐"
                            badgeColor="#FFD700"
                            size="small"
                            showLabel={false}
                        />
                    </div>

                    <div className="space-y-3">
                        {/* Rating Progress */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Rating: {performance.rating?.toFixed(2) || 0} / {next_tier.required_rating}</span>
                                <span>
                                    {next_tier.rating_gap > 0 
                                        ? `+${next_tier.rating_gap.toFixed(2)} needed` 
                                        : '✓ Completed'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${getProgress(
                                            performance.rating || 0, 
                                            next_tier.required_rating, 
                                            next_tier.rating_gap
                                        )}%` 
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Reviews Progress */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Reviews: {performance.total_reviews} / {next_tier.required_reviews}</span>
                                <span>
                                    {next_tier.reviews_gap > 0 
                                        ? `${next_tier.reviews_gap} more needed` 
                                        : '✓ Completed'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${getProgress(
                                            performance.total_reviews, 
                                            next_tier.required_reviews, 
                                            next_tier.reviews_gap
                                        )}%` 
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Projects Progress */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Projects: {performance.completed_projects} / {next_tier.required_projects}</span>
                                <span>
                                    {next_tier.projects_gap > 0 
                                        ? `${next_tier.projects_gap} more needed` 
                                        : '✓ Completed'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${getProgress(
                                            performance.completed_projects, 
                                            next_tier.required_projects, 
                                            next_tier.projects_gap
                                        )}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge History */}
            {history && history.length > 0 && (
                <div className="border-t pt-4">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <span className="material-icons-outlined text-lg">
                            {showHistory ? 'expand_less' : 'expand_more'}
                        </span>
                        Badge History ({history.length})
                    </button>

                    {showHistory && (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                            {history.map((event, index) => (
                                <div 
                                    key={index}
                                    className={`p-3 rounded-lg text-sm ${
                                        event.reason === 'promotion' 
                                            ? 'bg-green-50 border-l-4 border-green-500' 
                                            : event.reason === 'demotion'
                                            ? 'bg-red-50 border-l-4 border-red-500'
                                            : 'bg-gray-50 border-l-4 border-gray-500'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {event.reason === 'promotion' ? (
                                                <span className="text-green-600">📈</span>
                                            ) : event.reason === 'demotion' ? (
                                                <span className="text-red-600">📉</span>
                                            ) : (
                                                <span className="text-gray-600">🏁</span>
                                            )}
                                            <span className="font-semibold text-gray-800">
                                                {event.from_tier ? (
                                                    <>{event.from_tier} → {event.to_tier}</>
                                                ) : (
                                                    <>Started at {event.to_tier}</>
                                                )}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 capitalize">
                                        {event.reason}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Accountability Message */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start gap-2">
                    <span className="material-icons-outlined text-yellow-600 text-xl">info</span>
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Badge Accountability</p>
                        <p>Your badge can go up or down based on your performance. Maintain great ratings and completed projects to keep your tier, or work your way back up if demoted!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeProgress;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import HintBubble from './HintBubble';

interface Hint {
    hint_id: string;
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    icon: string;
    action_text?: string;
    action_url?: string;
    seen_count: number;
    is_new: boolean;
}

interface HintsContainerProps {
    maxHints?: number;
    position?: 'top' | 'bottom' | 'sidebar';
}

const HintsContainer: React.FC<HintsContainerProps> = ({ 
    maxHints = 3,
    position = 'top' 
}) => {
    const location = useLocation();
    const { userProfile } = useAuth();
    const [hints, setHints] = useState<Hint[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (userProfile) {
            fetchHints();
        }
    }, [userProfile, location.pathname]);

    const fetchHints = async () => {
        if (!userProfile) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('get_hints_for_user', {
                    user_id: userProfile.id,
                    page_path: location.pathname,
                    user_role: userProfile.role
                });

            if (error) throw error;

            // Limit to maxHints
            setHints((data || []).slice(0, maxHints));

            // Record that user has seen these hints
            if (data && data.length > 0) {
                for (const hint of data) {
                    await supabase.rpc('record_hint_interaction', {
                        user_id: userProfile.id,
                        hint_id: hint.hint_id,
                        action: 'seen'
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching hints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (hintId: string) => {
        if (!userProfile) return;

        try {
            // Record dismissal
            await supabase.rpc('record_hint_interaction', {
                user_id: userProfile.id,
                hint_id: hintId,
                action: 'dismissed'
            });

            // Remove from UI
            setHints(prev => prev.filter(h => h.hint_id !== hintId));
        } catch (error) {
            console.error('Error dismissing hint:', error);
        }
    };

    const handleRate = async (hintId: string, rating: number) => {
        if (!userProfile) return;

        try {
            await supabase.rpc('rate_hint', {
                user_id: userProfile.id,
                hint_id: hintId,
                rating: rating
            });
        } catch (error) {
            console.error('Error rating hint:', error);
        }
    };

    const handleDismissAll = async () => {
        if (!userProfile) return;

        try {
            for (const hint of hints) {
                await supabase.rpc('record_hint_interaction', {
                    user_id: userProfile.id,
                    hint_id: hint.hint_id,
                    action: 'dismissed'
                });
            }
            setHints([]);
        } catch (error) {
            console.error('Error dismissing all hints:', error);
        }
    };

    if (loading || hints.length === 0) {
        return null;
    }

    const positionStyles = {
        top: 'mb-6',
        bottom: 'mt-6',
        sidebar: 'fixed right-4 bottom-4 max-w-md z-40'
    };

    return (
        <div className={positionStyles[position]}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-yellow-500 animate-pulse">tips_and_updates</span>
                    <h3 className="font-semibold text-gray-800">
                        Helpful Tips
                        {hints.some(h => h.is_new) && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                            </span>
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {hints.length > 1 && (
                        <button
                            onClick={handleDismissAll}
                            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Dismiss All
                        </button>
                    )}
                    {position === 'sidebar' && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <span className="material-icons text-sm">
                                {collapsed ? 'expand_more' : 'expand_less'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hints */}
            {!collapsed && (
                <div className="space-y-3">
                    {hints.map((hint) => (
                        <HintBubble
                            key={hint.hint_id}
                            id={hint.hint_id}
                            title={hint.title}
                            message={hint.message}
                            icon={hint.icon}
                            priority={hint.priority}
                            actionText={hint.action_text}
                            actionUrl={hint.action_url}
                            onDismiss={handleDismiss}
                            onRate={handleRate}
                            autoHide={false}
                        />
                    ))}
                </div>
            )}

            {/* Collapsed State */}
            {collapsed && (
                <div 
                    onClick={() => setCollapsed(false)}
                    className="flex items-center gap-2 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                >
                    <span className="material-icons text-blue-600">tips_and_updates</span>
                    <span className="text-sm font-medium text-blue-900">
                        {hints.length} tip{hints.length !== 1 ? 's' : ''} available
                    </span>
                    <span className="material-icons text-blue-600 ml-auto">expand_more</span>
                </div>
            )}
        </div>
    );
};

export default HintsContainer;

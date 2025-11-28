import React, { useState, useEffect } from 'react';

interface HintBubbleProps {
    id: string;
    title: string;
    message: string;
    icon?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    actionText?: string;
    actionUrl?: string;
    onDismiss: (hintId: string) => void;
    onRate?: (hintId: string, rating: number) => void;
    autoHide?: boolean;
    duration?: number;
}

const HintBubble: React.FC<HintBubbleProps> = ({
    id,
    title,
    message,
    icon,
    priority,
    actionText,
    actionUrl,
    onDismiss,
    onRate,
    autoHide = false,
    duration = 8000
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRating, setShowRating] = useState(false);

    useEffect(() => {
        // Fade in animation
        const timer = setTimeout(() => setIsVisible(true), 100);

        // Auto-hide if enabled
        if (autoHide && duration > 0) {
            const hideTimer = setTimeout(() => handleDismiss(), duration);
            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        }

        return () => clearTimeout(timer);
    }, [autoHide, duration]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
    };

    const handleRate = (rating: number) => {
        if (onRate) {
            onRate(id, rating);
        }
        setShowRating(false);
        handleDismiss();
    };

    const getPriorityStyles = () => {
        switch (priority) {
            case 'critical':
                return {
                    border: 'border-red-300',
                    bg: 'bg-red-50',
                    icon: 'text-red-600',
                    text: 'text-red-900',
                    badge: 'bg-red-100 text-red-700'
                };
            case 'high':
                return {
                    border: 'border-orange-300',
                    bg: 'bg-orange-50',
                    icon: 'text-orange-600',
                    text: 'text-orange-900',
                    badge: 'bg-orange-100 text-orange-700'
                };
            case 'medium':
                return {
                    border: 'border-blue-300',
                    bg: 'bg-blue-50',
                    icon: 'text-blue-600',
                    text: 'text-blue-900',
                    badge: 'bg-blue-100 text-blue-700'
                };
            case 'low':
                return {
                    border: 'border-gray-300',
                    bg: 'bg-gray-50',
                    icon: 'text-gray-600',
                    text: 'text-gray-900',
                    badge: 'bg-gray-100 text-gray-700'
                };
        }
    };

    const styles = getPriorityStyles();

    return (
        <div
            className={`
                transition-all duration-300 transform
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
                border-2 rounded-lg shadow-lg p-4 mb-3
                ${styles.border} ${styles.bg}
            `}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${styles.icon}`}>
                    {icon?.startsWith('emoji') || /\p{Emoji}/u.test(icon || '') ? (
                        <span className="text-2xl">{icon}</span>
                    ) : (
                        <span className="material-icons-outlined text-2xl">
                            {icon || 'lightbulb'}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h4 className={`font-semibold ${styles.text} mb-1`}>
                                {title}
                            </h4>
                            {priority === 'critical' && (
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${styles.badge} mb-2`}>
                                    <span className="material-icons text-xs">warning</span>
                                    Important
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                            title="Dismiss"
                        >
                            <span className="material-icons text-sm">close</span>
                        </button>
                    </div>

                    <p className={`text-sm ${styles.text} leading-relaxed`}>
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        {actionText && actionUrl && (
                            <a
                                href={actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm font-medium hover:underline ${styles.icon} flex items-center gap-1`}
                            >
                                {actionText}
                                <span className="material-icons text-sm">arrow_forward</span>
                            </a>
                        )}

                        {onRate && (
                            <button
                                onClick={() => setShowRating(!showRating)}
                                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 ml-auto"
                            >
                                <span className="material-icons text-sm">thumb_up</span>
                                Was this helpful?
                            </button>
                        )}
                    </div>

                    {/* Rating Stars */}
                    {showRating && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded border border-gray-200">
                            <span className="text-xs text-gray-600">Rate this tip:</span>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() => handleRate(rating)}
                                    className="text-yellow-400 hover:text-yellow-500 transition-colors"
                                    title={`${rating} stars`}
                                >
                                    <span className="material-icons text-lg">star</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HintBubble;

import React from 'react';

interface BadgeDisplayProps {
    tierName: string;
    tierLevel: number;
    badgeIcon?: string;
    badgeColor?: string;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    className?: string;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
    tierName,
    tierLevel,
    badgeIcon = '🥉',
    badgeColor = '#CD7F32',
    size = 'medium',
    showLabel = true,
    className = ''
}) => {
    const sizeClasses = {
        small: 'w-6 h-6 text-xs',
        medium: 'w-10 h-10 text-lg',
        large: 'w-16 h-16 text-3xl'
    };

    const labelSizes = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
    };

    // Add glow effect for higher tiers
    const glowEffect = tierLevel >= 3 ? 'animate-pulse' : '';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div 
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${glowEffect}`}
                style={{
                    backgroundColor: `${badgeColor}20`,
                    border: `2px solid ${badgeColor}`,
                    boxShadow: tierLevel >= 4 ? `0 0 20px ${badgeColor}` : `0 0 10px ${badgeColor}40`
                }}
                title={`${tierName} Badge - Tier ${tierLevel}`}
            >
                <span className="leading-none">{badgeIcon}</span>
            </div>
            {showLabel && (
                <span 
                    className={`font-semibold ${labelSizes[size]}`}
                    style={{ color: badgeColor }}
                >
                    {tierName}
                </span>
            )}
        </div>
    );
};

export default BadgeDisplay;

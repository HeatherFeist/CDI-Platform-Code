import { supabase } from '../supabase';

export interface ProfileRating {
    userId: string;
    overallScore: number; // 0-5 stars
    completionScore: number; // 0-100%
    badges: Badge[];
    breakdown: RatingBreakdown;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedDate?: string;
}

export interface RatingBreakdown {
    profileComplete: boolean; // +1 star
    einVerified: boolean; // +1 star
    paymentConnected: boolean; // +0.5 star
    businessDescription: boolean; // +0.5 star
    hasLogo: boolean; // +0.5 star
    activeProjects: boolean; // +0.5 star
    positiveReviews: boolean; // +1 star
}

/**
 * Calculate user's profile rating based on completion and verification
 */
export async function calculateProfileRating(userId: string): Promise<ProfileRating> {
    try {
        // Fetch user profile data
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return getDefaultRating(userId);
        }

        // Fetch business profile if exists
        const { data: businessProfile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Check payment connections
        const { data: paymentMethods } = await supabase
            .from('payment_integrations')
            .select('*')
            .eq('profile_id', userId)
            .eq('is_active', true);

        // Check active projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['funding', 'active']);

        // Build rating breakdown
        const breakdown: RatingBreakdown = {
            profileComplete: !!(profile?.full_name && profile?.email),
            einVerified: !!(businessProfile?.ein && businessProfile?.ein_verified),
            paymentConnected: (paymentMethods?.length || 0) > 0,
            businessDescription: !!(businessProfile?.description && businessProfile?.description.length > 50),
            hasLogo: !!businessProfile?.logo_url,
            activeProjects: (projects?.length || 0) > 0,
            positiveReviews: false // TODO: Implement review system
        };

        // Calculate score
        let score = 0;
        if (breakdown.profileComplete) score += 1;
        if (breakdown.einVerified) score += 1;
        if (breakdown.paymentConnected) score += 0.5;
        if (breakdown.businessDescription) score += 0.5;
        if (breakdown.hasLogo) score += 0.5;
        if (breakdown.activeProjects) score += 0.5;
        if (breakdown.positiveReviews) score += 1;

        // Calculate completion percentage
        const totalCriteria = Object.keys(breakdown).length;
        const completedCriteria = Object.values(breakdown).filter(v => v).length;
        const completionScore = Math.round((completedCriteria / totalCriteria) * 100);

        // Determine badges
        const badges = generateBadges(breakdown);

        return {
            userId,
            overallScore: Math.min(score, 5),
            completionScore,
            badges,
            breakdown
        };

    } catch (error) {
        console.error('Error calculating rating:', error);
        return getDefaultRating(userId);
    }
}

/**
 * Generate badges based on achievements
 */
function generateBadges(breakdown: RatingBreakdown): Badge[] {
    const badges: Badge[] = [
        {
            id: 'verified_business',
            name: 'Verified Business',
            description: 'EIN verified and business registered',
            icon: '✓',
            earned: breakdown.einVerified,
            earnedDate: breakdown.einVerified ? new Date().toISOString() : undefined
        },
        {
            id: 'payment_ready',
            name: 'Payment Ready',
            description: 'Payment methods connected',
            icon: '💳',
            earned: breakdown.paymentConnected,
            earnedDate: breakdown.paymentConnected ? new Date().toISOString() : undefined
        },
        {
            id: 'active_merchant',
            name: 'Active Merchant',
            description: 'Has active projects or listings',
            icon: '🏪',
            earned: breakdown.activeProjects,
            earnedDate: breakdown.activeProjects ? new Date().toISOString() : undefined
        },
        {
            id: 'complete_profile',
            name: 'Complete Profile',
            description: 'Profile 100% complete',
            icon: '⭐',
            earned: Object.values(breakdown).every(v => v),
            earnedDate: Object.values(breakdown).every(v => v) ? new Date().toISOString() : undefined
        },
        {
            id: 'trusted_seller',
            name: 'Trusted Seller',
            description: 'Positive reviews and verified business',
            icon: '🏆',
            earned: breakdown.positiveReviews && breakdown.einVerified,
            earnedDate: (breakdown.positiveReviews && breakdown.einVerified) ? new Date().toISOString() : undefined
        }
    ];

    return badges;
}

/**
 * Get default rating for new users
 */
function getDefaultRating(userId: string): ProfileRating {
    return {
        userId,
        overallScore: 0,
        completionScore: 0,
        badges: generateBadges({
            profileComplete: false,
            einVerified: false,
            paymentConnected: false,
            businessDescription: false,
            hasLogo: false,
            activeProjects: false,
            positiveReviews: false
        }),
        breakdown: {
            profileComplete: false,
            einVerified: false,
            paymentConnected: false,
            businessDescription: false,
            hasLogo: false,
            activeProjects: false,
            positiveReviews: false
        }
    };
}

/**
 * Update profile and recalculate rating
 */
export async function updateProfileRating(userId: string): Promise<ProfileRating> {
    const rating = await calculateProfileRating(userId);

    // Store rating in database
    await supabase.from('user_ratings').upsert({
        user_id: userId,
        overall_score: rating.overallScore,
        completion_score: rating.completionScore,
        breakdown: rating.breakdown,
        updated_at: new Date().toISOString()
    });

    return rating;
}

/**
 * Verify EIN number (basic validation)
 */
export function validateEIN(ein: string): { valid: boolean; message: string } {
    // Remove any formatting
    const cleaned = ein.replace(/\D/g, '');

    // EIN must be exactly 9 digits
    if (cleaned.length !== 9) {
        return { valid: false, message: 'EIN must be 9 digits' };
    }

    // Basic validation: first two digits can't be 07, 08, 09, 17, 18, 19, 28, 29, etc.
    const prefix = parseInt(cleaned.slice(0, 2));
    const invalidPrefixes = [7, 8, 9, 17, 18, 19, 28, 29, 49, 69, 70, 78, 79, 89];

    if (invalidPrefixes.includes(prefix)) {
        return { valid: false, message: 'Invalid EIN prefix' };
    }

    return { valid: true, message: 'EIN format is valid' };
}

/**
 * Format EIN for display
 */
export function formatEIN(ein: string): string {
    const cleaned = ein.replace(/\D/g, '');
    if (cleaned.length !== 9) return ein;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
}

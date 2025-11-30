import { supabase } from '../supabase';

export interface TeamMemberRating {
    userId: string;
    overallRating: number; // 0-5 stars
    totalReviews: number;
    completedProjects: number;
    badges: TeamBadge[];
    skills: Skill[];
    certifications: Certification[];
    breakdown: RatingBreakdown;
}

export interface TeamBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedDate?: string;
    category: 'skill' | 'achievement' | 'quality' | 'experience';
}

export interface Skill {
    id: string;
    name: string;
    category: string;
    yearsExperience: number;
    verified: boolean;
}

export interface Certification {
    id: string;
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    verified: boolean;
    credentialUrl?: string;
}

export interface RatingBreakdown {
    qualityScore: number; // Average from reviews
    professionalismScore: number;
    communicationScore: number;
    timelinessScore: number;
    projectCount: number;
    yearsExperience: number;
    certificationCount: number;
    positiveReviewPercentage: number;
}

export interface Review {
    id: string;
    projectId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerType: 'client' | 'team_member' | 'manager';
    rating: number; // 1-5
    qualityRating: number;
    professionalismRating: number;
    communicationRating: number;
    timelinessRating: number;
    comment: string;
    photos?: string[];
    createdAt: string;
    verified: boolean;
}

/**
 * Calculate team member's overall rating
 */
export async function calculateTeamRating(userId: string): Promise<TeamMemberRating> {
    try {
        // Fetch team member profile
        const { data: profile } = await supabase
            .from('team_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!profile) {
            return getDefaultRating(userId);
        }

        // Fetch all reviews
        const { data: reviews } = await supabase
            .from('team_reviews')
            .select('*')
            .eq('team_member_id', userId)
            .eq('status', 'approved');

        // Fetch completed projects
        const { data: projects } = await supabase
            .from('project_assignments')
            .select('project_id, status')
            .eq('team_member_id', userId)
            .eq('status', 'completed');

        // Fetch certifications
        const { data: certifications } = await supabase
            .from('team_certifications')
            .select('*')
            .eq('user_id', userId);

        // Fetch skills
        const { data: skills } = await supabase
            .from('team_skills')
            .select('*')
            .eq('user_id', userId);

        // Calculate breakdown
        const breakdown = calculateBreakdown(reviews || [], projects || [], certifications || [], profile);

        // Calculate overall rating
        const overallRating = calculateOverallScore(breakdown);

        // Generate badges
        const badges = generateTeamBadges(breakdown, profile, reviews || []);

        return {
            userId,
            overallRating,
            totalReviews: reviews?.length || 0,
            completedProjects: projects?.length || 0,
            badges,
            skills: skills || [],
            certifications: certifications || [],
            breakdown
        };

    } catch (error) {
        console.error('Error calculating team rating:', error);
        return getDefaultRating(userId);
    }
}

/**
 * Calculate rating breakdown from reviews and data
 */
function calculateBreakdown(
    reviews: any[],
    projects: any[],
    certifications: any[],
    profile: any
): RatingBreakdown {
    if (reviews.length === 0) {
        return {
            qualityScore: 0,
            professionalismScore: 0,
            communicationScore: 0,
            timelinessScore: 0,
            projectCount: projects.length,
            yearsExperience: profile.years_experience || 0,
            certificationCount: certifications.length,
            positiveReviewPercentage: 0
        };
    }

    const qualityScore = reviews.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / reviews.length;
    const professionalismScore = reviews.reduce((sum, r) => sum + (r.professionalism_rating || 0), 0) / reviews.length;
    const communicationScore = reviews.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / reviews.length;
    const timelinessScore = reviews.reduce((sum, r) => sum + (r.timeliness_rating || 0), 0) / reviews.length;

    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const positiveReviewPercentage = (positiveReviews / reviews.length) * 100;

    return {
        qualityScore: Math.round(qualityScore * 10) / 10,
        professionalismScore: Math.round(professionalismScore * 10) / 10,
        communicationScore: Math.round(communicationScore * 10) / 10,
        timelinessScore: Math.round(timelinessScore * 10) / 10,
        projectCount: projects.length,
        yearsExperience: profile.years_experience || 0,
        certificationCount: certifications.length,
        positiveReviewPercentage: Math.round(positiveReviewPercentage)
    };
}

/**
 * Calculate overall score from breakdown
 */
function calculateOverallScore(breakdown: RatingBreakdown): number {
    // Weighted average
    const reviewScore = (
        breakdown.qualityScore * 0.35 +
        breakdown.professionalismScore * 0.25 +
        breakdown.communicationScore * 0.20 +
        breakdown.timelinessScore * 0.20
    );

    // Bonuses
    let bonuses = 0;
    if (breakdown.projectCount >= 10) bonuses += 0.2;
    if (breakdown.projectCount >= 50) bonuses += 0.3;
    if (breakdown.yearsExperience >= 5) bonuses += 0.2;
    if (breakdown.yearsExperience >= 10) bonuses += 0.3;
    if (breakdown.certificationCount >= 3) bonuses += 0.2;
    if (breakdown.positiveReviewPercentage >= 90) bonuses += 0.3;

    const finalScore = Math.min(reviewScore + bonuses, 5);
    return Math.round(finalScore * 10) / 10;
}

/**
 * Generate badges based on achievements
 */
function generateTeamBadges(breakdown: RatingBreakdown, profile: any, reviews: any[]): TeamBadge[] {
    const badges: TeamBadge[] = [
        {
            id: 'verified_pro',
            name: 'Verified Professional',
            description: 'Identity and skills verified',
            icon: '✓',
            category: 'achievement',
            earned: profile.verified === true
        },
        {
            id: 'quality_master',
            name: 'Quality Master',
            description: '4.5+ quality rating with 20+ reviews',
            icon: '⭐',
            category: 'quality',
            earned: breakdown.qualityScore >= 4.5 && reviews.length >= 20
        },
        {
            id: 'top_rated',
            name: 'Top Rated',
            description: '90%+ positive reviews',
            icon: '🏆',
            category: 'achievement',
            earned: breakdown.positiveReviewPercentage >= 90 && reviews.length >= 10
        },
        {
            id: 'experienced_pro',
            name: 'Experienced Pro',
            description: '5+ years in the trade',
            icon: '👷',
            category: 'experience',
            earned: breakdown.yearsExperience >= 5
        },
        {
            id: 'veteran_contractor',
            name: 'Veteran Contractor',
            description: '10+ years of experience',
            icon: '🎖️',
            category: 'experience',
            earned: breakdown.yearsExperience >= 10
        },
        {
            id: 'project_champion',
            name: 'Project Champion',
            description: '50+ completed projects',
            icon: '🏗️',
            category: 'achievement',
            earned: breakdown.projectCount >= 50
        },
        {
            id: 'certified_expert',
            name: 'Certified Expert',
            description: '3+ industry certifications',
            icon: '📜',
            category: 'skill',
            earned: breakdown.certificationCount >= 3
        },
        {
            id: 'excellent_communicator',
            name: 'Excellent Communicator',
            description: '4.5+ communication rating',
            icon: '💬',
            category: 'quality',
            earned: breakdown.communicationScore >= 4.5 && reviews.length >= 10
        },
        {
            id: 'always_on_time',
            name: 'Always On Time',
            description: '4.5+ timeliness rating',
            icon: '⏰',
            category: 'quality',
            earned: breakdown.timelinessScore >= 4.5 && reviews.length >= 10
        },
        {
            id: 'rising_star',
            name: 'Rising Star',
            description: '5+ projects with 4.5+ average rating',
            icon: '🌟',
            category: 'achievement',
            earned: breakdown.projectCount >= 5 && breakdown.qualityScore >= 4.5
        }
    ];

    // Set earned dates for earned badges
    badges.forEach(badge => {
        if (badge.earned) {
            badge.earnedDate = new Date().toISOString();
        }
    });

    return badges;
}

/**
 * Get default rating for new team members
 */
function getDefaultRating(userId: string): TeamMemberRating {
    return {
        userId,
        overallRating: 0,
        totalReviews: 0,
        completedProjects: 0,
        badges: generateTeamBadges({
            qualityScore: 0,
            professionalismScore: 0,
            communicationScore: 0,
            timelinessScore: 0,
            projectCount: 0,
            yearsExperience: 0,
            certificationCount: 0,
            positiveReviewPercentage: 0
        }, {}, []),
        skills: [],
        certifications: [],
        breakdown: {
            qualityScore: 0,
            professionalismScore: 0,
            communicationScore: 0,
            timelinessScore: 0,
            projectCount: 0,
            yearsExperience: 0,
            certificationCount: 0,
            positiveReviewPercentage: 0
        }
    };
}

/**
 * Submit a review for a team member
 */
export async function submitTeamReview(review: {
    teamMemberId: string;
    projectId: string;
    reviewerId: string;
    reviewerType: 'client' | 'team_member' | 'manager';
    rating: number;
    qualityRating: number;
    professionalismRating: number;
    communicationRating: number;
    timelinessRating: number;
    comment: string;
    photos?: string[];
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('team_reviews')
            .insert({
                team_member_id: review.teamMemberId,
                project_id: review.projectId,
                reviewer_id: review.reviewerId,
                reviewer_type: review.reviewerType,
                rating: review.rating,
                quality_rating: review.qualityRating,
                professionalism_rating: review.professionalismRating,
                communication_rating: review.communicationRating,
                timeliness_rating: review.timelinessRating,
                comment: review.comment,
                photos: review.photos || [],
                status: 'pending', // Requires approval
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        // Recalculate rating
        await updateTeamRating(review.teamMemberId);

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting review:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update team member rating in database
 */
export async function updateTeamRating(userId: string): Promise<void> {
    const rating = await calculateTeamRating(userId);

    await supabase.from('team_ratings').upsert({
        user_id: userId,
        overall_rating: rating.overallRating,
        total_reviews: rating.totalReviews,
        completed_projects: rating.completedProjects,
        breakdown: rating.breakdown,
        updated_at: new Date().toISOString()
    });
}

/**
 * Get reviews for a team member
 */
export async function getTeamReviews(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .from('team_reviews')
        .select(`
            *,
            reviewer:profiles!team_reviews_reviewer_id_fkey(full_name),
            project:projects(name, address)
        `)
        .eq('team_member_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return (data || []).map(r => ({
        id: r.id,
        projectId: r.project_id,
        reviewerId: r.reviewer_id,
        reviewerName: r.reviewer?.full_name || 'Anonymous',
        reviewerType: r.reviewer_type,
        rating: r.rating,
        qualityRating: r.quality_rating,
        professionalismRating: r.professionalism_rating,
        communicationRating: r.communication_rating,
        timelinessRating: r.timeliness_rating,
        comment: r.comment,
        photos: r.photos,
        createdAt: r.created_at,
        verified: r.verified || false
    }));
}

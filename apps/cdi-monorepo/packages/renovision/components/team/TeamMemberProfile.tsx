import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
    calculateTeamRating,
    getTeamReviews,
    type TeamMemberRating,
    type Review
} from '../../services/teamRatingService';

interface TeamMemberProfileProps {
    userId?: string; // If not provided, uses current user
    isPublic?: boolean; // Public view vs edit view
}

export const TeamMemberProfile: React.FC<TeamMemberProfileProps> = ({ userId, isPublic = false }) => {
    const [profile, setProfile] = useState<any>(null);
    const [rating, setRating] = useState<TeamMemberRating | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        phone: '',
        email: '',
        years_experience: 0,
        specialties: [] as string[],
        hourly_rate: 0,
        available_for_hire: true,
        location: '',
        profile_photo_url: ''
    });

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const targetUserId = userId || user?.id;
            if (!targetUserId) return;

            // Load team member profile
            const { data: profileData, error: profileError } = await supabase
                .from('team_profiles')
                .select('*')
                .eq('user_id', targetUserId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error loading profile:', profileError);
            }

            if (profileData) {
                setProfile(profileData);
                setFormData({
                    full_name: profileData.full_name || '',
                    bio: profileData.bio || '',
                    phone: profileData.phone || '',
                    email: profileData.email || '',
                    years_experience: profileData.years_experience || 0,
                    specialties: profileData.specialties || [],
                    hourly_rate: profileData.hourly_rate || 0,
                    available_for_hire: profileData.available_for_hire ?? true,
                    location: profileData.location || '',
                    profile_photo_url: profileData.profile_photo_url || ''
                });
            }

            // Load rating
            const ratingData = await calculateTeamRating(targetUserId);
            setRating(ratingData);

            // Load reviews
            const reviewsData = await getTeamReviews(targetUserId);
            setReviews(reviewsData);

            // Load recent projects
            const { data: projectsData } = await supabase
                .from('project_assignments')
                .select(`
                    *,
                    project:projects(
                        id,
                        name,
                        address,
                        project_type,
                        status,
                        created_at
                    )
                `)
                .eq('team_member_id', targetUserId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(6);

            setProjects(projectsData || []);

        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('team_profiles')
                .upsert({
                    user_id: user.id,
                    ...formData,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            alert('Profile updated successfully!');
            setEditMode(false);
            loadProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile');
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={star <= rating ? 'text-yellow-400 text-xl' : 'text-gray-600 text-xl'}
                    >
                        ★
                    </span>
                ))}
                <span className="ml-2 text-white font-semibold">{rating.toFixed(1)}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-white">Loading profile...</div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === (userId || currentUser?.id);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                        {/* Profile Photo */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                                {formData.profile_photo_url ? (
                                    <img src={formData.profile_photo_url} alt={formData.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    formData.full_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                            {profile?.verified && (
                                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-4 border-slate-800">
                                    <span className="text-white text-xl">✓</span>
                                </div>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {formData.full_name || 'Team Member'}
                            </h1>
                            {formData.specialties && formData.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {formData.specialties.map((specialty, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm border border-blue-500/30">
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {formData.bio && (
                                <p className="text-slate-300 mb-4">{formData.bio}</p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-slate-400">
                                <span>📍 {formData.location || 'Location not set'}</span>
                                <span>💼 {formData.years_experience} years experience</span>
                                {formData.hourly_rate > 0 && (
                                    <span>💰 ${formData.hourly_rate}/hr</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isOwnProfile && !isPublic && (
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            {editMode ? 'Cancel' : 'Edit Profile'}
                        </button>
                    )}
                </div>
            </div>

            {/* Rating & Badges Section */}
            {rating && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall Rating */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Overall Rating</h3>
                        {renderStars(rating.overallRating)}
                        <div className="mt-4 space-y-2 text-sm text-slate-400">
                            <div>📊 {rating.totalReviews} reviews</div>
                            <div>✅ {rating.completedProjects} projects completed</div>
                            <div>⭐ {rating.breakdown.positiveReviewPercentage}% positive</div>
                        </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Quality</span>
                                    <span className="text-white font-semibold">{rating.breakdown.qualityScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(rating.breakdown.qualityScore / 5) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Professionalism</span>
                                    <span className="text-white font-semibold">{rating.breakdown.professionalismScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(rating.breakdown.professionalismScore / 5) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Communication</span>
                                    <span className="text-white font-semibold">{rating.breakdown.communicationScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(rating.breakdown.communicationScore / 5) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Timeliness</span>
                                    <span className="text-white font-semibold">{rating.breakdown.timelinessScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(rating.breakdown.timelinessScore / 5) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Badges & Achievements</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {rating.badges.filter(b => b.earned).map(badge => (
                                <div
                                    key={badge.id}
                                    className="bg-slate-700/50 rounded-lg p-3 text-center group hover:bg-slate-700 transition-colors cursor-pointer"
                                    title={badge.description}
                                >
                                    <div className="text-3xl mb-1">{badge.icon}</div>
                                    <div className="text-xs text-slate-300 font-medium">{badge.name}</div>
                                </div>
                            ))}
                        </div>
                        {rating.badges.filter(b => b.earned).length === 0 && (
                            <p className="text-slate-400 text-sm text-center">No badges earned yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Mode Form */}
            {editMode && isOwnProfile && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience</label>
                            <input
                                type="number"
                                value={formData.years_experience}
                                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate ($)</label>
                            <input
                                type="number"
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleSaveProfile}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => setEditMode(false)}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Projects */}
            {projects.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((assignment) => (
                            <div key={assignment.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <h4 className="font-semibold text-white mb-2">{assignment.project?.name}</h4>
                                <p className="text-sm text-slate-400 mb-2">📍 {assignment.project?.address}</p>
                                <p className="text-xs text-slate-500">{assignment.project?.project_type}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6">Community Reviews</h3>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="font-semibold text-white">{review.reviewerName}</div>
                                        <div className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-slate-300">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamMemberProfile;

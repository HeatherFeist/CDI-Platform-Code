import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { submitTeamReview } from '../../services/teamRatingService';

interface ReviewFormProps {
    teamMemberId: string;
    projectId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const TeamReviewForm: React.FC<ReviewFormProps> = ({
    teamMemberId,
    projectId,
    onSuccess,
    onCancel
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        rating: 5,
        qualityRating: 5,
        professionalismRating: 5,
        communicationRating: 5,
        timelinessRating: 5,
        comment: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to submit a review');
                return;
            }

            // Determine reviewer type (you can enhance this logic)
            const reviewerType = 'client'; // Default to client

            const result = await submitTeamReview({
                teamMemberId,
                projectId,
                reviewerId: user.id,
                reviewerType,
                ...formData
            });

            if (result.success) {
                alert('Review submitted successfully! It will be visible after approval.');
                onSuccess();
            } else {
                alert(`Failed to submit review: ${result.error}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const renderStarSelector = (field: 'rating' | 'qualityRating' | 'professionalismRating' | 'communicationRating' | 'timelinessRating', label: string) => {
        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, [field]: star })}
                            className={`text-3xl transition-transform hover:scale-110 ${
                                star <= formData[field] ? 'text-yellow-400' : 'text-gray-600'
                            }`}
                        >
                            ★
                        </button>
                    ))}
                    <span className="ml-3 text-white font-semibold self-center">{formData[field]}/5</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Submit Team Member Review</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Overall Rating */}
                    {renderStarSelector('rating', 'Overall Rating')}

                    {/* Detailed Ratings */}
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Detailed Ratings</h3>
                        {renderStarSelector('qualityRating', 'Quality of Work')}
                        {renderStarSelector('professionalismRating', 'Professionalism')}
                        {renderStarSelector('communicationRating', 'Communication')}
                        {renderStarSelector('timelinessRating', 'Timeliness')}
                    </div>

                    {/* Written Review */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Your Review *
                        </label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            required
                            rows={6}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Share your experience working with this team member..."
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Your review will be publicly visible after approval.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.comment}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamReviewForm;

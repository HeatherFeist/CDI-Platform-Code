import React, { useState, useEffect } from 'react';
import { batchedInvitationService, BatchedInvitation } from '../../services/batchedInvitationService';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface BatchedInvitationReviewProps {
    onClose: () => void;
    onSent: () => void;
}

export const BatchedInvitationReview: React.FC<BatchedInvitationReviewProps> = ({
    onClose,
    onSent
}) => {
    const { userProfile } = useAuth();
    const [batches, setBatches] = useState<BatchedInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (userProfile?.business_id) {
            loadPendingBatches();
        }
    }, [userProfile?.business_id]);

    const loadPendingBatches = async () => {
        setLoading(true);
        try {
            const pending = await batchedInvitationService.getPendingBatches(userProfile!.business_id);
            setBatches(pending);
        } catch (error) {
            console.error('Error loading batches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendAll = async () => {
        setSending(true);
        try {
            const result = await batchedInvitationService.sendAllPendingBatches(userProfile!.business_id);
            
            if (result.success) {
                alert(`✅ Successfully sent ${result.sent} batched invitations!`);
                onSent();
                onClose();
            } else {
                alert(`⚠️ Sent ${result.sent} invitations, ${result.failed} failed:\n${result.errors.join('\n')}`);
                loadPendingBatches(); // Reload to show updated status
            }
        } catch (error) {
            console.error('Error sending batches:', error);
            alert('❌ Failed to send invitations. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const toggleExpand = (batchId: string) => {
        const newExpanded = new Set(expandedBatches);
        if (newExpanded.has(batchId)) {
            newExpanded.delete(batchId);
        } else {
            newExpanded.add(batchId);
        }
        setExpandedBatches(newExpanded);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-700">Loading invitations...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (batches.length === 0) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="text-center">
                        <span className="material-icons text-6xl text-gray-400 mb-4">mail_outline</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Invitations</h3>
                        <p className="text-gray-600 mb-4">
                            Tag team members on estimate line items to create invitations.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span className="material-icons">send</span>
                                Review & Send Invitations
                            </h2>
                            <p className="mt-1 opacity-90">
                                {batches.length} team member{batches.length > 1 ? 's' : ''} with pending task assignments
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="p-6 bg-blue-50 border-b grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-900">
                            {batches.length}
                        </div>
                        <div className="text-sm text-blue-700">Team Members</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-900">
                            {batches.reduce((sum, b) => sum + b.total_assignments, 0)}
                        </div>
                        <div className="text-sm text-blue-700">Total Tasks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-900">
                            ${batches.reduce((sum, b) => sum + b.total_cost, 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-700">Total Value</div>
                    </div>
                </div>

                {/* Batches List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {batches.map((batch) => (
                        <div
                            key={batch.batch_id}
                            className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                        >
                            {/* Batch Header */}
                            <div
                                className="p-4 bg-gray-50 cursor-pointer"
                                onClick={() => toggleExpand(batch.batch_id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="material-icons text-blue-600">person</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {batch.team_member_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {batch.team_member_email}
                                                    {batch.team_member_phone && ` • ${batch.team_member_phone}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                                {batch.total_assignments} task{batch.total_assignments > 1 ? 's' : ''}
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                ${batch.total_cost.toFixed(2)}
                                            </div>
                                        </div>
                                        <span className="material-icons text-gray-400">
                                            {expandedBatches.has(batch.batch_id) ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedBatches.has(batch.batch_id) && (
                                <div className="p-4 border-t">
                                    <h4 className="font-medium text-gray-900 mb-3">Task Assignments:</h4>
                                    <div className="space-y-2">
                                        {batch.assignments.map((assignment, index) => (
                                            <div
                                                key={assignment.assignment_id}
                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-900">{assignment.line_item_description}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Estimate: {assignment.estimate_id.substring(0, 8)}... • Line Item #{assignment.line_item_index + 1}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        ${assignment.assigned_cost.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="material-icons text-sm align-middle mr-1">info</span>
                            Each member will receive ONE invitation with all their assigned tasks
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                disabled={sending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAll}
                                disabled={sending}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons">send</span>
                                        Send All Invitations ({batches.length})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchedInvitationReview;

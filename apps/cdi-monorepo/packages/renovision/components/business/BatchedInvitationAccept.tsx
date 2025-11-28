import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchedInvitationService, BatchedInvitation } from '../../services/batchedInvitationService';

export const BatchedInvitationAccept: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const [batch, setBatch] = useState<BatchedInvitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    useEffect(() => {
        if (batchId) {
            loadBatch();
        }
    }, [batchId]);

    const loadBatch = async () => {
        setLoading(true);
        try {
            const batchData = await batchedInvitationService.getBatchDetails(batchId!);
            setBatch(batchData);
        } catch (error) {
            console.error('Error loading batch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!batch) return;

        setProcessing(true);
        try {
            const result = await batchedInvitationService.acceptBatch(batch.batch_id);
            
            if (result.success) {
                // Check if any assignments have calendar events
                const hasCalendarEvents = batch.assignments.some(a => 
                    a.estimate_start_date && a.estimate_end_date
                );
                
                if (hasCalendarEvents) {
                    alert(
                        `✅ Successfully accepted all ${batch.total_assignments} task assignments!\n\n` +
                        `📅 Calendar events are being added to your Google Calendar automatically. ` +
                        `You'll receive an "Add to Calendar" link via email for each project.`
                    );
                } else {
                    alert(`✅ Successfully accepted all ${batch.total_assignments} task assignments!`);
                }
                navigate('/dashboard');
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error accepting batch:', error);
            alert('❌ Failed to accept assignments. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDecline = async () => {
        if (!batch) return;

        setProcessing(true);
        try {
            const result = await batchedInvitationService.declineBatch(
                batch.batch_id,
                declineReason
            );
            
            if (result.success) {
                alert(`✅ Declined ${batch.total_assignments} task assignments.`);
                navigate('/dashboard');
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error declining batch:', error);
            alert('❌ Failed to decline assignments. Please try again.');
        } finally {
            setProcessing(false);
            setShowDeclineModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700">Loading invitation...</span>
                </div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <span className="material-icons text-6xl text-red-400 mb-4">error_outline</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        This invitation may have expired or been removed.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isExpired = batchedInvitationService.isBatchExpired(batch);
    const isAlreadyResponded = batch.invitation_status === 'accepted' || batch.invitation_status === 'declined';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                            <span className="material-icons text-4xl">assignment</span>
                            Task Assignment Invitation
                        </h1>
                        <p className="opacity-90">
                            You've been assigned to {batch.total_assignments} task{batch.total_assignments > 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Status Banner */}
                    {isExpired && (
                        <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-2 text-red-800">
                            <span className="material-icons">warning</span>
                            <span className="font-medium">This invitation has expired</span>
                        </div>
                    )}
                    {isAlreadyResponded && (
                        <div className={`${
                            batch.invitation_status === 'accepted' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                        } border-b p-4 flex items-center gap-2`}>
                            <span className="material-icons">
                                {batch.invitation_status === 'accepted' ? 'check_circle' : 'cancel'}
                            </span>
                            <span className="font-medium">
                                You already {batch.invitation_status} this invitation
                            </span>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-6 bg-blue-50 border-b grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Team Member</div>
                            <div className="font-semibold text-gray-900">{batch.team_member_name}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Total Compensation</div>
                            <div className="text-2xl font-bold text-blue-600">${batch.total_cost.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-icons">list</span>
                        Your Assignments ({batch.total_assignments})
                    </h2>
                    
                    <div className="space-y-3">
                        {batch.assignments.map((assignment, index) => (
                            <div
                                key={assignment.assignment_id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {assignment.line_item_description}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>
                                                <span className="material-icons text-xs align-middle">description</span>
                                                {' '}Estimate #{assignment.estimate_id.substring(0, 8)}...
                                            </span>
                                            <span>
                                                <span className="material-icons text-xs align-middle">format_list_numbered</span>
                                                {' '}Line Item #{assignment.line_item_index + 1}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">
                                            ${assignment.assigned_cost.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">your share</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                            ${batch.total_cost.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                {!isExpired && !isAlreadyResponded && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={() => setShowDeclineModal(true)}
                                disabled={processing}
                                className="flex-1 px-6 py-4 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span className="material-icons">cancel</span>
                                <span className="font-semibold">Decline All Tasks</span>
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={processing}
                                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons">check_circle</span>
                                        <span className="font-semibold">Accept All Tasks</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">
                            By accepting, you agree to complete all {batch.total_assignments} task assignments listed above.
                        </p>
                    </div>
                )}

                {/* Decline Modal */}
                {showDeclineModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Decline All Tasks?</h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to decline all {batch.total_assignments} task assignments?
                            </p>
                            <label className="block mb-4">
                                <span className="text-sm font-medium text-gray-700 mb-2 block">
                                    Reason (optional):
                                </span>
                                <textarea
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="Let us know why you're declining..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                />
                            </label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeclineModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                                    disabled={processing}
                                >
                                    {processing ? 'Declining...' : 'Confirm Decline'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchedInvitationAccept;

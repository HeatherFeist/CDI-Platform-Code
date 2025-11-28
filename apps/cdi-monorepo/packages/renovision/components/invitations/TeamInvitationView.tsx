import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

interface TaskAssignment {
    id: string;
    estimate_id: string;
    line_item_description: string;
    assigned_cost: number;
    status: string;
    completed: boolean;
    estimate: {
        estimate_number: string;
        title: string;
        customer: {
            name: string;
        };
    };
}

interface BatchInvitation {
    id: string;
    total_tasks: number;
    total_amount: number;
    status: string;
    expires_at: string;
    team_member: {
        first_name: string;
        last_name: string;
        email: string;
    };
    business: {
        name: string;
        phone: string;
        email: string;
    };
}

export default function TeamInvitationView() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState<BatchInvitation | null>(null);
    const [tasks, setTasks] = useState<TaskAssignment[]>([]);
    const [responding, setResponding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadInvitation();
        }
    }, [token]);

    const loadInvitation = async () => {
        try {
            setLoading(true);
            
            // Load invitation by token
            const { data: invData, error: invError } = await supabase
                .from('batched_invitations')
                .select(`
                    *,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        email
                    ),
                    business:businesses!business_id (
                        name,
                        phone,
                        email
                    )
                `)
                .eq('invitation_token', token)
                .single();

            if (invError) throw invError;
            if (!invData) throw new Error('Invitation not found');

            // Check if expired
            if (new Date(invData.expires_at) < new Date()) {
                setError('This invitation has expired');
                setLoading(false);
                return;
            }

            setInvitation(invData);

            // Load all tasks for this invitation
            const { data: tasksData, error: tasksError } = await supabase
                .from('task_assignments')
                .select(`
                    *,
                    estimate:estimates!estimate_id (
                        estimate_number,
                        title,
                        customer:customers!customer_id (
                            name
                        )
                    )
                `)
                .eq('batch_invitation_id', invData.id);

            if (tasksError) throw tasksError;
            setTasks(tasksData || []);
        } catch (err: any) {
            console.error('Error loading invitation:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (accepted: boolean) => {
        if (!invitation) return;

        try {
            setResponding(true);

            const newStatus = accepted ? 'accepted' : 'declined';

            // Update invitation status
            const { error: updateError } = await supabase
                .from('batched_invitations')
                .update({
                    status: newStatus,
                    responded_at: new Date().toISOString()
                })
                .eq('id', invitation.id);

            if (updateError) throw updateError;

            // Update all task assignments
            const { error: tasksError } = await supabase
                .from('task_assignments')
                .update({ status: newStatus })
                .eq('batch_invitation_id', invitation.id);

            if (tasksError) throw tasksError;

            // Log response
            const { error: responseError } = await supabase
                .from('invitation_responses')
                .insert({
                    batch_invitation_id: invitation.id,
                    response_type: newStatus,
                    responded_at: new Date().toISOString()
                });

            if (responseError) throw responseError;

            // Show success
            alert(accepted 
                ? `Great! You've accepted ${invitation.total_tasks} tasks totaling $${invitation.total_amount.toFixed(2)}`
                : 'Invitation declined. The business has been notified.'
            );

            // Reload to show updated status
            loadInvitation();
        } catch (err: any) {
            console.error('Error responding:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setResponding(false);
        }
    };

    const toggleTaskComplete = async (taskId: string, completed: boolean) => {
        try {
            const { error } = await supabase
                .from('task_assignments')
                .update({ 
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                })
                .eq('id', taskId);

            if (error) throw error;

            // Update local state
            setTasks(tasks.map(t => 
                t.id === taskId ? { ...t, completed } : t
            ));
        } catch (err: any) {
            console.error('Error updating task:', err);
            alert(`Error: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <span className="material-icons text-red-500 text-5xl mb-4">error_outline</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!invitation) {
        return <div className="min-h-screen flex items-center justify-center">Invitation not found</div>;
    }

    const hasResponded = invitation.status !== 'pending' && invitation.status !== 'sent';
    const completedTasks = tasks.filter(t => t.completed).length;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">
                            Work Invitation from {invitation.business.name}
                        </h1>
                        <p className="text-blue-100">
                            Hello {invitation.team_member.first_name} {invitation.team_member.last_name}
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="p-6 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <span className="material-icons text-blue-600 text-4xl mb-2">assignment</span>
                                <div className="text-2xl font-bold text-gray-900">{invitation.total_tasks}</div>
                                <div className="text-sm text-gray-600">Total Tasks</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <span className="material-icons text-green-600 text-4xl mb-2">attach_money</span>
                                <div className="text-2xl font-bold text-gray-900">${invitation.total_amount.toFixed(2)}</div>
                                <div className="text-sm text-gray-600">Total Payment</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <span className="material-icons text-purple-600 text-4xl mb-2">
                                    {hasResponded ? 'check_circle' : 'schedule'}
                                </span>
                                <div className="text-2xl font-bold text-gray-900 capitalize">{invitation.status}</div>
                                <div className="text-sm text-gray-600">Status</div>
                            </div>
                        </div>
                    </div>

                    {/* Accept/Decline Buttons */}
                    {!hasResponded && (
                        <div className="p-6 bg-gray-50 border-b">
                            <h3 className="font-semibold text-lg mb-4">Do you accept this work invitation?</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleResponse(true)}
                                    disabled={responding}
                                    className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
                                >
                                    <span className="material-icons">check_circle</span>
                                    Accept All Tasks
                                </button>
                                <button
                                    onClick={() => handleResponse(false)}
                                    disabled={responding}
                                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
                                >
                                    <span className="material-icons">cancel</span>
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress (if accepted) */}
                    {invitation.status === 'accepted' && (
                        <div className="p-6 bg-blue-50 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">Progress</span>
                                <span className="text-sm text-gray-600">
                                    {completedTasks} of {tasks.length} completed
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-green-600 h-3 rounded-full transition-all"
                                    style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Task List */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons">list</span>
                        Task Details
                    </h2>

                    <div className="space-y-4">
                        {tasks.map((task, index) => (
                            <div 
                                key={task.id}
                                className={`border rounded-lg p-4 ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                            >
                                <div className="flex items-start gap-4">
                                    {invitation.status === 'accepted' && (
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={(e) => toggleTaskComplete(task.id, e.target.checked)}
                                            className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                Task #{index + 1}: {task.line_item_description}
                                            </h3>
                                            <span className="text-green-600 font-bold">${task.assigned_cost.toFixed(2)}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <p>Estimate: {task.estimate.estimate_number} - {task.estimate.title}</p>
                                            <p>Customer: {task.estimate.customer.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-semibold text-lg mb-3">Questions?</h3>
                    <p className="text-gray-600 mb-3">Contact the business:</p>
                    <div className="flex flex-col gap-2 text-sm">
                        <a href={`mailto:${invitation.business.email}`} className="text-blue-600 hover:underline flex items-center gap-2">
                            <span className="material-icons text-sm">email</span>
                            {invitation.business.email}
                        </a>
                        <a href={`tel:${invitation.business.phone}`} className="text-blue-600 hover:underline flex items-center gap-2">
                            <span className="material-icons text-sm">phone</span>
                            {invitation.business.phone}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

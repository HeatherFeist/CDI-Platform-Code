import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface TaskAssignment {
    id: string;
    estimate_id: string;
    team_member_id: string;
    line_item_index: number;
    line_item_description: string;
    line_item_cost: number;
    assigned_cost: number;
    status: 'invited' | 'accepted' | 'declined' | 'completed';
    invited_at: string;
    responded_at?: string;
    estimate: {
        id: string;
        project_name: string;
        client_name: string;
        created_at: string;
        business: {
            business_name: string;
        };
    };
}

interface GroupedInvite {
    estimateId: string;
    projectName: string;
    clientName: string;
    businessName: string;
    createdAt: string;
    assignments: TaskAssignment[];
    totalCost: number;
    status: 'pending' | 'partial' | 'accepted' | 'declined';
}

export const TeamInbox: React.FC = () => {
    const [invites, setInvites] = useState<GroupedInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (user) {
            loadInvites();
        }
    }, [user]);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const loadInvites = async () => {
        try {
            setLoading(true);

            // Get the team member record for the current user
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!teamMember) {
                setInvites([]);
                return;
            }

            // Fetch all task assignments for this team member
            const { data: assignments, error } = await supabase
                .from('task_assignments')
                .select(`
                    *,
                    estimate:estimates (
                        id,
                        project_name,
                        client_name,
                        created_at,
                        business:businesses (
                            business_name
                        )
                    )
                `)
                .eq('team_member_id', teamMember.id)
                .order('invited_at', { ascending: false });

            if (error) throw error;

            // Group assignments by estimate
            const grouped = new Map<string, GroupedInvite>();

            assignments?.forEach((assignment: any) => {
                const estimateId = assignment.estimate_id;

                if (!grouped.has(estimateId)) {
                    grouped.set(estimateId, {
                        estimateId,
                        projectName: assignment.estimate.project_name,
                        clientName: assignment.estimate.client_name,
                        businessName: assignment.estimate.business.business_name,
                        createdAt: assignment.estimate.created_at,
                        assignments: [],
                        totalCost: 0,
                        status: 'pending'
                    });
                }

                const invite = grouped.get(estimateId)!;
                invite.assignments.push(assignment);
                invite.totalCost += assignment.assigned_cost || 0;
            });

            // Determine overall status for each invite
            grouped.forEach((invite) => {
                const statuses = invite.assignments.map(a => a.status);
                if (statuses.every(s => s === 'accepted')) {
                    invite.status = 'accepted';
                } else if (statuses.every(s => s === 'declined')) {
                    invite.status = 'declined';
                } else if (statuses.some(s => s === 'accepted' || s === 'declined')) {
                    invite.status = 'partial';
                } else {
                    invite.status = 'pending';
                }
            });

            setInvites(Array.from(grouped.values()));
        } catch (error) {
            console.error('Error loading invites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (assignmentId: string, status: 'accepted' | 'declined') => {
        try {
            const { error } = await supabase
                .from('task_assignments')
                .update({
                    status,
                    responded_at: new Date().toISOString()
                })
                .eq('id', assignmentId);

            if (error) throw error;

            // Reload invites to reflect changes
            await loadInvites();
        } catch (error) {
            console.error('Error updating assignment:', error);
            alert('Failed to update assignment status');
        }
    };

    const handleBulkResponse = async (estimateId: string, status: 'accepted' | 'declined') => {
        const invite = invites.find(i => i.estimateId === estimateId);
        if (!invite) return;

        try {
            const pendingAssignments = invite.assignments.filter(a => a.status === 'invited');

            for (const assignment of pendingAssignments) {
                await handleResponse(assignment.id, status);
            }
        } catch (error) {
            console.error('Error bulk updating assignments:', error);
        }
    };

    const getStatusBadge = (status: GroupedInvite['status']) => {
        switch (status) {
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'declined':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'pending':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const filteredInvites = invites.filter(invite => {
        if (activeFilter === 'all') return true;
        return invite.status === activeFilter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Invites</h1>
                    <p className="text-gray-600 mt-1">Review and respond to project assignments</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-blue-600">inbox</span>
                    <span className="font-semibold text-gray-900">{invites.filter(i => i.status === 'pending').length}</span>
                    <span className="text-gray-600">pending</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-gray-200">
                {(['all', 'pending', 'accepted', 'declined'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${activeFilter === filter
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {filter}
                        {filter !== 'all' && (
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                {invites.filter(i => i.status === filter).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Invites List */}
            {filteredInvites.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <span className="material-icons text-6xl text-gray-300">inbox</span>
                    <p className="text-gray-600 mt-4">No invites found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInvites.map(invite => (
                        <div key={invite.estimateId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            {/* Invite Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">{invite.projectName}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Client: {invite.clientName} • {invite.businessName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Invited {new Date(invite.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invite.status)}`}>
                                        {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="p-4 space-y-2">
                                <h4 className="font-medium text-gray-900 text-sm mb-3">Assigned Tasks:</h4>
                                {invite.assignments.map(assignment => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{assignment.line_item_description}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Status: <span className="capitalize">{assignment.status}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">${assignment.assigned_cost.toFixed(2)}</p>
                                            {assignment.status === 'invited' && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleResponse(assignment.id, 'accepted')}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponse(assignment.id, 'declined')}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total & Actions */}
                            <div className="bg-gray-50 p-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Payment</p>
                                        <p className="text-2xl font-bold text-gray-900">${invite.totalCost.toFixed(2)}</p>
                                    </div>
                                    {invite.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleBulkResponse(invite.estimateId, 'accepted')}
                                                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-icons text-sm">check_circle</span>
                                                Accept All
                                            </button>
                                            <button
                                                onClick={() => handleBulkResponse(invite.estimateId, 'declined')}
                                                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-icons text-sm">cancel</span>
                                                Decline All
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamInbox;

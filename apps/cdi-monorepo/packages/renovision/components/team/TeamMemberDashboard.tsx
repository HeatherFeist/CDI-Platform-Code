import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface ProjectInvitation {
    id: string;
    project: {
        id: string;
        name: string;
        description: string;
        business: {
            name: string;
        };
        customer: {
            first_name: string;
            last_name: string;
        };
    };
    estimate: {
        title: string;
        estimate_number: string;
    };
    tasks: string[];
    pay_amount: number;
    pay_type: 'fixed' | 'hourly' | 'milestone';
    estimated_hours?: number;
    milestones: Array<{
        name: string;
        description: string;
        amount: number;
        due_date: string;
    }>;
    status: 'invited' | 'accepted' | 'declined' | 'in_progress' | 'completed';
    invited_at: string;
}

interface ActiveProject {
    id: string;
    project_id: string;
    project: {
        name: string;
        status: string;
        customer: {
            first_name: string;
            last_name: string;
        };
    };
    tasks: string[];
    pay_amount: number;
    milestones: Array<{
        name: string;
        description: string;
        amount: number;
        due_date: string;
        completed: boolean;
        paid: boolean;
    }>;
    status: string;
}

export default function TeamMemberDashboard() {
    const { userProfile } = useAuth();
    const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
    const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const [tab, setTab] = useState<'invitations' | 'active'>('invitations');

    useEffect(() => {
        if (userProfile) {
            fetchData();
        }
    }, [userProfile]);

    const fetchData = async () => {
        if (!userProfile?.id) return;

        try {
            // Find team member record for this user
            const { data: teamMemberData, error: teamMemberError } = await supabase
                .from('team_members')
                .select('id')
                .eq('profile_id', userProfile.id)
                .single();

            if (teamMemberError) throw teamMemberError;

            if (teamMemberData) {
                // Fetch invitations
                const { data: invitationsData, error: invitationsError } = await supabase
                    .from('project_team_members')
                    .select(`
                        *,
                        project:projects(
                            id,
                            name,
                            description,
                            business:businesses(name),
                            customer:customers(first_name, last_name)
                        ),
                        estimate:estimates(title, estimate_number)
                    `)
                    .eq('team_member_id', teamMemberData.id)
                    .eq('status', 'invited');

                if (invitationsError) throw invitationsError;
                setInvitations(invitationsData || []);

                // Fetch active projects
                const { data: activeData, error: activeError } = await supabase
                    .from('project_team_members')
                    .select(`
                        *,
                        project:projects(
                            name,
                            status,
                            customer:customers(first_name, last_name)
                        )
                    `)
                    .eq('team_member_id', teamMemberData.id)
                    .in('status', ['accepted', 'in_progress']);

                if (activeError) throw activeError;
                setActiveProjects(activeData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (invitationId: string, accept: boolean) => {
        setResponding(invitationId);
        try {
            const { error } = await supabase
                .from('project_team_members')
                .update({ 
                    status: accept ? 'accepted' : 'declined',
                    accepted_at: accept ? new Date().toISOString() : null
                })
                .eq('id', invitationId);

            if (error) throw error;

            await fetchData();
            
            if (accept) {
                alert('You have accepted this project! The contractor will be notified.');
            } else {
                alert('You have declined this project. The contractor will be notified.');
            }
        } catch (error) {
            console.error('Error responding to invitation:', error);
            alert('Failed to respond to invitation');
        } finally {
            setResponding(null);
        }
    };

    const calculateTotalPay = (invitation: ProjectInvitation) => {
        if (invitation.pay_type === 'milestone') {
            return invitation.milestones.reduce((sum, m) => sum + m.amount, 0);
        }
        return invitation.pay_amount;
    };

    const calculateEarnings = () => {
        return activeProjects.reduce((sum, project) => {
            if (project.milestones && project.milestones.length > 0) {
                return sum + project.milestones
                    .filter(m => m.paid)
                    .reduce((mSum, m) => mSum + m.amount, 0);
            }
            return sum;
        }, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold mb-2">Welcome back, {userProfile?.first_name}!</h1>
                <p className="text-blue-100">Manage your project invitations and track your active work</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Invitations</p>
                            <p className="text-3xl font-bold text-gray-900">{invitations.length}</p>
                        </div>
                        <span className="material-icons text-4xl text-yellow-600">mail</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Projects</p>
                            <p className="text-3xl font-bold text-gray-900">{activeProjects.length}</p>
                        </div>
                        <span className="material-icons text-4xl text-blue-600">construction</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Earned</p>
                            <p className="text-3xl font-bold text-gray-900">${calculateEarnings().toLocaleString()}</p>
                        </div>
                        <span className="material-icons text-4xl text-green-600">payments</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="border-b">
                    <div className="flex">
                        <button
                            onClick={() => setTab('invitations')}
                            className={`flex-1 px-6 py-4 text-sm font-medium ${
                                tab === 'invitations'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center justify-center">
                                <span className="material-icons text-sm mr-2">mail</span>
                                Project Invitations ({invitations.length})
                            </span>
                        </button>
                        <button
                            onClick={() => setTab('active')}
                            className={`flex-1 px-6 py-4 text-sm font-medium ${
                                tab === 'active'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center justify-center">
                                <span className="material-icons text-sm mr-2">work</span>
                                Active Projects ({activeProjects.length})
                            </span>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {tab === 'invitations' ? (
                        invitations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <span className="material-icons text-6xl mb-2 opacity-30">inbox</span>
                                <p>No pending invitations</p>
                                <p className="text-sm mt-1">You'll see new project invitations here</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {invitations.map((invitation) => (
                                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{invitation.project.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {invitation.project.business.name} • 
                                                    Client: {invitation.project.customer.first_name} {invitation.project.customer.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Invited {new Date(invitation.invited_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                Pending Response
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Responsibilities:</h4>
                                                <ul className="space-y-1">
                                                    {invitation.tasks.map((task, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-gray-600">
                                                            <span className="material-icons text-xs text-blue-600 mr-2 mt-0.5">task_alt</span>
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-green-900">Your Compensation</h4>
                                                    <span className="text-2xl font-bold text-green-700">
                                                        ${calculateTotalPay(invitation).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-green-800">
                                                    <span className="flex items-center">
                                                        <span className="material-icons text-xs mr-1">info</span>
                                                        {invitation.pay_type === 'hourly' ? 'Hourly Rate' : 
                                                         invitation.pay_type === 'milestone' ? 'Milestone-Based' : 'Fixed Amount'}
                                                    </span>
                                                    {invitation.estimated_hours && (
                                                        <span className="flex items-center">
                                                            <span className="material-icons text-xs mr-1">schedule</span>
                                                            {invitation.estimated_hours} hours estimated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {invitation.milestones.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Milestones:</h4>
                                                    <div className="space-y-2">
                                                        {invitation.milestones.map((milestone, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{milestone.name}</p>
                                                                    <p className="text-xs text-gray-600">{milestone.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</p>
                                                                    <p className="text-xs text-gray-600">
                                                                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <span className="material-icons text-blue-600 mr-2">info</span>
                                                    <div className="text-sm text-blue-900">
                                                        <p className="font-medium mb-1">Transparent Agreement</p>
                                                        <p className="text-blue-800">
                                                            By accepting, you agree to complete the tasks listed above for the compensation shown. 
                                                            The client will see your role in the project with full transparency.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={() => handleRespond(invitation.id, true)}
                                                    disabled={responding === invitation.id}
                                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center font-medium"
                                                >
                                                    {responding === invitation.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-icons text-sm mr-2">check_circle</span>
                                                            Accept Project
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(invitation.id, false)}
                                                    disabled={responding === invitation.id}
                                                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center font-medium"
                                                >
                                                    <span className="material-icons text-sm mr-2">cancel</span>
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        activeProjects.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <span className="material-icons text-6xl mb-2 opacity-30">work_off</span>
                                <p>No active projects</p>
                                <p className="text-sm mt-1">Accept invitations to see active projects here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeProjects.map((project) => (
                                    <div key={project.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{project.project.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Client: {project.project.customer.first_name} {project.project.customer.last_name}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                project.status === 'in_progress' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {project.status === 'in_progress' ? 'In Progress' : 'Accepted'}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Your Tasks:</h4>
                                                <ul className="space-y-1">
                                                    {project.tasks.map((task, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-gray-600">
                                                            <span className="material-icons text-xs text-blue-600 mr-2 mt-0.5">task</span>
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {project.milestones && project.milestones.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h4>
                                                    <div className="space-y-2">
                                                        {project.milestones.map((milestone, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`material-icons text-sm ${
                                                                        milestone.completed ? 'text-green-600' : 'text-gray-400'
                                                                    }`}>
                                                                        {milestone.completed ? 'check_circle' : 'radio_button_unchecked'}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{milestone.name}</p>
                                                                        <p className="text-xs text-gray-600">{milestone.description}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</p>
                                                                    {milestone.paid ? (
                                                                        <span className="text-xs text-green-600 font-medium">Paid</span>
                                                                    ) : milestone.completed ? (
                                                                        <span className="text-xs text-yellow-600 font-medium">Pending Payment</span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">In Progress</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <span className="text-sm text-gray-600">Your Total Compensation:</span>
                                                <span className="text-lg font-bold text-gray-900">${project.pay_amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

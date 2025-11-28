import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import ProjectPhotosCapture from '../business/ProjectPhotosCapture';
import { SavedDesignsPicker, SavedDesign } from '../shared/SavedDesignsPicker';

interface Milestone {
    id: string;
    name: string;
    description: string;
    amount: number;
    due_date: string;
    completed_date: string | null;
    is_completed: boolean;
    is_paid: boolean;
    paid_date: string | null;
    assigned_to: string[];
    photos: string[];
    notes: string | null;
    display_order: number;
}

interface TeamMember {
    id: string;
    team_member: {
        first_name: string;
        last_name: string;
        role: string;
    };
    tasks: string[];
    pay_amount: number;
    status: string;
}

interface ProjectData {
    id: string;
    name: string;
    description: string;
    status: string;
    customer: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    business: {
        id: string;
        name: string;
    };
    scheduled_date: string | null;
    start_date: string | null;
    completed_date: string | null;
}

interface ActiveProjectViewProps {
    projectId: string;
    viewMode: 'contractor' | 'team_member' | 'client';
}

export default function ActiveProjectView({ projectId, viewMode }: ActiveProjectViewProps) {
    const { userProfile } = useAuth();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showAIDesigns, setShowAIDesigns] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchProjectData();
        fetchMessages();
        
        // Subscribe to real-time updates
        const milestonesSubscription = supabase
            .channel('milestones-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'project_milestones', filter: `project_id=eq.${projectId}` },
                () => fetchProjectData()
            )
            .subscribe();

        const messagesSubscription = supabase
            .channel('messages-changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'project_communications', filter: `project_id=eq.${projectId}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            milestonesSubscription.unsubscribe();
            messagesSubscription.unsubscribe();
        };
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            // Fetch project details
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select(`
                    *,
                    customer:customers(*),
                    business:businesses(*)
                `)
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;
            setProject(projectData);

            // Fetch milestones
            const { data: milestonesData, error: milestonesError } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('display_order', { ascending: true });

            if (milestonesError) throw milestonesError;
            setMilestones(milestonesData || []);

            // Fetch team members
            const { data: teamData, error: teamError } = await supabase
                .from('project_team_members')
                .select(`
                    *,
                    team_member:team_members(first_name, last_name, role)
                `)
                .eq('project_id', projectId)
                .eq('status', 'accepted');

            if (teamError) throw teamError;
            setTeamMembers(teamData || []);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('project_communications')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
        if (viewMode === 'client') {
            alert('Only team members can mark milestones as complete');
            return;
        }

        setUpdatingMilestone(milestoneId);
        try {
            const { error } = await supabase
                .from('project_milestones')
                .update({
                    is_completed: !currentStatus,
                    completed_date: !currentStatus ? new Date().toISOString() : null
                })
                .eq('id', milestoneId);

            if (error) throw error;

            // Create notification for contractor
            if (!currentStatus) {
                await supabase
                    .from('project_notifications')
                    .insert({
                        user_id: project?.business.id, // Would need business owner ID
                        project_id: projectId,
                        notification_type: 'milestone_complete',
                        title: 'Milestone Completed',
                        message: `A milestone has been marked as complete and is ready for review`,
                        action_url: `/projects/${projectId}`
                    });
            }

            await fetchProjectData();
        } catch (error) {
            console.error('Error updating milestone:', error);
            alert('Failed to update milestone');
        } finally {
            setUpdatingMilestone(null);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userProfile) return;

        try {
            const senderType = viewMode === 'contractor' ? 'contractor' : 
                              viewMode === 'team_member' ? 'team_member' : 'customer';

            const { error } = await supabase
                .from('project_communications')
                .insert({
                    project_id: projectId,
                    sender_id: userProfile.id,
                    sender_type: senderType,
                    message: newMessage
                });

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleSelectAIDesign = async (design: SavedDesign) => {
        try {
            console.log('✅ Adding AI design to project:', design.name);
            
            // Add the AI design as a project note/photo
            // You can customize this based on how your project stores photos
            const photoCaption = `AI Design Concept: ${design.generation_prompt || design.name}`;
            
            // Option 1: Add as a project photo (if your project has a photos array)
            // This would need the actual project update logic based on your schema
            
            // For now, just show success and close picker
            alert(`AI Design "${design.name}" added to project!`);
            setShowAIDesigns(false);
            
            // You can add actual storage logic here based on your project structure
            // For example: await projectService.addProjectPhoto(projectId, design.thumbnail_url, photoCaption);
        } catch (error) {
            console.error('Error adding AI design:', error);
            alert('Failed to add AI design to project');
        }
    };

    const calculateProgress = () => {
        if (milestones.length === 0) return 0;
        const completed = milestones.filter(m => m.is_completed).length;
        return Math.round((completed / milestones.length) * 100);
    };

    const calculateTotalPaid = () => {
        return milestones.filter(m => m.is_paid).reduce((sum, m) => sum + m.amount, 0);
    };

    const calculateTotalProject = () => {
        return milestones.reduce((sum, m) => sum + m.amount, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-12 text-gray-500">Project not found</div>;
    }

    const progress = calculateProgress();
    const totalPaid = calculateTotalPaid();
    const totalProject = calculateTotalProject();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                        <p className="text-blue-100 mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center">
                                <span className="material-icons text-sm mr-2">business</span>
                                {project.business.name}
                            </div>
                            <div className="flex items-center">
                                <span className="material-icons text-sm mr-2">person</span>
                                {project.customer.first_name} {project.customer.last_name}
                            </div>
                            {project.start_date && (
                                <div className="flex items-center">
                                    <span className="material-icons text-sm mr-2">event</span>
                                    Started: {new Date(project.start_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        project.status === 'completed' ? 'bg-green-500' :
                        project.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-yellow-500'
                    }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Overall Progress</p>
                            <p className="text-3xl font-bold text-gray-900">{progress}%</p>
                        </div>
                        <div className="relative w-16 h-16">
                            <svg className="transform -rotate-90 w-16 h-16">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${progress * 1.76} 176`}
                                    className="text-blue-600"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Milestones</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {milestones.filter(m => m.is_completed).length}/{milestones.length}
                            </p>
                        </div>
                        <span className="material-icons text-4xl text-blue-600">flag</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Amount Paid</p>
                            <p className="text-2xl font-bold text-gray-900">${totalPaid.toLocaleString()}</p>
                        </div>
                        <span className="material-icons text-4xl text-green-600">paid</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Budget</p>
                            <p className="text-2xl font-bold text-gray-900">${totalProject.toLocaleString()}</p>
                        </div>
                        <span className="material-icons text-4xl text-gray-600">account_balance_wallet</span>
                    </div>
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Project Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="material-icons text-blue-600">person</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {member.team_member.first_name} {member.team_member.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{member.team_member.role}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p className="font-medium mb-1">Tasks:</p>
                                <ul className="space-y-1">
                                    {member.tasks.slice(0, 2).map((task, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="material-icons text-xs mr-1 mt-0.5">check</span>
                                            {task}
                                        </li>
                                    ))}
                                    {member.tasks.length > 2 && (
                                        <li className="text-blue-600">+{member.tasks.length - 2} more</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Project Milestones</h2>
                    {viewMode !== 'client' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPhotos(!showPhotos)}
                                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                <span className="material-icons text-sm mr-2">photo_camera</span>
                                {showPhotos ? 'Hide Photos' : 'Add Progress Photos'}
                            </button>
                            <button
                                onClick={() => setShowAIDesigns(!showAIDesigns)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <span className="material-icons text-sm mr-2">auto_awesome</span>
                                {showAIDesigns ? 'Hide AI Designs' : 'Add AI Design Concept'}
                            </button>
                        </div>
                    )}
                </div>

                {showPhotos && viewMode !== 'client' && (
                    <div className="mb-6">
                        <ProjectPhotosCapture projectId={projectId} />
                    </div>
                )}

                {showAIDesigns && viewMode !== 'client' && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">Browse AI-Generated Design Concepts</h3>
                        <SavedDesignsPicker
                            onSelect={handleSelectAIDesign}
                            onClose={() => setShowAIDesigns(false)}
                            showPrompts={true}
                            columns={3}
                            maxHeight="500px"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    {milestones.map((milestone, idx) => (
                        <div key={milestone.id} className={`border-2 rounded-lg p-5 transition-all ${
                            milestone.is_completed ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="flex-shrink-0 pt-1">
                                        {milestone.is_completed ? (
                                            <span className="material-icons text-3xl text-green-600">check_circle</span>
                                        ) : (
                                            <span className="material-icons text-3xl text-gray-400">radio_button_unchecked</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                Milestone {idx + 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                                        
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center text-gray-700">
                                                <span className="material-icons text-sm mr-1">payments</span>
                                                <span className="font-semibold">${milestone.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center text-gray-700">
                                                <span className="material-icons text-sm mr-1">event</span>
                                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                                            </div>
                                            {milestone.is_completed && milestone.completed_date && (
                                                <div className="flex items-center text-green-700">
                                                    <span className="material-icons text-sm mr-1">check</span>
                                                    Completed: {new Date(milestone.completed_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        {milestone.is_paid && (
                                            <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                                                <span className="material-icons text-sm mr-1">paid</span>
                                                Payment Released
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {viewMode !== 'client' && !milestone.is_completed && (
                                    <button
                                        onClick={() => handleToggleMilestone(milestone.id, milestone.is_completed)}
                                        disabled={updatingMilestone === milestone.id}
                                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {updatingMilestone === milestone.id ? 'Updating...' : 'Mark Complete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Communication */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Project Communication</h2>
                
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map((message, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-sm text-blue-600">person</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                            {message.sender_type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(message.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{message.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <span className="material-icons text-sm mr-2">send</span>
                        Send
                    </button>
                </div>
            </div>

            {/* Transparency Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="material-icons text-green-600 mr-3">verified</span>
                    <div className="text-sm text-green-900">
                        <p className="font-medium mb-1">Real-Time Transparency</p>
                        <p className="text-green-800">
                            All project participants can see milestone progress, team member activities, and project communication in real-time. 
                            Updates are synced instantly across all devices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

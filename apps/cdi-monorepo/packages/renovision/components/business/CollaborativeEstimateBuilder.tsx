import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import ProjectPhotosCapture from './ProjectPhotosCapture';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    specialties: string[];
    hourly_rate: number | null;
}

interface ProjectTeamAssignment {
    id?: string;
    team_member_id: string;
    team_member?: TeamMember;
    tasks: string[];
    pay_amount: number;
    pay_type: 'fixed' | 'hourly' | 'milestone';
    estimated_hours?: number;
    milestones: Milestone[];
    status: 'invited' | 'accepted' | 'declined';
}

interface Milestone {
    name: string;
    description: string;
    amount: number;
    due_date: string;
}

interface CollaborativeEstimateBuilderProps {
    projectId: string;
    estimateId?: string;
    onComplete?: () => void;
}

export default function CollaborativeEstimateBuilder({ 
    projectId, 
    estimateId: initialEstimateId, 
    onComplete 
}: CollaborativeEstimateBuilderProps) {
    const { userProfile } = useAuth();
    const [estimateId, setEstimateId] = useState<string | undefined>(initialEstimateId);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignments, setAssignments] = useState<ProjectTeamAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Estimate details
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [materialsCost, setMaterialsCost] = useState(0);
    const [equipmentCost, setEquipmentCost] = useState(0);
    const [permitsCost, setPermitsCost] = useState(0);
    const [contingency, setContingency] = useState(10); // Percentage

    // UI state
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [currentAssignment, setCurrentAssignment] = useState<ProjectTeamAssignment>({
        team_member_id: '',
        tasks: [''],
        pay_amount: 0,
        pay_type: 'fixed',
        milestones: [],
        status: 'invited'
    });

    useEffect(() => {
        fetchData();
    }, [projectId, userProfile]);

    const fetchData = async () => {
        if (!userProfile?.business_id) return;

        try {
            // Fetch team members
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .eq('is_active', true)
                .eq('invite_status', 'accepted');

            if (membersError) throw membersError;
            setTeamMembers(membersData || []);

            // Fetch existing assignments if estimate exists
            if (estimateId) {
                const { data: assignmentsData, error: assignmentsError } = await supabase
                    .from('project_team_members')
                    .select(`
                        *,
                        team_member:team_members(*)
                    `)
                    .eq('estimate_id', estimateId);

                if (assignmentsError) throw assignmentsError;
                setAssignments(assignmentsData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        setCurrentAssignment({
            ...currentAssignment,
            tasks: [...currentAssignment.tasks, '']
        });
    };

    const handleUpdateTask = (index: number, value: string) => {
        const newTasks = [...currentAssignment.tasks];
        newTasks[index] = value;
        setCurrentAssignment({
            ...currentAssignment,
            tasks: newTasks
        });
    };

    const handleRemoveTask = (index: number) => {
        setCurrentAssignment({
            ...currentAssignment,
            tasks: currentAssignment.tasks.filter((_, i) => i !== index)
        });
    };

    const handleAddMilestone = () => {
        setCurrentAssignment({
            ...currentAssignment,
            milestones: [
                ...currentAssignment.milestones,
                { name: '', description: '', amount: 0, due_date: '' }
            ]
        });
    };

    const handleUpdateMilestone = (index: number, field: keyof Milestone, value: any) => {
        const newMilestones = [...currentAssignment.milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setCurrentAssignment({
            ...currentAssignment,
            milestones: newMilestones
        });
    };

    const handleRemoveMilestone = (index: number) => {
        setCurrentAssignment({
            ...currentAssignment,
            milestones: currentAssignment.milestones.filter((_, i) => i !== index)
        });
    };

    const handleAddAssignment = () => {
        if (!currentAssignment.team_member_id || currentAssignment.tasks.filter(t => t.trim()).length === 0) {
            alert('Please select a team member and add at least one task');
            return;
        }

        if (currentAssignment.pay_type === 'milestone' && currentAssignment.milestones.length === 0) {
            alert('Please add at least one milestone for milestone-based payment');
            return;
        }

        const member = teamMembers.find(m => m.id === currentAssignment.team_member_id);
        setAssignments([
            ...assignments,
            { 
                ...currentAssignment, 
                team_member: member,
                tasks: currentAssignment.tasks.filter(t => t.trim())
            }
        ]);

        // Reset form
        setCurrentAssignment({
            team_member_id: '',
            tasks: [''],
            pay_amount: 0,
            pay_type: 'fixed',
            milestones: [],
            status: 'invited'
        });
        setShowAddTeam(false);
    };

    const handleRemoveAssignment = (index: number) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const calculateTotalLabor = () => {
        return assignments.reduce((total, assignment) => {
            if (assignment.pay_type === 'milestone') {
                return total + assignment.milestones.reduce((sum, m) => sum + m.amount, 0);
            }
            return total + assignment.pay_amount;
        }, 0);
    };

    const calculateSubtotal = () => {
        return materialsCost + equipmentCost + permitsCost + calculateTotalLabor();
    };

    const calculateContingencyAmount = () => {
        return (calculateSubtotal() * contingency) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateContingencyAmount();
    };

    const handleSaveEstimate = async () => {
        if (!userProfile?.business_id || !title.trim()) {
            alert('Please provide an estimate title');
            return;
        }

        if (assignments.length === 0) {
            alert('Please add at least one team member to the project');
            return;
        }

        setSaving(true);
        try {
            let currentEstimateId = estimateId;

            // Create or update estimate
            if (!currentEstimateId) {
                const { data: estimateData, error: estimateError } = await supabase
                    .from('estimates')
                    .insert({
                        business_id: userProfile.business_id,
                        project_id: projectId,
                        estimate_number: `EST-${Date.now()}`,
                        title,
                        description,
                        total_amount: calculateTotal(),
                        status: 'draft'
                    })
                    .select()
                    .single();

                if (estimateError) throw estimateError;
                currentEstimateId = estimateData.id;
                setEstimateId(currentEstimateId);
            } else {
                const { error: updateError } = await supabase
                    .from('estimates')
                    .update({
                        title,
                        description,
                        total_amount: calculateTotal()
                    })
                    .eq('id', currentEstimateId);

                if (updateError) throw updateError;
            }

            // Save team assignments
            for (const assignment of assignments) {
                if (assignment.id) {
                    // Update existing
                    const { error } = await supabase
                        .from('project_team_members')
                        .update({
                            tasks: assignment.tasks,
                            pay_amount: assignment.pay_amount,
                            pay_type: assignment.pay_type,
                            estimated_hours: assignment.estimated_hours,
                            milestones: assignment.milestones
                        })
                        .eq('id', assignment.id);

                    if (error) throw error;
                } else {
                    // Create new
                    const { error } = await supabase
                        .from('project_team_members')
                        .insert({
                            project_id: projectId,
                            estimate_id: currentEstimateId,
                            team_member_id: assignment.team_member_id,
                            tasks: assignment.tasks,
                            pay_amount: assignment.pay_amount,
                            pay_type: assignment.pay_type,
                            estimated_hours: assignment.estimated_hours,
                            milestones: assignment.milestones,
                            status: 'invited'
                        });

                    if (error) throw error;
                }
            }

            alert('Estimate saved! Team members will be notified to review and accept their assignments.');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error saving estimate:', error);
            alert('Failed to save estimate');
        } finally {
            setSaving(false);
        }
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
                <h2 className="text-2xl font-bold mb-2">Collaborative Estimate Builder</h2>
                <p className="text-blue-100">
                    Build your estimate with full transparency - invite team members, assign tasks, 
                    and show everyone exactly what they'll do and earn
                </p>
            </div>

            {/* Project Photos */}
            <ProjectPhotosCapture 
                projectId={projectId} 
                estimateId={estimateId}
            />

            {/* Estimate Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimate Details</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimate Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Kitchen Renovation - Complete Remodel"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Detailed description of the project scope..."
                        />
                    </div>
                </div>
            </div>

            {/* Team Assignments */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Team Members & Tasks</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Assign team members with their specific tasks and compensation
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddTeam(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <span className="material-icons text-sm mr-2">person_add</span>
                        Add Team Member
                    </button>
                </div>

                {assignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <span className="material-icons text-6xl mb-2 opacity-30">group_add</span>
                        <p>No team members assigned yet</p>
                        <p className="text-sm mt-1">Add team members to show transparency to your client</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((assignment, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="material-icons text-blue-600">person</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {assignment.team_member?.first_name} {assignment.team_member?.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">{assignment.team_member?.role}</p>
                                            {assignment.team_member?.specialties && assignment.team_member.specialties.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {assignment.team_member.specialties.slice(0, 3).map((specialty, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                                            {specialty}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAssignment(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                </div>

                                <div className="ml-13 space-y-3">
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Tasks:</h5>
                                        <ul className="space-y-1">
                                            {assignment.tasks.map((task, taskIdx) => (
                                                <li key={taskIdx} className="flex items-start text-sm text-gray-600">
                                                    <span className="material-icons text-xs mr-2 mt-0.5">check_circle</span>
                                                    {task}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-sm text-gray-400">payments</span>
                                            <span className="font-semibold text-gray-900">
                                                ${assignment.pay_amount.toLocaleString()}
                                            </span>
                                            <span className="text-gray-600">
                                                ({assignment.pay_type === 'hourly' ? 'Hourly' : assignment.pay_type === 'milestone' ? 'Milestone-based' : 'Fixed'})
                                            </span>
                                        </div>
                                        {assignment.estimated_hours && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-sm text-gray-400">schedule</span>
                                                <span className="text-gray-600">{assignment.estimated_hours} hours</span>
                                            </div>
                                        )}
                                    </div>

                                    {assignment.milestones.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h5>
                                            <div className="space-y-2">
                                                {assignment.milestones.map((milestone, milestoneIdx) => (
                                                    <div key={milestoneIdx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{milestone.name}</p>
                                                            <p className="text-xs text-gray-600">{milestone.description}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</p>
                                                            <p className="text-xs text-gray-600">{new Date(milestone.due_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full ${
                                            assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            assignment.status === 'declined' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {assignment.status === 'invited' ? 'Pending Acceptance' : assignment.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Materials & Other Costs */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Costs</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Materials Cost
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={materialsCost}
                                onChange={(e) => setMaterialsCost(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Equipment/Tools
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={equipmentCost}
                                onChange={(e) => setEquipmentCost(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Permits & Fees
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={permitsCost}
                                onChange={(e) => setPermitsCost(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contingency (%)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={contingency}
                            onChange={(e) => setContingency(parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12">{contingency}%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                        Recommended 10-15% for unexpected costs
                    </p>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Labor (Team Members)</span>
                        <span className="font-medium text-gray-900">${calculateTotalLabor().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Materials</span>
                        <span className="font-medium text-gray-900">${materialsCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Equipment</span>
                        <span className="font-medium text-gray-900">${equipmentCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Permits & Fees</span>
                        <span className="font-medium text-gray-900">${permitsCost.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">${calculateSubtotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Contingency ({contingency}%)</span>
                        <span className="font-medium text-gray-900">${calculateContingencyAmount().toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 pt-3 flex justify-between">
                        <span className="text-lg font-bold text-gray-900">Total Estimate</span>
                        <span className="text-lg font-bold text-blue-600">${calculateTotal().toLocaleString()}</span>
                    </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="material-icons text-green-600 mr-2">verified</span>
                        <div className="text-sm text-green-900">
                            <p className="font-medium mb-1">Full Transparency Guarantee</p>
                            <p className="text-green-700">
                                Your client will see exactly who's working on their project, what they'll do, 
                                and what everyone gets paid. This builds trust and ensures everyone's on the same page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleSaveEstimate}
                    disabled={saving || assignments.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <span className="material-icons text-sm mr-2">send</span>
                            Send to Team & Client
                        </>
                    )}
                </button>
            </div>

            {/* Add Team Member Modal */}
            {showAddTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add Team Member to Project</h2>
                                <button
                                    onClick={() => {
                                        setShowAddTeam(false);
                                        setCurrentAssignment({
                                            team_member_id: '',
                                            tasks: [''],
                                            pay_amount: 0,
                                            pay_type: 'fixed',
                                            milestones: [],
                                            status: 'invited'
                                        });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Select Team Member */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Team Member *
                                    </label>
                                    <select
                                        value={currentAssignment.team_member_id}
                                        onChange={(e) => setCurrentAssignment({ ...currentAssignment, team_member_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Choose a team member...</option>
                                        {teamMembers.filter(m => !assignments.find(a => a.team_member_id === m.id)).map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.first_name} {member.last_name} - {member.role}
                                                {member.specialties.length > 0 && ` (${member.specialties.join(', ')})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tasks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tasks & Responsibilities *
                                    </label>
                                    {currentAssignment.tasks.map((task, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={task}
                                                onChange={(e) => handleUpdateTask(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Install kitchen cabinets"
                                            />
                                            {currentAssignment.tasks.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveTask(index)}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddTask}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <span className="material-icons text-sm mr-1">add</span>
                                        Add Task
                                    </button>
                                </div>

                                {/* Payment Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Type *
                                    </label>
                                    <select
                                        value={currentAssignment.pay_type}
                                        onChange={(e) => setCurrentAssignment({ ...currentAssignment, pay_type: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="milestone">Milestone-Based</option>
                                    </select>
                                </div>

                                {/* Payment Amount */}
                                {currentAssignment.pay_type !== 'milestone' && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {currentAssignment.pay_type === 'hourly' ? 'Hourly Rate' : 'Total Pay'} *
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={currentAssignment.pay_amount}
                                                    onChange={(e) => setCurrentAssignment({ ...currentAssignment, pay_amount: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        {currentAssignment.pay_type === 'hourly' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Hours
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={currentAssignment.estimated_hours || ''}
                                                    onChange={(e) => setCurrentAssignment({ ...currentAssignment, estimated_hours: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Milestones */}
                                {currentAssignment.pay_type === 'milestone' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Milestones *
                                        </label>
                                        {currentAssignment.milestones.map((milestone, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-sm font-medium text-gray-700">Milestone {index + 1}</span>
                                                    <button
                                                        onClick={() => handleRemoveMilestone(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <span className="material-icons text-sm">delete</span>
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={milestone.name}
                                                        onChange={(e) => handleUpdateMilestone(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Milestone name"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={milestone.description}
                                                        onChange={(e) => handleUpdateMilestone(index, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Description"
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">Amount</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={milestone.amount}
                                                                    onChange={(e) => handleUpdateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">Due Date</label>
                                                            <input
                                                                type="date"
                                                                value={milestone.due_date}
                                                                onChange={(e) => handleUpdateMilestone(index, 'due_date', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={handleAddMilestone}
                                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            <span className="material-icons text-sm mr-1">add</span>
                                            Add Milestone
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowAddTeam(false);
                                            setCurrentAssignment({
                                                team_member_id: '',
                                                tasks: [''],
                                                pay_amount: 0,
                                                pay_type: 'fixed',
                                                milestones: [],
                                                status: 'invited'
                                            });
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddAssignment}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add to Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

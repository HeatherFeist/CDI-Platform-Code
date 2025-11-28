import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    hourly_rate: number | null;
    specialties: string[];
}

interface ProjectTeamMember {
    id: string;
    team_member_id: string;
    pay_amount: number;
    pay_type: 'fixed' | 'hourly' | 'milestone';
    estimated_hours?: number;
    tasks: string[];
    team_member: TeamMember;
}

interface TaskAssignment {
    taskId: string;
    taskName: string;
    taskDescription: string;
    totalCost: number;
    assignedMembers: string[]; // project_team_member IDs
    costPerMember: number;
}

interface MultiMemberTaskAssignmentProps {
    projectId: string;
    estimateId?: string;
    onAssignmentComplete: (assignments: TaskAssignment[]) => void;
    onCancel: () => void;
}

export const MultiMemberTaskAssignment: React.FC<MultiMemberTaskAssignmentProps> = ({
    projectId,
    estimateId,
    onAssignmentComplete,
    onCancel
}) => {
    const { userProfile } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [projectTeamMembers, setProjectTeamMembers] = useState<ProjectTeamMember[]>([]);
    const [tasks, setTasks] = useState<TaskAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state for new task
    const [newTask, setNewTask] = useState({
        name: '',
        description: '',
        totalCost: 0
    });

    useEffect(() => {
        loadTeamMembers();
        loadProjectTeamMembers();
        loadExistingTasks();
    }, [projectId]);

    const loadTeamMembers = async () => {
        if (!userProfile?.business_id) return;

        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .eq('is_active', true);

            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error) {
            console.error('Error loading team members:', error);
        }
    };

    const loadProjectTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('project_team_members')
                .select(`
                    *,
                    team_member:team_members(*)
                `)
                .eq('project_id', projectId);

            if (error) throw error;
            setProjectTeamMembers(data || []);
        } catch (error) {
            console.error('Error loading project team members:', error);
        }
    };

    const loadExistingTasks = async () => {
        try {
            // Load project milestones which act as tasks
            const { data, error } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('display_order');

            if (error) throw error;

            const taskAssignments: TaskAssignment[] = (data || []).map(milestone => ({
                taskId: milestone.id,
                taskName: milestone.name,
                taskDescription: milestone.description || '',
                totalCost: parseFloat(milestone.amount.toString()),
                assignedMembers: milestone.assigned_to || [],
                costPerMember: milestone.assigned_to?.length > 0 
                    ? parseFloat(milestone.amount.toString()) / milestone.assigned_to.length 
                    : 0
            }));

            setTasks(taskAssignments);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const addNewTask = () => {
        if (!newTask.name || !newTask.totalCost) return;

        const taskAssignment: TaskAssignment = {
            taskId: `temp-${Date.now()}`, // Temporary ID for new tasks
            taskName: newTask.name,
            taskDescription: newTask.description,
            totalCost: newTask.totalCost,
            assignedMembers: [],
            costPerMember: 0
        };

        setTasks(prev => [...prev, taskAssignment]);
        setNewTask({ name: '', description: '', totalCost: 0 });
    };

    const updateTaskAssignment = (taskId: string, assignedMembers: string[]) => {
        setTasks(prev => prev.map(task => {
            if (task.taskId === taskId) {
                const costPerMember = assignedMembers.length > 0 ? task.totalCost / assignedMembers.length : 0;
                return {
                    ...task,
                    assignedMembers,
                    costPerMember
                };
            }
            return task;
        }));
    };

    const toggleMemberAssignment = (taskId: string, memberId: string) => {
        const task = tasks.find(t => t.taskId === taskId);
        if (!task) return;

        const isAssigned = task.assignedMembers.includes(memberId);
        const newAssignedMembers = isAssigned
            ? task.assignedMembers.filter(id => id !== memberId)
            : [...task.assignedMembers, memberId];

        updateTaskAssignment(taskId, newAssignedMembers);
    };

    const removeTask = (taskId: string) => {
        setTasks(prev => prev.filter(task => task.taskId !== taskId));
    };

    const saveAssignments = async () => {
        setSaving(true);
        try {
            // Save all task assignments to project_milestones
            for (const task of tasks) {
                if (task.taskId.startsWith('temp-')) {
                    // Create new milestone
                    const { error } = await supabase
                        .from('project_milestones')
                        .insert({
                            project_id: projectId,
                            name: task.taskName,
                            description: task.taskDescription,
                            amount: task.totalCost,
                            assigned_to: task.assignedMembers
                        });

                    if (error) throw error;
                } else {
                    // Update existing milestone
                    const { error } = await supabase
                        .from('project_milestones')
                        .update({
                            assigned_to: task.assignedMembers,
                            amount: task.totalCost
                        })
                        .eq('id', task.taskId);

                    if (error) throw error;
                }
            }

            onAssignmentComplete(tasks);
        } catch (error) {
            console.error('Error saving assignments:', error);
            alert('Failed to save task assignments. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getTeamMemberName = (memberId: string) => {
        const projectMember = projectTeamMembers.find(pm => pm.id === memberId);
        if (projectMember?.team_member) {
            return `${projectMember.team_member.first_name} ${projectMember.team_member.last_name}`;
        }
        return 'Unknown Member';
    };

    const getTeamMemberRate = (memberId: string) => {
        const projectMember = projectTeamMembers.find(pm => pm.id === memberId);
        return projectMember?.team_member.hourly_rate || 0;
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Task Assignment</h2>
                    <p className="text-gray-600">Assign multiple team members to tasks and automatically divide costs</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveAssignments}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </div>

            {/* Add New Task */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                        <input
                            type="text"
                            value={newTask.name}
                            onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Demo & Removal"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input
                            type="text"
                            value={newTask.description}
                            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Task details"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={newTask.totalCost || ''}
                                onChange={(e) => setNewTask(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={addNewTask}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Add Task
                        </button>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.taskId} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{task.taskName}</h3>
                                {task.taskDescription && (
                                    <p className="text-gray-600 mt-1">{task.taskDescription}</p>
                                )}
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    ${task.totalCost.toFixed(2)} total
                                </p>
                                {task.assignedMembers.length > 0 && (
                                    <p className="text-lg text-blue-600">
                                        ${task.costPerMember.toFixed(2)} per member
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => removeTask(task.taskId)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <span className="material-icons">delete</span>
                            </button>
                        </div>

                        {/* Team Member Selection */}
                        <div>
                            <h4 className="text-md font-medium text-gray-700 mb-3">
                                Assign Team Members ({task.assignedMembers.length} selected)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {projectTeamMembers.map((projectMember) => {
                                    const isAssigned = task.assignedMembers.includes(projectMember.id);
                                    return (
                                        <div
                                            key={projectMember.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                isAssigned
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onClick={() => toggleMemberAssignment(task.taskId, projectMember.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {projectMember.team_member.first_name} {projectMember.team_member.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {projectMember.team_member.role}
                                                    </p>
                                                    {projectMember.team_member.hourly_rate && (
                                                        <p className="text-sm text-green-600">
                                                            ${projectMember.team_member.hourly_rate}/hr
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                    isAssigned
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {isAssigned && (
                                                        <span className="text-white text-sm">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {task.assignedMembers.length === 0 && (
                                <p className="text-gray-500 text-sm mt-2">
                                    No team members assigned to this task
                                </p>
                            )}
                        </div>

                        {/* Cost Breakdown */}
                        {task.assignedMembers.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-700 mb-2">Cost Breakdown</h5>
                                <div className="space-y-1">
                                    {task.assignedMembers.map(memberId => (
                                        <div key={memberId} className="flex justify-between text-sm">
                                            <span>{getTeamMemberName(memberId)}</span>
                                            <span className="font-medium">${task.costPerMember.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span>${task.totalCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <span className="material-icons text-4xl mb-2 opacity-50">assignment</span>
                        <p>No tasks created yet</p>
                        <p className="text-sm">Add your first task above to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiMemberTaskAssignment;
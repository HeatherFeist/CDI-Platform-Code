import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface TaskAssignment {
    id: string;
    team_member_id: string;
    line_item_index: number;
    line_item_description: string;
    line_item_cost: number;
    assigned_cost: number;
    status: 'invited' | 'accepted' | 'declined' | 'completed';
    invited_at: string;
    responded_at?: string;
    team_member: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        role: string;
        avatar_url?: string;
    };
}

interface EstimateTaskAssignmentsProps {
    estimateId: string;
    editable?: boolean;
}

export const EstimateTaskAssignments: React.FC<EstimateTaskAssignmentsProps> = ({
    estimateId,
    editable = false
}) => {
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupedAssignments, setGroupedAssignments] = useState<Map<number, TaskAssignment[]>>(new Map());

    useEffect(() => {
        loadAssignments();
    }, [estimateId]);

    useEffect(() => {
        // Group assignments by line item
        const grouped = new Map<number, TaskAssignment[]>();
        assignments.forEach(assignment => {
            const existing = grouped.get(assignment.line_item_index) || [];
            existing.push(assignment);
            grouped.set(assignment.line_item_index, existing);
        });
        setGroupedAssignments(grouped);
    }, [assignments]);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('task_assignments')
                .select(`
                    *,
                    team_member:team_members (
                        first_name,
                        last_name,
                        email,
                        phone,
                        role,
                        avatar_url
                    )
                `)
                .eq('estimate_id', estimateId)
                .order('line_item_index', { ascending: true })
                .order('invited_at', { ascending: true });

            if (error) throw error;
            setAssignments(data || []);
        } catch (error) {
            console.error('Error loading task assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: TaskAssignment['status']) => {
        switch (status) {
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'declined':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'invited':
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        }
    };

    const getStatusIcon = (status: TaskAssignment['status']) => {
        switch (status) {
            case 'accepted':
                return 'check_circle';
            case 'declined':
                return 'cancel';
            case 'completed':
                return 'task_alt';
            case 'invited':
            default:
                return 'schedule';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="text-center p-4 text-gray-500 text-sm">
                No team members assigned to this estimate yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-icons text-blue-600">group</span>
                Team Assignments
            </h4>

            {Array.from(groupedAssignments.entries()).map(([lineItemIndex, lineAssignments]) => (
                <div key={lineItemIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-3">
                        <h5 className="font-medium text-gray-900">
                            {lineAssignments[0].line_item_description}
                        </h5>
                        <p className="text-sm text-gray-600">
                            Total Cost: ${lineAssignments[0].line_item_cost.toFixed(2)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        {lineAssignments.map(assignment => (
                            <div
                                key={assignment.id}
                                className="bg-white rounded-lg border p-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                        {assignment.team_member.first_name[0]}
                                        {assignment.team_member.last_name[0]}
                                    </div>

                                    {/* Member Info */}
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {assignment.team_member.first_name} {assignment.team_member.last_name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {assignment.team_member.role}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Assigned: ${assignment.assigned_cost?.toFixed(2) || '0.00'}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                                        <span className="material-icons text-sm">
                                            {getStatusIcon(assignment.status)}
                                        </span>
                                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                    </div>

                                    {/* Contact Info */}
                                    <div className="flex gap-2">
                                        {assignment.team_member.phone && (
                                            <span
                                                className="material-icons text-sm text-gray-400"
                                                title={`Phone: ${assignment.team_member.phone}`}
                                            >
                                                phone
                                            </span>
                                        )}
                                        {assignment.team_member.email && (
                                            <span
                                                className="material-icons text-sm text-gray-400"
                                                title={`Email: ${assignment.team_member.email}`}
                                            >
                                                email
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Response Time */}
                                {assignment.responded_at && (
                                    <div className="text-xs text-gray-500 ml-3">
                                        Responded: {new Date(assignment.responded_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                {lineAssignments.length} member{lineAssignments.length > 1 ? 's' : ''} assigned
                            </span>
                            <span className="text-gray-600">
                                {lineAssignments.filter(a => a.status === 'accepted').length} accepted • 
                                {lineAssignments.filter(a => a.status === 'declined').length} declined • 
                                {lineAssignments.filter(a => a.status === 'invited').length} pending
                            </span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Overall Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-900">
                            {assignments.length}
                        </div>
                        <div className="text-xs text-blue-700">Total Assignments</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-900">
                            {assignments.filter(a => a.status === 'accepted').length}
                        </div>
                        <div className="text-xs text-green-700">Accepted</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-900">
                            {assignments.filter(a => a.status === 'declined').length}
                        </div>
                        <div className="text-xs text-red-700">Declined</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {assignments.filter(a => a.status === 'invited').length}
                        </div>
                        <div className="text-xs text-yellow-700">Pending</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EstimateTaskAssignments;

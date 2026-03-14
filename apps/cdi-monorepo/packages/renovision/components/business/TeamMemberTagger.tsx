import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';
import { batchedInvitationService } from '../../services/batchedInvitationService';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    is_active: boolean;
}

interface TaggedMember {
    assignmentId: string;
    batchId?: string | null;
    id: string;
    name: string;
    status: 'invited' | 'accepted' | 'declined';
}

interface TeamMemberTaggerProps {
    lineItemDescription: string;
    lineItemCost?: number;
    estimateId: string;
    lineItemIndex: number;
    onMembersTagged: (members: TaggedMember[]) => void;
}

export const TeamMemberTagger: React.FC<TeamMemberTaggerProps> = ({
    lineItemDescription,
    lineItemCost,
    estimateId,
    lineItemIndex,
    onMembersTagged
}) => {
    const { userProfile } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
    const [taggedMembers, setTaggedMembers] = useState<TaggedMember[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile?.business_id) {
            loadTeamMembers();
        }
    }, [userProfile?.business_id]);

    useEffect(() => {
        loadTaggedMembers();
    }, [estimateId, lineItemIndex]);

    useEffect(() => {
        onMembersTagged(taggedMembers);
    }, [taggedMembers]);

    const loadTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .eq('is_active', true);

            if (error) throw error;
            setAvailableMembers(data || []);
        } catch (error) {
            console.error('Error loading team members:', error);
        }
    };

    const loadTaggedMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('task_assignments')
                .select(`
                    id,
                    status,
                    batch_invitation_id,
                    team_member_id,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name
                    )
                `)
                .eq('estimate_id', estimateId)
                .eq('line_item_index', lineItemIndex)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const mappedMembers: TaggedMember[] = (data || []).map((assignment: any) => ({
                assignmentId: assignment.id,
                batchId: assignment.batch_invitation_id,
                id: assignment.team_member_id,
                name: `${assignment.team_member.first_name} ${assignment.team_member.last_name}`,
                status: assignment.status
            }));

            setTaggedMembers(mappedMembers);
        } catch (error) {
            console.error('Error loading tagged members:', error);
        }
    };

    const handleTagMember = async (member: TeamMember) => {
        try {
            const assignedCost = lineItemCost ? lineItemCost / (taggedMembers.length + 1) : 0;

            const { data: assignment, error: insertError } = await supabase
                .from('task_assignments')
                .insert({
                    estimate_id: estimateId,
                    line_item_index: lineItemIndex,
                    line_item_description: lineItemDescription,
                    line_item_cost: lineItemCost || 0,
                    team_member_id: member.id,
                    business_id: userProfile?.business_id,
                    assigned_cost: assignedCost,
                    status: 'invited',
                    responded_at: null,
                    completed_at: null
                })
                .select('id')
                .single();

            if (insertError) throw insertError;

            const batchResult = await batchedInvitationService.createOrUpdateBatch(
                userProfile?.business_id!,
                member.id
            );

            if (!batchResult.success || !batchResult.batchId) {
                throw new Error(batchResult.error || 'Failed to create invitation batch');
            }

            const { error: linkError } = await supabase
                .from('task_assignments')
                .update({ batch_invitation_id: batchResult.batchId })
                .eq('id', assignment.id);

            if (linkError) throw linkError;

            const newMember: TaggedMember = {
                assignmentId: assignment.id,
                batchId: batchResult.batchId,
                id: member.id,
                name: `${member.first_name} ${member.last_name}`,
                status: 'invited'
            };

            setTaggedMembers([...taggedMembers, newMember]);
            setSearchTerm('');
            setShowDropdown(false);
        } catch (error) {
            console.error('Error tagging member:', error);
        }
    };

    const handleRemoveTag = (id: string) => {
        const tagToRemove = taggedMembers.find((member) => member.id === id);
        if (!tagToRemove) return;

        void (async () => {
            try {
                const { error } = await supabase
                    .from('task_assignments')
                    .delete()
                    .eq('id', tagToRemove.assignmentId);

                if (error) throw error;

                if (tagToRemove.batchId) {
                    const remainingAssignments = taggedMembers.filter(
                        (member) => member.batchId === tagToRemove.batchId && member.assignmentId !== tagToRemove.assignmentId
                    );

                    const remainingIds = remainingAssignments.map((member) => member.assignmentId);
                    let totalAmount = 0;

                    if (remainingIds.length > 0) {
                        const { data: totalsData, error: totalsError } = await supabase
                            .from('task_assignments')
                            .select('assigned_cost')
                            .in('id', remainingIds);

                        if (totalsError) throw totalsError;
                        totalAmount = (totalsData || []).reduce(
                            (sum, assignment: any) => sum + Number(assignment.assigned_cost || 0),
                            0
                        );
                    }

                    const { error: batchError } = await supabase
                        .from('batched_invitations')
                        .update({
                            total_tasks: remainingIds.length,
                            total_amount: totalAmount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', tagToRemove.batchId);

                    if (batchError) throw batchError;
                }

                setTaggedMembers(taggedMembers.filter((member) => member.id !== id));
            } catch (removeError) {
                console.error('Error removing tagged member:', removeError);
            }
        })();
    };

    const filteredMembers = availableMembers.filter(member => {
        const name = `${member.first_name} ${member.last_name}`.toLowerCase();
        const alreadyTagged = taggedMembers.some(t => t.id === member.id);
        return name.includes(searchTerm.toLowerCase()) && !alreadyTagged;
    });

    return (
        <div className="space-y-3">
            {lineItemCost && taggedMembers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">Cost Division:</span>
                        <div className="text-right">
                            <div className="text-sm text-blue-700">
                                ${lineItemCost.toFixed(2)} ÷ {taggedMembers.length} = ${(lineItemCost / taggedMembers.length).toFixed(2)} each
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {taggedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {taggedMembers.map((member) => (
                        <div
                            key={member.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                            <span>{member.name}</span>
                            <button
                                onClick={() => handleRemoveTag(member.id)}
                                className="ml-2 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Click here or type to search team members..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {showDropdown && availableMembers.length > 0 && filteredMembers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredMembers.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => handleTagMember(member)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                    {member.first_name[0]}{member.last_name[0]}
                                </div>
                                <div>
                                    <div className="font-medium">{member.first_name} {member.last_name}</div>
                                    <div className="text-sm text-gray-500">{member.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                
                {showDropdown && availableMembers.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center">
                        <span className="material-icons text-gray-400 text-3xl mb-2">group_off</span>
                        <p className="text-sm text-gray-600">No team members found.</p>
                        <p className="text-xs text-gray-500 mt-1">Add team members in the Team Members section first.</p>
                    </div>
                )}
                
                {showDropdown && availableMembers.length > 0 && filteredMembers.length === 0 && searchTerm && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center">
                        <p className="text-sm text-gray-600">No members match "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamMemberTagger;

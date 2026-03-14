import { supabase } from '../supabase';

export interface BatchedInvitationAssignment {
    assignment_id: string;
    estimate_id: string;
    line_item_index: number;
    line_item_description: string;
    assigned_cost: number;
    status: string;
}

export interface BatchedInvitation {
    batch_id: string;
    business_id: string;
    team_member_id: string;
    team_member_name: string;
    team_member_email: string;
    team_member_phone: string | null;
    team_member_profile_id: string | null;
    invitation_token: string;
    invitation_status: 'pending' | 'sent' | 'accepted' | 'declined' | 'partial';
    total_assignments: number;
    total_cost: number;
    sent_at: string | null;
    responded_at: string | null;
    expires_at: string;
    created_at: string;
    assignments: BatchedInvitationAssignment[];
}

interface BatchedInvitationRow {
    id: string;
    business_id: string;
    team_member_id: string;
    invitation_token: string;
    status: BatchedInvitation['invitation_status'];
    total_tasks: number;
    total_amount: number;
    sent_at: string | null;
    responded_at: string | null;
    expires_at: string;
    created_at: string;
    team_member: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        profile_id?: string | null;
    } | null;
    task_assignments: Array<{
        id: string;
        estimate_id: string;
        line_item_index: number;
        line_item_description: string;
        assigned_cost: number | null;
        status: string;
    }> | null;
}

class BatchedInvitationService {
    async createOrUpdateBatch(
        businessId: string,
        teamMemberId: string
    ): Promise<{ success: boolean; batchId?: string; error?: string }> {
        try {
            const { data: existing, error: existingError } = await supabase
                .from('batched_invitations')
                .select('id')
                .eq('business_id', businessId)
                .eq('team_member_id', teamMemberId)
                .maybeSingle();

            if (existingError) throw existingError;

            let batchId = existing?.id;

            if (!batchId) {
                const token = this.generateToken();
                const { data: created, error: createError } = await supabase
                    .from('batched_invitations')
                    .insert({
                        business_id: businessId,
                        team_member_id: teamMemberId,
                        invitation_token: token,
                        status: 'pending'
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;
                batchId = created.id;
            } else {
                const { error: resetError } = await supabase
                    .from('batched_invitations')
                    .update({
                        status: 'pending',
                        responded_at: null,
                        sent_at: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', batchId);

                if (resetError) throw resetError;
            }

            const { data: assignments, error: assignmentsError } = await supabase
                .from('task_assignments')
                .select('id, assigned_cost')
                .eq('business_id', businessId)
                .eq('team_member_id', teamMemberId)
                .eq('status', 'invited');

            if (assignmentsError) throw assignmentsError;

            const assignmentIds = (assignments || []).map((assignment) => assignment.id);
            const totalCost = (assignments || []).reduce(
                (sum, assignment) => sum + Number(assignment.assigned_cost || 0),
                0
            );

            if (assignmentIds.length > 0) {
                const { error: linkError } = await supabase
                    .from('task_assignments')
                    .update({ batch_invitation_id: batchId })
                    .in('id', assignmentIds);

                if (linkError) throw linkError;
            }

            const { error: totalsError } = await supabase
                .from('batched_invitations')
                .update({
                    total_tasks: assignmentIds.length,
                    total_amount: totalCost,
                    updated_at: new Date().toISOString()
                })
                .eq('id', batchId);

            if (totalsError) throw totalsError;

            return { success: true, batchId };
        } catch (error: any) {
            console.error('Error creating batched invitation:', error);
            return { success: false, error: error.message };
        }
    }

    async getPendingBatches(businessId: string): Promise<BatchedInvitation[]> {
        try {
            const { data, error } = await supabase
                .from('batched_invitations')
                .select(`
                    id,
                    business_id,
                    invitation_token,
                    team_member_id,
                    status,
                    total_tasks,
                    total_amount,
                    sent_at,
                    responded_at,
                    expires_at,
                    created_at,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        email,
                        phone,
                        profile_id
                    ),
                    task_assignments (
                        id,
                        estimate_id,
                        line_item_index,
                        line_item_description,
                        assigned_cost,
                        status
                    )
                `)
                .eq('business_id', businessId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map((row) => this.mapBatchRow(row as unknown as BatchedInvitationRow));
        } catch (error) {
            console.error('Error getting pending batches:', error);
            return [];
        }
    }

    async sendBatchedInvitation(batchId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const batch = await this.getBatchDetails(batchId);
            if (!batch) {
                throw new Error('Invitation batch not found.');
            }

            const invitationUrl = `${window.location.origin}/invitation/${batch.invitation_token}`;

            const { error: updateError } = await supabase
                .from('batched_invitations')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', batchId);

            if (updateError) throw updateError;

            if (batch.team_member_profile_id) {
                await supabase.from('notifications').insert({
                    recipient_id: batch.team_member_profile_id,
                    type: 'task_invitation',
                    title: `New mini estimate from your contractor`,
                    message: `You have ${batch.total_assignments} assigned item${batch.total_assignments === 1 ? '' : 's'} totaling $${batch.total_cost.toFixed(2)}.`,
                    data: {
                        batch_id: batch.batch_id,
                        invitation_url: invitationUrl,
                        total_assignments: batch.total_assignments,
                        total_cost: batch.total_cost
                    },
                    read: false
                });
            }

            if (batch.team_member_phone) {
                try {
                    await supabase.functions.invoke('send-sms-notification', {
                        body: {
                            to: batch.team_member_phone,
                            message: `You have a new Renovision mini estimate for $${batch.total_cost.toFixed(2)}. Review and respond: ${invitationUrl}`
                        }
                    });
                } catch (smsError) {
                    console.error('Error sending invitation SMS:', smsError);
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error sending batched invitation:', error);
            return { success: false, error: error.message };
        }
    }

    async sendAllPendingBatches(businessId: string): Promise<{
        success: boolean;
        sent: number;
        failed: number;
        errors: string[];
    }> {
        const pendingBatches = await this.getPendingBatches(businessId);
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const batch of pendingBatches) {
            const result = await this.sendBatchedInvitation(batch.batch_id);
            if (result.success) {
                sent++;
            } else {
                failed++;
                errors.push(`${batch.team_member_name}: ${result.error}`);
            }
        }

        return {
            success: failed === 0,
            sent,
            failed,
            errors
        };
    }

    async getBatchDetails(batchId: string): Promise<BatchedInvitation | null> {
        try {
            const { data, error } = await supabase
                .from('batched_invitations')
                .select(`
                    id,
                    business_id,
                    invitation_token,
                    team_member_id,
                    status,
                    total_tasks,
                    total_amount,
                    sent_at,
                    responded_at,
                    expires_at,
                    created_at,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        email,
                        phone,
                        profile_id
                    ),
                    task_assignments (
                        id,
                        estimate_id,
                        line_item_index,
                        line_item_description,
                        assigned_cost,
                        status
                    )
                `)
                .eq('id', batchId)
                .single();

            if (error) throw error;
            return this.mapBatchRow(data as unknown as BatchedInvitationRow);
        } catch (error) {
            console.error('Error getting batch details:', error);
            return null;
        }
    }

    formatBatchSummary(batch: BatchedInvitation): string {
        return `${batch.team_member_name}: ${batch.total_assignments} tasks, $${batch.total_cost.toFixed(2)} total`;
    }

    private mapBatchRow(row: BatchedInvitationRow): BatchedInvitation {
        const teamMemberName = row.team_member
            ? `${row.team_member.first_name} ${row.team_member.last_name}`.trim()
            : 'Unknown team member';

        return {
            batch_id: row.id,
            business_id: row.business_id,
            team_member_id: row.team_member_id,
            team_member_name: teamMemberName,
            team_member_email: row.team_member?.email || '',
            team_member_phone: row.team_member?.phone || null,
            team_member_profile_id: row.team_member?.profile_id || null,
            invitation_token: row.invitation_token,
            invitation_status: row.status,
            total_assignments: row.total_tasks || 0,
            total_cost: Number(row.total_amount || 0),
            sent_at: row.sent_at,
            responded_at: row.responded_at,
            expires_at: row.expires_at,
            created_at: row.created_at,
            assignments: (row.task_assignments || []).map((assignment) => ({
                assignment_id: assignment.id,
                estimate_id: assignment.estimate_id,
                line_item_index: assignment.line_item_index,
                line_item_description: assignment.line_item_description,
                assigned_cost: Number(assignment.assigned_cost || 0),
                status: assignment.status
            }))
        };
    }

    private generateToken(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
}

export const batchedInvitationService = new BatchedInvitationService();
export default batchedInvitationService;

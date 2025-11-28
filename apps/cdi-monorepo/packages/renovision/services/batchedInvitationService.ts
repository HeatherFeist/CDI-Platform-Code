import { supabase } from '../supabase';

export interface BatchedInvitation {
    batch_id: string;
    business_id: string;
    team_member_id: string;
    team_member_name: string;
    team_member_email: string;
    team_member_phone: string | null;
    invitation_status: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
    total_assignments: number;
    total_cost: number;
    sent_at: string | null;
    responded_at: string | null;
    expires_at: string;
    created_at: string;
    assignments: Array<{
        assignment_id: string;
        estimate_id: string;
        line_item_index: number;
        line_item_description: string;
        assigned_cost: number;
        status: string;
        estimate_start_date?: string;
        estimate_end_date?: string;
    }>;
}

class BatchedInvitationService {
    /**
     * Create or update a batched invitation for a team member
     * This groups all pending task assignments together
     */
    async createOrUpdateBatch(
        businessId: string,
        teamMemberId: string
    ): Promise<{ success: boolean; batchId?: string; error?: string }> {
        try {
            const { data, error } = await supabase.rpc('upsert_batched_invitation', {
                p_business_id: businessId,
                p_team_member_id: teamMemberId
            });

            if (error) throw error;

            return { success: true, batchId: data };
        } catch (error: any) {
            console.error('Error creating batched invitation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send batched invitation to team member
     * This should be called AFTER all tasks have been tagged
     */
    async sendBatchedInvitation(
        batchId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Mark batch as sent
            const { error: sendError } = await supabase.rpc('send_batched_invitation', {
                p_batch_id: batchId
            });

            if (sendError) throw sendError;

            // Get batch details for sending notifications
            const batchDetails = await this.getBatchDetails(batchId);
            if (!batchDetails) {
                throw new Error('Batch not found');
            }

            // Send combined notification (email, SMS, in-app)
            await this.sendCombinedNotification(batchDetails);

            return { success: true };
        } catch (error: any) {
            console.error('Error sending batched invitation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send combined notification with all assignments
     */
    private async sendCombinedNotification(batch: BatchedInvitation): Promise<void> {
        // Build message listing all projects
        const projectsList = batch.assignments.map((assignment, index) => 
            `${index + 1}. ${assignment.line_item_description} - $${assignment.assigned_cost.toFixed(2)}`
        ).join('\n');

        const message = `Hi ${batch.team_member_name}!\n\nYou've been assigned to ${batch.total_assignments} tasks:\n\n${projectsList}\n\nTotal: $${batch.total_cost.toFixed(2)}\n\nPlease review and respond:`;

        // Accept/Decline URLs
        const acceptUrl = `${window.location.origin}/accept-batch/${batch.batch_id}`;
        const declineUrl = `${window.location.origin}/decline-batch/${batch.batch_id}`;

        // Send email
        await supabase.functions.invoke('send-batched-invitation-email', {
            body: {
                to: batch.team_member_email,
                teamMemberName: batch.team_member_name,
                totalAssignments: batch.total_assignments,
                totalCost: batch.total_cost,
                assignments: batch.assignments,
                acceptUrl,
                declineUrl,
                expiresAt: batch.expires_at
            }
        });

        // Send SMS if phone available
        if (batch.team_member_phone) {
            const smsMessage = `${message}\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}`;
            
            await supabase.functions.invoke('send-sms-notification', {
                body: {
                    to: batch.team_member_phone,
                    message: smsMessage
                }
            });
        }

        // Send in-app notification
        await supabase.from('notifications').insert({
            recipient_id: batch.team_member_id,
            type: 'batched_task_invitation',
            title: `You have ${batch.total_assignments} new task assignments`,
            message: message,
            data: {
                batch_id: batch.batch_id,
                total_assignments: batch.total_assignments,
                total_cost: batch.total_cost,
                accept_url: acceptUrl,
                decline_url: declineUrl
            },
            read: false
        });
    }

    /**
     * Get batch details with all assignments
     */
    async getBatchDetails(batchId: string): Promise<BatchedInvitation | null> {
        try {
            const { data, error } = await supabase
                .from('batched_invitation_details')
                .select('*')
                .eq('batch_id', batchId)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error getting batch details:', error);
            return null;
        }
    }

    /**
     * Get all pending batches for a business (ready to send)
     */
    async getPendingBatches(businessId: string): Promise<BatchedInvitation[]> {
        try {
            const { data, error } = await supabase
                .from('batched_invitation_details')
                .select('*')
                .eq('business_id', businessId)
                .eq('invitation_status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting pending batches:', error);
            return [];
        }
    }

    /**
     * Get batches for a specific team member
     */
    async getMemberBatches(
        teamMemberId: string,
        status?: 'pending' | 'sent' | 'accepted' | 'declined'
    ): Promise<BatchedInvitation[]> {
        try {
            let query = supabase
                .from('batched_invitation_details')
                .select('*')
                .eq('team_member_id', teamMemberId);

            if (status) {
                query = query.eq('invitation_status', status);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting member batches:', error);
            return [];
        }
    }

    /**
     * Accept all tasks in a batch
     */
    async acceptBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase.rpc('accept_batched_invitation', {
                p_batch_id: batchId
            });

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error accepting batch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decline all tasks in a batch
     */
    async declineBatch(
        batchId: string,
        reason?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase.rpc('decline_batched_invitation', {
                p_batch_id: batchId,
                p_reason: reason || null
            });

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error declining batch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send all pending batches for a business
     * This should be called when contractor is ready to send all invites
     */
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

    /**
     * Format batch for display
     */
    formatBatchSummary(batch: BatchedInvitation): string {
        return `${batch.team_member_name}: ${batch.total_assignments} tasks, $${batch.total_cost.toFixed(2)} total`;
    }

    /**
     * Check if batch is expired
     */
    isBatchExpired(batch: BatchedInvitation): boolean {
        return new Date(batch.expires_at) < new Date();
    }

    /**
     * Get batch status color for UI
     */
    getStatusColor(status: BatchedInvitation['invitation_status']): string {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            sent: 'bg-blue-100 text-blue-800 border-blue-300',
            accepted: 'bg-green-100 text-green-800 border-green-300',
            declined: 'bg-red-100 text-red-800 border-red-300',
            expired: 'bg-gray-100 text-gray-800 border-gray-300'
        };
        return colors[status];
    }

    /**
     * Get batch status icon
     */
    getStatusIcon(status: BatchedInvitation['invitation_status']): string {
        const icons = {
            pending: 'schedule',
            sent: 'send',
            accepted: 'check_circle',
            declined: 'cancel',
            expired: 'schedule'
        };
        return icons[status];
    }
}

export const batchedInvitationService = new BatchedInvitationService();
export default batchedInvitationService;

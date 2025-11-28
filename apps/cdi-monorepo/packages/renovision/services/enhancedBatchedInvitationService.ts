import { supabase } from '../supabase';

interface BatchedInvitation {
    id: string;
    business_id: string;
    team_member_id: string;
    invitation_token: string;
    total_tasks: number;
    total_amount: number;
    status: string;
}

class BatchedInvitationService {
    /**
     * Create or update a batched invitation for a team member
     */
    async createOrUpdateBatch(businessId: string, teamMemberId: string): Promise<BatchedInvitation> {
        try {
            // Check if batch already exists
            const { data: existing } = await supabase
                .from('batched_invitations')
                .select('*')
                .eq('business_id', businessId)
                .eq('team_member_id', teamMemberId)
                .single();

            if (existing) {
                // Update existing batch (totals will be auto-calculated by trigger)
                const { data, error } = await supabase
                    .from('batched_invitations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Create new batch with unique token
                const token = await this.generateToken();
                
                const { data, error } = await supabase
                    .from('batched_invitations')
                    .insert({
                        business_id: businessId,
                        team_member_id: teamMemberId,
                        invitation_token: token,
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error creating/updating batch:', error);
            throw error;
        }
    }

    /**
     * Link a task assignment to a batched invitation
     */
    async linkTaskToBatch(taskId: string, batchId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('task_assignments')
                .update({ batch_invitation_id: batchId })
                .eq('id', taskId);

            if (error) throw error;
        } catch (error) {
            console.error('Error linking task to batch:', error);
            throw error;
        }
    }

    /**
     * Send invitation via email
     */
    async sendInvitationEmail(batchId: string): Promise<void> {
        try {
            // Get batch details with team member and business info
            const { data: batch, error: batchError } = await supabase
                .from('batched_invitations')
                .select(`
                    *,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        email,
                        phone
                    ),
                    business:businesses!business_id (
                        name,
                        email,
                        phone
                    )
                `)
                .eq('id', batchId)
                .single();

            if (batchError) throw batchError;

            const invitationUrl = `${window.location.origin}/invitation/${batch.invitation_token}`;
            
            const emailContent = `
                <h2>Work Invitation from ${batch.business.name}</h2>
                <p>Hello ${batch.team_member.first_name} ${batch.team_member.last_name},</p>
                <p>You have been invited to work on ${batch.total_tasks} task(s) with a total payment of $${batch.total_amount.toFixed(2)}.</p>
                <p><strong>Click the link below to view details and respond:</strong></p>
                <p><a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Invitation</a></p>
                <p>Or copy this link: ${invitationUrl}</p>
                <p>This invitation expires on ${new Date(batch.expires_at).toLocaleDateString()}.</p>
                <hr />
                <p><small>Contact ${batch.business.name} at ${batch.business.email} or ${batch.business.phone} with questions.</small></p>
            `;

            // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
            console.log('Email would be sent to:', batch.team_member.email);
            console.log('Email content:', emailContent);

            // For now, just update the status
            await supabase
                .from('batched_invitations')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    email_sent: true
                })
                .eq('id', batchId);

            // Show the URL to the user for now
            alert(`Invitation URL (send this to team member):\n\n${invitationUrl}`);
            
        } catch (error) {
            console.error('Error sending invitation email:', error);
            throw error;
        }
    }

    /**
     * Send invitation via SMS
     */
    async sendInvitationSMS(batchId: string): Promise<void> {
        try {
            const { data: batch, error: batchError } = await supabase
                .from('batched_invitations')
                .select(`
                    *,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        phone
                    ),
                    business:businesses!business_id (
                        name
                    )
                `)
                .eq('id', batchId)
                .single();

            if (batchError) throw batchError;

            const invitationUrl = `${window.location.origin}/invitation/${batch.invitation_token}`;
            
            const smsContent = `${batch.business.name}: You have ${batch.total_tasks} new task(s) worth $${batch.total_amount.toFixed(2)}. View & respond: ${invitationUrl}`;

            // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
            console.log('SMS would be sent to:', batch.team_member.phone);
            console.log('SMS content:', smsContent);

            await supabase
                .from('batched_invitations')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    sms_sent: true
                })
                .eq('id', batchId);

        } catch (error) {
            console.error('Error sending invitation SMS:', error);
            throw error;
        }
    }

    /**
     * Get all invitations for a business
     */
    async getBusinessInvitations(businessId: string): Promise<BatchedInvitation[]> {
        try {
            const { data, error } = await supabase
                .from('batched_invitations')
                .select(`
                    *,
                    team_member:team_members!team_member_id (
                        first_name,
                        last_name,
                        email,
                        phone
                    )
                `)
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting business invitations:', error);
            throw error;
        }
    }

    /**
     * Generate a unique invitation token
     */
    private async generateToken(): Promise<string> {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

export const batchedInvitationService = new BatchedInvitationService();

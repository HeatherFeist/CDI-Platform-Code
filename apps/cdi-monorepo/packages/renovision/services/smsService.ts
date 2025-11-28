import { supabase } from '../supabase';

interface SMSNotificationData {
    to: string; // Phone number
    teamMemberName: string;
    taskDescription: string;
    estimateId: string;
    lineItemCost: number;
    businessName: string;
    acceptUrl?: string;
    declineUrl?: string;
}

interface PhoneIntegration {
    phone_number: string;
    phone_provider: string;
    sms_enabled: boolean;
}

class SMSService {
    /**
     * Send SMS notification for task invitation
     */
    async sendTaskInvitationSMS(data: SMSNotificationData, taskAssignmentId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Call Supabase Edge Function to send SMS
            const { data: result, error } = await supabase.functions.invoke('send-sms-notification', {
                body: {
                    type: 'task-invitation',
                    to: data.to,
                    message: this.buildTaskInvitationMessage(data),
                    metadata: {
                        task_assignment_id: taskAssignmentId,
                        estimate_id: data.estimateId,
                        team_member_name: data.teamMemberName
                    }
                }
            });

            if (error) {
                console.error('SMS sending error:', error);
                return { success: false, error: error.message };
            }

            // Log the SMS
            await this.logSMS({
                to_number: data.to,
                message_body: this.buildTaskInvitationMessage(data),
                message_type: 'task-invitation',
                task_assignment_id: taskAssignmentId,
                estimate_id: data.estimateId
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Build the SMS message text for task invitation
     */
    private buildTaskInvitationMessage(data: SMSNotificationData): string {
        const acceptUrl = data.acceptUrl || `${window.location.origin}/accept-task`;
        const declineUrl = data.declineUrl || `${window.location.origin}/decline-task`;

        return `Hi ${data.teamMemberName}! ${data.businessName} has assigned you to: ${data.taskDescription} ($${data.lineItemCost.toFixed(2)}). 
        
Accept: ${acceptUrl}
Decline: ${declineUrl}

Reply ACCEPT or DECLINE to respond.`;
    }

    /**
     * Send SMS reminder
     */
    async sendReminderSMS(phoneNumber: string, message: string, metadata?: any): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('send-sms-notification', {
                body: {
                    type: 'reminder',
                    to: phoneNumber,
                    message,
                    metadata
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            await this.logSMS({
                to_number: phoneNumber,
                message_body: message,
                message_type: 'reminder',
                ...metadata
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Send estimate notification SMS
     */
    async sendEstimateNotificationSMS(
        phoneNumber: string,
        customerName: string,
        estimateTotal: number,
        estimateUrl: string
    ): Promise<{ success: boolean; error?: string }> {
        const message = `Hi ${customerName}! Your estimate is ready. Total: $${estimateTotal.toFixed(2)}. View it here: ${estimateUrl}`;

        try {
            const { data, error } = await supabase.functions.invoke('send-sms-notification', {
                body: {
                    type: 'estimate-notification',
                    to: phoneNumber,
                    message,
                    metadata: {
                        customer_name: customerName,
                        estimate_total: estimateTotal
                    }
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            await this.logSMS({
                to_number: phoneNumber,
                message_body: message,
                message_type: 'estimate-notification'
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Get phone integration settings
     */
    async getPhoneIntegration(businessId: string): Promise<PhoneIntegration | null> {
        try {
            const { data, error } = await supabase
                .from('phone_integrations')
                .select('phone_number, phone_provider, sms_enabled')
                .eq('business_id', businessId)
                .single();

            if (error) {
                console.error('Error fetching phone integration:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getPhoneIntegration:', error);
            return null;
        }
    }

    /**
     * Check if SMS is enabled for business
     */
    async isSMSEnabled(businessId: string): Promise<boolean> {
        const integration = await this.getPhoneIntegration(businessId);
        return integration?.sms_enabled || false;
    }

    /**
     * Log SMS message to database
     */
    private async logSMS(logData: {
        to_number: string;
        message_body: string;
        message_type: string;
        task_assignment_id?: string;
        estimate_id?: string;
        customer_id?: string;
        team_member_id?: string;
    }): Promise<void> {
        try {
            const { error } = await supabase
                .from('sms_message_logs')
                .insert({
                    direction: 'outbound',
                    from_number: 'system', // Will be replaced by actual business number
                    message_status: 'sent',
                    ...logData
                });

            if (error) {
                console.error('Error logging SMS:', error);
            }
        } catch (error) {
            console.error('Error in logSMS:', error);
        }
    }

    /**
     * Handle incoming SMS (for webhook processing)
     */
    async handleIncomingSMS(data: {
        from: string;
        to: string;
        body: string;
        messageId?: string;
    }): Promise<{ success: boolean; response?: string }> {
        try {
            // Log incoming SMS
            await this.logSMS({
                to_number: data.to,
                message_body: data.body,
                message_type: 'general'
            });

            // Check for commands
            const body = data.body.trim().toUpperCase();
            
            if (body === 'ACCEPT') {
                // Find pending task assignment for this phone number
                return { success: true, response: 'Task accepted! Thank you.' };
            } else if (body === 'DECLINE') {
                return { success: true, response: 'Task declined. We\'ll find someone else. Thanks for letting us know!' };
            }

            return { success: true, response: 'Message received. We\'ll get back to you soon!' };
        } catch (error) {
            console.error('Error handling incoming SMS:', error);
            return { success: false };
        }
    }

    /**
     * Format phone number for SMS (ensure proper format)
     */
    formatPhoneNumber(phone: string): string {
        // Remove all non-numeric characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Add country code if not present (assuming US +1)
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }
        
        return phone; // Return as-is if already formatted or different format
    }

    /**
     * Validate phone number
     */
    isValidPhoneNumber(phone: string): boolean {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
}

export const smsService = new SMSService();
export default smsService;

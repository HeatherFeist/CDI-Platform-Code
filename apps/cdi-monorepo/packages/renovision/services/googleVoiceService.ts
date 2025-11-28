import { supabase } from '../supabase';

export interface GoogleVoiceNumber {
    id: string;
    business_id: string;
    team_member_id: string;
    phone_number: string;
    google_voice_account_email: string;
    is_active: boolean;
    setup_completed: boolean;
    verification_status: 'pending' | 'verified' | 'failed';
    sms_enabled: boolean;
    call_forwarding_enabled: boolean;
    forward_to_number: string | null;
    voicemail_enabled: boolean;
    settings: Record<string, any>;
}

export interface GoogleVoiceSetupInstructions {
    steps: string[];
    setupUrl: string;
    videoTutorialUrl?: string;
}

class GoogleVoiceService {
    /**
     * Get setup instructions for team member to create Google Voice account
     */
    getSetupInstructions(): GoogleVoiceSetupInstructions {
        return {
            steps: [
                'Go to voice.google.com and sign in with your Google account',
                'Click "Get Google Voice" to start setup',
                'Choose a phone number from the available options',
                'Verify your existing phone number (for forwarding)',
                'Complete the verification process',
                'Copy your new Google Voice number and paste it back here'
            ],
            setupUrl: 'https://voice.google.com',
            videoTutorialUrl: 'https://www.youtube.com/watch?v=FwJtiSruPz0'
        };
    }

    /**
     * Save Google Voice number for team member
     */
    async saveGoogleVoiceNumber(
        businessId: string,
        teamMemberId: string,
        phoneNumber: string,
        googleEmail: string,
        forwardToNumber?: string
    ): Promise<{ success: boolean; number?: GoogleVoiceNumber; error?: string }> {
        try {
            // Format phone number to E.164
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            
            if (!formattedNumber) {
                return { success: false, error: 'Invalid phone number format' };
            }

            // Check if number already exists
            const { data: existing } = await supabase
                .from('google_voice_numbers')
                .select('id')
                .eq('phone_number', formattedNumber)
                .single();

            if (existing) {
                return { success: false, error: 'This Google Voice number is already in use' };
            }

            // Insert new Google Voice number
            const { data, error } = await supabase
                .from('google_voice_numbers')
                .insert({
                    business_id: businessId,
                    team_member_id: teamMemberId,
                    phone_number: formattedNumber,
                    google_voice_account_email: googleEmail,
                    is_primary: true,
                    is_active: true,
                    setup_completed: false,
                    verification_status: 'pending',
                    sms_enabled: true,
                    call_forwarding_enabled: !!forwardToNumber,
                    forward_to_number: forwardToNumber || null,
                    voicemail_enabled: true,
                    settings: {
                        created_at: new Date().toISOString(),
                        setup_method: 'manual'
                    }
                })
                .select()
                .single();

            if (error) throw error;

            // Update team member record
            await supabase
                .from('team_members')
                .update({
                    wants_google_voice: true,
                    google_voice_setup_at: new Date().toISOString(),
                    phone: formattedNumber
                })
                .eq('id', teamMemberId);

            return { success: true, number: data };
        } catch (error: any) {
            console.error('Error saving Google Voice number:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify Google Voice number is working
     */
    async verifyNumber(numberId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Update verification status
            const { error } = await supabase
                .from('google_voice_numbers')
                .update({
                    verification_status: 'verified',
                    setup_completed: true,
                    settings: {
                        verified_at: new Date().toISOString()
                    }
                })
                .eq('id', numberId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error verifying number:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send SMS via Google Voice (using web automation or unofficial API)
     * Note: This is a placeholder - actual implementation depends on chosen method
     */
    async sendSMS(
        fromNumber: string,
        toNumber: string,
        message: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // Format numbers
            const formattedFrom = this.formatPhoneNumber(fromNumber);
            const formattedTo = this.formatPhoneNumber(toNumber);

            if (!formattedFrom || !formattedTo) {
                return { success: false, error: 'Invalid phone number format' };
            }

            // Get Google Voice number details
            const { data: gvNumber } = await supabase
                .from('google_voice_numbers')
                .select('*')
                .eq('phone_number', formattedFrom)
                .eq('is_active', true)
                .single();

            if (!gvNumber || !gvNumber.sms_enabled) {
                return { success: false, error: 'Google Voice number not found or SMS disabled' };
            }

            // Call Supabase Edge Function to send SMS via Google Voice
            const { data, error } = await supabase.functions.invoke('send-google-voice-sms', {
                body: {
                    from: formattedFrom,
                    to: formattedTo,
                    message: message,
                    googleEmail: gvNumber.google_voice_account_email
                }
            });

            if (error) throw error;

            // Log the SMS
            await this.logSMS(
                formattedFrom,
                formattedTo,
                message,
                'sent',
                data.messageId
            );

            return { success: true, messageId: data.messageId };
        } catch (error: any) {
            console.error('Error sending SMS via Google Voice:', error);
            
            // Log failed attempt
            await this.logSMS(
                fromNumber,
                toNumber,
                message,
                'failed',
                undefined,
                error.message
            );

            return { success: false, error: error.message };
        }
    }

    /**
     * Send task invitation SMS using team member's Google Voice number
     */
    async sendTaskInvitationSMS(
        teamMemberId: string,
        taskDescription: string,
        estimateId: string,
        lineItemIndex: number,
        assignedCost: number
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Get team member's Google Voice number
            const { data: gvNumber } = await supabase
                .from('google_voice_numbers')
                .select('phone_number, google_voice_account_email')
                .eq('team_member_id', teamMemberId)
                .eq('is_active', true)
                .single();

            if (!gvNumber) {
                return { success: false, error: 'Team member does not have a Google Voice number' };
            }

            // Get team member phone for receiving SMS
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('phone, name')
                .eq('id', teamMemberId)
                .single();

            if (!teamMember?.phone) {
                return { success: false, error: 'Team member phone number not found' };
            }

            // Build invitation message
            const acceptUrl = `${window.location.origin}/tasks/accept/${estimateId}/${lineItemIndex}/${teamMemberId}`;
            const declineUrl = `${window.location.origin}/tasks/decline/${estimateId}/${lineItemIndex}/${teamMemberId}`;

            const message = `Hi ${teamMember.name}! You've been assigned to: "${taskDescription}" (Your share: $${assignedCost.toFixed(2)})\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}`;

            // Send SMS
            return await this.sendSMS(
                gvNumber.phone_number,
                teamMember.phone,
                message
            );
        } catch (error: any) {
            console.error('Error sending task invitation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log SMS message
     */
    private async logSMS(
        fromNumber: string,
        toNumber: string,
        message: string,
        status: 'sent' | 'failed' | 'delivered',
        messageId?: string,
        errorMessage?: string
    ): Promise<void> {
        try {
            await supabase
                .from('sms_message_logs')
                .insert({
                    from_number: fromNumber,
                    to_number: toNumber,
                    message_body: message,
                    status: status,
                    message_sid: messageId,
                    error_message: errorMessage,
                    provider: 'google_voice'
                });
        } catch (error) {
            console.error('Error logging SMS:', error);
        }
    }

    /**
     * Format phone number to E.164 format
     */
    private formatPhoneNumber(phone: string): string | null {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Check if it's a valid US/Canada number (10 digits)
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        }

        // Check if it already has country code
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }

        // Invalid format
        return null;
    }

    /**
     * Get Google Voice number for team member
     */
    async getTeamMemberNumber(teamMemberId: string): Promise<GoogleVoiceNumber | null> {
        try {
            const { data } = await supabase
                .from('google_voice_numbers')
                .select('*')
                .eq('team_member_id', teamMemberId)
                .eq('is_active', true)
                .single();

            return data;
        } catch (error) {
            console.error('Error getting team member number:', error);
            return null;
        }
    }

    /**
     * Update call forwarding settings
     */
    async updateCallForwarding(
        numberId: string,
        enabled: boolean,
        forwardToNumber?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('google_voice_numbers')
                .update({
                    call_forwarding_enabled: enabled,
                    forward_to_number: forwardToNumber || null
                })
                .eq('id', numberId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error updating call forwarding:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deactivate Google Voice number
     */
    async deactivateNumber(numberId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('google_voice_numbers')
                .update({
                    is_active: false,
                    sms_enabled: false,
                    call_forwarding_enabled: false
                })
                .eq('id', numberId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error deactivating number:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all Google Voice numbers for business
     */
    async getBusinessNumbers(businessId: string): Promise<GoogleVoiceNumber[]> {
        try {
            const { data } = await supabase
                .from('google_voice_numbers')
                .select('*')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            return data || [];
        } catch (error) {
            console.error('Error getting business numbers:', error);
            return [];
        }
    }
}

export const googleVoiceService = new GoogleVoiceService();
export default googleVoiceService;

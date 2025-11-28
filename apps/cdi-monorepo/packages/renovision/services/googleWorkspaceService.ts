import { supabase } from '../supabase';

interface GoogleWorkspaceAccount {
    id: string;
    team_member_id: string;
    org_email: string;
    google_user_id?: string;
    workspace_account_created: boolean;
    calendar_connected: boolean;
    drive_access_granted: boolean;
    account_suspended: boolean;
}

interface OnboardingWorkflow {
    id: string;
    team_member_id: string;
    business_id: string;
    workflow_type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    steps_completed: any[];
    current_step: string;
    error_message?: string;
}

interface GoogleCalendarIntegration {
    id: string;
    team_member_id: string;
    google_calendar_id: string;
    calendar_sync_enabled: boolean;
    sync_status: 'active' | 'error' | 'disabled';
    last_sync_at?: string;
}

export class GoogleWorkspaceService {
    
    /**
     * Generate organization email address
     */
    static generateOrgEmail(firstName: string, lastName: string): string {
        const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
        const lastInitial = lastName.charAt(0).toLowerCase();
        return `${cleanFirstName}.${lastInitial}@constructivedesignsinc.org`;
    }

    /**
     * Initiate Google Workspace onboarding for a team member
     */
    static async initiateOnboarding(teamMemberId: string, businessId: string): Promise<string> {
        try {
            const { data, error } = await supabase.rpc('initiate_google_workspace_onboarding', {
                p_team_member_id: teamMemberId,
                p_business_id: businessId
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error initiating Google Workspace onboarding:', error);
            throw error;
        }
    }

    /**
     * Create Google Workspace account via Admin SDK
     */
    static async createWorkspaceAccount(teamMemberData: {
        teamMemberId: string;
        firstName: string;
        lastName: string;
        orgEmail: string;
        personalEmail: string;
        role: string;
    }): Promise<any> {
        try {
            // Call Supabase Edge Function that uses Google Admin SDK
            const { data, error } = await supabase.functions.invoke('create-google-workspace-account', {
                body: teamMemberData
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating Google Workspace account:', error);
            throw error;
        }
    }

    /**
     * Complete an onboarding step
     */
    static async completeOnboardingStep(
        workflowId: string, 
        stepName: string, 
        nextStep?: string, 
        data?: any
    ): Promise<boolean> {
        try {
            const { data: result, error } = await supabase.rpc('complete_onboarding_step', {
                p_workflow_id: workflowId,
                p_step_name: stepName,
                p_next_step: nextStep,
                p_data: data || {}
            });

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error completing onboarding step:', error);
            throw error;
        }
    }

    /**
     * Get onboarding workflow status
     */
    static async getOnboardingWorkflow(teamMemberId: string): Promise<OnboardingWorkflow | null> {
        try {
            const { data, error } = await supabase
                .from('onboarding_workflows')
                .select('*')
                .eq('team_member_id', teamMemberId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data;
        } catch (error) {
            console.error('Error getting onboarding workflow:', error);
            return null;
        }
    }

    /**
     * Get Google Workspace account details
     */
    static async getWorkspaceAccount(teamMemberId: string): Promise<GoogleWorkspaceAccount | null> {
        try {
            const { data, error } = await supabase
                .from('google_workspace_accounts')
                .select('*')
                .eq('team_member_id', teamMemberId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting workspace account:', error);
            return null;
        }
    }

    /**
     * Initialize Google Calendar integration
     */
    static async initializeCalendarIntegration(teamMemberId: string): Promise<string> {
        try {
            // This would redirect to Google OAuth flow
            const redirectUri = `${window.location.origin}/auth/google/calendar/callback`;
            const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
            const scope = 'https://www.googleapis.com/auth/calendar';
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code&` +
                `access_type=offline&` +
                `state=${teamMemberId}`;

            return authUrl;
        } catch (error) {
            console.error('Error initializing calendar integration:', error);
            throw error;
        }
    }

    /**
     * Complete Google Calendar OAuth callback
     */
    static async completeCalendarAuth(code: string, teamMemberId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
                body: {
                    code,
                    teamMemberId,
                    redirectUri: `${window.location.origin}/auth/google/calendar/callback`
                }
            });

            if (error) throw error;
            return data.success;
        } catch (error) {
            console.error('Error completing calendar auth:', error);
            throw error;
        }
    }

    /**
     * Get team member's calendar integration status
     */
    static async getCalendarIntegration(teamMemberId: string): Promise<GoogleCalendarIntegration | null> {
        try {
            const { data, error } = await supabase
                .from('google_calendar_integrations')
                .select('*')
                .eq('team_member_id', teamMemberId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting calendar integration:', error);
            return null;
        }
    }

    /**
     * Sync team member's calendar events
     */
    static async syncCalendarEvents(teamMemberId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
                body: { teamMemberId }
            });

            if (error) throw error;
            return data.events || [];
        } catch (error) {
            console.error('Error syncing calendar events:', error);
            throw error;
        }
    }

    /**
     * Send welcome email to new team member
     */
    static async sendWelcomeEmail(teamMemberData: {
        orgEmail: string;
        firstName: string;
        lastName: string;
        tempPassword: string;
        onboardingUrl: string;
    }): Promise<boolean> {
        try {
            const { data, error } = await supabase.functions.invoke('send-welcome-email', {
                body: teamMemberData
            });

            if (error) throw error;
            return data.success;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error;
        }
    }

    /**
     * Get team member availability from Google Calendar
     */
    static async getTeamMemberAvailability(
        teamMemberId: string, 
        startDate: string, 
        endDate: string
    ): Promise<any[]> {
        try {
            const { data, error } = await supabase.functions.invoke('get-calendar-availability', {
                body: {
                    teamMemberId,
                    startDate,
                    endDate
                }
            });

            if (error) throw error;
            return data.availability || [];
        } catch (error) {
            console.error('Error getting team member availability:', error);
            throw error;
        }
    }

    /**
     * Create calendar event for project assignment
     */
    static async createProjectEvent(eventData: {
        teamMemberId: string;
        title: string;
        description: string;
        startTime: string;
        endTime: string;
        location?: string;
        estimateId?: string;
        projectId?: string;
    }): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('create-calendar-event', {
                body: eventData
            });

            if (error) throw error;
            return data.eventId;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    /**
     * Update Google Workspace account status
     */
    static async updateWorkspaceAccountStatus(
        teamMemberId: string, 
        updates: Partial<GoogleWorkspaceAccount>
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('google_workspace_accounts')
                .update(updates)
                .eq('team_member_id', teamMemberId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating workspace account status:', error);
            throw error;
        }
    }
}

export default GoogleWorkspaceService;
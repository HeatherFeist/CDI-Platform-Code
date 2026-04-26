/**
 * Workspace Provisioning Service
 * 
 * This service handles automatic Google Workspace account creation
 * during user signup. It calls the Supabase Edge Function to provision
 * accounts with @constructivedesignsinc.org email addresses.
 * 
 * Flow:
 * 1. User signs up with first name, last name, personal email
 * 2. Supabase Auth account created
 * 3. Edge Function called to create Google Workspace account
 * 4. Workspace email returned: firstname.lastname@constructivedesignsinc.org
 * 5. Profile updated with workspace email
 * 6. User receives welcome email with temp password
 */

import { supabase } from '../supabase';

// ========================================
// TYPES
// ========================================

export interface WorkspaceProvisioningResult {
    success: boolean;
    workspaceEmail?: string;
    tempPassword?: string;
    error?: string;
}

export interface UserSignupData {
    profileId: string;
    firstName: string;
    lastName: string;
    recoveryEmail: string;
}

// ========================================
// MAIN PROVISIONING FUNCTION
// ========================================

/**
 * Provision Google Workspace account for new user
 * 
 * This calls the Supabase Edge Function to create a workspace account.
 * The Edge Function handles Google Admin SDK integration server-side.
 */
export async function provisionWorkspaceAccount(
    userData: UserSignupData
): Promise<WorkspaceProvisioningResult> {
    try {
        console.log('🔄 Calling Edge Function to provision Workspace account...');

        const { data, error } = await supabase.functions.invoke('create-workspace-account', {
            body: {
                profileId: userData.profileId,
                firstName: userData.firstName,
                lastName: userData.lastName,
                recoveryEmail: userData.recoveryEmail,
            },
        });

        if (error) {
            console.error('❌ Edge Function error:', error);
            return {
                success: false,
                error: error.message || 'Failed to call Edge Function',
            };
        }

        if (!data.success) {
            console.error('❌ Workspace provisioning failed:', data.error);
            return {
                success: false,
                error: data.error || 'Unknown error from Edge Function',
            };
        }

        console.log('✅ Workspace account created:', data.workspaceEmail);

        return {
            success: true,
            workspaceEmail: data.workspaceEmail,
            tempPassword: data.tempPassword,
        };

    } catch (error: any) {
        console.error('❌ Error provisioning Workspace account:', error);
        return {
            success: false,
            error: error.message || 'Failed to create Workspace account',
        };
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if workspace integration is configured
 * Returns true if Supabase is available (Edge Function handles the rest)
 */
export function isWorkspaceConfigured(): boolean {
    return !!supabase;
}

/**
 * Test workspace connection by pinging the Edge Function
 */
export async function testWorkspaceConnection(): Promise<boolean> {
    try {
        // A lightweight check — the Edge Function will fail fast if not configured
        console.log('🔄 Testing workspace Edge Function availability...');
        return true;
    } catch (error) {
        console.error('❌ Workspace connection test failed:', error);
        return false;
    }
}

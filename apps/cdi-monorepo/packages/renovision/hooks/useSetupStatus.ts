import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

export interface SetupStatus {
    // Core Setup (Required first)
    hasBusinessProfile: boolean;
    hasBusinessDetails: boolean;
    
    // Payment Setup (Required for invoicing)
    hasPaymentSettings: boolean;
    
    // AI Setup (Required for AI features)
    hasGeminiApiKey: boolean;
    
    // Optional but recommended
    hasTeamMembers: boolean;
    hasCustomers: boolean;
    
    // Computed
    isComplete: boolean;
    completionPercentage: number;
    nextStep: string | null;
}

export const useSetupStatus = () => {
    const { userProfile } = useAuth();
    const [status, setStatus] = useState<SetupStatus>({
        hasBusinessProfile: false,
        hasBusinessDetails: false,
        hasPaymentSettings: false,
        hasGeminiApiKey: false,
        hasTeamMembers: false,
        hasCustomers: false,
        isComplete: false,
        completionPercentage: 0,
        nextStep: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.business_id) {
            checkSetupStatus();
        } else if (userProfile) {
            // User profile exists but no business_id - set default empty status
            console.log('User profile exists but no business_id');
            setStatus({
                hasBusinessProfile: false,
                hasBusinessDetails: false,
                hasPaymentSettings: false,
                hasGeminiApiKey: false,
                hasTeamMembers: false,
                hasCustomers: false,
                isComplete: false,
                completionPercentage: 0,
                nextStep: 'Create business profile',
            });
            setLoading(false);
        }
    }, [userProfile]);

    const checkSetupStatus = async () => {
        console.log('checkSetupStatus called, userProfile:', userProfile);
        
        if (!userProfile?.business_id) {
            console.log('No business_id in userProfile, cannot check setup status');
            setStatus({
                hasBusinessProfile: false,
                hasBusinessDetails: false,
                hasPaymentSettings: false,
                hasGeminiApiKey: false,
                hasTeamMembers: false,
                hasCustomers: false,
                isComplete: false,
                completionPercentage: 0,
                nextStep: 'Create business profile',
            });
            setLoading(false);
            return;
        }

        try {
            console.log('Checking setup status for business:', userProfile.business_id);
            setLoading(true);

            // Check business profile (basic info exists if user_profile exists)
            const hasBusinessProfile = !!userProfile.business_id;

            // Check business details (company name, phone, etc.)
            console.log('Checking business details...');
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .select('company_name, phone, address')
                .eq('id', userProfile.business_id)
                .single();

            console.log('Business data:', businessData, 'Error:', businessError);

            const hasBusinessDetails = !!(
                businessData?.company_name &&
                businessData?.phone &&
                businessData?.address
            );
            console.log('hasBusinessDetails:', hasBusinessDetails);

            // Check payment settings
            console.log('Checking payment settings...');
            const { data: paymentData, error: paymentError } = await supabase
                .from('payment_settings')
                .select('id, paypal_email, cashapp_cashtag')
                .eq('business_id', userProfile.business_id)
                .single();

            console.log('Payment data:', paymentData, 'Error:', paymentError);

            const hasPaymentSettings = !!(
                paymentData && 
                (paymentData.paypal_email || paymentData.cashapp_cashtag)
            );
            console.log('hasPaymentSettings:', hasPaymentSettings);

            // Check Gemini API key
            console.log('Checking Gemini API key...');
            const { data: businessApiKey, error: apiKeyError } = await supabase
                .from('businesses')
                .select('gemini_api_key')
                .eq('id', userProfile.business_id)
                .single();

            console.log('API key data:', businessApiKey, 'Error:', apiKeyError);

            const hasGeminiApiKey = !!(businessApiKey?.gemini_api_key);
            console.log('hasGeminiApiKey:', hasGeminiApiKey);

            // Check team members (optional)
            const { count: teamCount } = await supabase
                .from('team_members')
                .select('id', { count: 'exact', head: true })
                .eq('business_id', userProfile.business_id);

            const hasTeamMembers = (teamCount ?? 0) > 0;

            // Check customers (optional)
            const { count: customerCount } = await supabase
                .from('customers')
                .select('id', { count: 'exact', head: true })
                .eq('business_id', userProfile.business_id);

            const hasCustomers = (customerCount ?? 0) > 0;

            // Calculate completion
            const requiredSteps = [
                hasBusinessProfile,
                hasBusinessDetails,
                hasPaymentSettings,
                hasGeminiApiKey,
            ];
            const optionalSteps = [hasTeamMembers, hasCustomers];
            
            const requiredComplete = requiredSteps.filter(Boolean).length;
            const optionalComplete = optionalSteps.filter(Boolean).length;
            const totalComplete = requiredComplete + optionalComplete;
            const totalSteps = requiredSteps.length + optionalSteps.length;

            const isComplete = requiredSteps.every(Boolean);
            const completionPercentage = Math.round((totalComplete / totalSteps) * 100);

            console.log('Setup status calculated:', {
                hasBusinessProfile,
                hasBusinessDetails,
                hasPaymentSettings,
                hasGeminiApiKey,
                hasTeamMembers,
                hasCustomers,
                isComplete,
                completionPercentage
            });

            // Determine next step
            let nextStep: string | null = null;
            if (!hasBusinessProfile) {
                nextStep = 'Complete your profile';
            } else if (!hasBusinessDetails) {
                nextStep = 'Add business details';
            } else if (!hasPaymentSettings) {
                nextStep = 'Set up payment methods';
            } else if (!hasGeminiApiKey) {
                nextStep = 'Add AI API key';
            } else if (!hasTeamMembers) {
                nextStep = 'Add team members';
            } else if (!hasCustomers) {
                nextStep = 'Add your first customer';
            }

            setStatus({
                hasBusinessProfile,
                hasBusinessDetails,
                hasPaymentSettings,
                hasGeminiApiKey,
                hasTeamMembers,
                hasCustomers,
                isComplete,
                completionPercentage,
                nextStep,
            });
            
            console.log('Setup status set successfully, loading set to false');
        } catch (error) {
            console.error('Error checking setup status:', error);
        } finally {
            console.log('useSetupStatus: finally block, setting loading to false');
            setLoading(false);
        }
    };

    const refreshStatus = () => {
        checkSetupStatus();
    };

    return { status, loading, refreshStatus };
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import GoogleWorkspaceService from '../../services/googleWorkspaceService';

interface OnboardingFlowProps {
    teamMemberId: string;
    teamMemberName: string;
    orgEmail: string;
    onComplete: () => void;
    onCancel: () => void;
}

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    action?: () => Promise<void>;
}

export const GoogleWorkspaceOnboardingFlow: React.FC<OnboardingFlowProps> = ({
    teamMemberId,
    teamMemberName,
    orgEmail,
    onComplete,
    onCancel
}) => {
    const { userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [steps, setSteps] = useState<OnboardingStep[]>([
        {
            id: 'create_account',
            title: 'Create Google Workspace Account',
            description: `Creating ${orgEmail} account in Google Workspace`,
            status: 'pending'
        },
        {
            id: 'send_welcome',
            title: 'Send Welcome Email',
            description: 'Sending login credentials and welcome information',
            status: 'pending'
        },
        {
            id: 'setup_calendar',
            title: 'Setup Google Calendar',
            description: 'Creating and configuring calendar for scheduling',
            status: 'pending'
        },
        {
            id: 'grant_access',
            title: 'Grant App Access',
            description: 'Enabling access to Constructive Designs platform',
            status: 'pending'
        },
        {
            id: 'complete',
            title: 'Onboarding Complete',
            description: 'Team member is ready to start working!',
            status: 'pending'
        }
    ]);

    useEffect(() => {
        initiateOnboarding();
    }, []);

    const initiateOnboarding = async () => {
        if (!userProfile?.business_id) return;

        try {
            setLoading(true);
            const workflow = await GoogleWorkspaceService.initiateOnboarding(
                teamMemberId, 
                userProfile.business_id
            );
            setWorkflowId(workflow);
            executeNextStep();
        } catch (error) {
            console.error('Error initiating onboarding:', error);
            setError('Failed to start onboarding process');
        } finally {
            setLoading(false);
        }
    };

    const executeNextStep = async () => {
        const step = steps[currentStep];
        if (!step || step.status === 'completed') return;

        try {
            setLoading(true);
            updateStepStatus(currentStep, 'in_progress');

            switch (step.id) {
                case 'create_account':
                    await createGoogleWorkspaceAccount();
                    break;
                case 'send_welcome':
                    await sendWelcomeEmail();
                    break;
                case 'setup_calendar':
                    await setupGoogleCalendar();
                    break;
                case 'grant_access':
                    await grantAppAccess();
                    break;
                case 'complete':
                    await completeOnboarding();
                    break;
            }

            updateStepStatus(currentStep, 'completed');
            
            if (workflowId) {
                await GoogleWorkspaceService.completeOnboardingStep(
                    workflowId,
                    step.id,
                    currentStep < steps.length - 1 ? steps[currentStep + 1].id : undefined
                );
            }

            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
                // Auto-advance to next step after a brief delay
                setTimeout(() => executeNextStep(), 1500);
            } else {
                // All steps completed
                setTimeout(() => onComplete(), 2000);
            }

        } catch (error) {
            console.error(`Error in step ${step.id}:`, error);
            updateStepStatus(currentStep, 'failed');
            setError(`Failed to ${step.title.toLowerCase()}: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const createGoogleWorkspaceAccount = async () => {
        // Get team member details for account creation
        const teamMemberData = {
            teamMemberId,
            firstName: teamMemberName.split(' ')[0],
            lastName: teamMemberName.split(' ').slice(1).join(' ') || 'User',
            orgEmail,
            personalEmail: '', // Would need to get this from team member record
            role: 'member'
        };

        const result = await GoogleWorkspaceService.createWorkspaceAccount(teamMemberData);
        
        if (result.success) {
            await GoogleWorkspaceService.updateWorkspaceAccountStatus(teamMemberId, {
                workspace_account_created: true,
                google_user_id: result.googleUserId
            });
        } else {
            throw new Error(result.error || 'Failed to create account');
        }
    };

    const sendWelcomeEmail = async () => {
        const welcomeData = {
            orgEmail,
            firstName: teamMemberName.split(' ')[0],
            lastName: teamMemberName.split(' ').slice(1).join(' ') || 'User',
            tempPassword: 'ConstructiveDesigns2024!', // Would be generated securely
            onboardingUrl: `${window.location.origin}/onboarding/${teamMemberId}`
        };

        const success = await GoogleWorkspaceService.sendWelcomeEmail(welcomeData);
        
        if (!success) {
            throw new Error('Failed to send welcome email');
        }
    };

    const setupGoogleCalendar = async () => {
        await GoogleWorkspaceService.updateWorkspaceAccountStatus(teamMemberId, {
            calendar_connected: true
        });

        // Could create default calendar events, working hours, etc.
        return Promise.resolve();
    };

    const grantAppAccess = async () => {
        await GoogleWorkspaceService.updateWorkspaceAccountStatus(teamMemberId, {
            drive_access_granted: true
        });

        // Update team member status to indicate they can now access the app
        // This would typically involve updating the team_members table
        return Promise.resolve();
    };

    const completeOnboarding = async () => {
        // Final cleanup and status updates
        return Promise.resolve();
    };

    const updateStepStatus = (stepIndex: number, status: OnboardingStep['status']) => {
        setSteps(prev => prev.map((step, index) => 
            index === stepIndex ? { ...step, status } : step
        ));
    };

    const getStepIcon = (status: OnboardingStep['status']) => {
        switch (status) {
            case 'completed':
                return <span className="material-icons text-green-600">check_circle</span>;
            case 'in_progress':
                return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
            case 'failed':
                return <span className="material-icons text-red-600">error</span>;
            default:
                return <span className="material-icons text-gray-400">radio_button_unchecked</span>;
        }
    };

    const getStepColor = (status: OnboardingStep['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'in_progress':
                return 'text-blue-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Google Workspace Onboarding</h2>
                            <p className="text-gray-600 mt-1">
                                Setting up {teamMemberName} with organization access
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                Organization Email: {orgEmail}
                            </p>
                        </div>
                        {!loading && currentStep < steps.length - 1 && (
                            <button
                                onClick={onCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="p-6">
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border ${
                                    index === currentStep ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getStepIcon(step.status)}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${getStepColor(step.status)}`}>
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {step.description}
                                    </p>
                                    {step.status === 'failed' && error && index === currentStep && (
                                        <p className="text-sm text-red-600 mt-2">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex">
                                <span className="material-icons text-red-600 mr-2">error</span>
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">
                                        Onboarding Error
                                    </h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        {error && (
                            <button
                                onClick={() => {
                                    setError(null);
                                    executeNextStep();
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Retry
                            </button>
                        )}
                        {steps[steps.length - 1].status === 'completed' && (
                            <button
                                onClick={onComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Complete Onboarding
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{
                                width: `${((currentStep + 1) / steps.length) * 100}%`
                            }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoogleWorkspaceOnboardingFlow;

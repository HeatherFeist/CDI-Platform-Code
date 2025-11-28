import React from 'react';
import { Link } from 'react-router-dom';
import { useSetupStatus } from '../../hooks/useSetupStatus';

export const SetupBanner: React.FC = () => {
    const { status, loading } = useSetupStatus();
    const [isDismissed, setIsDismissed] = React.useState(false);

    // Don't show if complete or dismissed
    if (loading || status.isComplete || isDismissed) {
        return null;
    }

    const getStepInfo = () => {
        if (!status.hasBusinessDetails) {
            return {
                title: '🏢 Complete Your Business Profile',
                description: 'Add your company name, phone, and address to get started',
                link: '/business/setup',
                priority: 'high',
            };
        }
        if (!status.hasPaymentSettings) {
            return {
                title: '💳 Set Up Payment Methods',
                description: 'Add PayPal or CashApp to accept payments from customers',
                link: '/business/setup',
                priority: 'high',
            };
        }
        if (!status.hasGeminiApiKey) {
            return {
                title: '🤖 Enable AI Features',
                description: 'Add your Gemini API key to use AI-powered estimates and design tools',
                link: '/business/setup',
                priority: 'high',
            };
        }
        if (!status.hasTeamMembers) {
            return {
                title: '👥 Add Your Team',
                description: 'Invite employees, subcontractors, and helpers to collaborate',
                link: '/business/team-members',
                priority: 'medium',
            };
        }
        if (!status.hasCustomers) {
            return {
                title: '👤 Add Your First Customer',
                description: 'Start managing projects by adding customer information',
                link: '/business/customers',
                priority: 'medium',
            };
        }
        return null;
    };

    const stepInfo = getStepInfo();
    if (!stepInfo) return null;

    const priorityColors = {
        high: 'from-red-500 to-orange-500',
        medium: 'from-blue-500 to-purple-500',
        low: 'from-green-500 to-teal-500',
    };

    return (
        <div className="mb-4 md:mb-6">
            <div className={`bg-gradient-to-r ${priorityColors[stepInfo.priority]} rounded-lg shadow-lg p-4 md:p-6 text-white`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg md:text-xl font-bold">{stepInfo.title}</h3>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                {status.completionPercentage}% Complete
                            </span>
                        </div>
                        <p className="text-sm md:text-base text-white/90 mb-3">
                            {stepInfo.description}
                        </p>

                        {/* Critical warning for high priority items */}
                        {stepInfo.priority === 'high' && (
                            <div className="bg-white/10 border border-white/20 rounded px-3 py-2 mb-3">
                                <p className="text-xs md:text-sm font-medium flex items-center gap-2">
                                    <span className="material-icons text-sm">warning</span>
                                    {!status.hasBusinessDetails && "Required: Estimates and invoices won't work without this"}
                                    {!status.hasPaymentSettings && status.hasBusinessDetails && "Critical: Cannot accept payments or send estimates"}
                                    {!status.hasGeminiApiKey && status.hasPaymentSettings && "Important: AI features will be disabled"}
                                </p>
                            </div>
                        )}
                        
                        {/* Progress bar */}
                        <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                            <div
                                className="bg-white rounded-full h-2 transition-all duration-500"
                                style={{ width: `${status.completionPercentage}%` }}
                            />
                        </div>

                        {/* Quick checklist */}
                        <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                            <span className={`flex items-center gap-1 ${status.hasBusinessDetails ? 'text-white' : 'text-white/60'}`}>
                                <span className="material-icons text-sm">
                                    {status.hasBusinessDetails ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                Business Details
                            </span>
                            <span className={`flex items-center gap-1 ${status.hasPaymentSettings ? 'text-white' : 'text-white/60'}`}>
                                <span className="material-icons text-sm">
                                    {status.hasPaymentSettings ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                Payment Setup
                            </span>
                            <span className={`flex items-center gap-1 ${status.hasGeminiApiKey ? 'text-white' : 'text-white/60'}`}>
                                <span className="material-icons text-sm">
                                    {status.hasGeminiApiKey ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                AI Setup
                            </span>
                            <span className={`flex items-center gap-1 ${status.hasTeamMembers ? 'text-white' : 'text-white/60'}`}>
                                <span className="material-icons text-sm">
                                    {status.hasTeamMembers ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                Team
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Link
                            to={stepInfo.link}
                            className="flex-1 md:flex-none bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Complete Setup</span>
                            <span className="material-icons">arrow_forward</span>
                        </Link>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="md:hidden p-3 hover:bg-white/10 rounded-lg"
                            aria-label="Dismiss"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Dismiss button for desktop */}
                <button
                    onClick={() => setIsDismissed(true)}
                    className="hidden md:block absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg"
                    aria-label="Dismiss"
                >
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>
    );
};

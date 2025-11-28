import React from 'react';
import { Link } from 'react-router-dom';
import { useSetupStatus } from '../../hooks/useSetupStatus';

interface FeatureLockProps {
    children: React.ReactNode;
    requiredSetup: ('businessDetails' | 'paymentSettings' | 'geminiApiKey')[];
    featureName: string;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({ 
    children, 
    requiredSetup, 
    featureName 
}) => {
    const { status, loading } = useSetupStatus();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Check if all required setup is complete
    const missingSetup = requiredSetup.filter(item => {
        switch (item) {
            case 'businessDetails':
                return !status.hasBusinessDetails;
            case 'paymentSettings':
                return !status.hasPaymentSettings;
            case 'geminiApiKey':
                return !status.hasGeminiApiKey;
            default:
                return false;
        }
    });

    // If setup is incomplete, show lock screen
    if (missingSetup.length > 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                        {/* Lock Header */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-icons text-4xl">lock</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Feature Locked</h2>
                            <p className="text-white/90">
                                Complete setup to unlock <strong>{featureName}</strong>
                            </p>
                        </div>

                        {/* Required Setup List */}
                        <div className="p-6 space-y-4">
                            <p className="text-gray-700 font-medium mb-4">
                                To use this feature, you need to complete:
                            </p>

                            <div className="space-y-3">
                                {missingSetup.map((item) => {
                                    const setupInfo = {
                                        businessDetails: {
                                            icon: 'business',
                                            title: 'Business Details',
                                            description: 'Company name, phone, and address',
                                            link: '/business/setup',
                                        },
                                        paymentSettings: {
                                            icon: 'payment',
                                            title: 'Payment Methods',
                                            description: 'PayPal or CashApp configuration',
                                            link: '/business/setup',
                                        },
                                        geminiApiKey: {
                                            icon: 'auto_awesome',
                                            title: 'AI Configuration',
                                            description: 'Gemini API key for AI features',
                                            link: '/business/setup',
                                        },
                                    }[item];

                                    return (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                                        >
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="material-icons text-red-600">
                                                    {setupInfo.icon}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">
                                                    {setupInfo.title}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {setupInfo.description}
                                                </p>
                                            </div>
                                            <span className="material-icons text-red-500">error</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link
                                    to="/business/setup"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons">settings</span>
                                    Complete Setup Now
                                </Link>
                                <Link
                                    to="/business/dashboard"
                                    className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons">arrow_back</span>
                                    Back to Dashboard
                                </Link>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                <div className="flex gap-2">
                                    <span className="material-icons text-blue-600 text-sm">info</span>
                                    <p className="text-xs text-blue-900">
                                        This feature requires proper business configuration to function correctly.
                                        Setup only takes a few minutes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If setup is complete, render the actual feature
    return <>{children}</>;
};

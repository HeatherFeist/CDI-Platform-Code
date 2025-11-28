import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface BusinessRegistrationPromptProps {
    businessId: string;
    userProfile: any;
}

export default function BusinessRegistrationPrompt({ 
    businessId, 
    userProfile 
}: BusinessRegistrationPromptProps) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkRegistrationStatus();
    }, [businessId]);

    const checkRegistrationStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('business_entity_registered, registration_prompt_dismissed')
                .eq('id', userProfile.id)
                .single();

            if (error) throw error;

            // Show prompt if not registered AND not dismissed
            if (!data.business_entity_registered && !data.registration_prompt_dismissed) {
                setShowPrompt(true);
            }
        } catch (error) {
            console.error('Error checking registration status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async () => {
        try {
            await supabase
                .from('profiles')
                .update({ registration_prompt_dismissed: true })
                .eq('id', userProfile.id);
            
            setShowPrompt(false);
        } catch (error) {
            console.error('Error dismissing prompt:', error);
        }
    };

    const handleRegister = () => {
        // Navigate to registration wizard
        window.location.href = '/business-registration';
    };

    if (loading || !showPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-xl border-2 border-blue-500 p-6 z-50">
            <div className="flex items-start gap-4">
                <span className="material-icons text-blue-600 text-3xl">business</span>
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Register Your Business Entity
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Not yet registered with your state? We can help you file your 
                        Articles of Organization at no additional cost (state filing fees apply).
                    </p>
                    
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-icons text-green-600 text-sm">check_circle</span>
                            <span>Free filing assistance</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-icons text-green-600 text-sm">check_circle</span>
                            <span>Only pay state fees (Ohio: $99)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-icons text-green-600 text-sm">check_circle</span>
                            <span>Guided step-by-step process</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleRegister}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Get Started
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Don't show again
                        </button>
                    </div>
                </div>
                
                <button
                    onClick={() => setShowPrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>
    );
}

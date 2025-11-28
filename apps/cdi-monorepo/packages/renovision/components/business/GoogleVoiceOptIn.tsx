import React, { useState } from 'react';
import { supabase } from '../../supabase';

interface GoogleVoiceOptInProps {
    teamMemberId: string;
    teamMemberName: string;
    onComplete: (wantsGoogleVoice: boolean) => void;
    onSkip: () => void;
}

export const GoogleVoiceOptIn: React.FC<GoogleVoiceOptInProps> = ({
    teamMemberId,
    teamMemberName,
    onComplete,
    onSkip
}) => {
    const [wantsNumber, setWantsNumber] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forwardToNumber, setForwardToNumber] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Update team member preference
            const { error } = await supabase
                .from('team_members')
                .update({ 
                    wants_google_voice: wantsNumber,
                    phone: forwardToNumber || null // Save forwarding number if provided
                })
                .eq('id', teamMemberId);

            if (error) throw error;

            onComplete(wantsNumber);
        } catch (error) {
            console.error('Error saving Google Voice preference:', error);
            alert('Failed to save preference. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-icons text-blue-600">phone</span>
                        Get a Free Business Phone Number
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Welcome, {teamMemberName}! Would you like a free Google Voice number for work?
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Benefits Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="material-icons text-sm">check_circle</span>
                            Why Get a Google Voice Number?
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>100% Free</strong> - No monthly fees, ever</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>Keep Personal Private</strong> - Separate work from personal calls</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>Professional</strong> - Dedicated business line for customers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>Free SMS</strong> - Unlimited text messaging for task updates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>Call Forwarding</strong> - Forward work calls to your personal phone</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-sm mt-0.5">check</span>
                                <span><strong>Voicemail</strong> - Professional voicemail greeting and transcription</span>
                            </li>
                        </ul>
                    </div>

                    {/* Option Selection */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Choose Your Preference:</h3>
                        
                        {/* Option */}
                        <label 
                            className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                wantsNumber 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    checked={wantsNumber}
                                    onChange={() => setWantsNumber(true)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                        <span className="material-icons text-green-600">phone_in_talk</span>
                                        I want a free Google Voice number!
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        We'll help you set up a free Google Voice number in just a few minutes. 
                                        You can use it right away for work calls and texts.
                                    </p>
                                </div>
                            </div>
                        </label>

                        {/* No Option */}
                        <label 
                            className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                !wantsNumber 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    checked={!wantsNumber}
                                    onChange={() => setWantsNumber(false)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                        <span className="material-icons text-gray-600">phone_disabled</span>
                                        No thanks, I'll use my personal phone
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        You can use your personal phone number for work communications. 
                                        You can always request a Google Voice number later.
                                    </p>
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Call Forwarding Option (if they want Google Voice) */}
                    {wantsNumber && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block">
                                <span className="font-medium text-gray-900 mb-2 block">
                                    Optional: Forward work calls to your personal phone
                                </span>
                                <input
                                    type="tel"
                                    value={forwardToNumber}
                                    onChange={(e) => setForwardToNumber(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                    If you provide your personal number, work calls can be forwarded automatically. 
                                    You can always change this later.
                                </p>
                            </label>
                        </div>
                    )}

                    {/* How It Works */}
                    {wantsNumber && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">info</span>
                                How It Works
                            </h3>
                            <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                                <li>We'll help you create a free Google Voice account (if you don't have one)</li>
                                <li>You'll choose your own phone number from available options</li>
                                <li>The number gets linked to your work account automatically</li>
                                <li>Start receiving task notifications and customer calls instantly</li>
                                <li>Access voicemail, call history, and texts through Google Voice app</li>
                            </ol>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={onSkip}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={loading}
                    >
                        I'll decide later
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <span className="material-icons text-sm">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleVoiceOptIn;

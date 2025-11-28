import React, { useState } from 'react';
import { googleVoiceService } from '../../services/googleVoiceService';

interface GoogleVoiceSetupWizardProps {
    businessId: string;
    teamMemberId: string;
    teamMemberName: string;
    forwardToNumber?: string;
    onComplete: (phoneNumber: string) => void;
    onCancel: () => void;
}

type SetupStep = 'intro' | 'instructions' | 'enter-number' | 'verify' | 'complete';

export const GoogleVoiceSetupWizard: React.FC<GoogleVoiceSetupWizardProps> = ({
    businessId,
    teamMemberId,
    teamMemberName,
    forwardToNumber,
    onComplete,
    onCancel
}) => {
    const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
    const [googleVoiceNumber, setGoogleVoiceNumber] = useState('');
    const [googleEmail, setGoogleEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const instructions = googleVoiceService.getSetupInstructions();

    const handleNext = () => {
        const steps: SetupStep[] = ['intro', 'instructions', 'enter-number', 'verify', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const steps: SetupStep[] = ['intro', 'instructions', 'enter-number', 'verify', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const handleSaveNumber = async () => {
        if (!googleVoiceNumber || !googleEmail) {
            setError('Please enter both your Google Voice number and email');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await googleVoiceService.saveGoogleVoiceNumber(
            businessId,
            teamMemberId,
            googleVoiceNumber,
            googleEmail,
            forwardToNumber
        );

        setLoading(false);

        if (result.success) {
            handleNext(); // Move to verification step
        } else {
            setError(result.error || 'Failed to save Google Voice number');
        }
    };

    const openGoogleVoice = () => {
        window.open(instructions.setupUrl, '_blank');
    };

    const openVideoTutorial = () => {
        if (instructions.videoTutorialUrl) {
            window.open(instructions.videoTutorialUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="material-icons">phone_in_talk</span>
                        Get Your Free Business Phone
                    </h2>
                    <p className="mt-2 opacity-90">
                        Set up your free Google Voice number in just a few minutes
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        {['Intro', 'Instructions', 'Enter Number', 'Verify', 'Complete'].map((label, index) => (
                            <div key={label} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    ['intro', 'instructions', 'enter-number', 'verify', 'complete'].indexOf(currentStep) >= index
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {index + 1}
                                </div>
                                {index < 4 && (
                                    <div className={`w-12 h-1 ${
                                        ['intro', 'instructions', 'enter-number', 'verify', 'complete'].indexOf(currentStep) > index
                                            ? 'bg-blue-600'
                                            : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Intro */}
                    {currentStep === 'intro' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📱</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Welcome, {teamMemberName}!
                                </h3>
                                <p className="text-gray-600">
                                    Let's get you set up with a free business phone number
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                        <span className="material-icons">check_circle</span>
                                        What You'll Get
                                    </h4>
                                    <ul className="space-y-2 text-sm text-green-800">
                                        <li>✓ Free phone number for life</li>
                                        <li>✓ Unlimited SMS texting</li>
                                        <li>✓ Free voice calls</li>
                                        <li>✓ Voicemail & transcription</li>
                                        <li>✓ Call forwarding to your phone</li>
                                    </ul>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <span className="material-icons">schedule</span>
                                        Time Required
                                    </h4>
                                    <ul className="space-y-2 text-sm text-blue-800">
                                        <li>⏱ Setup: 3-5 minutes</li>
                                        <li>⏱ Choose number: 1 minute</li>
                                        <li>⏱ Verification: 2 minutes</li>
                                        <li>⏱ Total: ~6 minutes</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                                    <span className="material-icons">info</span>
                                    What You'll Need
                                </h4>
                                <ul className="space-y-1 text-sm text-yellow-800">
                                    <li>• A Google account (Gmail)</li>
                                    <li>• Your personal phone number (for verification)</li>
                                    <li>• 5 minutes of your time</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Instructions */}
                    {currentStep === 'instructions' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Follow These Steps
                                </h3>
                                <p className="text-gray-600">
                                    We'll guide you through creating your Google Voice account
                                </p>
                            </div>

                            <div className="space-y-4">
                                {instructions.steps.map((step, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900 mb-3">
                                    <strong>Need help?</strong> Watch our video tutorial or click the button below to open Google Voice
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={openGoogleVoice}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons">open_in_new</span>
                                        Open Google Voice
                                    </button>
                                    {instructions.videoTutorialUrl && (
                                        <button
                                            onClick={openVideoTutorial}
                                            className="flex-1 px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons">play_circle</span>
                                            Watch Tutorial
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enter Number */}
                    {currentStep === 'enter-number' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Enter Your New Number
                                </h3>
                                <p className="text-gray-600">
                                    Copy and paste your Google Voice number here
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                                    <span className="material-icons text-red-600">error</span>
                                    <p className="text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium text-gray-900 mb-2">
                                        Your Google Voice Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={googleVoiceNumber}
                                        onChange={(e) => {
                                            setGoogleVoiceNumber(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                        Enter the number exactly as shown in Google Voice
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-900 mb-2">
                                        Your Google Account Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={googleEmail}
                                        onChange={(e) => {
                                            setGoogleEmail(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="your.email@gmail.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                        The Gmail account you used for Google Voice
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-900">
                                    <strong>Tip:</strong> Your Google Voice number can be found at the top of the Google Voice website after you complete setup.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Verify */}
                    {currentStep === 'verify' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Number Saved!
                                </h3>
                                <p className="text-gray-600">
                                    Your Google Voice number has been linked to your account
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-700">Your Work Number:</span>
                                    <span className="text-xl font-bold text-blue-900">{googleVoiceNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Google Account:</span>
                                    <span className="font-medium text-gray-900">{googleEmail}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">What happens next:</h4>
                                <div className="space-y-2">
                                    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="material-icons text-green-600">check_circle</span>
                                        <p className="text-gray-700">You'll receive task assignments via SMS to this number</p>
                                    </div>
                                    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="material-icons text-green-600">check_circle</span>
                                        <p className="text-gray-700">Customers can call you on your work number</p>
                                    </div>
                                    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="material-icons text-green-600">check_circle</span>
                                        <p className="text-gray-700">All calls and texts are tracked automatically</p>
                                    </div>
                                    {forwardToNumber && (
                                        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                            <span className="material-icons text-green-600">check_circle</span>
                                            <p className="text-gray-700">Work calls will forward to: {forwardToNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Complete */}
                    {currentStep === 'complete' && (
                        <div className="space-y-6 text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                All Set!
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Your free business phone is ready to use
                            </p>

                            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Quick Tips:</h4>
                                <ul className="space-y-2 text-left text-gray-700">
                                    <li className="flex gap-2">
                                        <span className="material-icons text-blue-600">phone_iphone</span>
                                        <span>Download the Google Voice app on your phone</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="material-icons text-blue-600">notifications</span>
                                        <span>Enable notifications to get instant task alerts</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="material-icons text-blue-600">voicemail</span>
                                        <span>Set up a professional voicemail greeting</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="material-icons text-blue-600">settings</span>
                                        <span>Customize call forwarding in settings anytime</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => onComplete(googleVoiceNumber)}
                                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2"
                            >
                                <span>Get Started</span>
                                <span className="material-icons">arrow_forward</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {currentStep !== 'complete' && (
                    <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                        <button
                            onClick={currentStep === 'intro' ? onCancel : handleBack}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            disabled={loading}
                        >
                            <span className="material-icons text-sm">arrow_back</span>
                            {currentStep === 'intro' ? 'Cancel' : 'Back'}
                        </button>

                        <button
                            onClick={currentStep === 'enter-number' ? handleSaveNumber : handleNext}
                            disabled={loading || (currentStep === 'enter-number' && (!googleVoiceNumber || !googleEmail))}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {currentStep === 'enter-number' ? 'Save Number' : 'Continue'}
                                    <span className="material-icons text-sm">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleVoiceSetupWizard;

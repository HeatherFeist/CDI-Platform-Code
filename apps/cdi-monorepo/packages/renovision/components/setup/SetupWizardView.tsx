import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { supabase } from '../../supabase';

export default function SetupWizardView() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { status, refreshStatus } = useSetupStatus();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [showSkipWarning, setShowSkipWarning] = useState(false);
    const [skipAction, setSkipAction] = useState<() => void>(() => {});

    // Step 1: Business Details
    const [businessData, setBusinessData] = useState({
        company_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
    });

    // Step 2: Payment Settings
    const [paymentData, setPaymentData] = useState({
        paypal_email: '',
        cashapp_cashtag: '',
        paypal_enabled: false,
        cashapp_enabled: false,
    });

    // Step 3: AI Settings
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    const handleBusinessSubmit = async () => {
        if (!userProfile?.business_id) return;
        
        setSaving(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update(businessData)
                .eq('id', userProfile.business_id);

            if (error) throw error;

            await refreshStatus();
            setCurrentStep(2);
        } catch (error: any) {
            alert(`Error saving business details: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!userProfile?.business_id) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('payment_settings')
                .upsert({
                    business_id: userProfile.business_id,
                    paypal_email: paymentData.paypal_email,
                    cashapp_cashtag: paymentData.cashapp_cashtag,
                    payment_methods_enabled: {
                        paypal: paymentData.paypal_enabled,
                        cashapp: paymentData.cashapp_enabled,
                    }
                }, {
                    onConflict: 'business_id'
                });

            if (error) throw error;

            await refreshStatus();
            setCurrentStep(3);
        } catch (error: any) {
            alert(`Error saving payment settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAISubmit = async () => {
        console.log('handleAISubmit called');
        console.log('userProfile:', userProfile);
        console.log('business_id:', userProfile?.business_id);
        console.log('apiKey length:', apiKey?.length);

        if (!userProfile?.business_id) {
            console.error('No business_id found!');
            alert('Error: No business profile found. Please contact support.');
            return;
        }

        setSaving(true);
        try {
            console.log('Saving API key to database...');
            const { data, error } = await supabase
                .from('businesses')
                .update({ gemini_api_key: apiKey })
                .eq('id', userProfile.business_id)
                .select();

            console.log('Update response:', { data, error });

            if (error) throw error;

            console.log('API key saved successfully, refreshing status...');
            await refreshStatus();
            
            console.log('Navigating to dashboard...');
            navigate('/business/dashboard');
        } catch (error: any) {
            console.error('Error in handleAISubmit:', error);
            alert(`Error saving API key: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSkipClick = (nextAction: () => void, isCritical: boolean) => {
        if (isCritical) {
            setSkipAction(() => nextAction);
            setShowSkipWarning(true);
        } else {
            nextAction();
        }
    };

    const confirmSkip = () => {
        setShowSkipWarning(false);
        skipAction();
    };

    const steps = [
        { number: 1, title: 'Business Details', icon: 'business' },
        { number: 2, title: 'Payment Methods', icon: 'payment' },
        { number: 3, title: 'AI Features', icon: 'auto_awesome' },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Skip Warning Modal */}
            {showSkipWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="material-icons text-red-600 text-2xl">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Are You Sure?</h3>
                                <p className="text-sm text-gray-600">
                                    Skipping this step will prevent critical features from working properly.
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-900 font-medium mb-2">
                                {currentStep === 1 && "⚠️ Estimates, Invoices, and Customer Communications will NOT work"}
                                {currentStep === 2 && "🚫 You will NOT be able to accept payments or send estimates"}
                            </p>
                            <p className="text-xs text-red-800">
                                You can complete this setup later, but you won't be able to use the application effectively until you do.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSkipWarning(false)}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Complete Setup Now
                            </button>
                            <button
                                onClick={confirmSkip}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Skip Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 md:p-8 text-white">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to Constructive! 🎉</h1>
                    <p className="text-blue-100">Let's get your business set up in just a few steps</p>
                </div>

                {/* Progress Steps */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.number}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
                                        currentStep >= step.number
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                    }`}>
                                        {currentStep > step.number ? (
                                            <span className="material-icons">check</span>
                                        ) : (
                                            <span className="material-icons">{step.icon}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs md:text-sm mt-2 font-medium hidden md:block ${
                                        currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 md:mx-4 ${
                                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Step 1: Business Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Business Information</h2>
                                <p className="text-gray-600">This information will appear on your estimates and invoices</p>
                            </div>

                            {/* Warning about consequences */}
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                                <div className="flex gap-3">
                                    <span className="material-icons text-amber-600 flex-shrink-0">warning</span>
                                    <div className="text-sm text-amber-900">
                                        <p className="font-semibold mb-1">⚠️ Required for Core Features</p>
                                        <p className="mb-2">Without complete business details, the following features will NOT work:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>Estimates & Invoices</strong> - Cannot generate professional documents</li>
                                            <li><strong>Customer Communications</strong> - No contact information displayed</li>
                                            <li><strong>Payment Processing</strong> - Customers won't know where to send payment</li>
                                            <li><strong>Legal Compliance</strong> - Business documents require valid address</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={businessData.company_name}
                                        onChange={(e) => setBusinessData({ ...businessData, company_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Constructive Designs Inc."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={businessData.phone}
                                            onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={businessData.address}
                                        onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="123 Main Street"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={businessData.city}
                                            onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={businessData.state}
                                            onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            maxLength={2}
                                            placeholder="CA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP Code *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={businessData.zip}
                                            onChange={(e) => setBusinessData({ ...businessData, zip: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="90210"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => handleSkipClick(() => navigate('/business/dashboard'), true)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Skip for now
                                </button>
                                <button
                                    onClick={handleBusinessSubmit}
                                    disabled={saving || !businessData.company_name || !businessData.phone || !businessData.address}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Continue'}
                                    <span className="material-icons">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Payment Settings */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Methods</h2>
                                <p className="text-gray-600">Set up how you'll receive payments from customers</p>
                            </div>

                            {/* Warning about consequences */}
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <div className="flex gap-3">
                                    <span className="material-icons text-red-600 flex-shrink-0">error</span>
                                    <div className="text-sm text-red-900">
                                        <p className="font-semibold mb-1">🚫 Critical: Payment Features Disabled</p>
                                        <p className="mb-2">Without payment methods configured, you <strong>CANNOT</strong>:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>Send Estimates</strong> - No payment instructions included</li>
                                            <li><strong>Accept Online Payments</strong> - Customers have no way to pay</li>
                                            <li><strong>Track Revenue</strong> - Payment tracking will not function</li>
                                            <li><strong>Issue Invoices</strong> - Invoices require payment details</li>
                                        </ul>
                                        <p className="mt-2 font-medium">⚠️ At least one payment method (PayPal OR CashApp) is required.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* PayPal */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="material-icons text-blue-600">account_balance</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">PayPal</h3>
                                                <p className="text-sm text-gray-600">Accept credit cards and PayPal</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={paymentData.paypal_enabled}
                                                onChange={(e) => setPaymentData({ ...paymentData, paypal_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {paymentData.paypal_enabled && (
                                        <input
                                            type="email"
                                            value={paymentData.paypal_email}
                                            onChange={(e) => setPaymentData({ ...paymentData, paypal_email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="your-email@example.com"
                                        />
                                    )}
                                </div>

                                {/* CashApp */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <span className="material-icons text-green-600">attach_money</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Cash App</h3>
                                                <p className="text-sm text-gray-600">Quick mobile payments</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={paymentData.cashapp_enabled}
                                                onChange={(e) => setPaymentData({ ...paymentData, cashapp_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    {paymentData.cashapp_enabled && (
                                        <input
                                            type="text"
                                            value={paymentData.cashapp_cashtag}
                                            onChange={(e) => setPaymentData({ ...paymentData, cashapp_cashtag: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="$YourCashTag"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 pt-4">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <span className="material-icons">arrow_back</span>
                                    Back
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSkipClick(() => setCurrentStep(3), true)}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={saving}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? 'Saving...' : 'Continue'}
                                        <span className="material-icons">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: AI Settings */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Enable AI Features</h2>
                                <p className="text-gray-600">Add your Google Gemini API key to unlock AI-powered estimates and design tools</p>
                            </div>

                            {/* Warning about consequences */}
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <div className="flex gap-3">
                                    <span className="material-icons text-blue-600 flex-shrink-0">info</span>
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">🤖 AI Features Disabled Without API Key</p>
                                        <p className="mb-2">You can skip this step, but these features will be unavailable:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>AI-Powered Estimates</strong> - Automatic cost calculations won't work</li>
                                            <li><strong>Master Craftsman AI</strong> - No intelligent project recommendations</li>
                                            <li><strong>Design Assistant</strong> - AI design suggestions disabled</li>
                                            <li><strong>Smart Image Analysis</strong> - Cannot analyze project photos</li>
                                        </ul>
                                        <p className="mt-2 font-medium">💡 You can add your API key later in Settings.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <span className="material-icons text-blue-600">info</span>
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">Get your free API key:</p>
                                        <ol className="list-decimal ml-4 space-y-1">
                                            <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                                            <li>Sign in with your Google account</li>
                                            <li>Click "Create API Key"</li>
                                            <li>Copy and paste it below</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gemini API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="AIzaSy..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-icons text-sm">
                                            {showKey ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 pt-4">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <span className="material-icons">arrow_back</span>
                                    Back
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/business/dashboard')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        onClick={handleAISubmit}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? 'Saving...' : 'Complete Setup'}
                                        <span className="material-icons">check_circle</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

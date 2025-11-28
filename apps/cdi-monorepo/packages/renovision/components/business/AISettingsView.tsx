import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export default function AISettingsView() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingKey, setTestingKey] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [keyStatus, setKeyStatus] = useState<'not_set' | 'valid' | 'invalid'>('not_set');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchAPIKey();
    }, [userProfile]);

    const fetchAPIKey = async () => {
        if (!userProfile?.id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch API key from USER'S profile (user-owned API keys)
            const { data, error } = await supabase
                .from('profiles')
                .select('gemini_api_key')
                .eq('id', userProfile.id)
                .single();

            if (error) throw error;

            if (data?.gemini_api_key) {
                setApiKey(data.gemini_api_key);
                setKeyStatus('valid');
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAPIKey = async () => {
        if (!userProfile?.id) {
            setErrorMessage('User profile not found');
            return;
        }

        if (!apiKey.trim()) {
            setErrorMessage('Please enter an API key');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Save API key to USER'S profile (user-owned API keys)
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    gemini_api_key: apiKey.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            setSuccessMessage('API key saved successfully!');
            setKeyStatus('valid');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving API key:', error);
            setErrorMessage('Failed to save API key. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestAPIKey = async () => {
        if (!apiKey.trim()) {
            setErrorMessage('Please enter an API key to test');
            return;
        }

        setTestingKey(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Test the API key with a simple request
            const { GoogleGenAI } = await import('@google/genai');
            const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });
            
            // Simple test prompt
            const result = await genAI.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: [{ role: 'user', parts: [{ text: 'Say "API key is working" if you can read this.' }] }]
            });
            const text = result.text?.trim();

            if (text) {
                setKeyStatus('valid');
                setSuccessMessage('✓ API key is valid and working!');
            } else {
                setKeyStatus('invalid');
                setErrorMessage('API key test failed. Please check your key.');
            }
        } catch (error: any) {
            console.error('Error testing API key:', error);
            setKeyStatus('invalid');
            if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
                setErrorMessage('Invalid API key. Please check and try again.');
            } else {
                setErrorMessage('Failed to test API key: ' + (error.message || 'Please check your internet connection.'));
            }
        } finally {
            setTestingKey(false);
        }
    };

    const handleClearAPIKey = async () => {
        if (!confirm('Are you sure you want to remove your API key? AI features will stop working.')) {
            return;
        }

        if (!userProfile?.business_id) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ 
                    gemini_api_key: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.business_id);

            if (error) throw error;

            setApiKey('');
            setKeyStatus('not_set');
            setSuccessMessage('API key removed successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error clearing API key:', error);
            setErrorMessage('Failed to remove API key');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!userProfile?.id) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                        <span className="material-icons text-yellow-600 mr-3">warning</span>
                        <div>
                            <h3 className="text-yellow-800 font-semibold">User Profile Required</h3>
                            <p className="text-yellow-700 mt-1">
                                Please sign in to configure AI settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Configure your Google Gemini API key to enable AI-powered features
                </p>
            </div>

            {/* Status Banner */}
            <div className={`rounded-lg p-4 ${
                keyStatus === 'valid' 
                    ? 'bg-green-50 border border-green-200' 
                    : keyStatus === 'invalid'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
            }`}>
                <div className="flex items-center">
                    <span className={`material-icons mr-3 ${
                        keyStatus === 'valid' 
                            ? 'text-green-600' 
                            : keyStatus === 'invalid'
                            ? 'text-red-600'
                            : 'text-gray-400'
                    }`}>
                        {keyStatus === 'valid' ? 'check_circle' : keyStatus === 'invalid' ? 'error' : 'info'}
                    </span>
                    <div>
                        <h3 className={`font-semibold ${
                            keyStatus === 'valid' 
                                ? 'text-green-800' 
                                : keyStatus === 'invalid'
                                ? 'text-red-800'
                                : 'text-gray-700'
                        }`}>
                            {keyStatus === 'valid' 
                                ? 'API Key Configured' 
                                : keyStatus === 'invalid'
                                ? 'API Key Invalid'
                                : 'API Key Not Configured'}
                        </h3>
                        <p className={`text-sm mt-1 ${
                            keyStatus === 'valid' 
                                ? 'text-green-700' 
                                : keyStatus === 'invalid'
                                ? 'text-red-700'
                                : 'text-gray-600'
                        }`}>
                            {keyStatus === 'valid' 
                                ? 'Your AI features are enabled and ready to use' 
                                : keyStatus === 'invalid'
                                ? 'Please check your API key and try again'
                                : 'Add your API key to enable AI-powered estimates, chat assistance, and more'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="material-icons text-green-600 mr-3">check_circle</span>
                        <p className="text-green-800">{successMessage}</p>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="material-icons text-red-600 mr-3">error</span>
                        <p className="text-red-800">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* API Key Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Gemini API Key
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Gemini API key"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons text-sm">
                                    {showKey ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <button
                            onClick={handleTestAPIKey}
                            disabled={testingKey || !apiKey.trim()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {testingKey ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons text-sm">play_arrow</span>
                                    Test
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Your API key is stored securely and never shared. Get your free API key from{' '}
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        onClick={handleClearAPIKey}
                        disabled={saving || !apiKey}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remove Key
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchAPIKey}
                            disabled={saving}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSaveAPIKey}
                            disabled={saving || !apiKey.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons text-sm">save</span>
                                    Save API Key
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Features Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    AI Features Enabled by This Key
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-blue-600 mt-1">auto_awesome</span>
                        <div>
                            <h4 className="font-medium text-gray-900">Natural Language Estimates</h4>
                            <p className="text-sm text-gray-600">
                                Create detailed estimates from plain English project descriptions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-purple-600 mt-1">chat</span>
                        <div>
                            <h4 className="font-medium text-gray-900">AI Chat Assistant</h4>
                            <p className="text-sm text-gray-600">
                                Get intelligent answers about your projects and estimates
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-green-600 mt-1">image</span>
                        <div>
                            <h4 className="font-medium text-gray-900">Photo Analysis</h4>
                            <p className="text-sm text-gray-600">
                                Analyze project photos for damage assessment and recommendations
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-orange-600 mt-1">calculate</span>
                        <div>
                            <h4 className="font-medium text-gray-900">Smart Cost Estimation</h4>
                            <p className="text-sm text-gray-600">
                                Regional pricing with ZIP code-based unit cost adjustments
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to Get API Key */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    How to Get Your API Key
                </h3>
                <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">1.</span>
                        <span>
                            Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">2.</span>
                        <span>Sign in with your Google account</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">3.</span>
                        <span>Click "Create API Key" or "Get API Key"</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">4.</span>
                        <span>Copy the generated key and paste it above</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">5.</span>
                        <span>Click "Test" to verify, then "Save API Key"</span>
                    </li>
                </ol>
                <p className="mt-4 text-sm text-blue-700">
                    <strong>Note:</strong> The free tier includes 15 requests per minute, which is sufficient for most construction businesses.
                </p>
            </div>
        </div>
    );
}

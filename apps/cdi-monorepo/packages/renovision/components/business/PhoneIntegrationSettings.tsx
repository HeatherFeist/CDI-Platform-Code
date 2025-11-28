import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface PhoneIntegration {
    id?: string;
    business_id: string;
    phone_number: string;
    phone_provider: string;
    sms_enabled: boolean;
    voice_enabled: boolean;
    call_recording_enabled: boolean;
    auto_create_lead: boolean;
}

export const PhoneIntegrationSettings: React.FC = () => {
    const { userProfile } = useAuth();
    const [settings, setSettings] = useState<PhoneIntegration | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneProvider, setPhoneProvider] = useState('twilio');
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [callRecording, setCallRecording] = useState(false);
    const [autoCreateLead, setAutoCreateLead] = useState(true);

    useEffect(() => {
        if (userProfile?.business_id) {
            loadSettings();
        }
    }, [userProfile]);

    const loadSettings = async () => {
        if (!userProfile?.business_id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('phone_integrations')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setSettings(data);
                setPhoneNumber(data.phone_number || '');
                setPhoneProvider(data.phone_provider || 'twilio');
                setSmsEnabled(data.sms_enabled);
                setVoiceEnabled(data.voice_enabled);
                setCallRecording(data.call_recording_enabled);
                setAutoCreateLead(data.auto_create_lead);
            }
        } catch (error) {
            console.error('Error loading phone settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userProfile?.business_id) return;

        try {
            setSaving(true);

            const integrationData = {
                business_id: userProfile.business_id,
                phone_number: phoneNumber,
                phone_provider: phoneProvider,
                sms_enabled: smsEnabled,
                voice_enabled: voiceEnabled,
                call_recording_enabled: callRecording,
                auto_create_lead: autoCreateLead
            };

            if (settings?.id) {
                // Update existing
                const { error } = await supabase
                    .from('phone_integrations')
                    .update(integrationData)
                    .eq('id', settings.id);

                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('phone_integrations')
                    .insert(integrationData);

                if (error) throw error;
            }

            alert('Phone integration settings saved successfully!');
            loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="material-icons text-blue-600">phone</span>
                    Phone Integration Settings
                </h2>

                <div className="space-y-6">
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Connect Your Business Phone</h3>
                        <p className="text-sm text-blue-800">
                            Connect your business phone number to automatically log calls, send SMS notifications 
                            to team members, and create leads from incoming calls. We support Twilio, Vonage, and other providers.
                        </p>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter your business phone number in international format (e.g., +1234567890)
                        </p>
                    </div>

                    {/* Phone Provider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Provider
                        </label>
                        <select
                            value={phoneProvider}
                            onChange={(e) => setPhoneProvider(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="twilio">Twilio</option>
                            <option value="vonage">Vonage (Nexmo)</option>
                            <option value="plivo">Plivo</option>
                            <option value="other">Other / Manual Setup</option>
                        </select>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Features</h3>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">SMS Notifications</div>
                                <div className="text-sm text-gray-600">
                                    Send SMS to team members for task invitations and updates
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={smsEnabled}
                                    onChange={(e) => setSmsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Voice Calls</div>
                                <div className="text-sm text-gray-600">
                                    Enable phone call logging and tracking
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={voiceEnabled}
                                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Call Recording</div>
                                <div className="text-sm text-gray-600">
                                    Automatically record phone calls for quality and training
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={callRecording}
                                    onChange={(e) => setCallRecording(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Auto-Create Leads</div>
                                <div className="text-sm text-gray-600">
                                    Automatically create customer leads from incoming calls
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoCreateLead}
                                    onChange={(e) => setAutoCreateLead(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Setup Instructions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Setup Instructions</h3>
                        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                            <li>Sign up for a {phoneProvider === 'twilio' ? 'Twilio' : phoneProvider} account</li>
                            <li>Purchase a phone number or port your existing number</li>
                            <li>Configure webhooks to point to your application URL</li>
                            <li>Add your API credentials in the advanced settings</li>
                            <li>Test the integration by sending a test SMS</li>
                        </ol>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving || !phoneNumber}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhoneIntegrationSettings;

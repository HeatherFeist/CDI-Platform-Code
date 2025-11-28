import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface CalendarSettings {
    id?: string;
    google_calendar_enabled: boolean;
    google_access_token?: string;
    google_refresh_token?: string;
    google_calendar_id?: string;
    sync_enabled: boolean;
}

export default function CalendarSettingsView() {
    const { userProfile } = useAuth();
    const [settings, setSettings] = useState<CalendarSettings>({
        google_calendar_enabled: false,
        sync_enabled: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userProfile?.business_id) {
            fetchSettings();
        }
    }, [userProfile]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('calendar_settings')
                .select('*')
                .eq('business_id', userProfile!.business_id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                setSettings({
                    id: data.id,
                    google_calendar_enabled: data.google_calendar_enabled,
                    google_calendar_id: data.google_calendar_id,
                    sync_enabled: data.sync_enabled
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGoogleCalendar = async () => {
        // This would initiate OAuth flow with Google Calendar API
        // For now, we'll simulate the connection
        alert('Google Calendar integration requires OAuth setup. This will:\n\n' +
              '1. Redirect to Google sign-in\n' +
              '2. Request calendar permissions\n' +
              '3. Store access tokens securely\n' +
              '4. Enable automatic appointment syncing\n\n' +
              'Implementation requires Google Cloud project setup.');
        
        // In production, you would:
        // 1. Redirect to Google OAuth URL
        // 2. Handle callback with authorization code
        // 3. Exchange code for tokens
        // 4. Store tokens in calendar_settings table
        
        // For demonstration purposes:
        const mockConnection = confirm('Simulate Google Calendar connection for demo?');
        if (mockConnection) {
            try {
                setSaving(true);
                const { data, error } = await supabase
                    .from('calendar_settings')
                    .upsert({
                        business_id: userProfile!.business_id,
                        google_calendar_enabled: true,
                        google_calendar_id: 'primary',
                        sync_enabled: true,
                        google_access_token: 'demo_access_token',
                        google_refresh_token: 'demo_refresh_token'
                    })
                    .select()
                    .single();

                if (error) throw error;
                
                setSettings({
                    ...settings,
                    id: data.id,
                    google_calendar_enabled: true,
                    google_calendar_id: 'primary'
                });
                
                alert('Google Calendar connected successfully! (Demo mode)');
            } catch (error) {
                console.error('Error connecting calendar:', error);
                alert('Failed to connect calendar');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleDisconnectGoogleCalendar = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

        try {
            setSaving(true);
            const { error } = await supabase
                .from('calendar_settings')
                .update({
                    google_calendar_enabled: false,
                    google_access_token: null,
                    google_refresh_token: null,
                    google_calendar_id: null
                })
                .eq('business_id', userProfile!.business_id);

            if (error) throw error;
            
            setSettings({
                ...settings,
                google_calendar_enabled: false,
                google_calendar_id: undefined
            });
            
            alert('Google Calendar disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting calendar:', error);
            alert('Failed to disconnect calendar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleSync = async () => {
        try {
            setSaving(true);
            const newSyncEnabled = !settings.sync_enabled;
            
            const { error } = await supabase
                .from('calendar_settings')
                .update({ sync_enabled: newSyncEnabled })
                .eq('business_id', userProfile!.business_id);

            if (error) throw error;
            
            setSettings({ ...settings, sync_enabled: newSyncEnabled });
        } catch (error) {
            console.error('Error toggling sync:', error);
            alert('Failed to update sync settings');
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

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Calendar Settings</h1>
                <p className="text-gray-600 mt-1">Connect and manage your calendar integrations</p>
            </div>

            {/* Google Calendar Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 rounded-lg p-3">
                                <span className="material-icons text-blue-600 text-3xl">event</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Google Calendar</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {settings.google_calendar_enabled
                                        ? 'Connected and syncing appointments'
                                        : 'Connect to sync appointments automatically'
                                    }
                                </p>
                            </div>
                        </div>
                        {settings.google_calendar_enabled ? (
                            <button
                                onClick={handleDisconnectGoogleCalendar}
                                disabled={saving}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            >
                                {saving ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                        ) : (
                            <button
                                onClick={handleConnectGoogleCalendar}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Connecting...' : 'Connect Google Calendar'}
                            </button>
                        )}
                    </div>
                </div>

                {settings.google_calendar_enabled && (
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">Automatic Sync</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Automatically sync new appointments to Google Calendar
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleSync}
                                    disabled={saving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.sync_enabled ? 'bg-blue-600' : 'bg-gray-200'
                                    } disabled:opacity-50`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            settings.sync_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Connected Calendar</h4>
                                <p className="text-sm text-gray-600">
                                    Calendar ID: <span className="font-mono">{settings.google_calendar_id || 'primary'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* How It Works Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">How Calendar Integration Works</h3>
                <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-blue-600 mt-0.5">check_circle</span>
                        <div>
                            <strong>Two-way sync:</strong> Appointments created in the app will appear in your Google Calendar, 
                            and changes in Google Calendar will update in the app.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-blue-600 mt-0.5">check_circle</span>
                        <div>
                            <strong>Automatic updates:</strong> When you reschedule or cancel an appointment, 
                            it's automatically updated in Google Calendar.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-blue-600 mt-0.5">check_circle</span>
                        <div>
                            <strong>Team visibility:</strong> Share appointments with your team by connecting 
                            their Google Calendars to the same business account.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-blue-600 mt-0.5">check_circle</span>
                        <div>
                            <strong>Customer details:</strong> All customer information, project details, and notes 
                            are included in the calendar event description.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-blue-600 mt-0.5">check_circle</span>
                        <div>
                            <strong>Secure connection:</strong> Your calendar access is encrypted and stored securely. 
                            You can disconnect at any time.
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Calendar Services (Future) */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Calendar Services</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 rounded-lg p-3">
                                <span className="material-icons text-gray-400 text-3xl">event</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Outlook Calendar</h4>
                                <p className="text-sm text-gray-600">Coming soon</p>
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">Available Q1 2026</span>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 rounded-lg p-3">
                                <span className="material-icons text-gray-400 text-3xl">event</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Apple Calendar</h4>
                                <p className="text-sm text-gray-600">Coming soon</p>
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">Available Q2 2026</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

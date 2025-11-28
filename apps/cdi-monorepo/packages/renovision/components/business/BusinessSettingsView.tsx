import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface BusinessData {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export default function BusinessSettingsView() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchBusinessData();
    }, [userProfile]);

    const fetchBusinessData = async () => {
        if (!userProfile?.business_id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', userProfile.business_id)
                .single();

            if (error) throw error;

            if (data) {
                setBusinessName(data.name || '');
                setBusinessDescription(data.description || '');
            }
        } catch (error) {
            console.error('Error fetching business data:', error);
            setErrorMessage('Failed to load business information');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userProfile?.business_id) {
            setErrorMessage('Business profile not found');
            return;
        }

        if (!businessName.trim()) {
            setErrorMessage('Business name is required');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    name: businessName.trim(),
                    description: businessDescription.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.business_id);

            if (error) throw error;

            setSuccessMessage('Business profile updated successfully!');
            
            // Reload after a short delay to reflect changes throughout the app
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Error saving business data:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update business profile');
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

    if (!userProfile?.business_id) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                        <span className="material-icons text-yellow-600 mr-3">warning</span>
                        <div>
                            <h3 className="text-yellow-800 font-semibold">Business Profile Required</h3>
                            <p className="text-yellow-700 mt-1">
                                Please complete your business setup before accessing settings.
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
                <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
                <p className="text-gray-600 mt-1">Manage your business profile and information</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
                    <div className="flex items-center">
                        <span className="material-icons text-green-600 mr-3">check_circle</span>
                        <div>
                            <h3 className="text-green-800 font-semibold">Success!</h3>
                            <p className="text-green-700">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="material-icons text-red-600 mr-3">error</span>
                        <div>
                            <h3 className="text-red-800 font-semibold">Error</h3>
                            <p className="text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Business Profile Form */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="material-icons text-white text-2xl">business</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
                        <p className="text-sm text-gray-600">Update your business name and description</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g., ABC Construction, Smith Renovations"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            maxLength={255}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            This name will appear on estimates, invoices, and throughout the app
                        </p>
                    </div>

                    {/* Business Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Description <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                            value={businessDescription}
                            onChange={(e) => setBusinessDescription(e.target.value)}
                            placeholder="Brief description of your business, services offered, specialties, etc."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            maxLength={1000}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {businessDescription.length}/1000 characters
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving || !businessName.trim()}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin material-icons">refresh</span>
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">save</span>
                                    <span>Save Business Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="material-icons text-blue-600">info</span>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">About Business Settings</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Your business name appears on all customer-facing documents</li>
                            <li>• Changes will be reflected throughout the app immediately after saving</li>
                            <li>• The page will reload automatically to apply your changes</li>
                            <li>• Keep your business information up-to-date for professional communication</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Additional Settings Sections (Future Expansion) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-icons text-gray-400">settings</span>
                    <h3 className="text-lg font-semibold text-gray-900">More Settings Coming Soon</h3>
                </div>
                <p className="text-gray-600 text-sm">
                    Additional business settings like address, contact information, logo, 
                    tax ID, and other details will be added in future updates.
                </p>
            </div>
        </div>
    );
}

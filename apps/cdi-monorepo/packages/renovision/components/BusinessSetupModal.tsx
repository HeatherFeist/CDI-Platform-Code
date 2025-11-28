import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface BusinessSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBusinessCreated: () => void;
}

export const BusinessSetupModal: React.FC<BusinessSetupModalProps> = ({ isOpen, onClose, onBusinessCreated }) => {
    const { userProfile, user } = useAuth();
    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user) {
            setError('You must be logged in to create a business.');
            setLoading(false);
            return;
        }

        try {
            console.log('Creating business:', formData);

            // Create the business
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .insert({
                    name: formData.businessName,
                    description: formData.description
                })
                .select()
                .single();

            if (businessError) {
                console.error('Error creating business:', businessError);
                throw businessError;
            }

            console.log('Business created:', businessData);

            // Update the user's profile with the new business_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ business_id: businessData.id })
                .eq('id', user.id);

            if (profileError) {
                console.error('Error updating profile:', profileError);
                throw profileError;
            }

            console.log('Profile updated with business_id:', businessData.id);

            alert('Business created successfully! Please refresh the page.');
            onBusinessCreated();
            onClose();
            
            // Reload the page to refresh the context
            window.location.reload();
        } catch (err) {
            console.error('Error creating business:', err);
            setError(err instanceof Error ? err.message : 'Failed to create business');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">Set Up Your Business</h2>
                    <p className="text-gray-600 mb-4">
                        You need to set up a business profile before you can create projects.
                    </p>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Business Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                    required
                                    placeholder="e.g., ABC Construction"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                    rows={3}
                                    placeholder="Brief description of your business"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            >
                                {loading ? 'Creating...' : 'Create Business'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

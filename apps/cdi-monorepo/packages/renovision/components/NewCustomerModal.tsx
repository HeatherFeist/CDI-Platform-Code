import React, { useState } from 'react';
import { Customer } from '../types/business';
import { supabaseBusinessService } from '../services/supabaseBusinessService';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { BusinessSetupModal } from './BusinessSetupModal';

interface NewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCustomerCreated: (customer: Customer) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, onCustomerCreated }) => {
    const { userProfile } = useAuth();
    const businessId = userProfile?.business_id;
    const [showBusinessSetup, setShowBusinessSetup] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        source: '',
        notes: '',
        communicationPreferences: {
            email: true,
            sms: false,
            phone: true
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!businessId) {
            setError('Business profile required. Please set up your business first.');
            setShowBusinessSetup(true);
            setLoading(false);
            return;
        }

        console.log('Creating customer with businessId:', businessId);

        try {
            const customerData = {
                businessId: businessId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                },
                communicationPreferences: formData.communicationPreferences,
                source: formData.source,
                notes: formData.notes,
                projects: [],
                tags: [],
                totalSpent: 0,
                projectCount: 0,
                lastContactDate: undefined,
            };

            console.log('Customer data:', customerData);
            const createdCustomer = await supabaseBusinessService.createCustomer(customerData);
            console.log('Customer created:', createdCustomer);
            onCustomerCreated(createdCustomer);
            onClose();
        } catch (err) {
            console.error('Error creating customer:', err);
            setError(err instanceof Error ? err.message : 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">New Customer</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form id="new-customer-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-2">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        ZIP Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Source
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="How did they find us?"
                                        value={formData.source}
                                        onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Communication Preferences
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.communicationPreferences.email}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    communicationPreferences: {
                                                        ...prev.communicationPreferences,
                                                        email: e.target.checked
                                                    }
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2">Email</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.communicationPreferences.sms}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    communicationPreferences: {
                                                        ...prev.communicationPreferences,
                                                        sms: e.target.checked
                                                    }
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2">SMS</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.communicationPreferences.phone}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    communicationPreferences: {
                                                        ...prev.communicationPreferences,
                                                        phone: e.target.checked
                                                    }
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2">Phone</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                {/* Fixed footer with buttons */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="new-customer-form"
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {loading ? 'Creating...' : 'Create Customer'}
                    </button>
                </div>
            </div>
        </div>
        
        <BusinessSetupModal
            isOpen={showBusinessSetup}
            onClose={() => setShowBusinessSetup(false)}
            onBusinessCreated={() => {
                setShowBusinessSetup(false);
                // Reload to refresh user profile with business_id
                window.location.reload();
            }}
        />
        </>
    );
};
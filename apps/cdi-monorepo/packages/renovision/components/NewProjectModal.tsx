import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { supabaseBusinessService } from '../services/supabaseBusinessService';
import { Project, ProjectStatus } from '../types/business';
import { BusinessSetupModal } from './BusinessSetupModal';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const { userProfile } = useAuth();
    const { customers } = useBusinessContext();
    const businessId = userProfile?.business_id;
    
    const [formData, setFormData] = useState({
        customerId: '',
        name: '',
        description: '',
        estimatedDuration: '',
        category: 'Renovation',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showBusinessSetup, setShowBusinessSetup] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Check if Supabase is configured
        if (!businessId) {
            setError('Business ID not found. Please set up your business profile first.');
            setLoading(false);
            return;
        }

        if (!formData.customerId) {
            setError('Please select a customer');
            setLoading(false);
            return;
        }

        console.log('Creating project with businessId:', businessId);
        console.log('Form data:', formData);

        try {
            const projectData = {
                customerId: formData.customerId,
                name: formData.name,
                title: formData.name,
                description: formData.description,
                status: ProjectStatus.INQUIRY,
                priority: 'medium' as const,
                category: formData.category,
                estimatedDuration: parseInt(formData.estimatedDuration),
                location: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'USA'
                },
                photos: [],
                notes: [],
                tasks: [],
                payments: [],
                assignedTeam: [],
                materials: [],
                permits: [],
                inspections: [],
                warranties: [],
                milestones: []
            };

            console.log('Project data:', projectData);
            const projectId = await supabaseBusinessService.addProject(projectData, businessId);
            console.log('Project created with ID:', projectId);
            
            alert('Project created successfully!');
            onClose();
            // Refresh the page or notify parent to reload
            window.location.reload();
        } catch (err) {
            console.error('Error creating project:', err);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to create project';
            if (err instanceof Error) {
                if (err.message.includes('Supabase not configured')) {
                    errorMessage = 'Database not configured. Please contact support or check your Supabase configuration.';
                } else if (err.message.includes('JWT')) {
                    errorMessage = 'Authentication error. Please try signing out and back in.';
                } else if (err.message.includes('network') || err.message.includes('fetch')) {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">New Project</h2>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Customer *
                                </label>
                                <select
                                    value={formData.customerId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                    required
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.firstName} {customer.lastName}
                                        </option>
                                    ))}
                                </select>
                                {customers.length === 0 && (
                                    <p className="mt-1 text-sm text-amber-600">
                                        No customers available. Create a customer first.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                        required
                                    >
                                        <option value="Renovation">Renovation</option>
                                        <option value="Repair">Repair</option>
                                        <option value="Installation">Installation</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Estimated Duration (days)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimatedDuration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                                        required
                                        min="1"
                                    />
                                </div>
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
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
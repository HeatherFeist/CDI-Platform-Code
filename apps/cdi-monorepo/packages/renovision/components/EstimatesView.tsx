import React, { useState, useEffect } from 'react';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Estimate, EstimateItem } from '../types/business';
import { GeneratedEstimate } from '../services/geminiService';
import { supabaseBusinessService } from '../services/supabaseBusinessService';
import AIEstimateCreator from './business/AIEstimateCreator';
import EnhancedCalculator from './business/EnhancedCalculator';
import TeamMemberTagger from './business/TeamMemberTagger';
import DirectMessaging from './business/DirectMessaging';
import SimpleProductSearch from './estimates/SimpleProductSearch';
import AIProductSuggestions from './AIProductSuggestions';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { FeatureLock } from './common/FeatureLock';

export const EstimatesView: React.FC = () => {
    const { userProfile } = useAuth();
    const { customers, projects } = useBusinessContext();
    const businessId = userProfile?.business_id;
    
    console.log('EstimatesView: userProfile:', userProfile);
    console.log('EstimatesView: businessId:', businessId);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
    const [showAICreator, setShowAICreator] = useState(false);
    const [showEnhancedCalculator, setShowEnhancedCalculator] = useState(false);
    const [showTaskAssignment, setShowTaskAssignment] = useState(false);
    const [showMessaging, setShowMessaging] = useState(false);
    const [selectedEstimateForTasks, setSelectedEstimateForTasks] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [expandedEstimateId, setExpandedEstimateId] = useState<string | null>(null);
    const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    // Navigation safety hook
    const { checkUnsavedChanges } = useUnsavedChanges({ 
        hasUnsavedChanges,
        message: "You have unsaved estimate changes. Are you sure you want to leave without saving?"
    });

    useEffect(() => {
        loadEstimates();
    }, [businessId]);

    const loadEstimates = async () => {
        console.log('loadEstimates called, businessId:', businessId);
        
        if (!businessId) {
            console.log('No businessId, skipping load');
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            console.log('Fetching estimates from database...');
            const data = await supabaseBusinessService.getEstimates(businessId);
            console.log('Estimates loaded successfully:', data?.length || 0, 'estimates');
            setEstimates(data);
        } catch (error: any) {
            console.error('Error loading estimates:', error);
            alert(`Error loading estimates: ${error?.message || 'Unknown error'}`);
        } finally {
            console.log('Setting isLoading to false');
            setIsLoading(false);
        }
    };

    const handleCreateEstimate = () => {
        setSelectedEstimate(null);
        setShowModal(true);
    };

    const handleEditEstimate = (estimate: Estimate) => {
        // Toggle expanded view for inline editing
        if (expandedEstimateId === estimate.id) {
            // If already expanded, collapse it
            if (hasUnsavedChanges) {
                if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                    return;
                }
            }
            setExpandedEstimateId(null);
            setEditingEstimate(null);
            setEditingItemIndex(null);
            setHasUnsavedChanges(false);
        } else {
            // Expand this estimate for editing
            setExpandedEstimateId(estimate.id);
            setEditingEstimate({ ...estimate });
            setEditingItemIndex(null);
        }
    };

    const handleCreateWithAI = () => {
        if (!checkUnsavedChanges()) return;
        
        if (customers.length > 0) {
            setSelectedCustomerId(customers[0].id);
            setShowAICreator(true);
            setHasUnsavedChanges(true);
        } else {
            alert('Please create a customer first before generating an estimate.');
        }
    };

    const handleEnhancedCalculatorComplete = async (generatedEstimate: GeneratedEstimate) => {
        if (!businessId) return;
        
        try {
            // Convert GeneratedEstimate to Estimate format and save
            const estimateData: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'> = {
                businessId,
                customerId: customers[0]?.id || '', // Use first customer or let user select
                projectId: undefined,
                estimateNumber: `EST-${Date.now()}`,
                title: generatedEstimate.projectName,
                description: generatedEstimate.projectDescription,
                items: generatedEstimate.lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitCost,
                    total: item.totalCost
                } as EstimateItem)),
                subtotal: generatedEstimate.subtotal,
                taxRate: generatedEstimate.taxRate,
                taxAmount: generatedEstimate.taxAmount,
                total: generatedEstimate.total,
                status: 'draft',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: generatedEstimate.notes,
                terms: `Duration: ${generatedEstimate.estimatedDuration} days\n\nMeasurements:\n${JSON.stringify(generatedEstimate.measurements, null, 2)}`
            };
            
            await supabaseBusinessService.createEstimate(estimateData);
            setShowEnhancedCalculator(false);
            setHasUnsavedChanges(false); // Clear unsaved changes after successful save
            loadEstimates();
        } catch (error) {
            console.error('Error saving enhanced calculator estimate:', error);
            alert('Failed to save estimate. Please try again.');
        }
    };

    const handleAIEstimateComplete = (estimate: Estimate) => {
        setShowAICreator(false);
        setHasUnsavedChanges(false); // Clear unsaved changes after successful save
        loadEstimates();
    };

    const handleConvertToInvoice = async (estimateId: string) => {
        if (!businessId) return;
        if (confirm('Convert this estimate to an invoice?')) {
            try {
                await supabaseBusinessService.convertEstimateToInvoice(businessId, estimateId);
                alert('Estimate converted to invoice successfully!');
                loadEstimates();
            } catch (error) {
                console.error('Error converting estimate:', error);
                alert('Failed to convert estimate');
            }
        }
    };

    const handleDeleteEstimate = async (estimateId: string) => {
        if (!businessId) return;
        
        if (confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) {
            try {
                await supabaseBusinessService.deleteEstimate(businessId, estimateId);
                alert('Estimate deleted successfully!');
                
                // If the deleted estimate was being edited, close the edit view
                if (expandedEstimateId === estimateId) {
                    setExpandedEstimateId(null);
                    setEditingEstimate(null);
                    setEditingItemIndex(null);
                    setHasUnsavedChanges(false);
                }
                
                loadEstimates();
            } catch (error) {
                console.error('Error deleting estimate:', error);
                alert('Failed to delete estimate');
            }
        }
    };

    // Inline editing functions for expanded estimate view
    const updateEditingEstimateField = (field: keyof Estimate, value: any) => {
        if (!editingEstimate) return;
        setEditingEstimate({ ...editingEstimate, [field]: value });
        setHasUnsavedChanges(true);
    };

    const updateEditingItem = (index: number, field: keyof EstimateItem, value: string | number) => {
        if (!editingEstimate) return;
        const updatedItems = [...editingEstimate.items];
        const item = { ...updatedItems[index] };
        
        if (field === 'description') {
            item.description = value as string;
        } else if (field === 'quantity') {
            item.quantity = Number(value);
            item.total = Number((item.quantity * item.unitPrice).toFixed(2));
        } else if (field === 'unitPrice') {
            item.unitPrice = Number(value);
            item.total = Number((item.quantity * item.unitPrice).toFixed(2));
        }
        
        updatedItems[index] = item;
        setEditingEstimate({ ...editingEstimate, items: updatedItems });
        setHasUnsavedChanges(true);
    };

    const removeEditingItem = (index: number) => {
        if (!editingEstimate) return;
        const updatedItems = editingEstimate.items.filter((_, i) => i !== index);
        setEditingEstimate({ ...editingEstimate, items: updatedItems });
        setHasUnsavedChanges(true);
        setEditingItemIndex(null);
    };

    const addItemToEditingEstimate = () => {
        if (!editingEstimate) return;
        const newItem: EstimateItem = {
            description: 'New Item',
            quantity: 1,
            unitPrice: 0,
            total: 0
        };
        setEditingEstimate({ 
            ...editingEstimate, 
            items: [...editingEstimate.items, newItem] 
        });
        setHasUnsavedChanges(true);
        // Auto-focus on the new item for editing
        setEditingItemIndex(editingEstimate.items.length);
    };

    const calculateEditingTotal = () => {
        if (!editingEstimate) return { subtotal: 0, taxAmount: 0, total: 0 };
        const subtotal = editingEstimate.items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = subtotal * editingEstimate.taxRate;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    };

    const saveEditingEstimate = async () => {
        if (!editingEstimate || !businessId) return;
        
        try {
            const { subtotal, taxAmount, total } = calculateEditingTotal();
            
            const updatedData = {
                ...editingEstimate,
                subtotal: Number(subtotal.toFixed(2)),
                taxAmount: Number(taxAmount.toFixed(2)),
                total: Number(total.toFixed(2))
            };
            
            await supabaseBusinessService.updateEstimate(editingEstimate.id, updatedData);
            setHasUnsavedChanges(false);
            alert('Estimate updated successfully!');
            await loadEstimates();
            setExpandedEstimateId(null);
            setEditingEstimate(null);
            setEditingItemIndex(null);
        } catch (error) {
            console.error('Error saving estimate:', error);
            alert(`Failed to save estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const cancelEditingEstimate = () => {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
        }
        setExpandedEstimateId(null);
        setEditingEstimate(null);
        setEditingItemIndex(null);
        setHasUnsavedChanges(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'converted': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading estimates...</div>
            </div>
        );
    }

    return (
        <FeatureLock
            requiredSetup={['businessDetails', 'paymentSettings']}
            featureName="Estimates & Invoicing"
        >
            <div className="p-6">
                {showTaskAssignment ? (
                <div className="mb-6">
                    <button
                        onClick={() => {
                            setShowTaskAssignment(false);
                            setSelectedEstimateForTasks(null);
                        }}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back to Estimates</span>
                    </button>
                    {selectedEstimateForTasks && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Tag Team Members for Tasks</h3>
                            <p className="text-gray-600 mb-6">
                                Tag team members for individual line items. They'll receive instant notifications to accept or decline.
                            </p>
                            
                            {/* Map through the actual estimate's line items */}
                            <div className="space-y-6">
                                {(() => {
                                    const currentEstimate = estimates.find(e => e.id === selectedEstimateForTasks);
                                    if (!currentEstimate || !currentEstimate.items || currentEstimate.items.length === 0) {
                                        return (
                                            <div className="text-center py-8 text-gray-500">
                                                No line items found in this estimate.
                                            </div>
                                        );
                                    }

                                    return currentEstimate.items.map((item, index) => (
                                        <div key={`${currentEstimate.id}-item-${index}`} className="border rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-2">{item.description}</h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                <span>Qty: {item.quantity}</span>
                                                <span>Unit Price: ${item.unitPrice.toFixed(2)}</span>
                                            </div>
                                            <p className="text-green-600 font-semibold mb-3">
                                                Total: ${item.total.toFixed(2)}
                                            </p>
                                            
                                            <TeamMemberTagger
                                                lineItemIndex={index}
                                                lineItemDescription={item.description}
                                                lineItemCost={item.total}
                                                estimateId={selectedEstimateForTasks}
                                                onMembersTagged={(members) => {
                                                    console.log(`Members tagged for ${item.description}:`, members);
                                                }}
                                            />
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Save/Close Button */}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowTaskAssignment(false);
                                        setSelectedEstimateForTasks(null);
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : showEnhancedCalculator ? (
                <div className="mb-6">
                    <button
                        onClick={() => {
                            if (checkUnsavedChanges()) {
                                setShowEnhancedCalculator(false);
                                setHasUnsavedChanges(false);
                            }
                        }}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back to Estimates</span>
                    </button>
                    <EnhancedCalculator
                        onEstimateGenerated={handleEnhancedCalculatorComplete}
                        onCancel={() => {
                            if (checkUnsavedChanges()) {
                                setShowEnhancedCalculator(false);
                                setHasUnsavedChanges(false);
                            }
                        }}
                        onUnsavedChanges={setHasUnsavedChanges}
                    />
                </div>
            ) : showAICreator ? (
                <div className="mb-6">
                    <button
                        onClick={() => {
                            if (checkUnsavedChanges()) {
                                setShowAICreator(false);
                                setHasUnsavedChanges(false);
                            }
                        }}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back to Estimates</span>
                    </button>
                    {customers.length > 0 ? (
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Customer *
                            </label>
                            <select
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.firstName} {customer.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-amber-800">
                                Please create a customer first before generating an estimate.
                            </p>
                        </div>
                    )}
                    {selectedCustomerId && (
                        <AIEstimateCreator
                            customerId={selectedCustomerId}
                            onComplete={handleAIEstimateComplete}
                            onCancel={() => {
                                if (checkUnsavedChanges()) {
                                    setShowAICreator(false);
                                    setHasUnsavedChanges(false);
                                }
                            }}
                        />
                    )}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMessaging(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <span className="material-icons">message</span>
                                <span>Messages</span>
                            </button>
                            <button
                                onClick={handleCreateWithAI}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <span className="material-icons">auto_awesome</span>
                                <span>Create with AI</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!checkUnsavedChanges()) return;
                                    setShowEnhancedCalculator(true);
                                    setHasUnsavedChanges(true);
                                }}
                                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <span className="material-icons">calculate</span>
                                <span>Enhanced Calculator</span>
                            </button>
                            <button
                                onClick={handleCreateEstimate}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + New Estimate
                            </button>
                        </div>
                    </div>

                    {estimates.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500 mb-4">No estimates yet</p>
                            <button
                                onClick={handleCreateEstimate}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                Create your first estimate
                            </button>
                        </div>
                    ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estimate #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estimates.map((estimate) => (
                                <React.Fragment key={estimate.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            EST-{estimate.id.substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            CUS-{estimate.customerId.substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            PRJ-{estimate.projectId?.substring(0, 8) || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${estimate.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                                active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(estimate.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditEstimate(estimate)}
                                                className={`${expandedEstimateId === estimate.id ? 'text-green-600 hover:text-green-900' : 'text-blue-600 hover:text-blue-900'} mr-4 font-semibold`}
                                            >
                                                {expandedEstimateId === estimate.id ? '✓ Close' : 'Edit'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedEstimateForTasks(estimate.id);
                                                    setShowTaskAssignment(true);
                                                }}
                                                className="text-purple-600 hover:text-purple-900 mr-4"
                                            >
                                                Tag Members
                                            </button>
                                            <button
                                                onClick={() => handleConvertToInvoice(estimate.id)}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Convert to Invoice
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEstimate(estimate.id)}
                                                className="text-red-600 hover:text-red-900 font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded Inline Editing View */}
                                    {expandedEstimateId === estimate.id && editingEstimate && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 bg-gray-50">
                                                <div className="space-y-6">
                                                    {/* Header with Save/Cancel */}
                                                    <div className="flex justify-between items-center border-b pb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Editing Estimate: {editingEstimate.title || 'Untitled'}
                                                        </h3>
                                                        <div className="flex gap-3">
                                                            {hasUnsavedChanges && (
                                                                <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
                                                                    <span className="material-icons text-sm">warning</span>
                                                                    Unsaved Changes
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={cancelEditingEstimate}
                                                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={saveEditingEstimate}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                                            >
                                                                <span className="material-icons text-sm">save</span>
                                                                Save Changes
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Title & Description */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Title
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={editingEstimate.title || ''}
                                                                onChange={(e) => updateEditingEstimateField('title', e.target.value)}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Description
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={editingEstimate.description || ''}
                                                                onChange={(e) => updateEditingEstimateField('description', e.target.value)}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Line Items Table */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="text-md font-semibold text-gray-800">Line Items</h4>
                                                            <button
                                                                onClick={addItemToEditingEstimate}
                                                                className="px-4 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                            >
                                                                <span className="material-icons text-sm">add</span>
                                                                Add Item
                                                            </button>
                                                        </div>
                                                        <div className="bg-white rounded-lg border overflow-hidden">
                                                            <table className="min-w-full">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Description</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Quantity</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Unit Price</th>
                                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {editingEstimate.items.map((item, index) => (
                                                                        <React.Fragment key={index}>
                                                                            <tr className="border-t">
                                                                                <td className="px-4 py-3">
                                                                                    {editingItemIndex === index ? (
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.description}
                                                                                            onChange={(e) => updateEditingItem(index, 'description', e.target.value)}
                                                                                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                                                            autoFocus
                                                                                        />
                                                                                    ) : (
                                                                                        <span 
                                                                                            className="cursor-pointer hover:text-blue-600" 
                                                                                            onClick={() => setEditingItemIndex(index)}
                                                                                        >
                                                                                            {item.description}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    {editingItemIndex === index ? (
                                                                                        <input
                                                                                            type="number"
                                                                                            value={item.quantity}
                                                                                            onChange={(e) => updateEditingItem(index, 'quantity', e.target.value)}
                                                                                            className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                                                                        />
                                                                                    ) : (
                                                                                        <span 
                                                                                            className="cursor-pointer hover:text-blue-600" 
                                                                                            onClick={() => setEditingItemIndex(index)}
                                                                                        >
                                                                                            {item.quantity}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    {editingItemIndex === index ? (
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={item.unitPrice}
                                                                                            onChange={(e) => updateEditingItem(index, 'unitPrice', e.target.value)}
                                                                                            className="w-24 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                                                                        />
                                                                                    ) : (
                                                                                        <span 
                                                                                            className="cursor-pointer hover:text-blue-600" 
                                                                                            onClick={() => setEditingItemIndex(index)}
                                                                                        >
                                                                                            ${item.unitPrice.toFixed(2)}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right font-medium">
                                                                                    ${item.total.toFixed(2)}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <div className="flex justify-center gap-2">
                                                                                        {editingItemIndex === index ? (
                                                                                            <button
                                                                                                onClick={() => setEditingItemIndex(null)}
                                                                                                className="text-green-600 hover:text-green-800 text-sm"
                                                                                                title="Done editing"
                                                                                            >
                                                                                                <span className="material-icons text-sm">check</span>
                                                                                            </button>
                                                                                        ) : (
                                                                                            <button
                                                                                                onClick={() => setEditingItemIndex(index)}
                                                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                                                                title="Edit item"
                                                                                            >
                                                                                                <span className="material-icons text-sm">edit</span>
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => removeEditingItem(index)}
                                                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                                                            title="Remove item"
                                                                                        >
                                                                                            <span className="material-icons text-sm">delete</span>
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            {/* AI Product Suggestions Row */}
                                                                            {editingItemIndex !== index && (
                                                                                <tr>
                                                                                    <td colSpan={5} className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
                                                                                        <AIProductSuggestions
                                                                                            lineItemDescription={item.description}
                                                                                            lineItemIndex={index}
                                                                                            estimateId={editingEstimate.id}
                                                                                            onProductSelected={(product) => {
                                                                                                console.log('Product selected:', product);
                                                                                                // Optionally update the line item with product details
                                                                                                // updateEditingItem(index, 'description', product.productName);
                                                                                            }}
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Totals & Tax */}
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Tax Rate (%)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={(editingEstimate.taxRate * 100).toFixed(2)}
                                                                onChange={(e) => updateEditingEstimateField('taxRate', Number(e.target.value) / 100)}
                                                                className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div className="bg-white p-4 rounded-lg border">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Subtotal:</span>
                                                                    <span className="font-medium">${calculateEditingTotal().subtotal.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Tax:</span>
                                                                    <span className="font-medium">${calculateEditingTotal().taxAmount.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                                                    <span>Total:</span>
                                                                    <span className="text-blue-600">${calculateEditingTotal().total.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Notes & Terms */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Notes
                                                            </label>
                                                            <textarea
                                                                value={editingEstimate.notes || ''}
                                                                onChange={(e) => updateEditingEstimateField('notes', e.target.value)}
                                                                rows={4}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Terms
                                                            </label>
                                                            <textarea
                                                                value={editingEstimate.terms || ''}
                                                                onChange={(e) => updateEditingEstimateField('terms', e.target.value)}
                                                                rows={4}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

                    {showModal && (
                        <EstimateModal
                            estimate={selectedEstimate}
                            businessId={businessId}
                            customers={customers}
                            projects={projects}
                            onClose={() => {
                                setShowModal(false);
                                loadEstimates();
                            }}
                        />
                    )}
                </>
            )}

            {/* Direct Messaging Modal */}
            <DirectMessaging
                isOpen={showMessaging}
                onClose={() => setShowMessaging(false)}
            />
        </div>
        </FeatureLock>
    );
};

interface EstimateModalProps {
    estimate: Estimate | null;
    businessId: string | null;
    customers: any[];
    projects: any[];
    onClose: () => void;
}

const EstimateModal: React.FC<EstimateModalProps> = ({ estimate, businessId, customers, projects, onClose }) => {
    const [formData, setFormData] = useState({
        customerId: estimate?.customerId || '',
        projectId: estimate?.projectId || '',
        items: estimate?.items || [] as EstimateItem[],
        title: estimate?.title || '',
        description: estimate?.description || '',
        notes: estimate?.notes || '',
        taxRate: estimate?.taxRate || 0.08,
        terms: estimate?.terms || 'Payment due within 30 days',
    });

    const [newItem, setNewItem] = useState<EstimateItem>({
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
    });
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    const addItem = () => {
        if (newItem.description && newItem.quantity > 0 && newItem.unitPrice > 0) {
            // Ensure proper number types and rounding
            const quantity = Number(newItem.quantity);
            const unitPrice = Number(newItem.unitPrice);
            const total = Number((quantity * unitPrice).toFixed(2));
            
            setFormData({
                ...formData,
                items: [...formData.items, { 
                    description: newItem.description,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    total: total
                }],
            });
            setNewItem({ description: '', quantity: 1, unitPrice: 0, total: 0 });
        }
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        });
        setEditingItemIndex(null);
    };

    const updateItem = (index: number, field: keyof EstimateItem, value: string | number) => {
        const updatedItems = [...formData.items];
        const item = { ...updatedItems[index] };
        
        if (field === 'description') {
            item.description = value as string;
        } else if (field === 'quantity') {
            item.quantity = Number(value);
            item.total = Number((item.quantity * item.unitPrice).toFixed(2));
        } else if (field === 'unitPrice') {
            item.unitPrice = Number(value);
            item.total = Number((item.quantity * item.unitPrice).toFixed(2));
        }
        
        updatedItems[index] = item;
        setFormData({
            ...formData,
            items: updatedItems,
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!businessId) {
            alert('Business ID not found. Please ensure you are logged in and have a valid business profile.');
            return;
        }

        console.log('Creating estimate with businessId:', businessId);
        console.log('Form data:', formData);

        try {
            const subtotal = calculateTotal();
            const taxAmount = subtotal * formData.taxRate;
            const total = subtotal + taxAmount;

            const estimateData = {
                businessId: businessId,
                projectId: formData.projectId || undefined,
                customerId: formData.customerId || '',
                estimateNumber: `EST-${Date.now()}`, // Generate unique estimate number
                title: formData.title,
                description: formData.description,
                items: formData.items,
                subtotal: Number(subtotal.toFixed(2)),
                taxRate: formData.taxRate,
                taxAmount: Number(taxAmount.toFixed(2)),
                total: Number(total.toFixed(2)),
                status: 'draft' as const,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                notes: formData.notes,
                terms: formData.terms,
            };

            console.log('Estimate data to be saved:', estimateData);

            if (estimate) {
                await supabaseBusinessService.updateEstimate(estimate.id, estimateData);
            } else {
                await supabaseBusinessService.createEstimate(estimateData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving estimate:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            alert(`Failed to save estimate: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">
                        {estimate ? 'Edit Estimate' : 'New Estimate'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Title and Description */}
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimate Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Kitchen Remodel Estimate"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the work..."
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer *
                                </label>
                                <select
                                    required
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.firstName} {customer.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project (Optional)
                                </label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">No project selected</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-medium mb-2">Line Items</h3>
                            <div className="border rounded-lg p-4 mb-2">
                                <div className="grid grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="col-span-6 px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                                        className="col-span-2 px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={newItem.unitPrice}
                                        onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                                        className="col-span-3 px-3 py-2 border rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="col-span-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {formData.items.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, index) => (
                                                <React.Fragment key={index}>
                                                    <tr className="border-t hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            {editingItemIndex === index ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span className="cursor-pointer" onClick={() => setEditingItemIndex(index)}>
                                                                    {item.description}
                                                                </span>
                                                            )}
                                                        </td>
                                                    <td className="px-4 py-2">
                                                        {editingItemIndex === index ? (
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        ) : (
                                                            <span className="cursor-pointer" onClick={() => setEditingItemIndex(index)}>
                                                                {item.quantity}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {editingItemIndex === index ? (
                                                            <div className="flex items-center">
                                                                <span className="mr-1">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                                    className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="cursor-pointer" onClick={() => setEditingItemIndex(index)}>
                                                                ${item.unitPrice.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 font-semibold">
                                                        ${item.total.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {editingItemIndex === index ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingItemIndex(null)}
                                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                                >
                                                                    ✓ Done
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingItemIndex(index)}
                                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                                    title="Edit line item"
                                                                >
                                                                    <span className="material-icons text-sm">edit</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                                title="Remove line item"
                                                            >
                                                                <span className="material-icons text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Product Search Row - Show when not editing */}
                                                {editingItemIndex !== index && (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-2 bg-gray-50">
                                                            <SimpleProductSearch
                                                                lineItemDescription={item.description}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-700">
                                                    Subtotal:
                                                </td>
                                                <td className="px-4 py-3 font-bold text-lg">${calculateTotal().toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2} className="px-4 py-2 text-right text-gray-600">
                                                    Tax Rate:
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={formData.taxRate * 100}
                                                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) / 100 })}
                                                        className="w-20 px-2 py-1 border rounded text-right"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                    />
                                                    <span className="ml-1">%</span>
                                                </td>
                                                <td className="px-4 py-2 font-semibold">${(calculateTotal() * formData.taxRate).toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                            <tr className="border-t-2">
                                                <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">
                                                    Total:
                                                </td>
                                                <td className="px-4 py-3 font-bold text-xl text-green-600">
                                                    ${(calculateTotal() * (1 + formData.taxRate)).toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Notes and Terms */}
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes for the customer..."
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Terms & Conditions
                                </label>
                                <textarea
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    placeholder="Payment terms, warranty information, etc..."
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {estimate ? 'Update' : 'Create'} Estimate
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

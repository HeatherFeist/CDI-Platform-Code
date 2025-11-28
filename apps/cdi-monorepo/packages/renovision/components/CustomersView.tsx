import React, { useState, useEffect } from 'react';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { Customer } from '../types/business';
import { NewCustomerModal } from './NewCustomerModal';

export const CustomersView: React.FC = () => {
    const { customers, isLoading, refreshData, deleteCustomer } = useBusinessContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName} ${customer.lastName} ${customer.email}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const handleCustomerCreated = async (customer: Customer) => {
        await refreshData();
        setShowNewCustomerModal(false);
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            try {
                setDeletingCustomerId(customerId);
                await deleteCustomer(customerId);
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Failed to delete customer. Please try again.');
            } finally {
                setDeletingCustomerId(null);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Customers</h1>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowNewCustomerModal(true)}
                >
                    New Customer
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold">
                                    {customer.firstName} {customer.lastName}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs 
                                    ${customer.projectCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                >
                                    {customer.projectCount} {customer.projectCount === 1 ? 'Project' : 'Projects'}
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{customer.email}</p>
                                <p>{customer.phone}</p>
                                <p>{customer.address.street}</p>
                                <p>{customer.address.city}, {customer.address.state} {customer.address.zipCode}</p>
                            </div>

                            <div className="mt-4">
                                <div className="text-sm text-gray-500">
                                    Total Spent: ${customer.totalSpent.toLocaleString()}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="flex flex-wrap gap-1">
                                    {customer.tags.map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteCustomer(customer.id)}
                                        disabled={deletingCustomerId === customer.id}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete customer"
                                    >
                                        {deletingCustomerId === customer.id ? (
                                            <span className="animate-spin inline-block">⏳</span>
                                        ) : (
                                            '🗑️'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {/* TODO: Implement view details */}}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>

                            {customer.notes && (
                                <div className="mt-2 text-sm text-gray-500">
                                    <p className="line-clamp-2">{customer.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No customers found. {searchTerm ? 'Try a different search term.' : 'Add a new customer to get started.'}
                </div>
            )}

            <NewCustomerModal
                isOpen={showNewCustomerModal}
                onClose={() => setShowNewCustomerModal(false)}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
};
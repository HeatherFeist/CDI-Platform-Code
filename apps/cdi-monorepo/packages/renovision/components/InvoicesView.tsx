import React, { useState, useEffect } from 'react';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Invoice, InvoiceItem } from '../types/business';
import { supabaseBusinessService } from '../services/supabaseBusinessService';
import { FeatureLock } from './common/FeatureLock';

export const InvoicesView: React.FC = () => {
    const { userProfile } = useAuth();
    const businessId = userProfile?.business_id;
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');

    useEffect(() => {
        loadInvoices();
    }, [businessId]);

    const loadInvoices = async () => {
        if (!businessId) return;
        setIsLoading(true);
        try {
            const data = await supabaseBusinessService.getInvoices(businessId);
            setInvoices(data);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsPaid = async (invoiceId: string) => {
        if (!businessId) return;
        if (confirm('Mark this invoice as paid?')) {
            try {
                await supabaseBusinessService.updateInvoice(invoiceId, {
                    status: 'paid'
                });
                loadInvoices();
            } catch (error) {
                console.error('Error updating invoice:', error);
                alert('Failed to update invoice');
            }
        }
    };

    const handleSendInvoice = async (invoiceId: string) => {
        // In a real app, this would send an email
        alert('Invoice sent successfully! (Email functionality would be implemented here)');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (filter === 'all') return true;
        return invoice.status === filter;
    });

    const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    const outstandingAmount = invoices
        .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total, 0);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading invoices...</div>
            </div>
        );
    }

    return (
        <FeatureLock
            requiredSetup={['businessDetails', 'paymentSettings']}
            featureName="Invoices & Payment Tracking"
        >
            <div className="p-6">
                <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoices</h1>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${totalRevenue.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Outstanding</div>
                        <div className="text-2xl font-bold text-orange-600">
                            ${outstandingAmount.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {invoices.length}
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        All ({invoices.length})
                    </button>
                    <button
                        onClick={() => setFilter('unpaid')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'unpaid'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Unpaid ({invoices.filter(i => i.status === 'sent').length})
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'paid'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Paid ({invoices.filter(i => i.status === 'paid').length})
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'overdue'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Overdue ({invoices.filter(i => i.status === 'overdue').length})
                    </button>
                </div>
            </div>

            {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No invoices found</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        INV-{invoice.id.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Customer-{invoice.customerId.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {invoice.status === 'draft' && (
                                            <button
                                                onClick={() => handleSendInvoice(invoice.id)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Send
                                            </button>
                                        )}
                                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                            <button
                                                onClick={() => handleMarkAsPaid(invoice.id)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        <button className="text-gray-600 hover:text-gray-900">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </FeatureLock>
    );
};

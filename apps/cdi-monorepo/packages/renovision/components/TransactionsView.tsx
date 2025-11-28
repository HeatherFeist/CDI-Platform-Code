import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../supabase';

interface Transaction {
    id: string;
    invoice_id: string;
    customer_id: string;
    amount: number;
    platform_fee: number;
    business_amount: number;
    payment_method: string;
    payment_id: string;
    status: string;
    payment_metadata: any;
    created_at: string;
}

export const TransactionsView: React.FC = () => {
    const { userProfile } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (userProfile?.business_id) {
            fetchTransactions();
        }
    }, [userProfile]);

    const fetchTransactions = async () => {
        if (!supabase || !userProfile?.business_id) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesFilter = filter === 'all' || transaction.status === filter;
        const matchesSearch = searchTerm === '' || 
            transaction.payment_metadata?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.payment_metadata?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPlatformFees = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.platform_fee, 0);

    const totalBusinessRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.business_amount, 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'paypal':
                return '💳';
            case 'cashapp':
                return '💵';
            default:
                return '💰';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Transactions</h1>
                <p className="text-gray-600">Track all payments and platform fees</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="text-4xl">💰</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Your Revenue</p>
                            <p className="text-2xl font-bold text-green-600">${totalBusinessRevenue.toFixed(2)}</p>
                        </div>
                        <div className="text-4xl">📈</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Platform Fees</p>
                            <p className="text-2xl font-bold text-blue-600">${totalPlatformFees.toFixed(2)}</p>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <span className="material-icons" style={{ fontSize: '14px' }}>favorite</span>
                                Supporting community programs
                            </p>
                        </div>
                        <div className="text-4xl">🏢</div>
                    </div>
                </div>
            </div>

            {/* Community Impact Notice */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <span className="material-icons text-green-600 text-2xl">volunteer_activism</span>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-900 mb-1">Your Impact on the Community</h3>
                        <p className="text-sm text-green-800 mb-3">
                            All platform fees collected are donated to our <strong>nonprofit organization</strong> and directly fund 
                            community programs including <strong>renovation projects, neighborhood rehabilitation, and community development 
                            initiatives</strong>. Through your transactions, you've contributed <strong>${totalPlatformFees.toFixed(2)}</strong> to 
                            making a positive difference in local communities. Thank you for being part of the change!
                        </p>
                        <a
                            href="/business/programs"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-2 rounded transition-colors"
                        >
                            <span className="material-icons text-sm">arrow_forward</span>
                            Learn how these programs can benefit YOUR business
                        </a>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by invoice number or customer name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md font-medium ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-md font-medium ${
                                filter === 'completed'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-md font-medium ${
                                filter === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Pending
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">💳</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-600">Transactions will appear here once customers make payments</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Your Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Platform Fee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(transaction.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {transaction.payment_metadata?.invoice_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {transaction.payment_metadata?.customer_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="flex items-center gap-2">
                                                {getPaymentMethodIcon(transaction.payment_method)}
                                                <span className="capitalize">{transaction.payment_method}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            ${transaction.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                            ${transaction.business_amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                            ${transaction.platform_fee.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

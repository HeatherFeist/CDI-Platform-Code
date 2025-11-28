import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { InvoicePaymentButtons } from './InvoicePaymentButtons';

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    status: string;
    customer_id: string;
    business_id: string;
    due_date: string;
    items: any[];
}

interface Customer {
    first_name: string;
    last_name: string;
    email: string;
}

interface Business {
    name: string;
    description: string;
}

export const PublicPaymentPage: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (invoiceId) {
            fetchInvoiceData();
        }
    }, [invoiceId]);

    const fetchInvoiceData = async () => {
        if (!supabase || !invoiceId) return;

        try {
            setIsLoading(true);

            // Fetch invoice
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (invoiceError) throw invoiceError;
            setInvoice(invoiceData);

            // Fetch customer
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('first_name, last_name, email')
                .eq('id', invoiceData.customer_id)
                .single();

            if (customerError) throw customerError;
            setCustomer(customerData);

            // Fetch business
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .select('name, description')
                .eq('id', invoiceData.business_id)
                .single();

            if (businessError) throw businessError;
            setBusiness(businessData);

        } catch (err) {
            console.error('Error fetching invoice data:', err);
            setError('Unable to load invoice. Please check the link and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (invoice.status === 'paid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Already Paid</h1>
                    <p className="text-gray-600 mb-6">This invoice has already been paid. Thank you!</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                        <p className="text-sm text-green-800">Invoice #{invoice.invoice_number}</p>
                        <p className="text-sm text-green-800">Amount: ${invoice.total_amount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">💰</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Request</h1>
                        <p className="text-gray-600">from {business?.name || 'Business'}</p>
                    </div>

                    {/* Community Impact Banner */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-green-600 text-2xl">volunteer_activism</span>
                            <div>
                                <p className="text-sm font-semibold text-green-900">Supporting Community Programs</p>
                                <p className="text-xs text-green-700 mt-1">
                                    A small 5% platform fee from this payment helps fund nonprofit community renovation and rehabilitation projects in your neighborhood.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="border-t border-b py-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-600">Invoice Number</p>
                                <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Due Date</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Bill To</p>
                            <p className="font-semibold text-gray-900">
                                {customer?.first_name} {customer?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{customer?.email}</p>
                        </div>
                    </div>

                    {/* Items */}
                    {invoice.items && invoice.items.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Invoice Items</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                {invoice.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between py-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.description}</p>
                                            {item.quantity && (
                                                <p className="text-sm text-gray-600">
                                                    Qty: {item.quantity} × ${item.unitPrice?.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-semibold text-gray-900">
                                            ${item.amount?.toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-blue-900">Total Amount Due</span>
                            <span className="text-3xl font-bold text-blue-900">
                                ${invoice.total_amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Buttons */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Payment</h2>
                    <InvoicePaymentButtons
                        invoice={invoice}
                        customerEmail={customer?.email}
                        customerName={`${customer?.first_name} ${customer?.last_name}`}
                    />
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p className="font-medium">Powered by Constructive Home Reno</p>
                    <p className="mt-1 text-xs">Part of the Constructive Designs Inc. nonprofit network</p>
                    <p className="mt-2">Questions? Contact {business?.name}</p>
                </div>
            </div>
        </div>
    );
};

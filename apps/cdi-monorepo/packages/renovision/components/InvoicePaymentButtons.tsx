import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    status: string;
    customer_id: string;
    business_id: string;
}

interface PaymentSettings {
    paypal_email: string;
    cashapp_cashtag: string;
    payment_methods_enabled: {
        paypal: boolean;
        cashapp: boolean;
    };
    platform_fee_percentage: number;
    platform_paypal_email: string;
}

interface InvoicePaymentButtonsProps {
    invoice: Invoice;
    customerEmail?: string;
    customerName?: string;
}

export const InvoicePaymentButtons: React.FC<InvoicePaymentButtonsProps> = ({ 
    invoice, 
    customerEmail, 
    customerName 
}) => {
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentLink, setPaymentLink] = useState('');

    useEffect(() => {
        fetchPaymentSettings();
    }, [invoice.business_id]);

    const fetchPaymentSettings = async () => {
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('payment_settings')
                .select('*')
                .eq('business_id', invoice.business_id)
                .single();

            if (error) throw error;
            setPaymentSettings(data);
        } catch (error) {
            console.error('Error fetching payment settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateFees = () => {
        const platformFee = (invoice.total_amount * (paymentSettings?.platform_fee_percentage || 5)) / 100;
        const businessAmount = invoice.total_amount - platformFee;
        return { platformFee, businessAmount };
    };

    const recordTransaction = async (paymentMethod: string, paymentId?: string) => {
        if (!supabase || !paymentSettings) return;

        const { platformFee, businessAmount } = calculateFees();

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    business_id: invoice.business_id,
                    invoice_id: invoice.id,
                    customer_id: invoice.customer_id,
                    amount: invoice.total_amount,
                    platform_fee: platformFee,
                    business_amount: businessAmount,
                    payment_method: paymentMethod,
                    payment_id: paymentId,
                    status: 'completed',
                    payment_metadata: {
                        invoice_number: invoice.invoice_number,
                        customer_email: customerEmail,
                        customer_name: customerName,
                        timestamp: new Date().toISOString()
                    }
                });

            if (error) throw error;

            // Update invoice status to paid
            await supabase
                .from('invoices')
                .update({ status: 'paid' })
                .eq('id', invoice.id);

            alert('Payment recorded successfully!');
        } catch (error) {
            console.error('Error recording transaction:', error);
        }
    };

    const handlePayPalPayment = () => {
        if (!paymentSettings) return;

        const { platformFee, businessAmount } = calculateFees();
        
        // Create PayPal payment links for split payment
        const businessPayPalLink = `https://www.paypal.com/paypalme/${paymentSettings.paypal_email.split('@')[0]}/${businessAmount.toFixed(2)}`;
        const platformPayPalLink = `https://www.paypal.com/paypalme/${paymentSettings.platform_paypal_email.split('@')[0]}/${platformFee.toFixed(2)}`;
        
        // Open business payment first
        window.open(businessPayPalLink, '_blank');
        
        // Alert about platform fee
        if (confirm(`Business will receive $${businessAmount.toFixed(2)}. Platform fee of $${platformFee.toFixed(2)} will be charged separately. Click OK to pay platform fee now.`)) {
            window.open(platformPayPalLink, '_blank');
        }

        // Record the transaction
        recordTransaction('paypal');
    };

    const handleCashAppPayment = () => {
        if (!paymentSettings) return;

        const { platformFee, businessAmount } = calculateFees();
        
        // Create Cash App payment links
        const businessCashAppLink = `https://cash.app/$${paymentSettings.cashapp_cashtag}/${businessAmount.toFixed(2)}`;
        
        // Open business payment
        window.open(businessCashAppLink, '_blank');
        
        alert(`Business will receive $${businessAmount.toFixed(2)}. Platform fee of $${platformFee.toFixed(2)} must be paid separately to Cash App $ConstructiveDesigns.`);

        // Record the transaction
        recordTransaction('cashapp');
    };

    const generatePaymentLink = () => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/pay/${invoice.id}`;
        setPaymentLink(link);
        setShowPaymentLink(true);
    };

    const copyPaymentLink = () => {
        navigator.clipboard.writeText(paymentLink);
        alert('Payment link copied to clipboard!');
    };

    if (isLoading) {
        return <div className="text-gray-500 text-sm">Loading payment options...</div>;
    }

    if (!paymentSettings) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="text-amber-800">Payment methods not configured. Please set up your payment settings.</p>
            </div>
        );
    }

    const { platformFee, businessAmount } = calculateFees();
    const hasAnyPaymentMethod = paymentSettings.payment_methods_enabled.paypal || paymentSettings.payment_methods_enabled.cashapp;

    if (!hasAnyPaymentMethod) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <p className="text-gray-600">No payment methods enabled. Please enable PayPal or Cash App in Payment Settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Payment Amount Breakdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Breakdown</h4>
                <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                        <span>Invoice Total:</span>
                        <span className="font-semibold">${invoice.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Business Receives:</span>
                        <span>${businessAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                        <span className="flex items-center gap-1">
                            Platform Fee (5%):
                            <span className="material-icons text-green-600" style={{ fontSize: '14px' }} title="Supports community programs">favorite</span>
                        </span>
                        <span>${platformFee.toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-green-700 flex items-start gap-1">
                        <span className="material-icons" style={{ fontSize: '14px' }}>info</span>
                        <span>Platform fees support our nonprofit's community renovation and rehabilitation programs</span>
                    </p>
                </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Pay with:</h4>
                
                {paymentSettings.payment_methods_enabled.paypal && (
                    <button
                        onClick={handlePayPalPayment}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        <span className="text-2xl">💳</span>
                        <span>Pay ${invoice.total_amount.toFixed(2)} with PayPal</span>
                    </button>
                )}

                {paymentSettings.payment_methods_enabled.cashapp && (
                    <button
                        onClick={handleCashAppPayment}
                        className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        <span className="text-2xl">💵</span>
                        <span>Pay ${invoice.total_amount.toFixed(2)} with Cash App</span>
                    </button>
                )}
            </div>

            {/* Generate Payment Link */}
            <div className="border-t pt-4">
                <button
                    onClick={generatePaymentLink}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    <span>🔗</span>
                    <span>Generate Payment Link</span>
                </button>

                {showPaymentLink && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-2">Share this link with your customer:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={paymentLink}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded"
                            />
                            <button
                                onClick={copyPaymentLink}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Instructions */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Click your preferred payment method above</li>
                    <li>Complete payment through PayPal or Cash App</li>
                    <li>Payment will be split: 90% to business, 10% platform fee</li>
                    <li>Invoice will be marked as paid automatically</li>
                </ol>
            </div>
        </div>
    );
};

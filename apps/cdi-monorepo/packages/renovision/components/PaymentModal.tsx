import React, { useState } from 'react';
import { PayPalPayment } from './PayPalPayment';
import { CashAppPayment } from './CashAppPayment';
import { PaymentDetails, calculateTotalWithFee } from '../services/paymentService';
import { auth } from '../firebase';
import { createPaymentRecord, updatePaymentStatus, PaymentRecord } from '../services/paymentTrackingService';

interface PaymentModalProps {
    amount: number;
    description: string;
    cashtag?: string;
    onClose: () => void;
    onPaymentComplete: (paymentInfo: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    amount,
    description,
    cashtag = "YourCashTag", // Replace with your default Cash App tag
    onClose,
    onPaymentComplete
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cashapp' | null>(null);
    const [error, setError] = useState<string>("");

    const paymentDetails: PaymentDetails = {
        amount,
        currency: "USD",
        description
    };

    const handleSuccess = async (paymentInfo: any) => {
        try {
            // Create a payment record in Firestore
            const { platformFee, total } = calculateTotalWithFee(paymentDetails.amount);
            
            const paymentRecord: Omit<PaymentRecord, 'createdAt' | 'updatedAt'> = {
                userId: auth.currentUser?.uid || '',
                amount: total,
                currency: paymentDetails.currency,
                description: paymentDetails.description,
                provider: (paymentInfo.provider || 'paypal') as 'paypal' | 'cashapp',
                status: (paymentInfo.provider === 'cashapp' ? 'pending' : 'completed') as PaymentRecord['status'],
                transactionId: paymentInfo.transactionId,
                metadata: {
                    ...paymentInfo,
                    subtotal: paymentDetails.amount,
                    platformFee: platformFee,
                    total: total
                }
            };

            const paymentId = await createPaymentRecord(paymentRecord);
            
            // Update the payment record with the transaction ID if available
            if (paymentInfo.transactionId) {
                await updatePaymentStatus(paymentId, 'completed', paymentInfo.transactionId, paymentInfo);
            }

            onPaymentComplete({ ...paymentInfo, paymentId });
            onClose();
        } catch (error) {
            console.error('Error recording payment:', error);
            setError('Payment completed but there was an error recording it. Please contact support.');
        }
    };

    const handleError = (error: any) => {
        setError(typeof error === 'string' ? error : 'Payment failed. Please try again.');
    };

    const { platformFee, total } = calculateTotalWithFee(amount);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Payment Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="mb-6 border-b pb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Platform Fee (10%):</span>
                        <span>${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {!paymentMethod ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => setPaymentMethod('paypal')}
                            className="w-full bg-[#0070BA] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#005ea6] transition-colors"
                        >
                            Pay with PayPal
                        </button>
                        <button
                            onClick={() => setPaymentMethod('cashapp')}
                            className="w-full bg-[#00D632] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#00C02E] transition-colors"
                        >
                            Pay with Cash App
                        </button>
                    </div>
                ) : paymentMethod === 'paypal' ? (
                    <PayPalPayment
                        paymentDetails={paymentDetails}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        onCancel={() => setPaymentMethod(null)}
                    />
                ) : (
                    <CashAppPayment
                        paymentDetails={paymentDetails}
                        cashtag={cashtag}
                        onSuccess={() => handleSuccess({ provider: 'cashapp', status: 'initiated' })}
                        onError={handleError}
                    />
                )}

                {paymentMethod && (
                    <button
                        onClick={() => setPaymentMethod(null)}
                        className="mt-4 text-gray-600 hover:text-gray-800 underline"
                    >
                        Choose a different payment method
                    </button>
                )}
            </div>
        </div>
    );
};
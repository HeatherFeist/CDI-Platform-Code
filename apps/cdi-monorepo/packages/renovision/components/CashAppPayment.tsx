import React, { useState } from 'react';
import { generateCashAppLink, validatePaymentAmount, PaymentDetails } from '../services/paymentService';

interface CashAppPaymentProps {
    paymentDetails: PaymentDetails;
    cashtag: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const CashAppPayment: React.FC<CashAppPaymentProps> = ({
    paymentDetails,
    cashtag,
    onSuccess,
    onError
}) => {
    const [error, setError] = useState<string>("");

    const handlePayment = () => {
        if (!validatePaymentAmount(paymentDetails.amount)) {
            const errorMsg = "Invalid payment amount";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        try {
            const cashAppUrl = generateCashAppLink(
                paymentDetails.amount,
                cashtag,
                paymentDetails.description
            );

            // Open Cash App in a new window
            window.open(cashAppUrl, '_blank');
            onSuccess?.();
        } catch (err) {
            const errorMsg = "Failed to initiate Cash App payment";
            setError(errorMsg);
            onError?.(errorMsg);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <button
                onClick={handlePayment}
                className="w-full bg-[#00D632] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#00C02E] transition-colors"
            >
                Pay with Cash App
            </button>
            <p className="text-sm text-gray-500 mt-2">
                You'll be redirected to Cash App to complete your payment to ${cashtag}
            </p>
        </div>
    );
};
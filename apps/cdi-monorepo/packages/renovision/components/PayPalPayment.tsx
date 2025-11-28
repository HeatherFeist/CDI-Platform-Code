import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PAYPAL_OPTIONS, PaymentDetails, createPayPalOrder, handlePayPalApproval, validatePaymentAmount } from '../services/paymentService';

interface PayPalPaymentProps {
    paymentDetails: PaymentDetails;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onCancel?: () => void;
}

export const PayPalPayment: React.FC<PayPalPaymentProps> = ({
    paymentDetails,
    onSuccess,
    onError,
    onCancel
}) => {
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!validatePaymentAmount(paymentDetails.amount)) {
            setError("Invalid payment amount");
        }
    }, [paymentDetails.amount]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <PayPalScriptProvider options={PAYPAL_OPTIONS}>
            <div className="w-full max-w-md mx-auto">
                <PayPalButtons
                    style={{
                        layout: "vertical",
                        shape: "rect",
                    }}
                    createOrder={async (data, actions) => {
                        const orderData = await createPayPalOrder(paymentDetails);
                        return actions.order.create({
                            ...orderData,
                            intent: "CAPTURE"
                        });
                    }}
                    onApprove={async (data, actions) => {
                        try {
                            if (actions.order) {
                                const order = await actions.order.capture();
                                const result = await handlePayPalApproval(order, data.orderID);
                                onSuccess?.(result);
                            }
                        } catch (error) {
                            console.error("PayPal approval error:", error);
                            onError?.(error);
                        }
                    }}
                    onCancel={() => {
                        console.log("Payment cancelled");
                        onCancel?.();
                    }}
                    onError={(err) => {
                        console.error("PayPal error:", err);
                        onError?.(err);
                    }}
                />
            </div>
        </PayPalScriptProvider>
    );
};
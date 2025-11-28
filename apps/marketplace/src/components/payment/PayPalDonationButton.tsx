import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { useState } from 'react';

interface PayPalDonationButtonProps {
    amount: number;
    frequency: 'once' | 'monthly';
    onSuccess?: (details: any) => void;
    onError?: (error: any) => void;
}

export default function PayPalDonationButton({
    amount,
    frequency,
    onSuccess,
    onError
}: PayPalDonationButtonProps) {
    const [processing, setProcessing] = useState(false);

    // Get PayPal Client ID from environment
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

    if (!clientId) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ PayPal is not configured. Please add VITE_PAYPAL_CLIENT_ID to your environment variables.
            </div>
        );
    }

    const createOrder = (data: any, actions: any) => {
        setProcessing(true);

        if (frequency === 'monthly') {
            // For monthly donations, we'll use subscriptions
            // This requires setting up subscription plans in PayPal dashboard
            return actions.subscription.create({
                plan_id: import.meta.env.VITE_PAYPAL_SUBSCRIPTION_PLAN_ID || '',
            });
        } else {
            // One-time donation
            return actions.order.create({
                purchase_units: [
                    {
                        description: `Donation to Constructive Designs Inc. (501c3 - EIN: 86-3183952)`,
                        amount: {
                            currency_code: 'USD',
                            value: amount.toFixed(2),
                        },
                        custom_id: `donation_${Date.now()}`,
                    },
                ],
                application_context: {
                    shipping_preference: 'NO_SHIPPING',
                },
            });
        }
    };

    const onApprove = async (data: any, actions: any) => {
        try {
            if (frequency === 'monthly') {
                // Subscription approved
                console.log('Subscription approved:', data);
                onSuccess?.({
                    type: 'subscription',
                    subscriptionID: data.subscriptionID,
                    amount,
                    frequency,
                });
            } else {
                // Capture the one-time payment
                const details = await actions.order.capture();
                console.log('Payment captured:', details);

                onSuccess?.({
                    type: 'one-time',
                    orderID: data.orderID,
                    payerID: data.payerID,
                    amount,
                    frequency,
                    details,
                });
            }
        } catch (error) {
            console.error('Payment approval error:', error);
            onError?.(error);
        } finally {
            setProcessing(false);
        }
    };

    const onErrorHandler = (err: any) => {
        console.error('PayPal error:', err);
        setProcessing(false);
        onError?.(err);
    };

    return (
        <PayPalScriptProvider
            options={{
                clientId,
                currency: 'USD',
                intent: frequency === 'monthly' ? 'subscription' : 'capture',
                vault: frequency === 'monthly',
            }}
        >
            <div className="paypal-button-container">
                {processing && (
                    <div className="mb-4 text-center text-sm text-gray-600">
                        Processing your donation...
                    </div>
                )}

                <PayPalButtons
                    fundingSource={FUNDING.PAYPAL}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onErrorHandler}
                    style={{
                        layout: 'vertical',
                        color: 'gold',
                        shape: 'rect',
                        label: 'donate',
                    }}
                    disabled={!amount || amount <= 0}
                />
            </div>
        </PayPalScriptProvider>
    );
}

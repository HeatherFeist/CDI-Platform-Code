import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface PayPalCheckoutButtonProps {
    listingId: string;
    amount: number;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    onSuccess?: (details: any) => void;
    onError?: (error: any) => void;
}

export default function PayPalCheckoutButton({
    listingId,
    amount,
    sellerId,
    buyerId,
    listingTitle,
    onSuccess,
    onError
}: PayPalCheckoutButtonProps) {
    const [processing, setProcessing] = useState(false);

    // Get PayPal Client ID from environment
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

    if (!clientId) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ PayPal is not configured. Please contact support.
            </div>
        );
    }

    const createOrder = (data: any, actions: any) => {
        setProcessing(true);

        // Calculate platform fee (e.g., 5% for nonprofit operations)
        const platformFeePercent = 0.05; // 5%
        const platformFee = amount * platformFeePercent;
        const sellerAmount = amount - platformFee;

        return actions.order.create({
            purchase_units: [
                {
                    description: `Purchase: ${listingTitle}`,
                    amount: {
                        currency_code: 'USD',
                        value: amount.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: amount.toFixed(2),
                            },
                        },
                    },
                    payee: {
                        // This would be the seller's PayPal email or merchant ID
                        // You'll need to store this in the seller's profile
                        email_address: import.meta.env.VITE_PAYPAL_BUSINESS_EMAIL || '',
                    },
                    custom_id: `listing_${listingId}_${Date.now()}`,
                    invoice_id: `INV-${listingId}-${Date.now()}`,
                },
            ],
            application_context: {
                shipping_preference: 'NO_SHIPPING', // Digital/pickup items
                brand_name: 'Constructive Designs Marketplace',
                user_action: 'PAY_NOW',
            },
        });
    };

    const onApprove = async (data: any, actions: any) => {
        try {
            // Capture the payment
            const details = await actions.order.capture();
            console.log('Payment captured:', details);

            // Record transaction in database
            const { error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    listing_id: listingId,
                    buyer_id: buyerId,
                    seller_id: sellerId,
                    amount: amount,
                    payment_method: 'paypal',
                    payment_status: 'completed',
                    paypal_order_id: data.orderID,
                    paypal_payer_id: data.payerID,
                    completed_at: new Date().toISOString(),
                });

            if (transactionError) {
                console.error('Failed to record transaction:', transactionError);
            }

            // Update listing status to sold
            await supabase
                .from('listings')
                .update({
                    status: 'sold',
                    winner_id: buyerId
                })
                .eq('id', listingId);

            onSuccess?.({
                orderID: data.orderID,
                payerID: data.payerID,
                amount,
                details,
            });
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
                intent: 'capture',
            }}
        >
            <div className="paypal-button-container">
                {processing && (
                    <div className="mb-4 text-center text-sm text-gray-600">
                        Processing your payment...
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
                        label: 'pay',
                        height: 45,
                    }}
                />

                {/* Also show PayPal Credit option if available */}
                <div className="mt-2">
                    <PayPalButtons
                        fundingSource={FUNDING.PAYLATER}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onErrorHandler}
                        style={{
                            layout: 'vertical',
                            color: 'white',
                            shape: 'rect',
                            label: 'pay',
                            height: 45,
                        }}
                    />
                </div>
            </div>
        </PayPalScriptProvider>
    );
}

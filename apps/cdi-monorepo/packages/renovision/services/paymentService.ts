import { PayPalScriptOptions } from "@paypal/paypal-js";

export interface PaymentDetails {
    amount: number;
    currency: string;
    description: string;
    orderId?: string;
    subtotal?: number;
    platformFee?: number;
}

export const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

export const calculateTotalWithFee = (subtotal: number): {
    platformFee: number;
    total: number;
} => {
    const platformFee = Number((subtotal * PLATFORM_FEE_PERCENTAGE).toFixed(2));
    const total = Number((subtotal + platformFee).toFixed(2));
    return { platformFee, total };
};

// PayPal configuration
export const PAYPAL_OPTIONS: PayPalScriptOptions = {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "",
    merchantId: process.env.REACT_APP_PAYPAL_MERCHANT_ID || "",
    currency: "USD",
    intent: "capture",
};

// Cash App configuration
export const CASH_APP_CONFIG = {
    baseUrl: "https://cash.app",
};

export const createPayPalOrder = async (paymentDetails: PaymentDetails) => {
    return {
        purchase_units: [
            {
                amount: {
                    currency_code: paymentDetails.currency,
                    value: paymentDetails.amount.toString(),
                },
                description: paymentDetails.description,
            },
        ],
    };
};

export const handlePayPalApproval = async (data: any, orderId: string) => {
    // Here you would typically:
    // 1. Verify the payment with PayPal
    // 2. Update your database
    // 3. Send confirmation to the user
    console.log("Payment approved:", data);
    return {
        success: true,
        orderId: orderId,
        transactionId: data.orderID,
    };
};

// Cash App deep linking helper
export const generateCashAppLink = (amount: number, cashtag: string, note?: string) => {
    const baseUrl = CASH_APP_CONFIG.baseUrl;
    const encodedNote = note ? encodeURIComponent(note) : "";
    return `${baseUrl}/$${cashtag}/${amount}${note ? `?note=${encodedNote}` : ""}`;
};

// Validate payment amount
export const validatePaymentAmount = (amount: number): boolean => {
    return amount > 0 && amount <= 50000; // Example maximum limit
};
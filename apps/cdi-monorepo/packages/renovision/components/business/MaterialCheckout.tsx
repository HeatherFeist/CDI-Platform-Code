import React, { useState, useEffect } from 'react';
import { calculateMaterialPricing, createMaterialOrder, processClientPayment } from '../../services/materialFulfillmentService';
import { Product } from '../../services/productScraperService';

interface MaterialCheckoutProps {
    estimateId: string;
    projectId: string;
    businessId: string;
    products: { product: Product; quantity: number }[];
    deliveryAddress: string;
    localTaxRate: number;
    onComplete: (orderId: string) => void;
}

export const MaterialCheckout: React.FC<MaterialCheckoutProps> = ({
    estimateId,
    projectId,
    businessId,
    products,
    deliveryAddress,
    localTaxRate,
    onComplete
}) => {
    const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'complete'>('review');
    const [pricing, setPricing] = useState<ReturnType<typeof calculateMaterialPricing> | null>(null);
    const [orderId, setOrderId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    // Payment form state
    const [email, setEmail] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [billingZip, setBillingZip] = useState('');

    useEffect(() => {
        const calculated = calculateMaterialPricing(products, localTaxRate);
        setPricing(calculated);
    }, [products, localTaxRate]);

    const handleCreateOrder = async () => {
        try {
            const order = await createMaterialOrder(
                estimateId,
                projectId,
                businessId,
                products,
                deliveryAddress,
                localTaxRate
            );
            setOrderId(order.id);
            setStep('payment');
        } catch (err) {
            setError('Failed to create order. Please try again.');
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setError(null);

        try {
            // In production, use Stripe Elements for secure payment
            // This is a simplified version
            const result = await processClientPayment(
                orderId,
                'pm_mock_' + Date.now(), // Mock payment method ID
                email
            );

            if (result.success) {
                setStep('complete');
                setTimeout(() => onComplete(orderId), 2000);
            } else {
                setError(result.error || 'Payment failed');
                setStep('payment');
            }
        } catch (err) {
            setError('Payment processing error');
            setStep('payment');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (!pricing) {
        return <div>Loading...</div>;
    }

    // Step 1: Review Order
    if (step === 'review') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>

                    {/* Products List */}
                    <div className="space-y-4 mb-6">
                        {products.map(({ product, quantity }, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <span className="material-icons text-gray-400">inventory_2</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                    <p className="text-sm text-gray-600">{product.brand}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatCurrency(product.price * quantity)}</p>
                                    <p className="text-sm text-gray-600">
                                        {formatCurrency(product.price)} × {quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="border-t border-gray-200 pt-6 mb-6">
                        <div className="space-y-3 max-w-md ml-auto">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span className="font-semibold">{formatCurrency(pricing.clientTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Sales Tax ({(localTaxRate * 100).toFixed(1)}%)</span>
                                <span className="font-semibold">{formatCurrency(pricing.clientTaxAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {formatCurrency(pricing.clientGrandTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="material-icons text-blue-600">info</span>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">How This Works</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Pay once, directly to Constructive Designs (nonprofit)</li>
                                    <li>• No need to create accounts at multiple retailers</li>
                                    <li>• We purchase materials and arrange delivery to your job site</li>
                                    <li>• As a 501(c)(3) nonprofit, we obtain materials tax-exempt</li>
                                    <li>• Savings help fund our mission to train workers and support communities</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="material-icons text-gray-600">local_shipping</span>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Delivery Address</h4>
                                <p className="text-gray-700">{deliveryAddress}</p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Estimated delivery: 3-5 business days after payment
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateOrder}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">payment</span>
                            <span>Proceed to Payment</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Payment
    if (step === 'payment') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(pricing.clientGrandTotal)}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-red-600">error</span>
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handlePayment} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-600 mt-1">Receipt will be sent to this email</p>
                        </div>

                        {/* Card Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Card Number *
                            </label>
                            <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="1234 5678 9012 3456"
                                required
                                maxLength={19}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Expiry and CVC */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiry *
                                </label>
                                <input
                                    type="text"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    required
                                    maxLength={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CVC *
                                </label>
                                <input
                                    type="text"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    placeholder="123"
                                    required
                                    maxLength={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Billing ZIP *
                                </label>
                                <input
                                    type="text"
                                    value={billingZip}
                                    onChange={(e) => setBillingZip(e.target.value)}
                                    placeholder="12345"
                                    required
                                    maxLength={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="material-icons text-green-600">lock</span>
                                <span>Secure payment processed by Stripe. Your card information is encrypted.</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">lock</span>
                            <span>Pay {formatCurrency(pricing.clientGrandTotal)}</span>
                        </button>

                        <p className="text-xs text-center text-gray-600">
                            By completing this purchase, you agree to Constructive Designs' terms and conditions
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    // Step 3: Processing
    if (step === 'processing') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                    <p className="text-gray-600">Please wait while we process your payment securely.</p>
                </div>
            </div>
        );
    }

    // Step 4: Complete
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons text-green-600 text-5xl">check_circle</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-xl text-gray-600 mb-6">
                    Thank you for your payment of {formatCurrency(pricing.clientGrandTotal)}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                    <h3 className="font-semibold text-blue-900 mb-3">What Happens Next:</h3>
                    <ul className="space-y-2 text-blue-800">
                        <li className="flex items-start gap-2">
                            <span className="material-icons text-sm mt-0.5">check</span>
                            <span>Receipt sent to {email}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-icons text-sm mt-0.5">shopping_cart</span>
                            <span>We'll purchase your materials tax-exempt from our retail partners</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-icons text-sm mt-0.5">local_shipping</span>
                            <span>Materials will be delivered to your project site in 3-5 business days</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-icons text-sm mt-0.5">notifications</span>
                            <span>You'll receive tracking updates via email</span>
                        </li>
                    </ul>
                </div>

                <p className="text-sm text-gray-600">
                    Redirecting you back to your project...
                </p>
            </div>
        </div>
    );
};

export default MaterialCheckout;

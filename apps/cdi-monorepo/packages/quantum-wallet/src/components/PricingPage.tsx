import React, { useState } from 'react';
import { Check, Zap, Shield, TrendingUp } from 'lucide-react';

declare global {
    interface Window {
        paypal: any;
    }
}

interface PricingPageProps {
    onClose?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const plans = {
        monthly: {
            price: '$9.99',
            period: 'month',
            planId: import.meta.env.VITE_PAYPAL_PLAN_PREMIUM_MONTHLY,
        },
        annual: {
            price: '$99',
            period: 'year',
            planId: import.meta.env.VITE_PAYPAL_PLAN_PREMIUM_ANNUAL,
            savings: 'Save $20.88',
        },
    };

    const features = [
        { icon: Shield, text: 'Bank-level encryption' },
        { icon: TrendingUp, text: 'Advanced analytics & insights' },
        { icon: Zap, text: 'Real-time transaction tracking' },
        { icon: Check, text: 'Multi-account management' },
        { icon: Check, text: 'Budget planning tools' },
        { icon: Check, text: 'Spending categorization' },
        { icon: Check, text: 'Bill payment reminders' },
        { icon: Check, text: 'Priority customer support' },
    ];

    const currentPlan = plans[billingCycle];

    // Load PayPal SDK
    React.useEffect(() => {
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
        if (!clientId) {
            console.error('PayPal Client ID not found');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
        script.async = true;
        script.onload = () => {
            console.log('PayPal SDK loaded');
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubscribe = (planId: string) => {
        if (!window.paypal) {
            alert('PayPal is loading... Please try again in a moment.');
            return;
        }

        setLoadingPlan(planId);

        window.paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'subscribe',
            },
            createSubscription: function (data: any, actions: any) {
                return actions.subscription.create({
                    plan_id: planId,
                });
            },
            onApprove: function (data: any, actions: any) {
                alert(`Subscription successful! ID: ${data.subscriptionID}`);
                setLoadingPlan(null);
                if (onClose) onClose();
            },
            onError: function (err: any) {
                console.error('PayPal error:', err);
                alert('Subscription failed. Please try again.');
                setLoadingPlan(null);
            },
            onCancel: function () {
                setLoadingPlan(null);
            },
        }).render(`#paypal-button-${planId}`);
    };

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="gradient-text">Upgrade to Premium</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Unlock powerful features to take control of your finances
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center bg-slate-800/50 rounded-lg p-1 backdrop-blur-sm border border-slate-700">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly'
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all relative ${billingCycle === 'annual'
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Annual
                            {billingCycle === 'annual' && (
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    Save 17%
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="glass-card p-8 md:p-12 mb-8 relative overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/10 pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* Popular Badge */}
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium mb-6">
                            <Zap className="w-4 h-4 mr-2" />
                            Most Popular
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <div className="flex items-baseline mb-2">
                                <span className="text-5xl md:text-6xl font-bold gradient-text">
                                    {currentPlan.price}
                                </span>
                                <span className="text-2xl text-slate-400 ml-2">
                                    /{currentPlan.period}
                                </span>
                            </div>
                            {currentPlan.savings && (
                                <p className="text-green-400 font-medium">{currentPlan.savings} per year</p>
                            )}
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <span className="text-slate-300">{feature.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Subscribe Button */}
                        <div className="space-y-4">
                            {loadingPlan === currentPlan.planId ? (
                                <div id={`paypal-button-${currentPlan.planId}`} className="min-h-[50px]"></div>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(currentPlan.planId)}
                                    disabled={!currentPlan.planId}
                                    className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentPlan.planId ? 'Subscribe Now' : 'Plan ID Missing'}
                                </button>
                            )}

                            <p className="text-center text-sm text-slate-400">
                                Cancel anytime • Secure payment via PayPal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Cancel Anytime</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span>Instant Access</span>
                    </div>
                </div>

                {/* Close Button */}
                {onClose && (
                    <div className="text-center mt-8">
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                            Maybe later
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingPage;

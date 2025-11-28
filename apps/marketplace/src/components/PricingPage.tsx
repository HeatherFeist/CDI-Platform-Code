import React, { useState } from 'react';
import { Check, Zap, Shield, TrendingUp, Store, BarChart3, Package } from 'lucide-react';

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

    const plans = [
        {
            name: 'Basic',
            description: 'Perfect for getting started',
            monthly: {
                price: '$19.99',
                planId: import.meta.env.VITE_PAYPAL_PLAN_BASIC_MONTHLY,
            },
            annual: {
                price: '$199',
                planId: import.meta.env.VITE_PAYPAL_PLAN_BASIC_ANNUAL,
                savings: 'Save $40.88',
            },
            features: [
                'Up to 50 active listings',
                'Basic analytics dashboard',
                'Standard storefront',
                'Email support',
                '5% platform fee',
                'Basic payment processing',
            ],
            icon: Store,
            color: 'from-blue-600 to-cyan-600',
        },
        {
            name: 'Pro',
            description: 'For serious sellers',
            monthly: {
                price: '$49.99',
                planId: import.meta.env.VITE_PAYPAL_PLAN_PRO_MONTHLY,
            },
            annual: {
                price: '$499',
                planId: import.meta.env.VITE_PAYPAL_PLAN_PRO_ANNUAL,
                savings: 'Save $100.88',
            },
            features: [
                'Unlimited listings',
                'Advanced analytics & insights',
                'Premium storefront customization',
                'Priority support',
                '2% platform fee',
                'Advanced payment options',
                'Featured listings',
                'Marketing tools',
            ],
            icon: TrendingUp,
            color: 'from-purple-600 to-pink-600',
            popular: true,
        },
    ];

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
            const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
        };
    }, []);

    const handleSubscribe = (planId: string) => {
        if (!window.paypal) {
            alert('PayPal is loading... Please try again in a moment.');
            return;
        }

        setLoadingPlan(planId);

        window.paypal
            .Buttons({
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
            })
            .render(`#paypal-button-${planId}`);
    };

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-gradient-primary">Choose Your Plan</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Start selling on the marketplace with powerful tools and features
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

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
                    {plans.map((plan) => {
                        const currentPlan = billingCycle === 'monthly' ? plan.monthly : plan.annual;
                        const Icon = plan.icon;

                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border ${plan.popular ? 'border-purple-500 shadow-2xl shadow-purple-500/20' : 'border-slate-700'
                                    } transition-all hover:scale-105`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium">
                                            <Zap className="w-4 h-4 mr-2" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 mb-6">{plan.description}</p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline mb-2">
                                        <span className="text-4xl font-bold text-white">{currentPlan.price}</span>
                                        <span className="text-xl text-slate-400 ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                    </div>
                                    {currentPlan.savings && <p className="text-green-400 font-medium text-sm">{currentPlan.savings}</p>}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-300 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Subscribe Button */}
                                <div className="space-y-3">
                                    {loadingPlan === currentPlan.planId ? (
                                        <div id={`paypal-button-${currentPlan.planId}`} className="min-h-[50px]"></div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(currentPlan.planId)}
                                            disabled={!currentPlan.planId}
                                            className={`w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                                                    : 'bg-slate-700 text-white hover:bg-slate-600'
                                                }`}
                                        >
                                            {currentPlan.planId ? 'Get Started' : 'Plan ID Missing'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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

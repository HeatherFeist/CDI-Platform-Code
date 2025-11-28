import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../supabase';

interface PaymentSettings {
    id?: string;
    business_id: string;
    paypal_email: string;
    cashapp_cashtag: string;
    payment_methods_enabled: {
        paypal: boolean;
        cashapp: boolean;
    };
    platform_fee_percentage: number;
}

export const PaymentSettingsView: React.FC = () => {
    const { userProfile } = useAuth();
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [paypalEmail, setPaypalEmail] = useState('');
    const [cashappCashtag, setCashappCashtag] = useState('');
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [cashappEnabled, setCashappEnabled] = useState(false);

    useEffect(() => {
        if (userProfile?.business_id) {
            fetchPaymentSettings();
        }
    }, [userProfile]);

    const fetchPaymentSettings = async () => {
        if (!supabase || !userProfile?.business_id) {
            console.log('Cannot fetch payment settings: missing supabase or business_id');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Fetching payment settings for business_id:', userProfile.business_id);
            
            const { data, error } = await supabase
                .from('payment_settings')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Fetch error:', error);
                throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
            }

            if (data) {
                console.log('Payment settings found:', data);
                setSettings(data);
                setPaypalEmail(data.paypal_email || '');
                setCashappCashtag(data.cashapp_cashtag || '');
                setPaypalEnabled(data.payment_methods_enabled?.paypal || false);
                setCashappEnabled(data.payment_methods_enabled?.cashapp || false);
            } else {
                console.log('No payment settings found - user needs to create them');
            }
        } catch (err) {
            console.error('Error fetching payment settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load payment settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!supabase || !userProfile?.business_id) {
            setError('No business profile found. Please ensure you are logged in as a business user.');
            return;
        }

        // Validate inputs
        if (paypalEnabled && !paypalEmail) {
            setError('Please enter your PayPal email');
            return;
        }
        if (cashappEnabled && !cashappCashtag) {
            setError('Please enter your Cash App $cashtag');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);

            const paymentData = {
                business_id: userProfile.business_id,
                paypal_email: paypalEmail,
                cashapp_cashtag: cashappCashtag,
                payment_methods_enabled: {
                    paypal: paypalEnabled,
                    cashapp: cashappEnabled
                },
                platform_fee_percentage: 5.00 // Fixed 5% platform fee - competitive and fair
            };

            console.log('Attempting to save payment settings:', { ...paymentData, business_id: userProfile.business_id });

            if (settings?.id) {
                // Update existing settings
                const { data, error } = await supabase
                    .from('payment_settings')
                    .update(paymentData)
                    .eq('id', settings.id)
                    .select();

                if (error) {
                    console.error('Update error:', error);
                    throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
                }
                console.log('Update successful:', data);
            } else {
                // Insert new settings
                const { data, error } = await supabase
                    .from('payment_settings')
                    .insert(paymentData)
                    .select();

                if (error) {
                    console.error('Insert error:', error);
                    throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
                }
                console.log('Insert successful:', data);
            }

            setSuccess('Payment settings saved successfully!');
            await fetchPaymentSettings();
        } catch (err) {
            console.error('Error saving payment settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to save payment settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
                <p className="text-gray-600 mb-6">
                    Connect your PayPal and Cash App accounts to accept customer payments. 
                    A 10% platform fee will be automatically calculated on all transactions.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                        {success}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                    {/* Platform Fee Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <i className="material-icons text-blue-600">info</i>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Transaction Gratuity</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>A <strong>15% transaction gratuity</strong> is suggested and appreciated for the use and benefit of the platform. It is not required but all of the proceeds are used to fund our programs and services that are available to all of our members.</p>
                                    <p className="mt-2">
                                        <a 
                                            href="/donor-leaderboard" 
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                        >
                                            <i className="material-icons text-sm">emoji_events</i>
                                            View Top Donors This Month
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PayPal Settings */}
                    <div className="border-b pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">💳</div>
                                <div>
                                    <h2 className="text-xl font-semibold">PayPal</h2>
                                    <p className="text-sm text-gray-600">Accept payments via PayPal</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={paypalEnabled}
                                    onChange={(e) => setPaypalEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {paypalEnabled && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    PayPal Email Address
                                </label>
                                <input
                                    type="email"
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    placeholder="your-business@email.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the email address associated with your PayPal business account
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Cash App Settings */}
                    <div className="pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">💵</div>
                                <div>
                                    <h2 className="text-xl font-semibold">Cash App</h2>
                                    <p className="text-sm text-gray-600">Accept payments via Cash App</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={cashappEnabled}
                                    onChange={(e) => setCashappEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {cashappEnabled && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cash App $Cashtag
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        $
                                    </span>
                                    <input
                                        type="text"
                                        value={cashappCashtag}
                                        onChange={(e) => setCashappCashtag(e.target.value.replace('$', ''))}
                                        placeholder="YourCashtag"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter your Cash App $cashtag without the $ symbol
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            onClick={() => fetchPaymentSettings()}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSaving || (!paypalEnabled && !cashappEnabled)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">How Payment Processing Works</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Enable PayPal and/or Cash App and enter your account details</li>
                        <li>Create invoices for your customers with payment buttons</li>
                        <li>Customers click the payment button and complete payment through their preferred method</li>
                        <li>95% of the payment goes to your account, 5% goes to platform fees</li>
                        <li>All transactions are tracked in your dashboard for accounting</li>
                    </ol>
                </div>

                {/* Platform Fee & Nonprofit Mission */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <span className="material-icons">info</span>
                        Platform Fee - Only 5%
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                        All payments include a <strong>5% platform fee</strong>. For example, on a $1,000 payment, 
                        you receive <strong>$950</strong> and $50 goes to platform fees.
                    </p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-900 mb-2">Why we charge a fee:</p>
                        <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
                            <li><strong>All-in-one platform:</strong> Scheduling, estimates, invoicing, customer management, project tracking, and integrated payments</li>
                            <li><strong>No monthly fees:</strong> Only pay when you get paid - no subscriptions or hidden costs</li>
                            <li><strong>Competitive pricing:</strong> Our 5% is competitive with standard payment processing (2.9-3.5%) while including comprehensive business tools</li>
                            <li><strong>Transparent:</strong> See exactly what you're paying with clear fee breakdowns on every transaction</li>
                            <li><strong>Better than multiple subscriptions:</strong> Compare to $29-200/month for separate tools plus 2.9% payment processing</li>
                        </ul>
                    </div>
                    
                    {/* Nonprofit Mission */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="material-icons text-green-600 text-2xl">volunteer_activism</span>
                            <div>
                                <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1">
                                    <span className="material-icons" style={{ fontSize: '16px' }}>favorite</span>
                                    Supporting Our Communities
                                </p>
                                <p className="text-xs text-green-800 leading-relaxed mb-3">
                                    All platform fees are donated to our <strong>nonprofit organization</strong> and used for operating costs and 
                                    programs within local communities, including <strong>renovation projects, community rehabilitation, and neighborhood 
                                    revitalization initiatives</strong>. When you use this platform, you're directly contributing to positive change in your community. 
                                    Together, we're building better neighborhoods!
                                </p>
                                <a
                                    href="/business/programs"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-2 rounded transition-colors"
                                >
                                    <span className="material-icons text-sm">info</span>
                                    See how OUR programs benefit YOUR business
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

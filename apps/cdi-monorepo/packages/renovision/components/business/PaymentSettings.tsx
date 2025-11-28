import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface PaymentGateway {
    id: string;
    gateway_type: 'stripe' | 'cashapp' | 'paypal';
    api_key?: string;
    api_secret?: string;
    is_active: boolean;
    business_id: string;
    created_at: string;
    updated_at: string;
}

export const PaymentSettings: React.FC = () => {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'stripe' | 'cashapp' | 'paypal'>('stripe');
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Form states
    const [stripeKey, setStripeKey] = useState('');
    const [stripeSecret, setStripeSecret] = useState('');
    const [cashappCashtag, setCashappCashtag] = useState('');
    const [cashappApiKey, setCashappApiKey] = useState('');
    const [paypalClientId, setPaypalClientId] = useState('');
    const [paypalSecret, setPaypalSecret] = useState('');

    useEffect(() => {
        loadPaymentGateways();
    }, [userProfile]);

    const loadPaymentGateways = async () => {
        if (!userProfile?.business_id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_gateways')
                .select('*')
                .eq('business_id', userProfile.business_id);

            if (error) throw error;

            if (data) {
                setGateways(data);
                
                // Populate form fields
                data.forEach((gateway: PaymentGateway) => {
                    switch (gateway.gateway_type) {
                        case 'stripe':
                            setStripeKey(gateway.api_key || '');
                            setStripeSecret(gateway.api_secret || '');
                            break;
                        case 'cashapp':
                            setCashappCashtag(gateway.api_key || '');
                            setCashappApiKey(gateway.api_secret || '');
                            break;
                        case 'paypal':
                            setPaypalClientId(gateway.api_key || '');
                            setPaypalSecret(gateway.api_secret || '');
                            break;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading payment gateways:', error);
            setErrorMessage('Failed to load payment settings');
        } finally {
            setLoading(false);
        }
    };

    const saveGateway = async (
        gatewayType: 'stripe' | 'cashapp' | 'paypal',
        apiKey: string,
        apiSecret: string
    ) => {
        if (!userProfile?.business_id) return;

        try {
            setSaving(true);
            setErrorMessage('');
            setSuccessMessage('');

            const existingGateway = gateways.find(g => g.gateway_type === gatewayType);

            if (existingGateway) {
                // Update existing
                const { error } = await supabase
                    .from('payment_gateways')
                    .update({
                        api_key: apiKey,
                        api_secret: apiSecret,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingGateway.id);

                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('payment_gateways')
                    .insert({
                        business_id: userProfile.business_id,
                        gateway_type: gatewayType,
                        api_key: apiKey,
                        api_secret: apiSecret,
                        is_active: true
                    });

                if (error) throw error;
            }

            setSuccessMessage(`${gatewayType.toUpperCase()} settings saved successfully!`);
            await loadPaymentGateways();
        } catch (error) {
            console.error('Error saving gateway:', error);
            setErrorMessage('Failed to save payment gateway settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveStripe = () => saveGateway('stripe', stripeKey, stripeSecret);
    const handleSaveCashApp = () => saveGateway('cashapp', cashappCashtag, cashappApiKey);
    const handleSavePayPal = () => saveGateway('paypal', paypalClientId, paypalSecret);

    const toggleGatewayStatus = async (gateway: PaymentGateway) => {
        try {
            const { error } = await supabase
                .from('payment_gateways')
                .update({ is_active: !gateway.is_active })
                .eq('id', gateway.id);

            if (error) throw error;

            setSuccessMessage(`${gateway.gateway_type.toUpperCase()} ${!gateway.is_active ? 'activated' : 'deactivated'}`);
            await loadPaymentGateways();
        } catch (error) {
            console.error('Error toggling gateway:', error);
            setErrorMessage('Failed to update gateway status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Gateway Settings</h1>
                <p className="text-gray-600">Configure your payment processing methods for customer transactions</p>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {errorMessage}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('stripe')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'stripe'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-icons">credit_card</span>
                            Stripe
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cashapp')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'cashapp'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-icons">attach_money</span>
                            Cash App
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('paypal')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'paypal'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-icons">account_balance</span>
                            PayPal
                        </span>
                    </button>
                </nav>
            </div>

            {/* Stripe Settings */}
            {activeTab === 'stripe' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Stripe Configuration</h2>
                        {gateways.find(g => g.gateway_type === 'stripe') && (
                            <button
                                onClick={() => toggleGatewayStatus(gateways.find(g => g.gateway_type === 'stripe')!)}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    gateways.find(g => g.gateway_type === 'stripe')?.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {gateways.find(g => g.gateway_type === 'stripe')?.is_active ? 'Active' : 'Inactive'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Publishable Key
                            </label>
                            <input
                                type="text"
                                value={stripeKey}
                                onChange={(e) => setStripeKey(e.target.value)}
                                placeholder="pk_live_..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                value={stripeSecret}
                                onChange={(e) => setStripeSecret(e.target.value)}
                                placeholder="sk_live_..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                <li>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                                <li>Navigate to Developers → API keys</li>
                                <li>Copy your Publishable and Secret keys</li>
                                <li>Paste them above and click Save</li>
                            </ol>
                        </div>

                        <button
                            onClick={handleSaveStripe}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Stripe Settings'}
                        </button>
                    </div>
                </div>
            )}

            {/* Cash App Settings */}
            {activeTab === 'cashapp' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Cash App Configuration</h2>
                        {gateways.find(g => g.gateway_type === 'cashapp') && (
                            <button
                                onClick={() => toggleGatewayStatus(gateways.find(g => g.gateway_type === 'cashapp')!)}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    gateways.find(g => g.gateway_type === 'cashapp')?.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {gateways.find(g => g.gateway_type === 'cashapp')?.is_active ? 'Active' : 'Inactive'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Cashtag
                            </label>
                            <div className="flex items-center">
                                <span className="text-gray-500 mr-2">$</span>
                                <input
                                    type="text"
                                    value={cashappCashtag}
                                    onChange={(e) => setCashappCashtag(e.target.value)}
                                    placeholder="YourBusinessName"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cash App API Key (Optional)
                            </label>
                            <input
                                type="password"
                                value={cashappApiKey}
                                onChange={(e) => setCashappApiKey(e.target.value)}
                                placeholder="For advanced API integration"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <h4 className="font-medium text-green-900 mb-2">Setup Instructions:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                                <li>Open Cash App on your mobile device</li>
                                <li>Create or sign in to your Business account</li>
                                <li>Go to Settings → Business Profile</li>
                                <li>Note your $Cashtag and enter it above</li>
                                <li>For API access, visit <a href="https://cash.app/business" target="_blank" rel="noopener noreferrer" className="underline">Cash App Business</a></li>
                            </ol>
                        </div>

                        <button
                            onClick={handleSaveCashApp}
                            disabled={saving}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Cash App Settings'}
                        </button>
                    </div>
                </div>
            )}

            {/* PayPal Settings */}
            {activeTab === 'paypal' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">PayPal Configuration</h2>
                        {gateways.find(g => g.gateway_type === 'paypal') && (
                            <button
                                onClick={() => toggleGatewayStatus(gateways.find(g => g.gateway_type === 'paypal')!)}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    gateways.find(g => g.gateway_type === 'paypal')?.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {gateways.find(g => g.gateway_type === 'paypal')?.is_active ? 'Active' : 'Inactive'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client ID
                            </label>
                            <input
                                type="text"
                                value={paypalClientId}
                                onChange={(e) => setPaypalClientId(e.target.value)}
                                placeholder="Your PayPal Client ID"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                value={paypalSecret}
                                onChange={(e) => setPaypalSecret(e.target.value)}
                                placeholder="Your PayPal Secret"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline">PayPal Developer</a></li>
                                <li>Log in with your PayPal Business account</li>
                                <li>Navigate to My Apps & Credentials</li>
                                <li>Create a new app or select existing app</li>
                                <li>Copy the Client ID and Secret</li>
                                <li>Paste them above and click Save</li>
                            </ol>
                        </div>

                        <button
                            onClick={handleSavePayPal}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save PayPal Settings'}
                        </button>
                    </div>
                </div>
            )}

            {/* Active Gateways Summary */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Active Payment Methods</h3>
                <div className="space-y-2">
                    {gateways.filter(g => g.is_active).length === 0 ? (
                        <p className="text-gray-500">No active payment gateways configured</p>
                    ) : (
                        gateways
                            .filter(g => g.is_active)
                            .map(gateway => (
                                <div key={gateway.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-green-600">check_circle</span>
                                        <span className="font-medium capitalize">{gateway.gateway_type}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        Configured {new Date(gateway.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

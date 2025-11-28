import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ConnectPayPal from './ConnectPayPal';
import ConnectCashApp from './ConnectCashApp';
import { CreditCard, DollarSign, Trash2, Check, AlertCircle } from 'lucide-react';

interface PaymentIntegration {
    id: string;
    provider: string;
    public_identifier: string | null;
    is_active: boolean;
    is_verified: boolean;
    environment: string;
    connected_at: string;
}

export default function PaymentIntegrationsManager() {
    const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
    const [loading, setLoading] = useState(true);

    const loadIntegrations = async () => {
        try {
            const { data, error } = await supabase
                .from('payment_integrations')
                .select('id, provider, public_identifier, is_active, is_verified, environment, connected_at')
                .eq('is_active', true)
                .order('connected_at', { ascending: false });

            if (error) throw error;
            setIntegrations(data || []);
        } catch (error) {
            console.error('Error loading integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIntegrations();
    }, []);

    const handleDisconnect = async (id: string, provider: string) => {
        if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;

        try {
            const { error } = await supabase
                .from('payment_integrations')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;

            await loadIntegrations();
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Failed to disconnect payment provider');
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'paypal':
                return <CreditCard className="w-5 h-5" />;
            case 'cashapp':
                return <DollarSign className="w-5 h-5" />;
            default:
                return <CreditCard className="w-5 h-5" />;
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'paypal':
                return 'bg-blue-600';
            case 'cashapp':
                return 'bg-green-600';
            default:
                return 'bg-indigo-600';
        }
    };

    const getProviderName = (provider: string) => {
        switch (provider) {
            case 'paypal':
                return 'PayPal';
            case 'cashapp':
                return 'Cash App';
            case 'stripe':
                return 'Stripe';
            case 'plaid':
                return 'Plaid';
            default:
                return provider;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Integrations</h2>
                <p className="text-slate-400">
                    Connect your payment accounts using BYOK (Bring Your Own Keys)
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-900/20 border border-indigo-800 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div className="text-sm text-indigo-200">
                        <p className="font-semibold mb-1">Zero Liability Model</p>
                        <p>
                            You provide YOUR OWN payment API credentials. Payments go directly to YOUR accounts.
                            We never touch your money - we just facilitate connections.
                        </p>
                    </div>
                </div>
            </div>

            {/* Connected Integrations */}
            {integrations.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl"
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 ${getProviderColor(integration.provider)} rounded-lg flex items-center justify-center`}>
                                    {getProviderIcon(integration.provider)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-white">
                                            {getProviderName(integration.provider)}
                                        </h4>
                                        {integration.is_verified && (
                                            <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-900/30 border border-green-800 rounded-full text-xs text-green-400">
                                                <Check className="w-3 h-3" />
                                                <span>Verified</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {integration.public_identifier || `${integration.environment} environment`}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Connected {new Date(integration.connected_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDisconnect(integration.id, integration.provider)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-800 text-red-400 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Available Integrations */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Available Integrations</h3>

                {!integrations.find(i => i.provider === 'paypal') && (
                    <ConnectPayPal onSuccess={loadIntegrations} />
                )}

                {!integrations.find(i => i.provider === 'cashapp') && (
                    <ConnectCashApp onSuccess={loadIntegrations} />
                )}

                {/* Placeholder for future integrations */}
                <div className="p-4 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl text-center">
                    <p className="text-slate-400 text-sm">
                        More payment providers coming soon: Stripe, Plaid, Venmo
                    </p>
                </div>
            </div>

            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 mt-2">Loading integrations...</p>
                </div>
            )}
        </div>
    );
}

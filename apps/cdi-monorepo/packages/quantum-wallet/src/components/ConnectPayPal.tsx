import React, { useState } from 'react';
import { supabase } from '../supabase';
import { CreditCard, Check, X, ExternalLink, AlertCircle } from 'lucide-react';

interface ConnectPayPalProps {
    onSuccess?: () => void;
}

export default function ConnectPayPal({ onSuccess }: ConnectPayPalProps) {
    const [showModal, setShowModal] = useState(false);
    const [clientId, setClientId] = useState('');
    const [secret, setSecret] = useState('');
    const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const verifyPayPalCredentials = async (
        clientId: string,
        secret: string,
        env: 'sandbox' | 'production'
    ): Promise<boolean> => {
        try {
            const baseUrl = env === 'sandbox'
                ? 'https://api-m.sandbox.paypal.com'
                : 'https://api-m.paypal.com';

            const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${clientId}:${secret}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            return response.ok;
        } catch {
            return false;
        }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Verify credentials work
            const isValid = await verifyPayPalCredentials(clientId, secret, environment);

            if (!isValid) {
                throw new Error('Invalid PayPal credentials. Please check your Client ID and Secret.');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Store encrypted credentials
            const { error: dbError } = await supabase
                .from('payment_integrations')
                .upsert({
                    profile_id: user.id,
                    provider: 'paypal',
                    api_key_1: clientId,
                    api_key_2: secret,
                    environment: environment,
                    is_verified: true,
                    is_active: true,
                    connected_at: new Date().toISOString()
                }, {
                    onConflict: 'profile_id,provider,environment'
                });

            if (dbError) throw dbError;

            setSuccess('✅ PayPal connected successfully!');
            setTimeout(() => {
                setShowModal(false);
                setClientId('');
                setSecret('');
                setSuccess('');
                onSuccess?.();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to connect PayPal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-3 w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">PayPal</h3>
                    <p className="text-sm text-slate-400">Connect your PayPal account</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400" />
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-slate-700 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Connect PayPal</h2>
                                    <p className="text-sm text-slate-400">Bring Your Own Keys (BYOK)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div className="text-sm text-blue-200">
                                    <p className="font-semibold mb-1">Zero Liability Model</p>
                                    <p>Enter YOUR PayPal API credentials. Payments will go directly to YOUR PayPal account. We never touch your money - we just facilitate the connection.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Environment
                                </label>
                                <select
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                                >
                                    <option value="sandbox">Sandbox (Testing)</option>
                                    <option value="production">Production (Live Payments)</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    Use Sandbox for testing, Production for real payments
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    PayPal Client ID
                                </label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    required
                                    placeholder="Your PayPal Client ID"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    PayPal Secret
                                </label>
                                <input
                                    type="password"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    required
                                    placeholder="Your PayPal Secret"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                                />
                            </div>

                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                                <p className="font-semibold text-white mb-2 text-sm">How to get your PayPal API credentials:</p>
                                <ol className="list-decimal ml-4 space-y-1 text-sm text-slate-300">
                                    <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developer.paypal.com</a></li>
                                    <li>Log in with your PayPal account</li>
                                    <li>Click "Apps & Credentials"</li>
                                    <li>Create a new app or select existing app</li>
                                    <li>Copy your Client ID and Secret</li>
                                </ol>
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-start space-x-2">
                                    <X className="w-5 h-5 text-red-400 mt-0.5" />
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-start space-x-2">
                                    <Check className="w-5 h-5 text-green-400 mt-0.5" />
                                    <p className="text-sm text-green-200">{success}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !clientId || !secret}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Verifying...' : 'Connect PayPal'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

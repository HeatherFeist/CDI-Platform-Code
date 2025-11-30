import React, { useState } from 'react';
import { supabase } from '../supabase';
import { DollarSign, Check, X, QrCode } from 'lucide-react';

interface ConnectCashAppProps {
    onSuccess?: () => void;
}

export default function ConnectCashApp({ onSuccess }: ConnectCashAppProps) {
    const [showModal, setShowModal] = useState(false);
    const [cashTag, setCashTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate Cash App tag format
            let formattedTag = cashTag.trim();
            if (!formattedTag.startsWith('$')) {
                formattedTag = '$' + formattedTag;
            }

            // Basic validation
            if (formattedTag.length < 2 || formattedTag.length > 21) {
                throw new Error('Cash App tag must be between 1 and 20 characters');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Store Cash App tag
            const { error: dbError } = await supabase
                .from('payment_integrations')
                .upsert({
                    profile_id: user.id,
                    provider: 'cashapp',
                    public_identifier: formattedTag,
                    is_verified: true, // Cash App tags are public, no verification needed
                    is_active: true,
                    environment: 'production',
                    connected_at: new Date().toISOString()
                }, {
                    onConflict: 'profile_id,provider,environment'
                });

            if (dbError) throw dbError;

            // ALSO create an account entry so it shows up in the dashboard
            const { error: accountError } = await supabase
                .from('accounts')
                .upsert({
                    user_id: user.id,
                    plaid_account_id: `cashapp_${user.id}`, // specific ID for Cash App
                    plaid_item_id: 'manual_cashapp',
                    name: 'Cash App',
                    mask: formattedTag.substring(1).substring(0, 4), // Use first 4 chars of tag as mask
                    type: 'depository',
                    subtype: 'checking', // Treat as checking
                    institution_name: 'Cash App',
                    current_balance: 0, // Start with 0, user can update manually later
                    available_balance: 0
                }, {
                    onConflict: 'user_id,plaid_account_id'
                });

            if (accountError) console.error('Failed to create Cash App account entry:', accountError);

            setSuccess('✅ Cash App connected successfully!');
            setTimeout(() => {
                setShowModal(false);
                setCashTag('');
                setSuccess('');
                onSuccess?.();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to connect Cash App');
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
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">Cash App</h3>
                    <p className="text-sm text-slate-400">Connect your $CashTag</p>
                </div>
                <QrCode className="w-5 h-5 text-slate-400" />
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 rounded-2xl max-w-lg w-full p-8 border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Connect Cash App</h2>
                                    <p className="text-sm text-slate-400">Add your $CashTag</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-200">
                                <strong>Simple Setup:</strong> Just enter your $CashTag and you're ready to receive payments!
                            </p>
                        </div>

                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Your $CashTag
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                                        $
                                    </span>
                                    <input
                                        type="text"
                                        value={cashTag}
                                        onChange={(e) => setCashTag(e.target.value)}
                                        required
                                        placeholder="YourCashTag"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-500"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Enter your Cash App tag without the $ symbol (we'll add it)
                                </p>
                            </div>

                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                                <p className="font-semibold text-white mb-2 text-sm">How to find your $CashTag:</p>
                                <ol className="list-decimal ml-4 space-y-1 text-sm text-slate-300">
                                    <li>Open the Cash App on your phone</li>
                                    <li>Tap your profile icon</li>
                                    <li>Your $CashTag is displayed at the top</li>
                                    <li>Enter it here (e.g., $JohnDoe)</li>
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
                                    disabled={loading || !cashTag}
                                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Connecting...' : 'Connect Cash App'}
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

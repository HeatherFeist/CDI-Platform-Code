import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface DonationPromptProps {
    milestoneId: string;
    earningsAmount: number;
    onComplete: (donationAmount: number) => void;
    onSkip: () => void;
}

interface DonationPreset {
    id: string;
    preset_name: string;
    percentage: number;
    display_order: number;
    is_recommended: boolean;
    description: string;
}

export default function DonationPrompt({ milestoneId, earningsAmount, onComplete, onSkip }: DonationPromptProps) {
    const { userProfile } = useAuth();
    const [presets, setPresets] = useState<DonationPreset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [customPercentage, setCustomPercentage] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDonationPresets();
        loadUserPreference();
    }, []);

    const fetchDonationPresets = async () => {
        const { data, error } = await supabase
            .from('donation_presets')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Error fetching presets:', error);
            return;
        }

        setPresets(data || []);
        
        // Auto-select recommended preset
        const recommended = data?.find(p => p.is_recommended);
        if (recommended) {
            setSelectedPreset(recommended.id);
        }
    };

    const loadUserPreference = async () => {
        if (!userProfile) return;

        const { data } = await supabase
            .from('tax_settings')
            .select('default_donation_percentage')
            .eq('profile_id', userProfile.id)
            .single();

        if (data?.default_donation_percentage) {
            const matchingPreset = presets.find(p => p.percentage === data.default_donation_percentage);
            if (matchingPreset) {
                setSelectedPreset(matchingPreset.id);
            }
        }
    };

    const calculateDonation = (): { amount: number; percentage: number } => {
        if (useCustom) {
            if (customAmount) {
                const amount = parseFloat(customAmount);
                const percentage = (amount / earningsAmount) * 100;
                return { amount, percentage };
            } else if (customPercentage) {
                const percentage = parseFloat(customPercentage);
                const amount = (earningsAmount * percentage) / 100;
                return { amount, percentage };
            }
        }

        const preset = presets.find(p => p.id === selectedPreset);
        if (preset) {
            const amount = (earningsAmount * preset.percentage) / 100;
            return { amount, percentage: preset.percentage };
        }

        return { amount: 0, percentage: 0 };
    };

    const donation = calculateDonation();
    const netEarnings = earningsAmount - donation.amount;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Record donation choice
            const { error } = await supabase
                .from('donation_history')
                .insert({
                    profile_id: userProfile?.id,
                    milestone_id: milestoneId,
                    donation_amount: donation.amount,
                    donation_percentage: donation.percentage,
                    earnings_amount: earningsAmount,
                    suggested_amount: earningsAmount * 0.05,
                    donation_choice: useCustom ? 'custom' : (presets.find(p => p.id === selectedPreset)?.preset_name || 'suggested'),
                    tax_year: new Date().getFullYear()
                });

            if (error) throw error;

            onComplete(donation.amount);
        } catch (error) {
            console.error('Error recording donation:', error);
            alert('Failed to process donation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            // Record that they skipped
            const { error } = await supabase
                .from('donation_history')
                .insert({
                    profile_id: userProfile?.id,
                    milestone_id: milestoneId,
                    donation_amount: 0,
                    donation_percentage: 0,
                    earnings_amount: earningsAmount,
                    suggested_amount: earningsAmount * 0.05,
                    donation_choice: 'skipped',
                    tax_year: new Date().getFullYear()
                });

            if (error) throw error;

            onSkip();
        } catch (error) {
            console.error('Error recording skip:', error);
            onSkip(); // Continue anyway
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-icons text-5xl">celebration</span>
                        <h2 className="text-3xl font-bold">Milestone Complete!</h2>
                    </div>
                    <p className="text-lg opacity-90">Great work! Your earnings are ready.</p>
                </div>

                {/* Earnings Breakdown */}
                <div className="p-8">
                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600">Your Earnings</span>
                            <span className="text-3xl font-bold text-gray-900">
                                ${earningsAmount.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>From this milestone payment</span>
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="mb-8">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="material-icons text-green-600 text-3xl">favorite</span>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Support Our Mission (Optional)
                                </h3>
                                <p className="text-gray-600">
                                    Your voluntary contribution helps fund community programs that benefit everyone:
                                </p>
                            </div>
                        </div>
                        <ul className="space-y-2 ml-12 text-gray-700">
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm text-green-600">check_circle</span>
                                <strong>Earn While You Learn</strong> - Training programs for new trades workers
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm text-green-600">check_circle</span>
                                <strong>Buy1:Give1</strong> - Wholesale program for underserved communities
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-sm text-green-600">check_circle</span>
                                <strong>Home Reno Assistance</strong> - Help families afford essential repairs
                            </li>
                        </ul>
                    </div>

                    {/* Donation Options */}
                    <div className="mb-8">
                        <h4 className="font-semibold text-gray-900 mb-4">Choose your contribution:</h4>
                        
                        {/* Preset Options */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {presets.map((preset) => {
                                const amount = (earningsAmount * preset.percentage) / 100;
                                const isSelected = selectedPreset === preset.id && !useCustom;
                                
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            setSelectedPreset(preset.id);
                                            setUseCustom(false);
                                        }}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-green-300'
                                        } ${preset.is_recommended ? 'ring-2 ring-green-200' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900 capitalize">
                                                {preset.preset_name}
                                            </span>
                                            {preset.is_recommended && (
                                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            ${amount.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {preset.percentage}% • {preset.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Option */}
                        <button
                            onClick={() => setUseCustom(!useCustom)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                                useCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">Custom Amount</span>
                                <span className="material-icons">{useCustom ? 'expand_less' : 'expand_more'}</span>
                            </div>
                        </button>

                        {useCustom && (
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dollar Amount
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => {
                                                    setCustomAmount(e.target.value);
                                                    setCustomPercentage('');
                                                }}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                                                min="0"
                                                max={earningsAmount}
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Or Percentage
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={customPercentage}
                                                onChange={(e) => {
                                                    setCustomPercentage(e.target.value);
                                                    setCustomAmount('');
                                                }}
                                                placeholder="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-700">Your Contribution:</span>
                            <span className="text-2xl font-bold text-green-600">
                                ${donation.amount.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-blue-200">
                            <span className="text-gray-700">Net Earnings:</span>
                            <span className="text-2xl font-bold text-gray-900">
                                ${netEarnings.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="material-icons text-sm">info</span>
                            <span>
                                ✓ Tax-deductible donation • Receipt provided for your records • Estimated tax benefit: ${(donation.amount * 0.24).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={loading || donation.amount === 0}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin material-icons">refresh</span>
                                    Processing...
                                </span>
                            ) : (
                                `Continue with $${donation.amount.toFixed(2)} donation`
                            )}
                        </button>
                        <button
                            onClick={handleSkip}
                            disabled={loading}
                            className="px-6 py-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Skip this time
                        </button>
                    </div>

                    <p className="text-xs text-center text-gray-500 mt-4">
                        Constructive Designs Inc. is a 501(c)(3) nonprofit organization. Tax ID: XX-XXXXXXX
                    </p>
                </div>
            </div>
        </div>
    );
}

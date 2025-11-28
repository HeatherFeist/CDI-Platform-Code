import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface TaxSummary {
    total_earned: number;
    total_donated: number;
    number_of_payments: number;
    number_of_donations: number;
    avg_donation_pct: number;
    tax_benefit_estimate: number;
}

interface DonationRecord {
    id: string;
    created_at: string;
    donation_amount: number;
    donation_percentage: number;
    earnings_amount: number;
    receipt_number: string;
}

export default function TaxDashboard() {
    const { userProfile } = useAuth();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
    const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([]);
    const [taxSettings, setTaxSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showW9Form, setShowW9Form] = useState(false);

    useEffect(() => {
        if (userProfile) {
            fetchTaxData();
        }
    }, [userProfile, selectedYear]);

    const fetchTaxData = async () => {
        if (!userProfile) return;

        setLoading(true);
        try {
            // Fetch tax summary using the database function
            const { data: summary, error: summaryError } = await supabase
                .rpc('get_user_tax_summary', {
                    user_id: userProfile.id,
                    year: selectedYear
                });

            if (summaryError) throw summaryError;
            setTaxSummary(summary[0] || null);

            // Fetch donation history
            const { data: history, error: historyError } = await supabase
                .from('donation_history')
                .select('*')
                .eq('profile_id', userProfile.id)
                .eq('tax_year', selectedYear)
                .order('created_at', { ascending: false });

            if (historyError) throw historyError;
            setDonationHistory(history || []);

            // Fetch tax settings
            const { data: settings, error: settingsError } = await supabase
                .from('tax_settings')
                .select('*')
                .eq('profile_id', userProfile.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
            setTaxSettings(settings);
        } catch (error) {
            console.error('Error fetching tax data:', error);
        } finally {
            setLoading(false);
        }
    };

    const download1099 = async () => {
        // In production, this would generate and download a PDF
        alert('1099-K document will be generated and downloaded. (Feature coming soon!)');
    };

    const downloadDonationReceipt = async () => {
        // In production, this would generate and download a PDF
        alert('Donation receipt will be generated and downloaded. (Feature coming soon!)');
    };

    const downloadTaxPackage = async () => {
        // In production, this would generate a comprehensive PDF package
        alert('Complete tax package will be generated and downloaded. (Feature coming soon!)');
    };

    const availableYears = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
        availableYears.push(year);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tax Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Your earnings and charitable contributions for tax reporting
                        </p>
                    </div>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* W-9 Alert */}
            {!taxSettings?.w9_submitted && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex items-start">
                        <span className="material-icons text-yellow-400 mr-3">warning</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">W-9 Form Required</h3>
                            <p className="mt-1 text-sm text-yellow-700">
                                To receive 1099 tax documents, please complete your W-9 form.
                            </p>
                            <button
                                onClick={() => setShowW9Form(true)}
                                className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                            >
                                Complete W-9 Now →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Earnings Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-icons text-green-600 text-3xl">account_balance_wallet</span>
                    <h2 className="text-2xl font-bold text-gray-900">Earnings Summary</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-2">Total Earned</p>
                        <p className="text-4xl font-bold text-green-900">
                            ${(taxSummary?.total_earned || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                            From {taxSummary?.number_of_payments || 0} payments
                        </p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">Average per Payment</p>
                        <p className="text-4xl font-bold text-blue-900">
                            ${taxSummary && taxSummary.number_of_payments > 0
                                ? (taxSummary.total_earned / taxSummary.number_of_payments).toFixed(2)
                                : '0.00'}
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            Across all milestones
                        </p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg">
                        <p className="text-sm text-purple-800 font-medium mb-2">Projects Completed</p>
                        <p className="text-4xl font-bold text-purple-900">
                            {userProfile?.completed_projects || 0}
                        </p>
                        <p className="text-sm text-purple-700 mt-2">
                            Total lifetime projects
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">1099-K Tax Form</p>
                            <p className="text-sm text-gray-600">Required for reporting earnings to the IRS</p>
                        </div>
                        <button
                            onClick={download1099}
                            disabled={!taxSettings?.w9_submitted}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">download</span>
                            Download 1099-K
                        </button>
                    </div>
                </div>
            </div>

            {/* Charitable Contributions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-icons text-red-600 text-3xl">favorite</span>
                    <h2 className="text-2xl font-bold text-gray-900">Charitable Contributions</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-red-50 p-6 rounded-lg">
                        <p className="text-sm text-red-800 font-medium mb-2">Total Donated</p>
                        <p className="text-4xl font-bold text-red-900">
                            ${(taxSummary?.total_donated || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                            From {taxSummary?.number_of_donations || 0} donations
                        </p>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-lg">
                        <p className="text-sm text-orange-800 font-medium mb-2">Average Contribution</p>
                        <p className="text-4xl font-bold text-orange-900">
                            {(taxSummary?.avg_donation_pct || 0).toFixed(1)}%
                        </p>
                        <p className="text-sm text-orange-700 mt-2">
                            Per donation made
                        </p>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-2">Tax Benefit Estimate</p>
                        <p className="text-4xl font-bold text-green-900">
                            ~${(taxSummary?.tax_benefit_estimate || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                            At 24% tax bracket
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-blue-600">info</span>
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">About Tax-Deductible Donations</p>
                            <p>
                                Constructive Designs Inc. is a 501(c)(3) nonprofit organization. Your voluntary
                                contributions are tax-deductible to the full extent allowed by law. Consult your
                                tax advisor for specific guidance on your situation.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Donation Receipt</p>
                            <p className="text-sm text-gray-600">Official receipt for your tax records</p>
                        </div>
                        <button
                            onClick={downloadDonationReceipt}
                            disabled={!taxSummary?.total_donated}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">download</span>
                            Download Receipt
                        </button>
                    </div>
                </div>
            </div>

            {/* Donation History */}
            {donationHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Donation History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Donated</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {donationHistory.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {new Date(record.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                            {record.receipt_number}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            ${record.earnings_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-green-600 font-semibold text-right">
                                            ${record.donation_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                            {record.donation_percentage.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Download Tax Package */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Complete Tax Package</h3>
                        <p className="text-blue-100 mb-4">
                            Download all your tax documents in one comprehensive PDF
                        </p>
                        <ul className="space-y-2 text-sm text-blue-100">
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">check_circle</span>
                                1099-K Earnings Report
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">check_circle</span>
                                Charitable Donation Receipt
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">check_circle</span>
                                Annual Summary Statement
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">check_circle</span>
                                Transaction History
                            </li>
                        </ul>
                    </div>
                    <button
                        onClick={downloadTaxPackage}
                        disabled={!taxSettings?.w9_submitted}
                        className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center gap-2"
                    >
                        <span className="material-icons">folder_zip</span>
                        Download Package
                    </button>
                </div>
            </div>

            {/* Tax Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="material-icons text-gray-400">info</span>
                    <p>
                        <strong>Important:</strong> This information is provided for your convenience. Please consult
                        with a qualified tax professional for advice specific to your situation. Tax laws and
                        regulations may vary by location and individual circumstances.
                    </p>
                </div>
            </div>
        </div>
    );
}

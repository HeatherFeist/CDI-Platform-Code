import React, { useState, useEffect } from 'react';
import { BusinessPortfolioCard } from '../components/BusinessPortfolioCard';
import { 
    BusinessProject, 
    getActiveFundraisingProjects,
    makeDonation
} from '../services/crowdfundingService';

export const CrowdfundingPortal: React.FC = () => {
    const [projects, setProjects] = useState<BusinessProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<BusinessProject | null>(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [donationMessage, setDonationMessage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cash_app' | 'stripe'>('paypal');
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const data = await getActiveFundraisingProjects();
        setProjects(data);
        setLoading(false);
    };

    const handleDonateClick = (project: BusinessProject) => {
        setSelectedProject(project);
        setShowDonateModal(true);
    };

    const handleViewPlan = (project: BusinessProject) => {
        if (project.businessPlanUrl) {
            window.open(project.businessPlanUrl, '_blank');
        }
    };

    const handleSubmitDonation = async () => {
        if (!selectedProject || !donationAmount || parseFloat(donationAmount) <= 0) {
            alert('Please enter a valid donation amount');
            return;
        }

        setProcessing(true);
        
        const result = await makeDonation({
            projectId: selectedProject.id,
            merchantConfigId: selectedProject.merchantConfigId,
            amount: parseFloat(donationAmount),
            paymentMethod,
            message: donationMessage,
            isAnonymous: false
        });

        setProcessing(false);

        if (result.success) {
            alert(`🎉 Success! You've invested $${donationAmount} and received ${result.coinsIssued} ${selectedProject.coinName}!`);
            setShowDonateModal(false);
            setDonationAmount('');
            setDonationMessage('');
            loadProjects(); // Refresh to show updated progress
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading business opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            🚀 Turnkey Business Engine
                        </h1>
                        <p className="text-xl text-gray-600 mb-4">
                            Invest in Community Businesses & Earn Merchant Coins
                        </p>
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                                <h3 className="font-bold text-purple-900 mb-3">How It Works:</h3>
                                <div className="grid md:grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">💡</div>
                                        <div className="font-semibold text-purple-900">1. Business Idea</div>
                                        <div className="text-purple-700 text-xs">Community proposes turnkey business</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">💰</div>
                                        <div className="font-semibold text-purple-900">2. Seed Funding</div>
                                        <div className="text-purple-700 text-xs">Invest & get 100% back in coins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">⚡</div>
                                        <div className="font-semibold text-purple-900">3. Auction</div>
                                        <div className="text-purple-700 text-xs">Business sold to highest bidder</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🎉</div>
                                        <div className="font-semibold text-purple-900">4. Launch & Redeem</div>
                                        <div className="text-purple-700 text-xs">Use coins at new business</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl font-bold text-indigo-600">{projects.length}</div>
                        <div className="text-gray-600 mt-2">Active Projects</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl font-bold text-green-600">
                            ${projects.reduce((sum, p) => sum + p.currentFunding, 0).toLocaleString()}
                        </div>
                        <div className="text-gray-600 mt-2">Total Raised</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl font-bold text-purple-600">
                            {projects.reduce((sum, p) => sum + p.donorCount, 0)}
                        </div>
                        <div className="text-gray-600 mt-2">Community Investors</div>
                    </div>
                </div>

                {/* Project Grid */}
                {projects.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">🌱</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No Active Projects Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Be the first to propose a turnkey business idea to the community!
                        </p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            Submit Business Proposal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {projects.map(project => (
                            <BusinessPortfolioCard
                                key={project.id}
                                project={project}
                                onDonate={() => handleDonateClick(project)}
                                onViewPlan={() => handleViewPlan(project)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Donation Modal */}
            {showDonateModal && selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Invest in {selectedProject.name}
                                </h2>
                                <button
                                    onClick={() => setShowDonateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Project Summary */}
                            <div 
                                className="rounded-lg p-4 mb-6"
                                style={{ backgroundColor: `${selectedProject.brandColor}15` }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">{selectedProject.coinSymbol}</span>
                                    <div>
                                        <div className="font-semibold" style={{ color: selectedProject.brandColor }}>
                                            {selectedProject.coinName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {selectedProject.coinName} you'll receive
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Donation Amount */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Investment Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-lg font-semibold"
                                        min="1"
                                        step="1"
                                    />
                                </div>
                                {donationAmount && parseFloat(donationAmount) > 0 && (
                                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-green-700">You'll receive:</span>
                                            <span className="text-lg font-bold text-green-900 flex items-center gap-1">
                                                <span>{selectedProject.coinSymbol}</span>
                                                <span>{parseFloat(donationAmount).toLocaleString()}</span>
                                                <span className="text-sm font-normal">{selectedProject.coinName.replace(/s$/, '')}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="space-y-2">
                                    {['paypal', 'cash_app', 'stripe'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method as any)}
                                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                                                paymentMethod === method
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium capitalize">
                                                    {method.replace('_', ' ')}
                                                </span>
                                                {paymentMethod === method && (
                                                    <span className="text-indigo-600">✓</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Optional Message */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message (Optional)
                                </label>
                                <textarea
                                    value={donationMessage}
                                    onChange={(e) => setDonationMessage(e.target.value)}
                                    placeholder="Share why you're supporting this business..."
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Investment Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Investment Summary:</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Your Investment:</span>
                                        <span className="font-semibold">
                                            ${donationAmount || '0.00'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Coins Received:</span>
                                        <span className="font-semibold">
                                            {selectedProject.coinSymbol} {donationAmount || '0'}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between text-green-700">
                                            <span className="font-semibold">Redemption Value:</span>
                                            <span className="font-bold">
                                                ${donationAmount || '0.00'} (100%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                    💡 When the business launches, you can redeem up to <strong>50% per visit</strong> using your coins!
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitDonation}
                                disabled={processing || !donationAmount || parseFloat(donationAmount) <= 0}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    `💚 Invest $${donationAmount || '0'} & Get ${donationAmount || '0'} Coins`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrowdfundingPortal;

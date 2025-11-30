import React, { useState } from 'react';
import { BusinessProject, EquipmentItem } from '../services/crowdfundingService';

interface BusinessPortfolioCardProps {
    project: BusinessProject;
    onDonate?: () => void;
    onViewPlan?: () => void;
    showInvestmentView?: boolean; // For investor's portfolio view
    userInvestment?: number;
    userCoins?: number;
}

export const BusinessPortfolioCard: React.FC<BusinessPortfolioCardProps> = ({
    project,
    onDonate,
    onViewPlan,
    showInvestmentView = false,
    userInvestment,
    userCoins
}) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showEquipment, setShowEquipment] = useState(false);

    const fundingPercentage = Math.min(
        (project.currentFunding / project.fundraisingGoal) * 100,
        100
    );

    const remaining = project.fundraisingGoal - project.currentFunding;

    const getStatusColor = () => {
        switch (project.status) {
            case 'fundraising': return 'bg-blue-500';
            case 'funded': return 'bg-green-500';
            case 'auction': return 'bg-purple-500';
            case 'active': return 'bg-emerald-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = () => {
        switch (project.status) {
            case 'fundraising': return '🎯 Fundraising Active';
            case 'funded': return '✅ Fully Funded';
            case 'auction': return '⚡ Auction Live';
            case 'active': return '🏪 Business Active';
            default: return 'Planning';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            {/* Header Image */}
            {project.imageUrl && (
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    <img 
                        src={project.imageUrl} 
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-4 right-4 ${getStatusColor()} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {getStatusLabel()}
                    </div>
                </div>
            )}

            <div className="p-6">
                {/* Business Name & Tagline */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{project.coinSymbol}</span>
                        <h3 className="text-2xl font-bold text-gray-900">{project.name}</h3>
                    </div>
                    {project.tagline && (
                        <p className="text-gray-600 italic">{project.tagline}</p>
                    )}
                    <p className="text-gray-700 mt-2">{project.description}</p>
                </div>

                {/* Business Credentials */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">📋 EIN:</span>
                        <span className="font-mono font-semibold">
                            {project.ein || 'Pending Registration'}
                            {project.einVerified && (
                                <span className="ml-2 text-green-600">✓ Verified</span>
                            )}
                        </span>
                    </div>
                    {project.llcRegistrationDate && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">🏢 LLC Registered:</span>
                            <span className="font-medium">
                                {new Date(project.llcRegistrationDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                    {project.businessPlanUrl && (
                        <button
                            onClick={onViewPlan}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg transition-colors"
                        >
                            <span>📊</span>
                            <span className="font-medium">View 5-Year Business Plan</span>
                        </button>
                    )}
                </div>

                {/* Funding Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">💰 Savings Goal</span>
                        <span className="text-sm font-semibold text-gray-900">
                            ${project.currentFunding.toLocaleString()} / ${project.fundraisingGoal.toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${fundingPercentage}%` }}
                        >
                            {fundingPercentage > 20 && (
                                <span className="text-xs font-bold text-white">
                                    {fundingPercentage.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {project.donorCount}
                            </div>
                            <div className="text-xs text-gray-600">Investors</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                ${remaining.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600">Remaining</div>
                        </div>
                        {project.daysRemaining !== undefined && (
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {project.daysRemaining}
                                </div>
                                <div className="text-xs text-gray-600">Days Left</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Investment Breakdown Button */}
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg transition-colors mb-3"
                >
                    <span className="font-medium text-gray-700">💼 What the money will fund</span>
                    <span className="text-gray-500">{showBreakdown ? '▲' : '▼'}</span>
                </button>

                {/* Funding Breakdown */}
                {showBreakdown && project.fundingBreakdown && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-3 space-y-2">
                        <h4 className="font-semibold text-blue-900 mb-3">Investment Breakdown:</h4>
                        {Object.entries(project.fundingBreakdown).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                    ${(value as number).toLocaleString()}
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-blue-200 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-900">Total Needed:</span>
                                <span className="font-bold text-blue-900 text-lg">
                                    ${project.fundraisingGoal.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Equipment List Toggle */}
                        {project.equipmentChecklist.length > 0 && (
                            <button
                                onClick={() => setShowEquipment(!showEquipment)}
                                className="w-full mt-3 text-sm text-blue-700 hover:text-blue-800 font-medium"
                            >
                                {showEquipment ? '▲ Hide' : '▼ View'} Equipment Checklist ({project.equipmentChecklist.length} items)
                            </button>
                        )}
                    </div>
                )}

                {/* Equipment Checklist */}
                {showEquipment && project.equipmentChecklist.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 max-h-64 overflow-y-auto">
                        <h4 className="font-semibold text-gray-900 mb-3">📦 Equipment Checklist:</h4>
                        <div className="space-y-2">
                            {project.equipmentChecklist.map((item: EquipmentItem) => (
                                <div key={item.id} className="flex items-start justify-between p-2 bg-white rounded border border-gray-200">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-600">
                                            {item.category} • Qty: {item.quantity}
                                            {item.vendor && ` • ${item.vendor}`}
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <div className="font-semibold text-gray-900">
                                            ${item.estimatedCost.toLocaleString()}
                                        </div>
                                        <div className={`text-xs font-medium ${
                                            item.priority === 'essential' ? 'text-red-600' :
                                            item.priority === 'important' ? 'text-orange-600' :
                                            'text-gray-500'
                                        }`}>
                                            {item.priority}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User's Investment (Portfolio View) */}
                {showInvestmentView && userInvestment && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-3 border-2 border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">Your Investment:</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-purple-700">Amount Invested</div>
                                <div className="text-2xl font-bold text-purple-900">
                                    ${userInvestment.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-purple-700">
                                    {project.coinName} Earned
                                </div>
                                <div className="text-2xl font-bold text-purple-900 flex items-center gap-1">
                                    <span>{project.coinSymbol}</span>
                                    <span>{userCoins?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
                            💡 <strong>When business launches:</strong> Redeem up to 50% per visit with your {project.coinName}
                        </div>
                    </div>
                )}

                {/* Coin Details */}
                <div 
                    className="rounded-lg p-3 mb-4"
                    style={{ backgroundColor: `${project.brandColor}15` }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{project.coinSymbol}</span>
                            <div>
                                <div className="font-semibold" style={{ color: project.brandColor }}>
                                    {project.coinName}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Every $1 donated = 1 {project.coinName.replace(/s$/, '')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {project.status === 'fundraising' && (
                    <div className="space-y-2">
                        <button
                            onClick={onDonate}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            💚 Invest & Get {project.coinName}
                        </button>
                        
                        {project.paypalDonateButtonId && (
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                                onClick={() => window.open(`https://www.paypal.com/donate?hosted_button_id=${project.paypalDonateButtonId}`, '_blank')}
                            >
                                💳 Donate via PayPal
                            </button>
                        )}
                    </div>
                )}

                {project.status === 'funded' && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">🎉</div>
                        <div className="font-bold text-green-900 text-lg">Fully Funded!</div>
                        <div className="text-sm text-green-700 mt-1">
                            Business auction starting soon...
                        </div>
                    </div>
                )}

                {/* Transparency Note */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>🔒</span>
                        <span>
                            Funds held in transparent savings account. All transactions publicly visible.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessPortfolioCard;

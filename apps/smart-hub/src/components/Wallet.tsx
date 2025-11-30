import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Camera, Leaf, ShoppingBag, Sparkles, TrendingUp, Wallet as WalletIcon } from 'lucide-react';

interface Portfolio {
    slug: string;
    icon: React.ElementType;
    title: string;
    subtitle: string;
    description: string;
    status: string;
    goal: string;
    raised: string;
    timeline: string;
    coinName: string;
    coinSymbol: string;
    brandColor: string;
    progress: number;
}

const portfolios: Portfolio[] = [
    {
        slug: 'seasonal-greetings',
        icon: Sparkles,
        title: 'Seasonal Greetings',
        subtitle: 'Holiday Pop-Up Shop',
        description: 'Festive retail experience with curated gifts, decor, and warm hospitality for Dayton shoppers.',
        status: 'Fundraising',
        goal: '$2,000',
        raised: '$450',
        timeline: '60 days left',
        coinName: 'Holiday Tokens',
        coinSymbol: '🎄',
        brandColor: '#c41e3a',
        progress: 23,
    },
    {
        slug: 'gemstone-trails',
        icon: Leaf,
        title: 'Gemstone Trails',
        subtitle: 'Guided Nature Tours',
        description: 'Expert-led hikes spotlighting Ohio trails, education, and sustainable adventure.',
        status: 'Fundraising',
        goal: '$1,500',
        raised: '$680',
        timeline: '45 days left',
        coinName: 'Trail Tokens',
        coinSymbol: '💎',
        brandColor: '#2e7d32',
        progress: 45,
    },
    {
        slug: 'picnic-perfect',
        icon: ShoppingBag,
        title: 'Picnic Perfect',
        subtitle: 'Luxury Pop-Up Events',
        description: 'Gourmet picnic setups with premium service for proposals, birthdays, and celebrations.',
        status: 'Fundraising',
        goal: '$2,000',
        raised: '$320',
        timeline: '60 days left',
        coinName: 'Picnic Points',
        coinSymbol: '🧺',
        brandColor: '#d81b60',
        progress: 16,
    },
    {
        slug: 'dayton-micro-farms',
        icon: Camera,
        title: 'Dayton Micro-Farms',
        subtitle: 'Indoor Vertical Farms',
        description: 'Urban microgreens production delivering fresh, local superfoods to Dayton tables.',
        status: 'Fundraising',
        goal: '$2,200',
        raised: '$1,540',
        timeline: '90 days left',
        coinName: 'MicroFarm Coins',
        coinSymbol: '🌱',
        brandColor: '#558b2f',
        progress: 70,
    },
];

export const Wallet: React.FC = () => {
    const navigate = useNavigate();
    const [showPortfolios, setShowPortfolios] = useState(false);

    return (
        <div className="min-h-screen text-white font-sans p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Hub</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <WalletIcon className="text-primary" size={32} />
                        <h1 className="text-3xl font-bold gradient-text">Quantum Wallet</h1>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="glass-heavy p-8 rounded-3xl mb-8">
                    <div className="text-gray-400 text-sm mb-2">Total Balance</div>
                    <div className="text-5xl font-bold mb-6">$24,567.89</div>
                    <div className="flex gap-4">
                        <button className="btn-primary flex-1 py-3">Send</button>
                        <button className="btn-primary flex-1 py-3">Receive</button>
                        <button 
                            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                            onClick={() => setShowPortfolios(!showPortfolios)}
                        >
                            <Briefcase size={18} />
                            Portfolios
                        </button>
                    </div>
                </div>

                {/* Portfolios Section */}
                {showPortfolios && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Briefcase className="text-primary" size={24} />
                            <h2 className="text-2xl font-bold">Investment Portfolios</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {portfolios.map((portfolio) => (
                                <div
                                    key={portfolio.slug}
                                    className="app-card glass p-6 rounded-3xl border shadow-lg cursor-pointer transition-all duration-300"
                                    onClick={() => navigate(`/portfolios/${portfolio.slug}`)}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div 
                                            className="p-4 rounded-2xl"
                                            style={{ backgroundColor: portfolio.brandColor }}
                                        >
                                            <portfolio.icon className="text-white" size={32} />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold text-white mb-1">{portfolio.title}</h3>
                                            <p className="text-gray-400 text-sm">{portfolio.subtitle}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-300 mb-4">{portfolio.description}</p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>{portfolio.raised} raised</span>
                                            <span>{portfolio.goal} goal</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{ 
                                                    width: `${portfolio.progress}%`,
                                                    backgroundColor: portfolio.brandColor 
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs border-t border-gray-700 pt-4">
                                        <div>
                                            <span className="text-gray-500">Token: </span>
                                            <span className="text-white font-medium">{portfolio.coinSymbol} {portfolio.coinName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <TrendingUp size={14} className="text-primary" />
                                            <span>{portfolio.timeline}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                {!showPortfolios && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6 rounded-2xl">
                            <div className="text-gray-400 text-sm mb-2">Tokens</div>
                            <div className="text-3xl font-bold">12</div>
                            <div className="text-xs text-gray-500 mt-1">Active assets</div>
                        </div>
                        <div className="glass p-6 rounded-2xl">
                            <div className="text-gray-400 text-sm mb-2">NFTs</div>
                            <div className="text-3xl font-bold">8</div>
                            <div className="text-xs text-gray-500 mt-1">Collectibles</div>
                        </div>
                        <div className="glass p-6 rounded-2xl">
                            <div className="text-gray-400 text-sm mb-2">24h Change</div>
                            <div className="text-3xl font-bold text-green-400">+5.2%</div>
                            <div className="text-xs text-gray-500 mt-1">Portfolio growth</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

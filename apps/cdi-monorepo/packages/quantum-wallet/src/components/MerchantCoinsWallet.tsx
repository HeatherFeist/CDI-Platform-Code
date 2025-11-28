import React, { useState, useEffect } from 'react';
import { Coins, Clock, Store, Loader2 } from 'lucide-react';
import CrowdfundingCard from './CrowdfundingCard';
import { supabase } from '../supabase';
import {
    getUserMerchantCoins,
    getActiveCrowdfundingProjects,
    getUserCoinsTotalValue,
    type MerchantCoin,
    type CrowdfundingProject
} from '../services/merchantCoins';

// Mock data for demo mode
const MOCK_COINS: MerchantCoin[] = [
    {
        id: '1',
        merchantName: 'Seasonal Greetings',
        symbol: 'SGRT',
        balance: 150,
        valueUsd: 150.00,
        status: 'active',
        logoUrl: '🎄',
        redemptionRule: 'Max 50% of total invoice',
        projectId: 'mock-1'
    },
    {
        id: '2',
        merchantName: 'Gemstone Trails',
        symbol: 'GEMS',
        balance: 50,
        valueUsd: 50.00,
        status: 'locked',
        unlockDate: '2025-12-15',
        logoUrl: '💎',
        redemptionRule: '1 Token per visit',
        projectId: 'mock-2'
    }
];

const MOCK_CAMPAIGNS: CrowdfundingProject[] = [
    {
        id: '1',
        name: 'Picnic Perfect',
        slug: 'picnic-perfect',
        tagline: 'Luxury Pop-Up Events',
        description: 'A luxury pop-up picnic experience',
        fundingGoal: 2000,
        fundsRaised: 1200,
        cashtag: '$PicnicPerfectDayton',
        paypalUrl: 'https://paypal.me/picnicdayton',
        status: 'funding'
    },
    {
        id: '2',
        name: 'Dayton Micro-Farms',
        slug: 'dayton-micro-farms',
        tagline: 'Superfoods in the City',
        description: 'Indoor vertical microgreens farm',
        fundingGoal: 2200,
        fundsRaised: 450,
        cashtag: '$DaytonMicroGreens',
        paypalUrl: 'https://paypal.me/daytonmicro',
        status: 'funding'
    }
];

const MerchantCoinsWallet: React.FC = () => {
    const [coins, setCoins] = useState<MerchantCoin[]>([]);
    const [campaigns, setCampaigns] = useState<CrowdfundingProject[]>([]);
    const [view, setView] = useState<'wallet' | 'fund'>('wallet');
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState(0);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            if (session?.user) {
                loadRealData(session.user.id);
            } else {
                loadMockData();
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                loadRealData(session.user.id);
            } else {
                loadMockData();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadRealData = async (userId: string) => {
        setLoading(true);
        try {
            const [userCoins, activeProjects, total] = await Promise.all([
                getUserMerchantCoins(userId),
                getActiveCrowdfundingProjects(),
                getUserCoinsTotalValue(userId)
            ]);

            setCoins(userCoins);
            setCampaigns(activeProjects);
            setTotalValue(total);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fall back to mock data on error
            loadMockData();
        } finally {
            setLoading(false);
        }
    };

    const loadMockData = () => {
        setCoins(MOCK_COINS);
        setCampaigns(MOCK_CAMPAIGNS);
        setTotalValue(400);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Merchant Coins</h2>
                    <p className="text-slate-400">
                        {user ? 'Manage credits & fund new businesses' : 'Demo Mode - Sign in to see your real coins'}
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    {view === 'wallet' && coins.length > 0 && (
                        <div className="bg-indigo-900/30 px-4 py-2 rounded-lg border border-indigo-500/30">
                            <span className="text-sm text-indigo-300">Total Value</span>
                            <div className="text-xl font-bold text-white">${totalValue.toFixed(2)}</div>
                        </div>
                    )}
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setView('wallet')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'wallet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            My Wallet
                        </button>
                        <button
                            onClick={() => setView('fund')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'fund' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Fund Projects
                        </button>
                    </div>
                </div>
            </div>

            {view === 'wallet' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coins.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Coins className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Coins Yet</h3>
                            <p className="text-slate-400 mb-6">Fund a project to earn your first merchant coins!</p>
                            <button
                                onClick={() => setView('fund')}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Browse Projects
                            </button>
                        </div>
                    ) : (
                        <>
                            {coins.map((coin) => (
                                <div key={coin.id} className="card-glass p-6 relative overflow-hidden group">
                                    {/* Coin Card Content */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/0 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                                                {coin.logoUrl}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{coin.merchantName}</h3>
                                                <span className="text-xs font-medium text-slate-400">{coin.symbol}</span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium border ${coin.status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {coin.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-4">
                                        <div className="text-3xl font-bold text-white">{coin.balance}</div>
                                        <div className="text-sm text-slate-400">≈ ${coin.valueUsd.toFixed(2)} USD</div>
                                    </div>

                                    {coin.redemptionRule && (
                                        <div className="mb-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Usage Limit</p>
                                            <p className="text-sm text-indigo-300 font-medium">{coin.redemptionRule}</p>
                                        </div>
                                    )}

                                    {coin.status === 'active' ? (
                                        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                                            <Store className="w-4 h-4" />
                                            <span>Redeem at Store</span>
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg font-medium flex items-center justify-center space-x-2 cursor-not-allowed">
                                            <Clock className="w-4 h-4" />
                                            <span>Unlocks {coin.unlockDate}</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Call to Action Card */}
                            <button
                                onClick={() => setView('fund')}
                                className="card-glass p-6 border-dashed border-2 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center text-center group"
                            >
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                                    <Coins className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                </div>
                                <h3 className="font-bold text-white mb-1">Fund a Business</h3>
                                <p className="text-sm text-slate-400">Donate to new projects and earn coins</p>
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-bold text-white mb-2">No Active Campaigns</h3>
                            <p className="text-slate-400">Check back soon for new business opportunities!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map(campaign => (
                                <CrowdfundingCard key={campaign.id} project={campaign} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MerchantCoinsWallet;

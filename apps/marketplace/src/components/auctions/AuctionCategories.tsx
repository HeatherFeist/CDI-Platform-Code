import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Store,
    Briefcase,
    Package,
    Hammer,
    Sparkles,
    TrendingUp,
    Shield,
    Users,
    ArrowRight
} from 'lucide-react';

const AuctionCategories: React.FC = () => {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'pro-materials',
            title: 'Pro Materials & Supplies',
            icon: Package,
            color: 'from-blue-600 to-cyan-600',
            description: 'Bulk lots and individual items from our partnerships with Lowe\'s and Home Depot',
            features: [
                'Returns & scratch-and-dent items at deep discounts',
                'Bulk lots for contractors and flippers',
                'Individual items for DIY homeowners',
                'Buy Now or Auction format',
                'Materials Credit NFT rewards',
                'Redeemable at nonprofit warehouse or shipped direct'
            ],
            howItWorks: [
                'Browse available materials (updated weekly)',
                'Place bid or Buy Now',
                'Win auction or purchase instantly',
                'Receive Materials Credit NFT in your wallet',
                'Redeem at warehouse or request shipping',
                'Use NFTs for future purchases or trade'
            ],
            benefits: [
                'Save 40-70% off retail prices',
                'Support nonprofit mission',
                'Earn tradeable NFT credits',
                'Access exclusive contractor deals',
                'Sustainable reuse of materials'
            ],
            cta: 'Browse Materials',
            route: '/auctions/pro-materials'
        },
        {
            id: 'turnkey-business',
            title: 'Turnkey Business Opportunities',
            icon: Briefcase,
            color: 'from-purple-600 to-pink-600',
            description: 'Fully-vetted, ready-to-launch businesses created by our nonprofit',
            features: [
                'Pre-registered LLC with EIN',
                'Professional 5-year business plan',
                'Complete branding package (logo, website, marketing)',
                'Pre-negotiated supplier contracts',
                'Financial projections & market analysis',
                '6-12 months nonprofit mentorship',
                'Auto-listing in Service Directory',
                'Community crowdfunding support'
            ],
            howItWorks: [
                'Browse available turnkey businesses',
                'Review business plan, financials, and documents',
                'Place your bid (auction runs 7-10 days)',
                'Win auction and receive full business transfer',
                'List on Idea Board for community crowdfunding',
                'Launch business with nonprofit support',
                'Mint NFT coins for supporters',
                'Get listed in Service Directory automatically'
            ],
            benefits: [
                'Skip months of setup and legal work',
                'Proven business models with research',
                'Immediate community support',
                'Built-in customer base (NFT holders)',
                'Ongoing mentorship and guidance',
                'Lower risk than starting from scratch'
            ],
            cta: 'View Businesses',
            route: '/auctions/turnkey-businesses'
        },
        {
            id: 'retail-products',
            title: 'Retail Products & Goods',
            icon: Store,
            color: 'from-green-600 to-emerald-600',
            description: 'Curated products from community sellers and nonprofit partners',
            features: [
                'Handmade and artisan goods',
                'Vintage and collectible items',
                'Home décor and furnishings',
                'Tools and equipment',
                'Electronics and gadgets',
                'Fixed price or auction format'
            ],
            howItWorks: [
                'Browse products by category',
                'Place bid or Buy Now',
                'Win auction or purchase instantly',
                'Seller ships directly to you',
                'Leave review and earn rewards',
                'Support local creators and businesses'
            ],
            benefits: [
                'Unique items not found elsewhere',
                'Support community sellers',
                'Competitive pricing through auctions',
                'Buyer protection guarantee',
                'Earn rewards on purchases'
            ],
            cta: 'Shop Now',
            route: '/store/browse'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-gradient-primary">Auction Categories</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Explore our three unique auction categories, each designed to support our nonprofit mission
                        while providing incredible value to our community
                    </p>
                </div>

                {/* Trust Badges */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
                        <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">Nonprofit-Backed</h3>
                        <p className="text-slate-400 text-sm">
                            All auctions support our 501(c)(3) mission of community economic development
                        </p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
                        <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">Community-Driven</h3>
                        <p className="text-slate-400 text-sm">
                            Built by the community, for the community - everyone benefits
                        </p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
                        <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">NFT Rewards</h3>
                        <p className="text-slate-400 text-sm">
                            Earn tradeable NFT credits and merchant coins on purchases and support
                        </p>
                    </div>
                </div>

                {/* Category Cards */}
                <div className="space-y-12">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <div
                                key={category.id}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden hover:border-purple-500/50 transition-all"
                            >
                                {/* Header */}
                                <div className={`bg-gradient-to-r ${category.color} p-8`}>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white">{category.title}</h2>
                                            <p className="text-white/90 text-lg mt-1">{category.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    <div className="grid md:grid-cols-3 gap-8">
                                        {/* Features */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                                                What's Included
                                            </h3>
                                            <ul className="space-y-2">
                                                {category.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start space-x-2 text-slate-300 text-sm">
                                                        <span className="text-green-400 mt-1">✓</span>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* How It Works */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                                <Hammer className="w-5 h-5 mr-2 text-blue-400" />
                                                How It Works
                                            </h3>
                                            <ol className="space-y-2">
                                                {category.howItWorks.map((step, i) => (
                                                    <li key={i} className="flex items-start space-x-3 text-slate-300 text-sm">
                                                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <span>{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {/* Benefits */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                                                Key Benefits
                                            </h3>
                                            <ul className="space-y-2">
                                                {category.benefits.map((benefit, i) => (
                                                    <li key={i} className="flex items-start space-x-2 text-slate-300 text-sm">
                                                        <span className="text-purple-400 mt-1">★</span>
                                                        <span>{benefit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={() => navigate(category.route)}
                                            className={`bg-gradient-to-r ${category.color} text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center space-x-2`}
                                        >
                                            <span>{category.cta}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Start Bidding?
                    </h2>
                    <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
                        Join our community marketplace and discover incredible deals while supporting
                        local businesses and our nonprofit mission
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => navigate('/members/register')}
                            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-all"
                        >
                            Create Free Account
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all border border-white/30"
                        >
                            Browse All Auctions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionCategories;

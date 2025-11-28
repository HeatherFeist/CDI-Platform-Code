import { ArrowRight, Building2, Image, ShoppingBag, Shield, Users, Zap, Globe, Sparkles, Wallet, Rocket, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 custom-scrollbar overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-premium bg-slate-900/60 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-2.5 rounded-xl shadow-lg glow-indigo group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold gradient-text">
                                Constructive Designs Inc.
                            </span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-2">
                                <a href="#apps" className="hover:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/50">Apps</a>
                                <a href="#turnkey" className="hover:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/50">Turnkey Business</a>
                                <a href="#features" className="hover:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/50">Features</a>
                                <a href="#community" className="hover:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/50">Community</a>
                            </div>
                        </div>
                        <div>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary px-6 py-3 flex items-center gap-2"
                            >
                                <span>Sign In</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-24 sm:pt-48 sm:pb-32 overflow-hidden">
                {/* Animated Background Orbs */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl float animate-pulse"></div>
                    <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl float" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-20 left-1/3 w-[450px] h-[450px] bg-cyan-600/20 rounded-full blur-3xl float" style={{ animationDelay: '4s' }}></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-8">
                        <Sparkles className="text-indigo-400" size={16} />
                        <span className="text-sm font-semibold text-indigo-300">Powered by AI & Innovation</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8 leading-tight">
                        <span className="block text-slate-50 mb-2">Empowering Nonprofits with</span>
                        <span className="gradient-text text-6xl sm:text-8xl">
                            Next-Gen Technology
                        </span>
                    </h1>

                    <p className="mt-6 text-xl sm:text-2xl text-slate-400 max-w-4xl mx-auto mb-12 leading-relaxed">
                        A unified ecosystem of tools designed to streamline operations, visualize projects, and connect communities. Built on the <span className="text-indigo-400 font-semibold">"Piggyback on Giants"</span> philosophy.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary px-10 py-5 text-lg flex items-center justify-center gap-3"
                        >
                            <span className="font-bold">Get Started Free</span>
                            <ArrowRight size={22} />
                        </button>
                        <button className="btn-secondary px-10 py-5 text-lg font-bold">
                            Explore Ecosystem
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
                        <div className="card-glass p-6">
                            <div className="text-4xl font-black gradient-text-indigo mb-2">4+</div>
                            <div className="text-slate-400 font-medium">Integrated Apps</div>
                        </div>
                        <div className="card-glass p-6">
                            <div className="text-4xl font-black gradient-text-cyan mb-2">AI</div>
                            <div className="text-slate-400 font-medium">Powered Tools</div>
                        </div>
                        <div className="card-glass p-6">
                            <div className="text-4xl font-black gradient-text-purple mb-2">∞</div>
                            <div className="text-slate-400 font-medium">Possibilities</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apps Grid */}
            <div id="apps" className="py-24 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-50 mb-6">
                            Our <span className="gradient-text">Ecosystem</span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            One account, unlimited possibilities. Access all our specialized applications from a single unified dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* RenovVision */}
                        <a
                            href="https://renovision.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div
                                className="icon-container w-20 h-20 flex items-center justify-center mb-6"
                                style={{
                                    '--icon-color-from': 'rgba(99, 102, 241, 0.8)',
                                    '--icon-color-to': 'rgba(79, 70, 229, 0.9)',
                                    '--icon-shadow': 'rgba(99, 102, 241, 0.4)'
                                } as React.CSSProperties}
                            >
                                <Building2 className="text-white" size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-indigo transition-all">RenovVision</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                AI-powered home renovation management. Generate estimates, manage projects, and procure materials tax-free.
                            </p>
                            <div className="flex items-center text-indigo-400 font-bold group-hover:gap-3 gap-2 transition-all">
                                <span>Launch App</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Image Generator */}
                        <a
                            href="https://images.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div
                                className="icon-container w-20 h-20 flex items-center justify-center mb-6"
                                style={{
                                    '--icon-color-from': 'rgba(34, 211, 238, 0.8)',
                                    '--icon-color-to': 'rgba(6, 182, 212, 0.9)',
                                    '--icon-shadow': 'rgba(34, 211, 238, 0.4)'
                                } as React.CSSProperties}
                            >
                                <Image className="text-white" size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-cyan transition-all">CDI Image Gen</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Visualize renovations with AI. Generate before/after concepts, product staging, and marketing assets.
                            </p>
                            <div className="flex items-center text-cyan-400 font-bold group-hover:gap-3 gap-2 transition-all">
                                <span>Create Images</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Marketplace */}
                        <a
                            href="https://marketplace.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div
                                className="icon-container w-20 h-20 flex items-center justify-center mb-6"
                                style={{
                                    '--icon-color-from': 'rgba(52, 211, 153, 0.8)',
                                    '--icon-color-to': 'rgba(16, 185, 129, 0.9)',
                                    '--icon-shadow': 'rgba(52, 211, 153, 0.4)'
                                } as React.CSSProperties}
                            >
                                <ShoppingBag className="text-white" size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-emerald transition-all">Marketplace</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Buy and sell materials, tools, and services. Connect with local contractors and suppliers.
                            </p>
                            <div className="flex items-center text-emerald-400 font-bold group-hover:gap-3 gap-2 transition-all">
                                <span>Browse Products</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        {/* Quantum Wallet */}
                        <a
                            href="https://wallet.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div
                                className="icon-container w-20 h-20 flex items-center justify-center mb-6"
                                style={{
                                    '--icon-color-from': 'rgba(168, 85, 247, 0.8)',
                                    '--icon-color-to': 'rgba(147, 51, 234, 0.9)',
                                    '--icon-shadow': 'rgba(168, 85, 247, 0.4)'
                                } as React.CSSProperties}
                            >
                                <Wallet className="text-white" size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-purple transition-all">Quantum Wallet</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Secure financial management and payment processing. Track expenses, manage budgets, and process payments.
                            </p>
                            <div className="flex items-center text-purple-400 font-bold group-hover:gap-3 gap-2 transition-all">
                                <span>Manage Finances</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Turnkey Business Engine Section - NEW! */}
            <div id="turnkey" className="py-24 relative bg-gradient-to-b from-slate-900/50 to-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
                            <Rocket className="text-emerald-400" size={16} />
                            <span className="text-sm font-semibold text-emerald-300">New Initiative</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-50 mb-6">
                            <span className="gradient-text">Turnkey Business</span> Creation Engine
                        </h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            Fund a business. Get store credit. Support local entrepreneurs and receive 100% of your donation back in merchant coins.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                        {/* Info Card */}
                        <div className="card-glass p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-600/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

                            <div className="relative z-10">
                                <h3 className="text-3xl font-black text-slate-50 mb-6">How It Works</h3>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                                            1
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">We Incubate</h4>
                                            <p className="text-slate-400 text-sm">Our committee researches high-margin, low-risk business concepts perfect for Dayton.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                                            2
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">You Fund</h4>
                                            <p className="text-slate-400 text-sm">Donate via Cash App or PayPal. Get 100% value back in merchant coins for that business.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                                            3
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">We Build</h4>
                                            <p className="text-slate-400 text-sm">We set up the LLC, buy equipment, and prep the launch. Zero risk for the owner.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                                            4
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">You Redeem</h4>
                                            <p className="text-slate-400 text-sm">Use your coins when the business launches. You're their first customer!</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <TrendingUp size={18} />
                                            <span className="font-semibold">100% Store Credit</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-400">
                                            <Shield size={18} />
                                            <span className="font-semibold">Zero Risk</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <DollarSign size={18} />
                                            <span className="font-semibold">Support Local</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sample Projects Preview */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-50 mb-6">Current Projects</h3>

                            {/* Project Card 1 */}
                            <div className="card-glass p-6 hover:border-emerald-500/50 transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-white text-lg">🎄 Seasonal Greetings</h4>
                                        <p className="text-sm text-slate-400">Porch decorating service</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-400">Goal</div>
                                        <div className="font-bold text-white">$500</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: '0%' }}></div>
                                </div>
                                <p className="text-xs text-slate-500">Funding starts soon</p>
                            </div>

                            {/* Project Card 2 */}
                            <div className="card-glass p-6 hover:border-cyan-500/50 transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-white text-lg">💎 Gemstone Trails</h4>
                                        <p className="text-sm text-slate-400">Vending machine network</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-400">Goal</div>
                                        <div className="font-bold text-white">$2,700</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }}></div>
                                </div>
                                <p className="text-xs text-slate-500">Funding starts soon</p>
                            </div>

                            <a
                                href="/public/fund.html"
                                target="_blank"
                                className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-lg font-bold"
                            >
                                <span>View All Projects</span>
                                <ArrowRight size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-50 mb-8">
                                Why Choose <span className="gradient-text">CDI</span>?
                            </h2>
                            <div className="space-y-8">
                                <div className="flex gap-5 group">
                                    <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 p-4 rounded-2xl h-fit border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Shield className="text-indigo-400" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-50 mb-3">Secure & Private</h3>
                                        <p className="text-slate-400 leading-relaxed text-lg">
                                            Your data is yours. We use enterprise-grade security and "Bring Your Own Keys" architecture to ensure privacy.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5 group">
                                    <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-500/10 p-4 rounded-2xl h-fit border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                        <Zap className="text-cyan-400" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-50 mb-3">AI-Powered</h3>
                                        <p className="text-slate-400 leading-relaxed text-lg">
                                            Leverage the latest AI models (Gemini, Imagen) to automate estimates, design, and content creation.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5 group">
                                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 p-4 rounded-2xl h-fit border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <Users className="text-emerald-400" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-50 mb-3">Community Driven</h3>
                                        <p className="text-slate-400 leading-relaxed text-lg">
                                            Built for nonprofits and community organizations. Profits are reinvested into the ecosystem.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-cyan-600/30 rounded-3xl blur-3xl opacity-50"></div>
                            <div className="relative card-glass p-10 shadow-2xl">
                                <div className="flex items-center justify-between mb-10 border-b border-slate-700/50 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                        <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                                        <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                    </div>
                                    <div className="text-slate-500 text-sm font-semibold">Smart Hub Dashboard</div>
                                </div>
                                <div className="space-y-6">
                                    <div className="h-10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl w-3/4 shimmer"></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 hover:border-indigo-500/50 transition-all">
                                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl mb-3"></div>
                                            <div className="h-3 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                                            <div className="h-2 bg-slate-700/30 rounded w-1/2"></div>
                                        </div>
                                        <div className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 hover:border-cyan-500/50 transition-all">
                                            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl mb-3"></div>
                                            <div className="h-3 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                                            <div className="h-2 bg-slate-700/30 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="h-32 bg-gradient-to-br from-slate-800/30 to-slate-800/50 rounded-2xl border border-slate-700/30"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900/50 border-t border-slate-800/50 py-16 mt-24 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-2.5 rounded-xl shadow-lg glow-indigo">
                                <Building2 className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold gradient-text">
                                Constructive Designs Inc.
                            </span>
                        </div>
                        <div className="text-slate-500 text-sm font-medium">
                            © 2025 Constructive Designs Inc. All rights reserved.
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800/50 rounded-xl">
                                <Globe size={22} />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800/50 rounded-xl">
                                <Users size={22} />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

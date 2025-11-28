import { Building2, Image, ShoppingBag, LogOut, Settings, User, Wallet, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex custom-scrollbar">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 border-r border-slate-800/50 flex flex-col backdrop-blur-xl">
                <div className="p-8 flex items-center gap-3 border-b border-slate-800/50">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-2.5 rounded-xl shadow-lg glow-indigo">
                        <Building2 className="text-white" size={28} />
                    </div>
                    <span className="text-2xl font-black gradient-text">Smart Hub</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6">
                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                        <Activity size={22} />
                        <span>Overview</span>
                    </button>
                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-300 font-semibold hover:border hover:border-slate-700/50">
                        <User size={22} />
                        <span>Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-300 font-semibold hover:border hover:border-slate-700/50">
                        <Settings size={22} />
                        <span>Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-semibold hover:border hover:border-red-500/30"
                    >
                        <LogOut size={22} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="sticky top-0 z-40 backdrop-blur-premium bg-slate-900/60 border-b border-slate-800/50 px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black text-slate-50 mb-2">
                                Welcome back, <span className="gradient-text">User</span>
                            </h1>
                            <p className="text-slate-400 text-lg">Here are your active applications and recent activity.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 card-glass px-5 py-3">
                                <Sparkles className="text-indigo-400" size={20} />
                                <span className="text-sm font-semibold text-slate-300">Premium Account</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg glow-indigo cursor-pointer hover:scale-110 transition-transform">
                                JD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="card-glass p-6 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-indigo-500/20 p-3 rounded-xl">
                                    <Activity className="text-indigo-400" size={24} />
                                </div>
                                <TrendingUp className="text-emerald-400" size={20} />
                            </div>
                            <div className="text-3xl font-black text-slate-50 mb-1">4</div>
                            <div className="text-slate-400 font-medium">Active Apps</div>
                        </div>
                        <div className="card-glass p-6 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-cyan-500/20 p-3 rounded-xl">
                                    <Sparkles className="text-cyan-400" size={24} />
                                </div>
                                <TrendingUp className="text-emerald-400" size={20} />
                            </div>
                            <div className="text-3xl font-black text-slate-50 mb-1">12</div>
                            <div className="text-slate-400 font-medium">Projects Created</div>
                        </div>
                        <div className="card-glass p-6 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-purple-500/20 p-3 rounded-xl">
                                    <TrendingUp className="text-purple-400" size={24} />
                                </div>
                                <TrendingUp className="text-emerald-400" size={20} />
                            </div>
                            <div className="text-3xl font-black text-slate-50 mb-1">98%</div>
                            <div className="text-slate-400 font-medium">Efficiency Score</div>
                        </div>
                    </div>

                    {/* Apps Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-50 mb-6">Your Applications</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* RenovVision Card */}
                        <a
                            href="https://renovision.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div
                                    className="icon-container w-16 h-16 flex items-center justify-center"
                                    style={{
                                        '--icon-color-from': 'rgba(99, 102, 241, 0.8)',
                                        '--icon-color-to': 'rgba(79, 70, 229, 0.9)',
                                        '--icon-shadow': 'rgba(99, 102, 241, 0.4)'
                                    } as React.CSSProperties}
                                >
                                    <Building2 className="text-white" size={28} />
                                </div>
                                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 pulse-glow">
                                    Active
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-indigo transition-all">RenovVision</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Manage your renovation projects, estimates, and material orders with AI-powered tools.
                            </p>
                            <div className="text-indigo-400 text-sm font-bold group-hover:underline flex items-center gap-2">
                                <span>Launch App</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </a>

                        {/* Image Generator Card */}
                        <a
                            href="https://images.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div
                                    className="icon-container w-16 h-16 flex items-center justify-center"
                                    style={{
                                        '--icon-color-from': 'rgba(34, 211, 238, 0.8)',
                                        '--icon-color-to': 'rgba(6, 182, 212, 0.9)',
                                        '--icon-shadow': 'rgba(34, 211, 238, 0.4)'
                                    } as React.CSSProperties}
                                >
                                    <Image className="text-white" size={28} />
                                </div>
                                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 pulse-glow">
                                    Active
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-cyan transition-all">Image Generator</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Create AI-powered visualizations and marketing assets for your projects.
                            </p>
                            <div className="text-cyan-400 text-sm font-bold group-hover:underline flex items-center gap-2">
                                <span>Launch App</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </a>

                        {/* Marketplace Card */}
                        <a
                            href="https://marketplace.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div
                                    className="icon-container w-16 h-16 flex items-center justify-center"
                                    style={{
                                        '--icon-color-from': 'rgba(52, 211, 153, 0.8)',
                                        '--icon-color-to': 'rgba(16, 185, 129, 0.9)',
                                        '--icon-shadow': 'rgba(52, 211, 153, 0.4)'
                                    } as React.CSSProperties}
                                >
                                    <ShoppingBag className="text-white" size={28} />
                                </div>
                                <span className="bg-slate-700/50 text-slate-400 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-600">
                                    Coming Soon
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-emerald transition-all">Marketplace</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Buy and sell materials, tools, and services in the CDI ecosystem.
                            </p>
                            <div className="text-emerald-400 text-sm font-bold group-hover:underline flex items-center gap-2">
                                <span>Launch App</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </a>

                        {/* Quantum Wallet Card */}
                        <a
                            href="https://wallet.constructivedesignsinc.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div
                                    className="icon-container w-16 h-16 flex items-center justify-center"
                                    style={{
                                        '--icon-color-from': 'rgba(168, 85, 247, 0.8)',
                                        '--icon-color-to': 'rgba(147, 51, 234, 0.9)',
                                        '--icon-shadow': 'rgba(168, 85, 247, 0.4)'
                                    } as React.CSSProperties}
                                >
                                    <Wallet className="text-white" size={28} />
                                </div>
                                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 pulse-glow">
                                    Active
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-50 mb-3 group-hover:gradient-text-purple transition-all">Quantum Wallet</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Secure financial management and payment processing for your organization.
                            </p>
                            <div className="text-purple-400 text-sm font-bold group-hover:underline flex items-center gap-2">
                                <span>Launch App</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </a>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-12">
                        <h2 className="text-3xl font-black text-slate-50 mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card-glass p-8 group hover:scale-105 transition-transform cursor-pointer">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-indigo-500/20 p-4 rounded-xl">
                                        <Sparkles className="text-indigo-400" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-50">Create New Project</h3>
                                        <p className="text-slate-400 text-sm">Start a new renovation project</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-glass p-8 group hover:scale-105 transition-transform cursor-pointer">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-cyan-500/20 p-4 rounded-xl">
                                        <Image className="text-cyan-400" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-50">Generate Images</h3>
                                        <p className="text-slate-400 text-sm">Create AI-powered visuals</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

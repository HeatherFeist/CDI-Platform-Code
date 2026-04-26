import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

interface App {
    slug: string;
    icon: React.ElementType | string;
    title: string;
    subtitle: string;
    description: string;
    status: string;
    brandColor: string;
    initialState: boolean;
    isCustomIcon?: boolean;
}

interface AppCardProps {
    app: App;
}

const AppCard: React.FC<AppCardProps> = ({ app }) => {
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(app.initialState);
    const Icon = app.icon as React.ElementType;

    return (
        <div
            role="button"
            onClick={() => navigate(`/apps/${app.slug}`)}
            className={`app-card glass p-10 rounded-3xl border shadow-lg flex flex-col transition-all duration-300 cursor-pointer flex-shrink-0 hover:scale-105 ${isActive ? 'active' : ''}`}
            style={{ width: '320px', height: '320px' }}
        >
            {/* Large Showcase Icon */}
            <div className="relative mb-10 flex justify-center">
                <div 
                    className="p-12 rounded-3xl shadow-xl flex items-center justify-center" 
                    style={{ 
                        backgroundColor: app.brandColor,
                        boxShadow: `0 25px 70px ${app.brandColor}90`
                    }}
                >
                    {app.isCustomIcon ? (
                        <img src={app.icon as string} alt={app.title} className="w-40 h-40 object-contain" />
                    ) : (
                        <Icon className="text-white" size={160} strokeWidth={1.5} />
                    )}
                </div>
                <div
                    className={`toggle w-14 h-7 rounded-full flex items-center cursor-pointer transition-colors absolute -top-2 -right-2 ${isActive ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
                >
                    <div className={`w-6 h-6 bg-white rounded-full ml-0.5 transform ${isActive ? 'translate-x-6' : 'translate-x-0'} transition-transform`} />
                </div>
            </div>
            
            <div className="text-center mb-10">
                <h3 className="font-bold text-4xl text-white mb-4 leading-tight">{app.title}</h3>
                <p className="text-gray-400 text-base uppercase tracking-widest font-semibold">{app.subtitle}</p>
            </div>
            
            <div className="flex-grow flex flex-col justify-between">
                <p className="text-lg text-gray-300 leading-relaxed text-center px-6 mb-10">{app.description}</p>
                
                <div className="mt-auto pt-10">
                    <div className="flex items-center justify-center gap-4 text-base py-5 px-8 rounded-xl bg-gray-800/50">
                        {isActive ? (
                            <>
                                <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                                <span className="text-gray-300 font-semibold uppercase tracking-wide">Live</span>
                            </>
                        ) : (
                            <>
                                <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                                <span className="text-gray-500 font-semibold uppercase tracking-wide">Offline</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const apps: App[] = [
        {
            slug: 'renovision',
            icon: '/icons/renovision.svg',
            title: 'Renovision',
            subtitle: 'Home Renovation',
            description: 'Plan your next renovation with AI-powered estimates, real material prices, and tax-free purchasing.',
            status: 'Live',
            brandColor: '#2D68FF',
            initialState: true,
            isCustomIcon: true,
        },
        {
            slug: 'marketplace',
            icon: '/icons/marketplace.svg',
            title: 'Marketplace',
            subtitle: 'Buy & Sell Locally',
            description: 'Buy, sell, auction, or trade with people in your community. Safe meetups and PayPal protection built in.',
            status: 'Live',
            brandColor: '#00C2FF',
            initialState: true,
            isCustomIcon: true,
        },
        {
            slug: 'wallet',
            icon: '/icons/wallet.svg',
            title: 'Quantum Wallet',
            subtitle: 'Money Manager',
            description: 'Link your bank accounts, track spending, and manage project budgets — all in one dashboard.',
            status: 'Live',
            brandColor: '#9333EA',
            initialState: true,
            isCustomIcon: true,
        },
        {
            slug: 'image-editor',
            icon: '/icons/image-editor.svg',
            title: 'Image Editor',
            subtitle: 'AI Photo Editor',
            description: 'Visualize renovation ideas before you start. Upload a room photo and see what it could look like.',
            status: 'Live',
            brandColor: '#EC4899',
            initialState: true,
            isCustomIcon: true,
        },
        {
            slug: 'shopreneur',
            icon: 'https://img.freepik.com/free-photo/showing-cart-trolley-shopping-online-sign-graphic_53876-133967.jpg?semt=ais_hybrid&w=740&q=80',
            title: "Shop'reneur",
            subtitle: 'Start Your Store',
            description: 'Launch your own online store in minutes — inventory management, payments, and analytics included.',
            status: 'Live',
            brandColor: '#0EA5E9',
            initialState: true,
            isCustomIcon: true,
        },
    ];


    return (
        <div className="min-h-screen text-white font-sans">
            <nav className="sticky top-0 z-50 glass-heavy px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-8">
                    <button className="text-gray-300 px-4 py-2 rounded-lg hover:text-white transition-colors">Tools</button>
                    <button className="text-gray-300 px-4 py-2 rounded-lg hover:text-white transition-colors" onClick={() => navigate('/business-directory')}>Find a Pro</button>
                    <div className="bg-primary p-2.5 rounded-2xl shadow-sm">
                        <Building2 size={24} />
                    </div>
                    <button className="text-gray-300 px-4 py-2 rounded-lg hover:text-white transition-colors">Dashboard</button>
                    <button className="btn-primary px-6 py-2" onClick={() => navigate('/login')}>Sign In</button>
                </div>
            </nav>

            <header className="hero-glow py-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold gradient-text mb-4">Save Money on Home Projects</h1>
                    <p className="text-gray-300 text-lg">Free AI tools, tax-exempt material savings, and a local marketplace — all from a 501(c)(3) nonprofit.</p>
                </div>
            </header>

            <main className="-mt-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-8 justify-center items-start py-12 flex-wrap">
                        {apps.map((app) => (
                            <div key={app.slug}>
                                <AppCard app={app} />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="mt-16 px-6 pb-12 text-gray-400 text-center">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-2">© 2026 Constructive Designs Inc.</div>
                    <div className="text-sm text-gray-500">A 501(c)(3) nonprofit — saving you money on every project.</div>
                </div>
            </footer>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  requiresVerification: boolean;
  comingSoon?: boolean;
}

const apps: App[] = [
  {
    id: 'renovision',
    name: 'RenovVision',
    description: 'AI-powered estimates, project management, and job costing',
    url: 'https://renovision.web.app',
    icon: '📊',
    color: 'from-blue-500 to-blue-700',
    requiresVerification: false,
  },
  {
    id: 'marketplace',
    name: 'Materials Marketplace',
    description: 'Buy and sell new/used materials, auctions, local pickup',
    url: 'https://marketplace-cd.web.app',
    icon: '🏪',
    color: 'from-green-500 to-green-700',
    requiresVerification: false,
  },
  {
    id: 'wallet',
    name: 'Quantum Wallet',
    description: 'Manage USD, crypto, and time tracking in one place',
    url: 'https://wallet-cd.web.app',
    icon: '💰',
    color: 'from-purple-500 to-purple-700',
    requiresVerification: false,
  },
  {
    id: 'portal',
    name: 'Member Portal',
    description: 'Connect with verified contractors, team management',
    url: 'https://portal-cd.web.app',
    icon: '👥',
    color: 'from-indigo-500 to-indigo-700',
    requiresVerification: true,
  },
];

export default function AppLauncher() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, businesses(*)')
      .eq('id', userId)
      .single();
    
    setProfile(data);
    setLoading(false);
  };

  const canAccessApp = (app: App) => {
    if (!app.requiresVerification) return true;
    if (!profile) return false;
    return profile.is_verified_member;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Constructive Designs Inc.</h1>
                <p className="text-blue-300 text-sm">Nonprofit Contractor Community</p>
              </div>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-blue-300 text-sm">
                    {profile?.workspace_email || profile?.email}
                  </p>
                  {profile?.is_verified_member && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                      ✓ Verified Member
                    </span>
                  )}
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <a
                  href="https://renovision.web.app/login"
                  className="px-4 py-2 text-white hover:text-blue-300 transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="https://renovision.web.app/signup"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Get Started Free
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Your Complete Contractor Ecosystem
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            All the tools you need to run your construction business, manage projects, 
            buy/sell materials, and connect with other contractors - completely free.
          </p>
          
          {!user && (
            <div className="mt-8">
              <a
                href="https://renovision.web.app/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                🚀 Create Free Account
              </a>
              <p className="mt-4 text-blue-300 text-sm">
                One account, all apps. No credit card required.
              </p>
            </div>
          )}
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {apps.map((app) => {
            const hasAccess = canAccessApp(app);
            const isLocked = !hasAccess && app.requiresVerification;

            return (
              <div
                key={app.id}
                className={`relative group ${
                  app.comingSoon || isLocked ? 'opacity-75' : ''
                }`}
              >
                <a
                  href={app.comingSoon || isLocked ? '#' : app.url}
                  onClick={(e) => {
                    if (app.comingSoon || isLocked) {
                      e.preventDefault();
                    }
                  }}
                  className={`block h-full bg-gradient-to-br ${app.color} rounded-2xl p-6 shadow-lg transition-all ${
                    !app.comingSoon && hasAccess
                      ? 'hover:shadow-2xl hover:scale-105 cursor-pointer'
                      : 'cursor-not-allowed'
                  }`}
                >
                  {/* Icon */}
                  <div className="text-6xl mb-4">{app.icon}</div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-2">{app.name}</h3>

                  {/* Description */}
                  <p className="text-white/80 text-sm mb-4">{app.description}</p>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {app.comingSoon && (
                      <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 text-xs rounded-full border border-yellow-500/30">
                        🔒 Verification Required
                      </span>
                    )}
                    {hasAccess && !app.comingSoon && (
                      <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full group-hover:bg-white group-hover:text-blue-600 transition-colors">
                        Open App →
                      </span>
                    )}
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/10">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Why Join Our Community?
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💯</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">100% Free</h4>
              <p className="text-blue-200">
                All services provided at zero cost. Optional donations welcome but never required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">♻️</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Circular Economy</h4>
              <p className="text-blue-200">
                Buy and sell materials locally, keep them out of landfills, save money.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Trusted Network</h4>
              <p className="text-blue-200">
                Connect with verified contractors, grow your business through referrals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA for unverified users */}
        {user && profile && !profile.is_verified_member && (
          <div className="mt-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">🔒</div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-white mb-2">
                  Unlock Full Access
                </h4>
                <p className="text-blue-200 mb-4">
                  Complete verification to access the Member Portal and get your 
                  @constructivedesignsinc.org email address.
                </p>
                <a
                  href="https://renovision.web.app/business/verification"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all"
                >
                  Start Verification →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-white font-semibold mb-4">Apps</h5>
              <ul className="space-y-2">
                {apps.map((app) => (
                  <li key={app.id}>
                    <a
                      href={app.comingSoon ? '#' : app.url}
                      className="text-blue-300 hover:text-white transition-colors"
                    >
                      {app.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-4">Resources</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Getting Started
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Verification Process
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-4">Community</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Member Directory
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-4">Legal</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-300 hover:text-white transition-colors">
                    Donate
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-blue-300">
              © 2025 Constructive Designs Inc. - 501(c)(3) Nonprofit Organization
            </p>
            <p className="text-blue-400 text-sm mt-2">
              Building a sustainable future for contractors and communities ♻️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

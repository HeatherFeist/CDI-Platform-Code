import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import PlaidLinkButton from './components/PlaidLinkButton';
import AccountsOverview from './components/AccountsOverview';
import TransactionsList from './components/TransactionsList';
import SpendingAnalytics from './components/SpendingAnalytics';
import SettingsPanel from './components/SettingsPanel';
import MerchantCoinsWallet from './components/MerchantCoinsWallet';
import { Wallet, TrendingUp, Receipt, Settings, DollarSign, LogIn, UserPlus, LogOut, User, Coins } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(true); // Start in demo mode
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        setDemoMode(false);
        loadUserData(session.user.id);
      } else {
        // Load demo data if not logged in
        loadDemoData();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setDemoMode(false);
        loadUserData(session.user.id);
      } else {
        setDemoMode(true);
        loadDemoData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDemoData = () => {
    // Sample accounts
    setAccounts([
      { id: '1', name: 'Chase Checking', type: 'checking', balance: 3245.67, institution: 'Chase' },
      { id: '2', name: 'Capital One Savings', type: 'savings', balance: 8950.32, institution: 'Capital One' },
      { id: '3', name: 'Chase Credit Card', type: 'credit', balance: -1234.50, institution: 'Chase' },
    ]);

    // Sample transactions
    setTransactions([
      { id: '1', date: '2025-11-12', description: 'Grocery Store', amount: -87.43, category: 'Food & Dining' },
      { id: '2', date: '2025-11-11', description: 'Salary Deposit', amount: 2500.00, category: 'Income' },
      { id: '3', date: '2025-11-10', description: 'Electric Bill', amount: -125.67, category: 'Utilities' },
      { id: '4', date: '2025-11-09', description: 'Gas Station', amount: -45.23, category: 'Transportation' },
      { id: '5', date: '2025-11-08', description: 'Netflix', amount: -15.99, category: 'Entertainment' },
      { id: '6', date: '2025-11-07', description: 'Amazon', amount: -234.56, category: 'Shopping' },
      { id: '7', date: '2025-11-06', description: 'Restaurant', amount: -67.89, category: 'Food & Dining' },
      { id: '8', date: '2025-11-05', description: 'Freelance Payment', amount: 750.00, category: 'Income' },
      { id: '9', date: '2025-11-04', description: 'Insurance', amount: -189.00, category: 'Bills & Utilities' },
      { id: '10', date: '2025-11-03', description: 'Coffee Shop', amount: -12.45, category: 'Food & Dining' },
    ]);
  };

  const loadUserData = async (userId) => {
    // Load user's connected accounts and transactions
    // This will be populated from Plaid Link
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) throw error;

      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });

      if (error) throw error;

      setAuthError('✅ Check your email to confirm your account!');
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthError('');
      }, 3000);
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign up');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'coins', label: 'Merchant Coins', icon: Coins },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Modern Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Quantum Wallet</h1>
                <p className="text-xs text-slate-400">Financial Dashboard</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {demoMode && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                  Demo Mode
                </span>
              )}

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700 rounded-lg">
                    <User className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-medium text-slate-200">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 btn-secondary text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 btn-secondary text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 btn-primary text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>



      {demoMode && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <Wallet className="w-5 h-5" />
                <p className="text-sm">
                  <strong>Demo Mode:</strong> Viewing sample data. Connect your Plaid API key in Settings to link real accounts.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Set Up API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all border-b-2 ${activeTab === tab.id
                    ? 'text-indigo-400 border-indigo-500 bg-indigo-900/20'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Accounts</h2>
              <PlaidLinkButton onSuccess={(data) => console.log('Connected:', data)} />
            </div>
            <AccountsOverview accounts={accounts} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
            <TransactionsList transactions={transactions} />
          </div>
        )}

        {activeTab === 'coins' && (
          <MerchantCoinsWallet />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Spending Analytics</h2>
            <SpendingAnalytics transactions={transactions} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <SettingsPanel />
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-glass max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 mb-6">
              {authMode === 'signin'
                ? 'Sign in to access your financial dashboard'
                : 'Start tracking your finances with Quantum Wallet'}
            </p>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <p className={`text-sm ${authError.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-6 py-3 btn-primary disabled:opacity-50"
              >
                {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {authMode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-16 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400">
            © 2025 Constructive Designs Inc. - Secure Financial Tracking
          </p>
          <p className="text-slate-500 text-sm mt-2">
            🔐 Your data is encrypted and never shared
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

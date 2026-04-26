import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Key, Save, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import PaymentIntegrationsManager from './PaymentIntegrationsManager';

interface SettingsPanelProps {
  onSignInRequest?: () => void;
}

export default function SettingsPanel({ onSignInRequest }: SettingsPanelProps) {
  const [plaidKey, setPlaidKey] = useState('');
  const [plaidSecret, setPlaidSecret] = useState('');
  const [plaidEnv, setPlaidEnv] = useState('production');
  const [showKeys, setShowKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Load existing Plaid keys
      const { data } = await supabase
        .from('user_api_keys')
        .select('service, api_key')
        .eq('user_id', currentUser.id)
        .in('service', ['plaid_client_id', 'plaid_secret', 'plaid_env']);

      if (data && data.length > 0) {
        setPlaidKey(data.find(k => k.service === 'plaid_client_id')?.api_key || '');
        setPlaidSecret(data.find(k => k.service === 'plaid_secret')?.api_key || '');
        setPlaidEnv(data.find(k => k.service === 'plaid_env')?.api_key || 'production');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setMessage('Please sign in to save settings');
      if (onSignInRequest) onSignInRequest();
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const upserts: Array<{ user_id: string; service: string; api_key: string }> = [];

      if (plaidKey) upserts.push({ user_id: user.id, service: 'plaid_client_id', api_key: plaidKey });
      if (plaidSecret) upserts.push({ user_id: user.id, service: 'plaid_secret', api_key: plaidSecret });
      upserts.push({ user_id: user.id, service: 'plaid_env', api_key: plaidEnv });

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('user_api_keys')
          .upsert(upserts, { onConflict: 'user_id,service' });
        if (error) throw error;
      }

      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Sign-in prompt when not authenticated */}
      {!user && (
        <div className="bg-amber-500/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogIn className="w-6 h-6 text-amber-300" />
              <div>
                <h3 className="text-lg font-bold text-amber-100">Sign in to save your settings</h3>
                <p className="text-amber-200 text-sm">Your API keys and preferences require an account to persist securely.</p>
              </div>
            </div>
            {onSignInRequest && (
              <button
                onClick={onSignInRequest}
                className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plaid API Configuration - Moved to top to prevent overlap */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="w-6 h-6 text-blue-300" />
          <h3 className="text-xl font-bold text-white">Plaid API Configuration</h3>
        </div>

        <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-300 mt-0.5" />
            <div className="text-sm text-blue-100">
              <p className="font-semibold mb-1">Bring Your Own Plaid API Key</p>
              <p className="text-xs">
                Get your free Plaid API credentials at{' '}
                <a
                  href="https://dashboard.plaid.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 underline"
                >
                  dashboard.plaid.com
                </a>
                . Your keys are stored encrypted and never shared.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Plaid Client ID
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={plaidKey}
              onChange={(e) => setPlaidKey(e.target.value)}
              placeholder="Enter your Plaid client ID..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Plaid Secret
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={plaidSecret}
              onChange={(e) => setPlaidSecret(e.target.value)}
              placeholder="Enter your Plaid secret..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Environment
            </label>
            <select
              value={plaidEnv}
              onChange={(e) => setPlaidEnv(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="production" className="bg-slate-800">Production (Live Banking)</option>
              <option value="development" className="bg-slate-800">Development</option>
              <option value="sandbox" className="bg-slate-800">Sandbox (Test)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center space-x-2 text-blue-300 hover:text-white transition-colors"
            >
              {showKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span className="text-sm">{showKeys ? 'Hide' : 'Show'} keys</span>
            </button>

            <button
              onClick={handleSave}
              disabled={loading || (!plaidKey && !plaidSecret)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          {message && (
            <p className={`text-sm ${message.includes('✅') ? 'text-green-300' : 'text-red-300'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Payment Integrations (BYOK) - Full Width */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
        <PaymentIntegrationsManager />
      </div>

      {/* Demo Mode & Platform Apps - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Mode */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">🎮 Demo Mode</h3>
          <p className="text-blue-200 mb-4">
            Don't have a Plaid account yet? Try our demo mode with sample data to explore Quantum Wallet features.
          </p>
          <button className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all">
            Enable Demo Mode
          </button>
        </div>

        {/* Platform Apps Launcher */}
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-2">🚀 Platform Apps</h3>
          <p className="text-blue-200 mb-6 text-sm">Access other tools in your Constructive Designs suite</p>

          <div className="grid grid-cols-1 gap-4">
            <a
              href="http://localhost:3003"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🏠</span>
                </div>
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
              <h4 className="text-white font-semibold mb-1">RenovVision</h4>
              <p className="text-blue-200 text-xs">Estimates & Project Management</p>
            </a>

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🛒</span>
                </div>
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
              <h4 className="text-white font-semibold mb-1">Marketplace</h4>
              <p className="text-blue-200 text-xs">Trade Equipment & Phone Donations</p>
            </a>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🎨</span>
                </div>
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
              <h4 className="text-white font-semibold mb-1">AI Design Studio</h4>
              <p className="text-blue-200 text-xs">Virtual Staging & Visualization</p>
            </a>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
        <h4 className="text-lg font-bold text-green-300 mb-2">🔐 Your Data is Secure</h4>
        <ul className="space-y-2 text-green-100 text-sm">
          <li>✓ All API keys are encrypted at rest</li>
          <li>✓ We never see or store your bank credentials</li>
          <li>✓ Plaid uses bank-level 256-bit encryption</li>
          <li>✓ You can delete your data anytime</li>
        </ul>
      </div>
    </div>
  );
}

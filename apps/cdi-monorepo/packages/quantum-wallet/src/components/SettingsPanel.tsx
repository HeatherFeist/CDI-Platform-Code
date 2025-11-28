import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Key, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import PaymentIntegrationsManager from './PaymentIntegrationsManager';

export default function SettingsPanel() {
  const [plaidKey, setPlaidKey] = useState('');
  const [plaidSecret, setPlaidSecret] = useState('');
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
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('service', 'plaid');

      if (data && data.length > 0) {
        setPlaidKey(data.find(k => k.api_key.startsWith('client_id'))?.api_key || '');
        setPlaidSecret(data.find(k => k.api_key.startsWith('secret'))?.api_key || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setMessage('Please sign in to save settings');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Save Plaid client ID
      if (plaidKey) {
        await supabase.from('user_api_keys').upsert({
          user_id: user.id,
          service: 'plaid',
          api_key: plaidKey,
        });
      }

      // Save Plaid secret
      if (plaidSecret) {
        await supabase.from('user_api_keys').upsert({
          user_id: user.id,
          service: 'plaid_secret',
          api_key: plaidSecret,
        });
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
      {/* Payment Integrations (BYOK) */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
        <PaymentIntegrationsManager />
      </div>

      {/* Plaid API Configuration */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

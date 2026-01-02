import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { setUserApiKey, clearUserApiKey, hasApiKey } from '../services/geminiService';

interface ApiKeySettingsProps {
  onClose: () => void;
}

export default function ApiKeySettings({ onClose }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(hasApiKey());
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setUserApiKey(apiKey.trim());
      setSaved(true);
      setHasKey(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleClear = () => {
    clearUserApiKey();
    setApiKey('');
    setHasKey(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-indigo-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Features Setup</h2>
                <p className="text-indigo-100 text-sm">Connect your own Gemini API key</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {hasKey ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-semibold">AI Features Active</p>
                <p className="text-green-300/70 text-sm">Your API key is connected and ready to use</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-semibold">AI Features Offline</p>
                <p className="text-amber-300/70 text-sm">Add your API key to enable AI-powered features</p>
              </div>
            </div>
          )}

          {/* Why BYOK Section */}
          <div className="bg-slate-800/50 rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Why Bring Your Own Key?
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Free to use:</strong> Google's Gemini API has a generous free tier</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Privacy:</strong> Your data stays between you and Google</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Control:</strong> Manage your own API usage and limits</span>
              </li>
            </ul>
          </div>

          {/* Get API Key Link */}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg p-4 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Get Your Free API Key</p>
                <p className="text-sm text-indigo-100">Click to visit Google AI Studio</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* API Key Input */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Your API key is stored locally in your browser and never sent to our servers
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Save API Key
                </>
              )}
            </button>
            {hasKey && (
              <button
                onClick={handleClear}
                className="px-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 rounded-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {/* Features List */}
          <div className="bg-slate-800/50 rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-semibold text-white">AI Features You'll Unlock:</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span>AI Business Mentor (Chat with Ava)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span>Product Description Generator</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span>Product Image Generation</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span>Virtual Try-On Technology</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span>Trending Product Search</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    
    try {
      // Simple test of the API key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
      if (response.ok) {
        alert('✅ API key is valid!');
      } else {
        alert('❌ API key appears to be invalid');
      }
    } catch (error) {
      alert('❌ Error testing API key');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Gemini API Key</h2>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How to get your API key:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>2. Sign in with your Google account</li>
            <li>3. Click "Create API Key"</li>
            <li>4. Copy and paste it below</li>
          </ol>
        </div>

        <div className="mb-4">
          <label htmlFor="apikey" className="block text-sm font-medium mb-2">
            Your Gemini API Key:
          </label>
          <div className="relative">
            <input
              id="apikey"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers.
            All AI requests go directly from your browser to Google's servers.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTestKey}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Key
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-md hover:bg-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
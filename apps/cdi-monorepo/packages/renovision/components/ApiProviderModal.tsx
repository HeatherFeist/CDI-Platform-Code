/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ApiProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: 'gemini' | 'huggingface', apiKey: string) => void;
}

const ApiProviderModal: React.FC<ApiProviderModalProps> = ({ isOpen, onClose, onSelectProvider }) => {
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'huggingface'>('gemini');
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const providers = {
    gemini: {
      name: 'Google Gemini',
      description: 'Most advanced AI for complex image editing and reasoning',
      setup: 'Get free key from Google AI Studio',
      url: 'https://aistudio.google.com/app/apikey',
      features: ['Advanced reasoning', 'Complex editing', 'High quality results']
    },
    huggingface: {
      name: 'Hugging Face',
      description: 'Access to multiple open-source models like FLUX',
      setup: 'Get free key from Hugging Face',
      url: 'https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained',
      features: ['Multiple models', 'Open source', 'Community driven']
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      onSelectProvider(selectedProvider, apiKey.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Choose Your AI Provider</h2>
        
        <div className="space-y-4 mb-6">
          {Object.entries(providers).map(([key, provider]) => (
            <div key={key} className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedProvider === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`} onClick={() => setSelectedProvider(key as 'gemini' | 'huggingface')}>
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={selectedProvider === key}
                  onChange={() => setSelectedProvider(key as 'gemini' | 'huggingface')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{provider.description}</p>
                  <p className="text-blue-600 text-sm font-medium mb-2">{provider.setup}</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Your {providers[selectedProvider].name} API Key:
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${providers[selectedProvider].name} API key...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <a 
            href={providers[selectedProvider].url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
          >
            Get your {providers[selectedProvider].name} API key →
          </a>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiProviderModal;
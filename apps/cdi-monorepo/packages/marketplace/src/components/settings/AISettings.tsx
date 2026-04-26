
import { useState, useEffect } from 'react';
import { ApiKeyManager } from '../../utils/apiKeyManager';
import { FiSettings, FiKey, FiCheckCircle, FiAlertCircle, FiExternalLink, FiEye, FiEyeOff, FiChevronDown } from 'react-icons/fi';


export function AISettings() {
  // OpenAI
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [openaiSaving, setOpenaiSaving] = useState(false);
  const [openaiTesting, setOpenaiTesting] = useState(false);
  const [openaiKeySource, setOpenaiKeySource] = useState<'user' | 'environment' | 'none'>('none');
  const [hasUserOpenaiKey, setHasUserOpenaiKey] = useState(false);
  // Gemini
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiKeySource, setGeminiKeySource] = useState<'user' | 'environment' | 'none'>('none');
  const [hasUserGeminiKey, setHasUserGeminiKey] = useState(false);
  // Provider selection
  const [preferredProvider, setPreferredProvider] = useState<'openai' | 'gemini'>('openai');

  useEffect(() => {
    // OpenAI
    const openaiSource = ApiKeyManager.isOpenAIConfigured() ? (ApiKeyManager.getUserOpenAIKey() ? 'user' : 'environment') : 'none';
    setOpenaiKeySource(openaiSource);
    setHasUserOpenaiKey(openaiSource === 'user');
    if (openaiSource === 'user') {
      setOpenaiKey(ApiKeyManager.getUserOpenAIKey() || '');
    } else {
      setOpenaiKey('');
    }
    // Gemini
    const geminiSource = ApiKeyManager.isGeminiConfigured() ? (ApiKeyManager.getUserGeminiKey() ? 'user' : 'environment') : 'none';
    setGeminiKeySource(geminiSource);
    setHasUserGeminiKey(geminiSource === 'user');
    if (geminiSource === 'user') {
      setGeminiKey(ApiKeyManager.getUserGeminiKey() || '');
    } else {
      setGeminiKey('');
    }
    // Preferred provider (default to OpenAI if both, else whichever is present)
    if (openaiSource !== 'none') setPreferredProvider('openai');
    else if (geminiSource !== 'none') setPreferredProvider('gemini');
  }, []);

  // OpenAI handlers
  const handleTestOpenaiKey = async () => {
    if (!openaiKey.trim()) {
      setOpenaiTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }
    setOpenaiTesting(true);
    setOpenaiTestResult(null);
    if (!openaiKey.trim().startsWith('sk-')) {
      setOpenaiTestResult({ success: false, message: 'Invalid API key format. OpenAI keys should start with "sk-"' });
      setOpenaiTesting(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    setOpenaiTestResult({ success: true, message: '✓ API key format is valid. The key will be tested when you use AI features.' });
    setOpenaiTesting(false);
  };
  const handleSaveOpenaiKey = async () => {
    if (!openaiKey.trim()) {
      setOpenaiTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }
    if (!openaiKey.trim().startsWith('sk-')) {
      setOpenaiTestResult({ success: false, message: 'Invalid API key format. OpenAI keys should start with "sk-"' });
      return;
    }
    setOpenaiSaving(true);
    setOpenaiTestResult(null);
    try {
      ApiKeyManager.setOpenAIKey(openaiKey.trim());
      setOpenaiKeySource('user');
      setHasUserOpenaiKey(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setOpenaiTestResult({ success: true, message: '✓ API key saved successfully! AI features are now enabled.' });
    } catch (error) {
      setOpenaiTestResult({ success: false, message: 'Failed to save API key. Please try again.' });
    }
    setOpenaiSaving(false);
  };
  const handleRemoveOpenaiKey = () => {
    ApiKeyManager.removeOpenAIKey();
    setOpenaiKey('');
    setOpenaiKeySource('none');
    setHasUserOpenaiKey(false);
    setOpenaiTestResult({ success: true, message: 'API key removed.' });
  };

  // Gemini handlers
  const handleTestGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setGeminiTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }
    setGeminiTesting(true);
    setGeminiTestResult(null);
    if (!ApiKeyManager.validateGeminiKey(geminiKey.trim())) {
      setGeminiTestResult({ success: false, message: 'Invalid Gemini API key format.' });
      setGeminiTesting(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    setGeminiTestResult({ success: true, message: '✓ API key format is valid. The key will be tested when you use AI features.' });
    setGeminiTesting(false);
  };
  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setGeminiTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }
    if (!ApiKeyManager.validateGeminiKey(geminiKey.trim())) {
      setGeminiTestResult({ success: false, message: 'Invalid Gemini API key format.' });
      return;
    }
    setGeminiSaving(true);
    setGeminiTestResult(null);
    try {
      ApiKeyManager.setGeminiKey(geminiKey.trim());
      setGeminiKeySource('user');
      setHasUserGeminiKey(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setGeminiTestResult({ success: true, message: '✓ Gemini API key saved successfully! AI features are now enabled.' });
    } catch (error) {
      setGeminiTestResult({ success: false, message: 'Failed to save API key. Please try again.' });
    }
    setGeminiSaving(false);
  };
  const handleRemoveGeminiKey = () => {
    ApiKeyManager.removeGeminiKey();
    setGeminiKey('');
    setGeminiKeySource('none');
    setHasUserGeminiKey(false);
    setGeminiTestResult({ success: true, message: 'API key removed.' });
  };

  // Provider selection
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as 'openai' | 'gemini';
    setPreferredProvider(provider);
    localStorage.setItem('preferred_ai_provider', provider);
  };



  const getStatusBadge = (source: 'user' | 'environment' | 'none', label: string) => {
    if (source === 'user') {
      return (
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
          <FiCheckCircle className="w-4 h-4" />
          <span>{label}: Connected (Your Key)</span>
        </div>
      );
    } else if (source === 'environment') {
      return (
        <div className="flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-300">
          <FiCheckCircle className="w-4 h-4" />
          <span>{label}: Connected (Environment)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300">
          <FiAlertCircle className="w-4 h-4" />
          <span>{label}: Not Configured</span>
        </div>
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-100">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-950/40">
            <FiSettings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Settings</h1>
        </div>
        <p className="text-slate-400">
          Manage your OpenAI and Gemini API keys to enable AI-powered features. Choose your preferred provider below.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="market-panel mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiKey className="h-5 w-5 text-indigo-300" />
          <h2 className="text-xl font-semibold text-white">Preferred AI Provider</h2>
        </div>
        <div className="mb-4">
          <label htmlFor="providerSelect" className="mb-2 block text-sm font-medium text-slate-300">
            Choose which AI provider to use by default. If the selected provider fails, the app will automatically fall back to the other if available.
          </label>
          <select
            id="providerSelect"
            value={preferredProvider}
            onChange={handleProviderChange}
            className="market-input w-full px-4 py-2"
          >
            <option value="openai">OpenAI (ChatGPT, DALL-E)</option>
            <option value="gemini">Gemini (Google AI Studio)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(openaiKeySource, 'OpenAI')}
          {getStatusBadge(geminiKeySource, 'Gemini')}
        </div>
      </div>

      {/* OpenAI API Key Configuration */}
      <div className="market-panel mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiKey className="h-5 w-5 text-indigo-300" />
          <h2 className="text-xl font-semibold text-white">OpenAI API Key</h2>
        </div>
        <div className="mb-4">
          <label htmlFor="openaiKey" className="mb-2 block text-sm font-medium text-slate-300">
            Your OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showOpenaiKey ? 'text' : 'password'}
              id="openaiKey"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Enter your OpenAI API key (sk-...)"
              className="market-input w-full px-4 py-2 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showOpenaiKey ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Your API key is stored securely in your browser and never sent to our servers.
          </p>
        </div>
        {openaiTestResult && (
          <div className={`mb-4 rounded-lg border p-4 ${openaiTestResult.success ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
            <div className="flex items-center gap-2">
              {openaiTestResult.success ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
              <span>{openaiTestResult.message}</span>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestOpenaiKey}
            disabled={openaiTesting || !openaiKey.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openaiTesting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Testing...</> : <><FiCheckCircle className="w-4 h-4" />Test Connection</>}
          </button>
          <button
            onClick={handleSaveOpenaiKey}
            disabled={openaiSaving || !openaiKey.trim()}
            className="market-button-primary flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openaiSaving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Saving...</> : <><FiKey className="w-4 h-4" />Save API Key</>}
          </button>
          {hasUserOpenaiKey && (
            <button
              onClick={handleRemoveOpenaiKey}
              className="rounded-lg border border-red-400/30 px-4 py-2 text-red-300 transition-colors hover:bg-red-500/10"
            >Remove Key</button>
          )}
        </div>
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="market-button-secondary mt-4 inline-flex items-center gap-2 px-6 py-3 font-medium"
        >
          <span>Get OpenAI API Key</span>
          <FiExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Gemini API Key Configuration */}
      <div className="market-panel mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiKey className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-semibold text-white">Gemini (Google AI Studio) API Key</h2>
        </div>
        <div className="mb-4">
          <label htmlFor="geminiKey" className="mb-2 block text-sm font-medium text-slate-300">
            Your Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              id="geminiKey"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key (from Google AI Studio)"
              className="market-input w-full px-4 py-2 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showGeminiKey ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Your Gemini API key is stored securely in your browser and never sent to our servers.
          </p>
        </div>
        {geminiTestResult && (
          <div className={`mb-4 rounded-lg border p-4 ${geminiTestResult.success ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
            <div className="flex items-center gap-2">
              {geminiTestResult.success ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
              <span>{geminiTestResult.message}</span>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestGeminiKey}
            disabled={geminiTesting || !geminiKey.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {geminiTesting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Testing...</> : <><FiCheckCircle className="w-4 h-4" />Test Connection</>}
          </button>
          <button
            onClick={handleSaveGeminiKey}
            disabled={geminiSaving || !geminiKey.trim()}
            className="market-button-primary flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {geminiSaving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Saving...</> : <><FiKey className="w-4 h-4" />Save API Key</>}
          </button>
          {hasUserGeminiKey && (
            <button
              onClick={handleRemoveGeminiKey}
              className="rounded-lg border border-red-400/30 px-4 py-2 text-red-300 transition-colors hover:bg-red-500/10"
            >Remove Key</button>
          )}
        </div>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="market-button-secondary mt-4 inline-flex items-center gap-2 px-6 py-3 font-medium"
        >
          <span>Get Gemini API Key</span>
          <FiExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* FAQ */}
      <div className="market-panel mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 font-medium text-white">Why do I need my own API key?</h3>
            <p className="text-sm text-slate-400">
              We believe in transparency and keeping costs low. By using your own API key, you control your AI usage and costs directly. Both OpenAI and Gemini offer free credits for new users. This allows us to keep our platform fee low while providing powerful AI features.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-white">Is my API key secure?</h3>
            <p className="text-sm text-slate-400">
              Yes! Your API keys are stored only in your browser's local storage and are never sent to our servers. They're used directly to communicate with the AI services.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-white">Does OpenAI or Gemini charge for API usage?</h3>
            <p className="text-sm text-slate-400">
              Both providers offer free credits for new users. After that, pricing is very affordable for most use cases. See their respective pricing pages for details.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-white">Can I use the platform without AI features?</h3>
            <p className="text-sm text-slate-400">
              Absolutely! All core auction and store features work perfectly without AI. The AI features are optional helpers that can save you time when creating listings, but they're not required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

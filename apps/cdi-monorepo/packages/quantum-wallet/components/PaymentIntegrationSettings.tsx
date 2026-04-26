import React, { useState, useEffect } from 'react';
import { saveAppSetting, getAppSetting, getPlaidCredentials } from '../services/paymentIntegrationService';

export default function PaymentIntegrationSettings({ onSave, userId }) {
  const [paypalEmail, setPaypalEmail] = useState('');
  const [plaidClientId, setPlaidClientId] = useState('');
  const [plaidSecret, setPlaidSecret] = useState('');
  const [plaidEnv, setPlaidEnv] = useState('production');
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [stripeKey, setStripeKey] = useState('');
  const [mode, setMode] = useState('plaid');
  const [enableGpt5Mini, setEnableGpt5Mini] = useState(false);

  useEffect(() => {
    getAppSetting('enable_gpt5_mini').then(({ data }) => {
      if (data && data.value && typeof data.value.enabled !== 'undefined') {
        setEnableGpt5Mini(Boolean(data.value.enabled));
      }
    });
    if (userId) {
      getPlaidCredentials(userId).then(({ hasCredentials, env }) => {
        setPlaidConfigured(hasCredentials);
        if (env) setPlaidEnv(env);
      });
    }
  }, [userId]);

  const handleSave = () => {
    if (mode === 'paypal') {
      onSave({ type: 'paypal', email: paypalEmail });
    } else if (mode === 'plaid') {
      onSave({ type: 'plaid', clientId: plaidClientId, secret: plaidSecret, env: plaidEnv });
    } else if (mode === 'stripe') {
      onSave({ type: 'stripe', apiKey: stripeKey });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">Connect Payment Methods</h2>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Choose Integration:</label>
        <select value={mode} onChange={e => setMode(e.target.value)} className="w-full border p-2 rounded">
          <option value="plaid">Plaid (Bank Linking)</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe (Bring Your Own Key)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Developer Options (optional)</label>
        <div className="flex items-center gap-3">
          <input id="gpt-5-mini" type="checkbox" checked={enableGpt5Mini} onChange={async e => {
            const v = e.target.checked;
            setEnableGpt5Mini(v);
            await saveAppSetting('enable_gpt5_mini', { enabled: v });
          }} />
          <label htmlFor="gpt-5-mini" className="text-sm">Enable GPT-5 mini for clients (dev toggle)</label>
        </div>
        <p className="text-xs text-gray-500 mt-1">Toggles local UI flag only; to fully enable a model you still need backend support and valid API keys.</p>
      </div>
      {mode === 'paypal' && (
        <div className="mb-4">
          <label className="block mb-1">PayPal Email</label>
          <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="your@email.com" />
        </div>
      )}
      {mode === 'plaid' && (
        <div className="mb-4">
          {plaidConfigured && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              ✓ Plaid credentials saved. Leave fields blank to keep existing credentials.
            </div>
          )}
          <label className="block mb-1">Plaid Client ID</label>
          <input type="text" value={plaidClientId} onChange={e => setPlaidClientId(e.target.value)} className="w-full border p-2 rounded mb-2" placeholder="Your Plaid Client ID" />
          <label className="block mb-1">Plaid Secret</label>
          <input type="password" value={plaidSecret} onChange={e => setPlaidSecret(e.target.value)} className="w-full border p-2 rounded mb-2" placeholder="Your Plaid Secret" />
          <label className="block mb-1">Environment</label>
          <select value={plaidEnv} onChange={e => setPlaidEnv(e.target.value)} className="w-full border p-2 rounded">
            <option value="production">Production (Live Banking)</option>
            <option value="development">Development</option>
            <option value="sandbox">Sandbox (Test)</option>
          </select>
        </div>
      )}
      {mode === 'stripe' && (
        <div className="mb-4">
          <label className="block mb-1">Stripe API Key</label>
          <input type="text" value={stripeKey} onChange={e => setStripeKey(e.target.value)} className="w-full border p-2 rounded" placeholder="Paste your Stripe API key here" />
          <p className="text-xs text-gray-500 mt-1">You are responsible for your own Stripe account and compliance.</p>
        </div>
      )}
      <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold">Save</button>
      <div className="mt-4 text-xs text-gray-600">
        <p>We do not store your API keys or credentials. All advanced integrations are user-managed.</p>
      </div>
    </div>
  );
}

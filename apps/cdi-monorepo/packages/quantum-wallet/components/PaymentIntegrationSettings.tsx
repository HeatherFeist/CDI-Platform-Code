import React, { useState, useEffect } from 'react';
import { saveAppSetting, getAppSetting } from '../services/paymentIntegrationService';

export default function PaymentIntegrationSettings({ onSave }) {
  const [paypalEmail, setPaypalEmail] = useState('');
  const [plaidKey, setPlaidKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [mode, setMode] = useState('paypal');
  // Feature: model selection (admin-only). We'll show a simple toggle for enabling GPT-5-mini usage
  const [enableGpt5Mini, setEnableGpt5Mini] = useState(false);

  useEffect(() => {
    // load persisted flag
    getAppSetting('enable_gpt5_mini').then(({ data }) => {
      if (data && data.value && typeof data.value.enabled !== 'undefined') {
        setEnableGpt5Mini(Boolean(data.value.enabled));
      }
    });
  }, []);

  const handleSave = () => {
    if (mode === 'paypal') {
      onSave({ type: 'paypal', email: paypalEmail });
    } else if (mode === 'plaid') {
      onSave({ type: 'plaid', apiKey: plaidKey });
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
          <option value="paypal">PayPal (Recommended)</option>
          <option value="plaid">Plaid (Bring Your Own Key)</option>
          <option value="stripe">Stripe (Bring Your Own Key)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Developer Options (optional)</label>
        <div className="flex items-center gap-3">
          <input id="gpt-5-mini" type="checkbox" checked={enableGpt5Mini} onChange={async e => {
            const v = e.target.checked;
            setEnableGpt5Mini(v);
            // persist app setting (note: ensure only admins can change in production)
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
          <label className="block mb-1">Plaid API Key</label>
          <input type="text" value={plaidKey} onChange={e => setPlaidKey(e.target.value)} className="w-full border p-2 rounded" placeholder="Paste your Plaid API key here" />
          <p className="text-xs text-gray-500 mt-1">You are responsible for your own Plaid account and compliance.</p>
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

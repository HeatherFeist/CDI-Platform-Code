import React, { useEffect, useState } from 'react';
import PaymentIntegrationSettings from './PaymentIntegrationSettings';
import { savePaymentIntegration, getPaymentIntegrations } from '../services/paymentIntegrationService';
import { useUser } from '@supabase/auth-helpers-react';

export default function PaymentIntegrationManager() {
  const user = useUser();
  const [integrations, setIntegrations] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      getPaymentIntegrations(user.id).then(({ data }) => setIntegrations(data || []));
    }
  }, [user]);

  const handleSave = async (integration) => {
    if (!user) return;
    const { error } = await savePaymentIntegration(user.id, integration);
    if (error) {
      setMessage('Error saving integration: ' + error.message);
    } else {
      setMessage('Integration saved!');
      getPaymentIntegrations(user.id).then(({ data }) => setIntegrations(data || []));
    }
  };

  return (
    <div>
      <PaymentIntegrationSettings onSave={handleSave} />
      {message && <div className="mt-2 text-green-600">{message}</div>}
      <h3 className="mt-6 font-bold">Your Connected Payment Integrations</h3>
      <ul className="mt-2">
        {integrations.map((acc) => (
          <li key={acc.id} className="border-b py-2">
            <span className="font-semibold">{acc.institution.toUpperCase()}</span>
            {acc.account_type === 'paypal' && <span> — {acc.external_id}</span>}
            {acc.account_type === 'plaid' && <span> — Plaid Key Connected</span>}
            {acc.account_type === 'stripe' && <span> — Stripe Key Connected</span>}
          </li>
        ))}
        {integrations.length === 0 && <li>No integrations connected yet.</li>}
      </ul>
    </div>
  );
}

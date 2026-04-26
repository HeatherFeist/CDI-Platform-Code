import { supabase } from '../src/supabase';

// Save payment integration settings for the user
export async function savePaymentIntegration(userId, integration) {
  if (integration.type === 'paypal') {
    // Store PayPal email in fiat_accounts
    return await supabase.from('fiat_accounts').upsert([
      {
        user_id: userId,
        institution: 'paypal',
        account_type: 'paypal',
        external_id: integration.email,
        current_balance: 0
      }
    ], { onConflict: 'user_id,institution' });
  }
  if (integration.type === 'plaid') {
    // Store Plaid credentials in user_api_keys (what the edge functions read)
    const keys = [
      { user_id: userId, service: 'plaid_client_id', api_key: integration.clientId },
      { user_id: userId, service: 'plaid_secret', api_key: integration.secret },
      { user_id: userId, service: 'plaid_env', api_key: integration.env },
    ];
    const { error } = await supabase.from('user_api_keys').upsert(keys, { onConflict: 'user_id,service' });
    if (error) return { error };
    // Also mark plaid as configured in fiat_accounts for UI display
    return await supabase.from('fiat_accounts').upsert([
      {
        user_id: userId,
        institution: 'plaid',
        account_type: 'plaid',
        external_id: 'configured',
        current_balance: 0
      }
    ], { onConflict: 'user_id,institution' });
  }
  if (integration.type === 'stripe') {
    // Store Stripe API key reference (not the key itself)
    return await supabase.from('fiat_accounts').upsert([
      {
        user_id: userId,
        institution: 'stripe',
        account_type: 'stripe',
        external_id: integration.apiKey,
        current_balance: 0
      }
    ], { onConflict: 'user_id,institution' });
  }
}

// Get Plaid credentials status for the user
export async function getPlaidCredentials(userId) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('service, api_key')
    .eq('user_id', userId)
    .in('service', ['plaid_client_id', 'plaid_env']);
  if (error || !data) return { hasCredentials: false, env: 'sandbox' };
  const env = data.find(r => r.service === 'plaid_env')?.api_key || 'sandbox';
  const hasCredentials = data.some(r => r.service === 'plaid_client_id' && r.api_key);
  return { hasCredentials, env };
}

// Fetch all payment integrations for the user
export async function getPaymentIntegrations(userId) {
  const { data, error } = await supabase
    .from('fiat_accounts')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// App-level settings (feature flags)
export async function saveAppSetting(key, value) {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert([
      { key, value, updated_at: new Date().toISOString() }
    ], { onConflict: ['key'] });
  return { data, error };
}

export async function getAppSetting(key) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', key)
    .single();
  return { data, error };
}

import { supabase } from '../services/supabaseClient';

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
    ], { onConflict: ['user_id', 'institution'] });
  }
  if (integration.type === 'plaid') {
    // Store Plaid API key reference (not the key itself)
    return await supabase.from('fiat_accounts').upsert([
      {
        user_id: userId,
        institution: 'plaid',
        account_type: 'plaid',
        external_id: integration.apiKey,
        current_balance: 0
      }
    ], { onConflict: ['user_id', 'institution'] });
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
    ], { onConflict: ['user_id', 'institution'] });
  }
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

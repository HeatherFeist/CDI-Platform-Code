// Simple serverless function to proxy requests to GPT-5-mini when the feature flag is enabled.
// Deploy to Supabase Functions or any serverless env. Requires OPENAI_API_KEY env var.

// import fetch from 'node-fetch'; // Native fetch is available in Node 18+ and Edge runtimes
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // required to read app_settings securely

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req, res) {
  try {
    // Check feature flag
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'enable_gpt5_mini')
      .single();

    if (error) throw error;

    const enabled = data?.value?.enabled;
    if (!enabled) {
      return res.status(403).json({ error: 'GPT-5 mini is not enabled' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

    const body = await req.json();
    // Expecting { prompt: '...' }
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: body.prompt
      })
    });

    const dataOut = await resp.json();
    return res.status(200).json(dataOut);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}

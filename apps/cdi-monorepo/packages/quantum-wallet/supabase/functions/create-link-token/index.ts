import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get current user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        // Fetch user's Plaid keys
        const { data: keys, error: keysError } = await supabaseClient
            .from('user_api_keys')
            .select('service, api_key')
            .eq('user_id', user.id)
            .in('service', ['plaid_client_id', 'plaid_secret'])

        if (keysError || !keys) {
            throw new Error('Failed to fetch Plaid keys')
        }

        const clientId = keys.find(k => k.service === 'plaid_client_id')?.api_key
        const secret = keys.find(k => k.service === 'plaid_secret')?.api_key

        if (!clientId || !secret) {
            return new Response(
                JSON.stringify({ error: 'Plaid keys not configured in Settings' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Call Plaid API
        const response = await fetch('https://sandbox.plaid.com/link/token/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                client_name: 'Quantum Wallet',
                user: {
                    client_user_id: user.id,
                },
                products: ['transactions'],
                country_codes: ['US'],
                language: 'en',
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error_message || 'Failed to create link token')
        }

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

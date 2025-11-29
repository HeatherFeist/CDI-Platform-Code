import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        const { public_token, metadata } = await req.json()

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
            throw new Error('Plaid keys not configured')
        }

        // Exchange public token
        const response = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                public_token: public_token,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error_message || 'Failed to exchange token')
        }

        const accessToken = data.access_token
        const itemId = data.item_id

        // Store access token securely
        await supabaseClient.from('user_api_keys').upsert({
            user_id: user.id,
            service: `plaid_access_token_${itemId}`,
            api_key: accessToken
        })

        // Save Account Info
        if (metadata && metadata.accounts) {
            for (const account of metadata.accounts) {
                await supabaseClient.from('accounts').upsert({
                    user_id: user.id,
                    plaid_account_id: account.id,
                    plaid_item_id: itemId,
                    name: account.name,
                    mask: account.mask,
                    type: account.type,
                    subtype: account.subtype,
                    institution_name: metadata.institution.name
                }, { onConflict: 'user_id, plaid_account_id' })
            }
        }

        return new Response(
            JSON.stringify({ success: true, item_id: itemId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

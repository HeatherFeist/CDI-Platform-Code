// Supabase Edge Function: meta-oauth-callback
// Handles Meta (Facebook + Instagram) OAuth callback
// Exchanges authorization code for access token and stores connection

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetaOAuthRequest {
  code: string;
  redirect_uri: string;
  profile_id: string;
}

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaAccountsResponse {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: {
      id: string;
      username: string;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri, profile_id }: MetaOAuthRequest = await req.json()

    if (!code || !redirect_uri || !profile_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Meta app credentials from environment
    const metaAppId = Deno.env.get('META_APP_ID')
    const metaAppSecret = Deno.env.get('META_APP_SECRET')

    if (!metaAppId || !metaAppSecret) {
      throw new Error('Meta app credentials not configured')
    }

    // Exchange authorization code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}&` +
      `client_secret=${metaAppSecret}&` +
      `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
      `code=${code}`

    const tokenResponse = await fetch(tokenUrl)
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error?.message || 'Failed to exchange authorization code')
    }

    const tokenData: MetaTokenResponse = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in || 5183944 // Default to ~60 days

    // Get user's Facebook Pages (which may have Instagram Business Accounts)
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account{id,username}&` +
      `access_token=${accessToken}`

    const pagesResponse = await fetch(pagesUrl)
    
    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json()
      throw new Error(errorData.error?.message || 'Failed to fetch Facebook Pages')
    }

    const pagesData: MetaAccountsResponse = await pagesResponse.json()
    const pages = pagesData.data || []

    // Get user's basic profile info
    const profileUrl = `https://graph.facebook.com/v18.0/me?` +
      `fields=id,name,email&` +
      `access_token=${accessToken}`

    const profileResponse = await fetch(profileUrl)
    const profileData = await profileResponse.json()

    // Collect Instagram accounts
    const instagramAccounts = pages
      .filter(page => page.instagram_business_account)
      .map(page => ({
        id: page.instagram_business_account!.id,
        username: page.instagram_business_account!.username,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token
      }))

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store connection in database
    const { data: connection, error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        profile_id: profile_id,
        platform: 'meta',
        platform_user_id: profileData.id,
        platform_username: profileData.name,
        access_token: accessToken,
        token_expires_at: expiresAt,
        permissions: [
          'pages_manage_posts',
          'instagram_content_publish',
          'pages_read_engagement',
          'business_management',
          'instagram_basic',
          'pages_show_list'
        ],
        metadata: {
          email: profileData.email,
          facebook_pages: pages.map(p => ({
            id: p.id,
            name: p.name,
            access_token: p.access_token
          })),
          instagram_accounts: instagramAccounts
        },
        is_active: true,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,platform'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save connection to database')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Meta account connected successfully',
        facebook_pages: pages.length,
        instagram_accounts: instagramAccounts.length,
        connection_id: connection.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Meta OAuth callback error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

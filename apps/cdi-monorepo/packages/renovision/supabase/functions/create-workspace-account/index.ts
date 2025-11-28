import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkspaceAccountRequest {
  profileId: string;
  firstName: string;
  lastName: string;
  recoveryEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { profileId, firstName, lastName, recoveryEmail }: WorkspaceAccountRequest = await req.json();

    // Get service account credentials from Vault
    const { data: secretData } = await supabaseClient
      .from('vault.secrets')
      .select('secret')
      .eq('name', 'google_workspace_service_account')
      .single();

    if (!secretData) {
      throw new Error('Service account credentials not found');
    }

    const serviceAccount = JSON.parse(secretData.secret);

    // Get workspace configuration
    const { data: config } = await supabaseClient
      .from('google_workspace_config')
      .select('*')
      .single();

    if (!config) {
      throw new Error('Workspace configuration not found');
    }

    // Generate workspace email
    const { data: emailData } = await supabaseClient
      .rpc('generate_workspace_email', {
        p_first_name: firstName,
        p_last_name: lastName,
        p_domain: config.domain
      });

    const workspaceEmail = emailData;

    // Generate temporary password (user will be forced to change on first login)
    const tempPassword = generateSecurePassword();

    // Create JWT for Google API authentication
    const jwt = await createGoogleJWT(serviceAccount, config.admin_email);

    // Call Google Admin SDK API to create user
    const googleResponse = await fetch(
      'https://admin.googleapis.com/admin/directory/v1/users',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryEmail: workspaceEmail,
          name: {
            givenName: firstName,
            familyName: lastName,
          },
          password: tempPassword,
          changePasswordAtNextLogin: true,
          recoveryEmail: recoveryEmail,
          orgUnitPath: '/Contractors', // Optional: organize users
        }),
      }
    );

    if (!googleResponse.ok) {
      const error = await googleResponse.text();
      throw new Error(`Google API error: ${error}`);
    }

    const googleUser = await googleResponse.json();

    // Update profile with workspace email
    await supabaseClient
      .from('profiles')
      .update({
        workspace_email: workspaceEmail,
        workspace_account_created: true,
        workspace_account_created_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    // Log success
    await supabaseClient
      .from('workspace_account_log')
      .insert({
        profile_id: profileId,
        action: 'create',
        workspace_email: workspaceEmail,
        status: 'success',
      });

    // Send welcome email with credentials
    // TODO: Integrate with email service

    return new Response(
      JSON.stringify({
        success: true,
        workspaceEmail,
        tempPassword, // Include in response so admin can share with user
        message: 'Workspace account created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating workspace account:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to create Google JWT
async function createGoogleJWT(serviceAccount: any, delegateEmail: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: delegateEmail, // Impersonate admin
    scope: 'https://www.googleapis.com/auth/admin.directory.user',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign JWT
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(signature);
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Helper functions
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

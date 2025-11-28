import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google Admin SDK Configuration
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_ADMIN_EMAIL = Deno.env.get('GOOGLE_ADMIN_EMAIL')!
const GOOGLE_DOMAIN = 'constructivedesignsinc.org'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { teamMemberId, firstName, lastName, orgEmail, personalEmail, role } = await req.json()

    // Validate inputs
    if (!teamMemberId || !firstName || !lastName || !orgEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate secure temporary password
    const tempPassword = generateTempPassword()

    // Create Google Workspace account
    const googleResult = await createGoogleWorkspaceUser({
      firstName,
      lastName,
      orgEmail,
      tempPassword,
      role
    })

    if (!googleResult.success) {
      return new Response(
        JSON.stringify({ error: googleResult.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store workspace account details in Supabase
    const { error: dbError } = await supabaseClient
      .from('google_workspace_accounts')
      .insert({
        team_member_id: teamMemberId,
        org_email: orgEmail,
        google_user_id: googleResult.googleUserId,
        workspace_account_created: true,
        calendar_connected: false,
        drive_access_granted: false,
        temp_password_hash: await hashPassword(tempPassword)
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save account details' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        googleUserId: googleResult.googleUserId,
        orgEmail: orgEmail,
        tempPassword: tempPassword // In production, this would be sent via email instead
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function createGoogleWorkspaceUser({ firstName, lastName, orgEmail, tempPassword, role }) {
  try {
    // Get Google Admin SDK access token
    const accessToken = await getGoogleAccessToken()

    // Create user via Google Admin SDK
    const createUserResponse = await fetch(
      'https://admin.googleapis.com/admin/directory/v1/users',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          primaryEmail: orgEmail,
          name: {
            givenName: firstName,
            familyName: lastName
          },
          password: tempPassword,
          changePasswordAtNextLogin: true,
          orgUnitPath: role === 'admin' ? '/Admins' : '/Users',
          includeInGlobalAddressList: true,
          suspended: false
        })
      }
    )

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text()
      throw new Error(`Google API error: ${errorData}`)
    }

    const userData = await createUserResponse.json()

    // Set up default Google Calendar
    await setupGoogleCalendar(accessToken, userData.id)

    // Grant necessary permissions
    await setupUserPermissions(accessToken, userData.id, role)

    return {
      success: true,
      googleUserId: userData.id,
      primaryEmail: userData.primaryEmail
    }

  } catch (error) {
    console.error('Google Workspace user creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function getGoogleAccessToken() {
  // This would typically use a service account JWT
  // For this example, we'll use OAuth 2.0 flow
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      scope: 'https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/calendar'
    })
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Google access token')
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function setupGoogleCalendar(accessToken: string, googleUserId: string) {
  try {
    // Create a default calendar for the user
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: 'Constructive Designs Work Calendar',
          description: 'Work schedule and project meetings',
          timeZone: 'America/New_York'
        })
      }
    )

    if (!calendarResponse.ok) {
      console.error('Failed to create calendar:', await calendarResponse.text())
    }

    return true
  } catch (error) {
    console.error('Calendar setup error:', error)
    return false
  }
}

async function setupUserPermissions(accessToken: string, googleUserId: string, role: string) {
  try {
    // Add user to appropriate groups based on role
    const groupEmail = role === 'admin' ? 'admins@constructivedesignsinc.org' : 'team@constructivedesignsinc.org'
    
    const groupResponse = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${groupEmail}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `${googleUserId}@${GOOGLE_DOMAIN}`,
          role: 'MEMBER'
        })
      }
    )

    if (!groupResponse.ok) {
      console.error('Failed to add to group:', await groupResponse.text())
    }

    return true
  } catch (error) {
    console.error('Permissions setup error:', error)
    return false
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
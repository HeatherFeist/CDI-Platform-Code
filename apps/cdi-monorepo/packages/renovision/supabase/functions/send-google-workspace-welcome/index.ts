import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email service configuration (using SendGrid as an example)
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const FROM_EMAIL = 'noreply@constructivedesignsinc.org'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgEmail, firstName, lastName, tempPassword, onboardingUrl } = await req.json()

    // Validate inputs
    if (!orgEmail || !firstName || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create welcome email content
    const emailContent = createWelcomeEmailContent({
      firstName,
      lastName,
      orgEmail,
      tempPassword,
      onboardingUrl
    })

    // Send email via SendGrid
    const emailResult = await sendWelcomeEmail(orgEmail, emailContent)

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({ error: emailResult.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
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

function createWelcomeEmailContent({ firstName, lastName, orgEmail, tempPassword, onboardingUrl }) {
  const subject = `Welcome to Constructive Designs Inc - Your Account is Ready!`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to Constructive Designs Inc</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .credentials { background: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Constructive Designs Inc!</h1>
                <p>Your Google Workspace account is ready</p>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName} ${lastName},</h2>
                
                <p>Welcome to the Constructive Designs Inc team! We're excited to have you join us. Your Google Workspace account has been created and you now have access to all our organizational tools and systems.</p>
                
                <div class="credentials">
                    <h3>🔐 Your Login Credentials</h3>
                    <p><strong>Email:</strong> ${orgEmail}</p>
                    <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> You will be required to change your password on first login for security purposes.
                </div>
                
                <h3>🚀 Getting Started</h3>
                <ol>
                    <li><strong>Access Gmail:</strong> Go to <a href="https://gmail.com">gmail.com</a> and log in with your new credentials</li>
                    <li><strong>Complete Setup:</strong> Follow the onboarding process to set up your profile and preferences</li>
                    <li><strong>Join the Team:</strong> Access Google Calendar, Drive, and other workspace tools</li>
                    <li><strong>Platform Access:</strong> Use your new account to access the Constructive Designs platform</li>
                </ol>
                
                ${onboardingUrl ? `
                <a href="${onboardingUrl}" class="button">Complete Your Onboarding →</a>
                ` : ''}
                
                <h3>📧 What's Included</h3>
                <ul>
                    <li><strong>Professional Email:</strong> ${orgEmail}</li>
                    <li><strong>Google Calendar:</strong> Schedule meetings and manage your time</li>
                    <li><strong>Google Drive:</strong> Access shared files and collaborate on documents</li>
                    <li><strong>Team Access:</strong> Connect with colleagues and join project teams</li>
                    <li><strong>Platform Integration:</strong> Full access to our project management system</li>
                </ul>
                
                <h3>🔧 Need Help?</h3>
                <p>If you have any questions or need assistance setting up your account, please don't hesitate to reach out:</p>
                <ul>
                    <li>Email: <a href="mailto:support@constructivedesignsinc.org">support@constructivedesignsinc.org</a></li>
                    <li>Platform: Use the built-in messaging system to contact team members</li>
                </ul>
                
                <p>We're here to help you get settled in and make the most of your new role with Constructive Designs Inc!</p>
                
                <p>Best regards,<br>
                <strong>The Constructive Designs Inc Team</strong></p>
            </div>
            
            <div class="footer">
                <p>Constructive Designs Inc<br>
                Email: contact@constructivedesignsinc.org<br>
                This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `

  const textContent = `
Welcome to Constructive Designs Inc!

Hello ${firstName} ${lastName},

Welcome to the Constructive Designs Inc team! Your Google Workspace account has been created.

Your Login Credentials:
Email: ${orgEmail}
Temporary Password: ${tempPassword}

IMPORTANT: You will be required to change your password on first login.

Getting Started:
1. Go to gmail.com and log in with your new credentials
2. Complete the setup process and change your password
3. Access Google Calendar, Drive, and other workspace tools
4. Use your new account to access the Constructive Designs platform

What's Included:
- Professional email (${orgEmail})
- Google Calendar for scheduling
- Google Drive for file sharing
- Team access and collaboration tools
- Full platform integration

Need Help?
Email: support@constructivedesignsinc.org

Best regards,
The Constructive Designs Inc Team
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

async function sendWelcomeEmail(toEmail: string, emailContent: any) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
            subject: emailContent.subject
          }
        ],
        from: { email: FROM_EMAIL, name: 'Constructive Designs Inc' },
        content: [
          {
            type: 'text/plain',
            value: emailContent.textContent
          },
          {
            type: 'text/html',
            value: emailContent.htmlContent
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`SendGrid error: ${errorData}`)
    }

    return { success: true }

  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
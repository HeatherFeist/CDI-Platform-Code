// Supabase Edge Function: submit-affiliate-lead
// Handles instant single lead submission from affiliates
// Sends email to project manager and creates job record

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadSubmission {
  affiliate_id: string;
  location: string;
  timeline: string;
  duration: string;
  budget: number;
  notes: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const submission: LeadSubmission = await req.json()

    // Validate required fields
    if (!submission.affiliate_id || !submission.location || !submission.timeline || !submission.budget) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get affiliate partnership details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliate_partnerships')
      .select('id, business_name, contact_name, recruiting_member_id, profiles!recruiting_member_id(username)')
      .eq('affiliate_id', submission.affiliate_id)
      .eq('partnership_status', 'active')
      .single()

    if (affiliateError || !affiliate) {
      console.error('Affiliate lookup error:', affiliateError)
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate ID or inactive partnership' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find available project manager (simple round-robin for now)
    const { data: pm, error: pmError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'project_manager')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (pmError || !pm) {
      console.error('PM lookup error:', pmError)
      // Fallback to default PM email
      var pmEmail = 'project.manager@constructivedesignsinc.org'
      var pmId = null
    } else {
      var pmEmail = pm.email
      var pmId = pm.id
    }

    // Create job opportunity record
    const { data: job, error: jobError } = await supabase
      .from('sub_opportunities')
      .insert({
        title: `Affiliate Referral: ${submission.location}`,
        description: `${submission.notes}\n\nTimeline: ${submission.timeline}\nDuration: ${submission.duration}`,
        location: submission.location,
        estimated_budget: submission.budget,
        timeline: submission.timeline,
        estimated_duration: submission.duration,
        status: 'pending_pm_review',
        is_affiliate_referral: true,
        affiliate_partnership_id: affiliate.id,
        recruiting_member_id: affiliate.recruiting_member_id,
        affiliate_attribution_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        project_manager_id: pmId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      throw new Error('Failed to create job record')
    }

    // Calculate commission estimates
    const affiliateCommission = submission.budget * 0.05
    const overrideCommission = submission.budget * 0.02
    const platformNet = submission.budget * 0.03

    // Send email to project manager
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .lead-detail { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
    .label { font-weight: bold; color: #4a5568; }
    .value { color: #2d3748; margin-left: 10px; }
    .commission-box { background: #edf2f7; padding: 15px; margin: 15px 0; border-radius: 6px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Affiliate Lead Submission</h1>
      <p>Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    
    <div class="content">
      <h2>Affiliate Details</h2>
      <div class="lead-detail">
        <p><span class="label">Business:</span><span class="value">${affiliate.business_name}</span></p>
        <p><span class="label">Contact:</span><span class="value">${affiliate.contact_name}</span></p>
        <p><span class="label">Affiliate ID:</span><span class="value">${submission.affiliate_id}</span></p>
        <p><span class="label">Recruited By:</span><span class="value">${affiliate.profiles?.username || 'Direct signup'}</span></p>
      </div>

      <h2>Lead Details</h2>
      <div class="lead-detail">
        <p><span class="label">📍 Location:</span><span class="value">${submission.location}</span></p>
        <p><span class="label">📅 Timeline:</span><span class="value">${submission.timeline}</span></p>
        <p><span class="label">⏱️ Duration:</span><span class="value">${submission.duration}</span></p>
        <p><span class="label">💰 Budget:</span><span class="value">$${submission.budget.toLocaleString()}</span></p>
      </div>

      <div class="lead-detail">
        <p class="label">📝 Notes:</p>
        <p style="margin-top: 10px; white-space: pre-wrap;">${submission.notes}</p>
      </div>

      <div class="commission-box">
        <h3>Commission Structure (if completed):</h3>
        <p>• Affiliate (${affiliate.business_name}): <strong>$${affiliateCommission.toFixed(0)}</strong> (5%)</p>
        <p>• Override (${affiliate.profiles?.username || 'N/A'}): <strong>$${overrideCommission.toFixed(0)}</strong> (2%)</p>
        <p>• Platform: <strong>$${platformNet.toFixed(0)}</strong> (3%)</p>
        <p style="margin-top: 10px; font-size: 12px; color: #718096;">
          Total platform fee: $${(submission.budget * 0.10).toFixed(0)} (10% standard)
        </p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${supabaseUrl}/dashboard/jobs/${job.id}" class="button">View in Dashboard</a>
        <a href="${supabaseUrl}/dashboard/jobs/${job.id}/assign" class="button">Assign to Contractor</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification from Constructive Designs Affiliate System</p>
      <p>Job ID: ${job.id}</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email via Supabase Auth (or use SendGrid/Resend in production)
    // For now, we'll log it and you can set up your email service
    console.log('Email would be sent to:', pmEmail)
    console.log('Email HTML:', emailHtml)

    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // Example with Resend:
    // const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${resendApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'affiliates@constructivedesignsinc.org',
    //     to: pmEmail,
    //     subject: `New Lead: ${submission.location} ($${submission.budget.toLocaleString()})`,
    //     html: emailHtml
    //   })
    // })

    // Update affiliate stats
    await supabase.rpc('increment_affiliate_submission_count', { 
      p_affiliate_partnership_id: affiliate.id 
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        submission_id: job.id,
        message: 'Lead submitted successfully! Our project manager will review and contact the client.',
        affiliate_commission: `$${affiliateCommission.toFixed(0)}`,
        stats_updated: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing submission:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Supabase Edge Function: external-contractor-submit
// Processes form submissions from external contractors (like Nick)
// Deploy to: https://gjbrjysuqdvvqlxklvos.supabase.co/functions/v1/external-contractor-submit

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { request_id, location, start_date, estimated_duration, pay_rate, notes, submitted_at } = await req.json()

    // Validate required fields
    if (!request_id || !location || !start_date || !estimated_duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for admin access
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Lookup the external contractor request to get contractor_id
    const { data: requestData, error: requestError } = await supabase
      .from('external_contractor_requests')
      .select('contractor_id, contractor_name, external_contractor_name, external_contractor_contact')
      .eq('id', request_id)
      .single()

    if (requestError || !requestData) {
      console.error('Request lookup error:', requestError)
      return new Response(
        JSON.stringify({ error: 'Invalid request ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create sub_opportunity record
    const { data: jobData, error: jobError } = await supabase
      .from('sub_opportunities')
      .insert({
        contractor_id: requestData.contractor_id,
        job_location: location,
        start_date: start_date,
        estimated_duration: estimated_duration,
        pay_rate: pay_rate,
        notes: notes,
        status: 'pending', // Contractor must approve
        is_external_contractor: true,
        external_contractor_name: requestData.external_contractor_name,
        external_contractor_contact: requestData.external_contractor_contact,
        interested_count: 0,
        created_at: submitted_at || new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return new Response(
        JSON.stringify({ error: 'Failed to create job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark external request as fulfilled
    await supabase
      .from('external_contractor_requests')
      .update({ 
        fulfilled: true, 
        fulfilled_at: new Date().toISOString(),
        job_id: jobData.id
      })
      .eq('id', request_id)

    // Send notification to contractor (you)
    await supabase
      .from('notifications')
      .insert({
        user_id: requestData.contractor_id,
        type: 'external_contractor_response',
        title: `${requestData.external_contractor_name} responded!`,
        message: `${requestData.external_contractor_name} filled out the job request form. Review and approve the details.`,
        link: `/external-jobs/${jobData.id}`,
        read: false
      })

    // Optional: Send confirmation SMS/email to external contractor
    // (Integrate with Twilio or SendGrid here)

    // Optional: Create Google Calendar event
    if (Deno.env.get('GOOGLE_CALENDAR_ENABLED') === 'true') {
      // Google Calendar API integration here
      // Use contractor's linked calendar
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id: jobData.id,
        message: 'Job request submitted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

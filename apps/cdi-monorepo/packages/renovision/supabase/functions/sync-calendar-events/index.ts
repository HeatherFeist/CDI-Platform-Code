// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEvent {
  id: string;
  google_calendar_id: string;
  google_event_id?: string;
  event_title: string;
  event_description?: string;
  event_location?: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_ids } = await req.json();

    if (!event_ids || !Array.isArray(event_ids)) {
      throw new Error('event_ids array is required');
    }

    // Fetch events from database
    const { data: events, error: fetchError } = await supabaseClient
      .from('calendar_events')
      .select('*')
      .in('id', event_ids)
      .eq('sync_status', 'pending');

    if (fetchError) {
      throw fetchError;
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          failed: 0,
          errors: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each event
    for (const event of events as CalendarEvent[]) {
      try {
        // For MVP, we'll use a simplified approach:
        // Generate a Google Calendar link that opens in browser
        // In production, you'd use OAuth + Google Calendar API here
        
        const calendarUrl = createGoogleCalendarUrl(event);
        
        // Update event as synced with the calendar URL
        const { error: updateError } = await supabaseClient
          .from('calendar_events')
          .update({
            sync_status: 'synced',
            google_event_id: `manual-${event.id}`, // Placeholder
            last_sync_at: new Date().toISOString(),
            event_description: (event.event_description || '') + 
              `\n\nAdd to Google Calendar: ${calendarUrl}`
          })
          .eq('id', event.id);

        if (updateError) {
          throw updateError;
        }

        synced++;
      } catch (error) {
        console.error(`Failed to sync event ${event.id}:`, error);
        failed++;
        errors.push(`Event ${event.id}: ${error.message}`);

        // Mark event as failed
        await supabaseClient
          .from('calendar_events')
          .update({
            sync_status: 'failed',
            sync_error: error.message,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', event.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: failed === 0,
        synced,
        failed,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-calendar-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Creates a Google Calendar URL that can be clicked to add event
 * This is a temporary solution until full OAuth integration
 */
function createGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  
  // Format dates for Google Calendar URL (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.event_title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.event_description || '',
    location: event.event_location || '',
    trp: 'false' // Don't show event in Gmail
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* 
PRODUCTION IMPLEMENTATION with OAuth:

For full Google Calendar API integration, you would:

1. Set up Google OAuth 2.0:
   - Create credentials in Google Cloud Console
   - Set up OAuth consent screen
   - Add calendar API scope: https://www.googleapis.com/auth/calendar

2. Store OAuth tokens in database:
   ALTER TABLE team_members ADD COLUMN google_access_token TEXT;
   ALTER TABLE team_members ADD COLUMN google_refresh_token TEXT;
   ALTER TABLE team_members ADD COLUMN google_token_expiry TIMESTAMP;

3. Use Google Calendar API to create events:
   
   const accessToken = await refreshGoogleToken(event.team_member_id);
   
   const response = await fetch(
     `https://www.googleapis.com/calendar/v3/calendars/${event.google_calendar_id}/events`,
     {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         summary: event.event_title,
         description: event.event_description,
         location: event.event_location,
         start: {
           dateTime: event.start_datetime,
           timeZone: 'America/Chicago'
         },
         end: {
           dateTime: event.end_datetime,
           timeZone: 'America/Chicago'
         },
         reminders: {
           useDefault: false,
           overrides: [
             { method: 'email', minutes: 24 * 60 },
             { method: 'popup', minutes: 60 }
           ]
         }
       })
     }
   );

4. Handle token refresh:
   async function refreshGoogleToken(teamMemberId: string): Promise<string> {
     // Get stored refresh token
     // Call Google OAuth token endpoint
     // Update stored access token
     // Return new access token
   }

For now, the MVP generates a "Add to Calendar" link that users can click.
*/

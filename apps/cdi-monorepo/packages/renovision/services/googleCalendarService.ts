import { supabase } from '../supabase';

export interface CalendarEvent {
  id: string;
  business_id: string;
  team_member_id: string;
  task_assignment_id?: string;
  estimate_id?: string;
  batch_invitation_id?: string;
  google_calendar_id: string;
  google_event_id?: string;
  event_title: string;
  event_description?: string;
  event_location?: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  sync_status: 'pending' | 'synced' | 'failed' | 'cancelled' | 'deleted';
  sync_error?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EstimateCalendarEvent {
  estimate_id: string;
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  estimated_duration_days: number;
  team_member_id: string;
  team_member_name: string;
  team_member_email: string;
  calendar_event_id?: string;
  google_event_id?: string;
  event_title?: string;
  sync_status?: string;
  sync_error?: string;
  last_sync_at?: string;
  assignment_status: string;
}

class GoogleCalendarService {
  /**
   * Get pending calendar events that need to be synced
   */
  async getPendingEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('sync_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending calendar events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get calendar events for a specific estimate
   */
  async getEstimateCalendarEvents(estimateId: string): Promise<EstimateCalendarEvent[]> {
    const { data, error } = await supabase
      .from('estimate_calendar_events')
      .select('*')
      .eq('estimate_id', estimateId);

    if (error) {
      console.error('Error fetching estimate calendar events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get calendar events for a specific team member
   */
  async getTeamMemberEvents(teamMemberId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .in('sync_status', ['pending', 'synced'])
      .order('start_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching team member calendar events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Sync pending calendar events to Google Calendar
   * This calls a Supabase Edge Function that handles OAuth and API calls
   */
  async syncPendingEvents(): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const pendingEvents = await this.getPendingEvents();

      if (pendingEvents.length === 0) {
        return { success: true, synced: 0, failed: 0, errors: [] };
      }

      // Call Edge Function to sync events
      const { data, error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { event_ids: pendingEvents.map(e => e.id) }
      });

      if (error) {
        console.error('Error syncing calendar events:', error);
        return {
          success: false,
          synced: 0,
          failed: pendingEvents.length,
          errors: [error.message]
        };
      }

      return data;
    } catch (error) {
      console.error('Unexpected error syncing calendar events:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Update calendar event sync status
   */
  async updateEventStatus(
    eventId: string,
    status: CalendarEvent['sync_status'],
    googleEventId?: string,
    error?: string
  ): Promise<void> {
    const updates: any = {
      sync_status: status,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (googleEventId) {
      updates.google_event_id = googleEventId;
    }

    if (error) {
      updates.sync_error = error;
    }

    const { error: updateError } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating calendar event status:', updateError);
      throw updateError;
    }
  }

  /**
   * Delete/cancel a calendar event
   */
  async cancelEvent(eventId: string): Promise<void> {
    // Mark as cancelled in database
    await this.updateEventStatus(eventId, 'cancelled');

    // Get the event to find Google event ID
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select('google_event_id, google_calendar_id')
      .eq('id', eventId)
      .single();

    if (error || !event?.google_event_id) {
      return; // Nothing to delete in Google
    }

    // Call Edge Function to delete from Google Calendar
    try {
      await supabase.functions.invoke('delete-calendar-event', {
        body: {
          calendar_id: event.google_calendar_id,
          event_id: event.google_event_id
        }
      });
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      // Event is marked as cancelled in our DB, so this is not critical
    }
  }

  /**
   * Create a calendar event manually
   */
  async createEvent(event: {
    team_member_id: string;
    estimate_id: string;
    title: string;
    description?: string;
    location?: string;
    start_datetime: string;
    end_datetime: string;
    all_day?: boolean;
  }): Promise<string> {
    // Get team member email for calendar ID
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('email, businesses!inner(id)')
      .eq('id', event.team_member_id)
      .single();

    if (tmError || !teamMember) {
      throw new Error('Team member not found');
    }

    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert({
        business_id: teamMember.businesses.id,
        team_member_id: event.team_member_id,
        estimate_id: event.estimate_id,
        google_calendar_id: teamMember.email,
        event_title: event.title,
        event_description: event.description,
        event_location: event.location,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        all_day: event.all_day || false,
        sync_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }

    // Trigger sync
    await this.syncPendingEvents();

    return newEvent.id;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(businessId: string): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
  }> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('sync_status')
      .eq('business_id', businessId);

    if (error) {
      console.error('Error fetching sync stats:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      pending: data.filter(e => e.sync_status === 'pending').length,
      synced: data.filter(e => e.sync_status === 'synced').length,
      failed: data.filter(e => e.sync_status === 'failed').length
    };

    return stats;
  }

  /**
   * Retry failed calendar events
   */
  async retryFailedEvents(): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    // Reset failed events to pending
    const { error } = await supabase
      .from('calendar_events')
      .update({ sync_status: 'pending', sync_error: null })
      .eq('sync_status', 'failed');

    if (error) {
      console.error('Error resetting failed events:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error.message]
      };
    }

    // Sync them
    return await this.syncPendingEvents();
  }

  /**
   * Format event details for display
   */
  formatEventDetails(event: CalendarEvent): string {
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    
    if (event.all_day) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    
    return `${start.toLocaleString()} - ${end.toLocaleString()}`;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: CalendarEvent['sync_status']): string {
    const colors = {
      pending: '#FFA500',
      synced: '#4CAF50',
      failed: '#F44336',
      cancelled: '#9E9E9E',
      deleted: '#757575'
    };
    return colors[status] || '#9E9E9E';
  }

  /**
   * Get status icon for UI
   */
  getStatusIcon(status: CalendarEvent['sync_status']): string {
    const icons = {
      pending: 'schedule',
      synced: 'check_circle',
      failed: 'error',
      cancelled: 'cancel',
      deleted: 'delete'
    };
    return icons[status] || 'help';
  }
}

export const googleCalendarService = new GoogleCalendarService();

import { supabase } from '../lib/supabase';
import { 
  City, 
  MeetupLocation, 
  DeliveryService, 
  DeliveryRequest, 
  CommunityEvent,
  DeliveryStatus,
  LocationHelpers 
} from '../types/location';

export class LocationService {
  private static instance: LocationService;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // City management
  async getCities(): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getCityByName(name: string, state: string): Promise<City | null> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('name', name)
      .eq('state', state)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Meetup locations
  async getMeetupLocationsByCity(cityId: string): Promise<MeetupLocation[]> {
    const { data, error } = await supabase
      .from('meetup_locations')
      .select(`
        *,
        city:cities(*)
      `)
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getNearbyMeetupLocations(
    latitude: number, 
    longitude: number, 
    radiusMiles: number = 25
  ): Promise<MeetupLocation[]> {
    const { data, error } = await supabase
      .rpc('get_nearby_meetup_locations', {
        user_lat: latitude,
        user_lng: longitude,
        radius_miles: radiusMiles
      });

    if (error) throw error;
    return data || [];
  }

  async getMeetupLocationById(id: string): Promise<MeetupLocation | null> {
    const { data, error } = await supabase
      .from('meetup_locations')
      .select(`
        *,
        city:cities(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Delivery services
  async getDeliveryServicesByCity(cityId: string): Promise<DeliveryService[]> {
    const { data, error } = await supabase
      .from('delivery_services')
      .select(`
        *,
        city:cities(*)
      `)
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createDeliveryRequest(request: Partial<DeliveryRequest>): Promise<DeliveryRequest> {
    const { data, error } = await supabase
      .from('delivery_requests')
      .insert([{
        ...request,
        tracking_code: this.generateTrackingCode(),
        delivery_status: 'requested'
      }])
      .select(`
        *,
        listing:listings(*),
        delivery_service:delivery_services(*),
        buyer:profiles(*),
        seller:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateDeliveryStatus(requestId: string, status: DeliveryStatus): Promise<void> {
    const updateData: any = { 
      delivery_status: status,
      updated_at: new Date().toISOString()
    };

    // Set completion time for delivered status
    if (status === 'delivered') {
      updateData.delivery_time_actual = new Date().toISOString();
    } else if (status === 'picked_up') {
      updateData.pickup_time_actual = new Date().toISOString();
    }

    const { error } = await supabase
      .from('delivery_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) throw error;
  }

  async getUserDeliveryRequests(userId: string): Promise<DeliveryRequest[]> {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        listing:listings(*),
        delivery_service:delivery_services(*),
        buyer:profiles(*),
        seller:profiles(*)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Community events
  async getCommunityEvents(cityId: string): Promise<CommunityEvent[]> {
    const { data, error } = await supabase
      .from('community_events')
      .select(`
        *,
        city:cities(*),
        meetup_location:meetup_locations(*),
        organizer:profiles(*)
      `)
      .eq('city_id', cityId)
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date');

    if (error) throw error;
    return data || [];
  }

  async createCommunityEvent(event: Partial<CommunityEvent>): Promise<CommunityEvent> {
    const { data, error } = await supabase
      .from('community_events')
      .insert([event])
      .select(`
        *,
        city:cities(*),
        meetup_location:meetup_locations(*),
        organizer:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    // This would need a separate table for event registrations
    // For now, we'll just increment the participant count
    const { error } = await supabase
      .rpc('increment_event_participants', { event_id: eventId });

    if (error) throw error;
  }

  // Utility functions
  private generateTrackingCode(): string {
    const prefix = 'CDM'; // Constructive Designs Marketplace
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  async estimateDeliveryFee(
    pickupAddress: string,
    deliveryAddress: string,
    serviceId?: string
  ): Promise<number> {
    // In a real implementation, you'd geocode addresses and calculate distance
    // For now, return a base estimate
    const baseDistance = 10; // miles
    return LocationHelpers.estimateDeliveryFee(baseDistance);
  }

  async searchListingsByLocation(
    cityId: string,
    userLatitude?: number,
    userLongitude?: number,
    filters?: {
      category?: string;
      condition?: string;
      priceMin?: number;
      priceMax?: number;
      radius?: number;
    }
  ): Promise<any[]> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(*),
        category:categories(*),
        city:cities(*)
      `)
      .eq('city_id', cityId)
      .eq('status', 'active')
      .gt('end_time', new Date().toISOString());

    // Apply filters
    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }
    
    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }
    
    if (filters?.priceMin) {
      query = query.gte('starting_bid', filters.priceMin);
    }
    
    if (filters?.priceMax) {
      query = query.lte('starting_bid', filters.priceMax);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's location preferences
  async getUserLocationPreferences(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .select('city_id, preferred_meetup_radius, delivery_preferences')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update user's location preferences
  async updateUserLocationPreferences(
    userId: string, 
    preferences: {
      city_id?: string;
      preferred_meetup_radius?: number;
      delivery_preferences?: any;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', userId);

    if (error) throw error;
  }

  // Get safe exchange tips
  getSafeExchangeTips(): string[] {
    return [
      'Meet in well-lit, public places with high foot traffic',
      'Bring a friend or let someone know where you\'re going',
      'Use verified meetup locations when possible',
      'Inspect items thoroughly before completing the exchange',
      'Use the app messaging system to communicate',
      'Don\'t share personal financial information',
      'Trust your instincts - if something feels wrong, leave',
      'Consider police station exchange zones for high-value items',
      'Take photos of items during the exchange',
      'Complete payment through the app when possible'
    ];
  }

  // Get local delivery tips
  getDeliveryTips(): string[] {
    return [
      'Verify delivery service credentials and reviews',
      'Take photos of items before pickup',
      'Provide clear pickup and delivery instructions',
      'Be available during scheduled pickup/delivery windows',
      'Use signature confirmation for valuable items',
      'Keep tracking codes for reference',
      'Communicate any delays or issues promptly',
      'Tip delivery drivers for exceptional service',
      'Report any problems through the app immediately'
    ];
  }
}
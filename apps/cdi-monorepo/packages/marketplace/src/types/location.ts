// Location-based marketplace types
export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  population?: number;
  market_launch_date?: string;
  created_at: string;
  updated_at: string;
}

export type LocationType = 
  | 'police_station'
  | 'shopping_center'
  | 'public_park'
  | 'library'
  | 'community_center'
  | 'parking_lot';

export interface MeetupLocation {
  id: string;
  city_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location_type: LocationType;
  operating_hours?: { [day: string]: string };
  safety_features: string[];
  is_verified: boolean;
  is_active: boolean;
  description?: string;
  contact_info?: {
    phone?: string;
    website?: string;
    contact_person?: string;
  };
  distance_miles?: number; // Calculated field
  created_at: string;
  updated_at: string;
  
  // Populated relations
  city?: City;
}

export type ServiceType = 'individual_driver' | 'delivery_company' | 'community_volunteer';

export interface DeliveryService {
  id: string;
  city_id: string;
  service_name: string;
  service_type: ServiceType;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  service_area?: any; // Geographic boundaries
  base_fee?: number;
  per_mile_fee?: number;
  max_item_weight?: number; // pounds
  max_item_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  available_days: string[];
  available_hours?: {
    start: string;
    end: string;
  };
  rating: number;
  total_deliveries: number;
  is_verified: boolean;
  is_active: boolean;
  insurance_info?: any;
  background_checked: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  city?: City;
}

export type DeliveryStatus = 
  | 'requested'
  | 'accepted'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryRequest {
  id: string;
  listing_id: string;
  delivery_service_id?: string;
  buyer_id: string;
  seller_id: string;
  pickup_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    special_instructions?: string;
  };
  delivery_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    special_instructions?: string;
  };
  pickup_time_requested?: string;
  delivery_time_requested?: string;
  pickup_time_actual?: string;
  delivery_time_actual?: string;
  delivery_fee: number;
  delivery_status: DeliveryStatus;
  special_instructions?: string;
  signature_required: boolean;
  photo_proof_required: boolean;
  tracking_code?: string;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  listing?: any; // Import from main types
  delivery_service?: DeliveryService;
  buyer?: any; // Profile
  seller?: any; // Profile
}

export type EventType = 'weekend_market' | 'pickup_event' | 'community_sale' | 'auction_meetup';

export interface CommunityEvent {
  id: string;
  city_id: string;
  meetup_location_id?: string;
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  end_time: string;
  description?: string;
  max_participants?: number;
  current_participants: number;
  entry_fee: number;
  organizer_id?: string;
  is_active: boolean;
  requires_registration: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  city?: City;
  meetup_location?: MeetupLocation;
  organizer?: any; // Profile
}

export interface DeliveryPreferences {
  willing_to_meet: boolean;
  max_travel_distance: number;
  preferred_meetup_times: string[];
  delivery_service_preferred: boolean;
  contact_method: 'app_messaging' | 'phone' | 'email';
}

// Location utility functions
export const LocationHelpers = {
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  formatDistance: (miles: number): string => {
    if (miles < 1) {
      return `${(miles * 5280).toFixed(0)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  },

  getLocationTypeIcon: (type: LocationType): string => {
    const icons = {
      police_station: '🚔',
      shopping_center: '🏪',
      public_park: '🏞️',
      library: '📚',
      community_center: '🏛️',
      parking_lot: '🅿️'
    };
    return icons[type] || '📍';
  },

  getLocationTypeLabel: (type: LocationType): string => {
    const labels = {
      police_station: 'Police Station',
      shopping_center: 'Shopping Center',
      public_park: 'Public Park',
      library: 'Library',
      community_center: 'Community Center',
      parking_lot: 'Parking Lot'
    };
    return labels[type] || 'Location';
  },

  getDeliveryStatusColor: (status: DeliveryStatus): string => {
    const colors = {
      requested: 'yellow',
      accepted: 'blue',
      pickup_scheduled: 'purple',
      picked_up: 'orange',
      in_transit: 'indigo',
      delivered: 'green',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'gray';
  },

  getDeliveryStatusIcon: (status: DeliveryStatus): string => {
    const icons = {
      requested: '📋',
      accepted: '✅',
      pickup_scheduled: '📅',
      picked_up: '📦',
      in_transit: '🚚',
      delivered: '🎉',
      failed: '❌',
      cancelled: '⚪'
    };
    return icons[status] || '📍';
  },

  estimateDeliveryFee: (distance: number, baseRate: number = 5, perMileRate: number = 1.5): number => {
    return baseRate + (distance * perMileRate);
  },

  isWithinServiceArea: (pickupLat: number, pickupLng: number, deliveryLat: number, deliveryLng: number, maxDistance: number = 25): boolean => {
    const distance = LocationHelpers.calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
    return distance <= maxDistance;
  },

  formatAddress: (address: DeliveryRequest['pickup_address'] | DeliveryRequest['delivery_address']): string => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  },

  getSafetyScore: (location: MeetupLocation): number => {
    let score = 0;
    if (location.is_verified) score += 20;
    if (location.location_type === 'police_station') score += 30;
    if (location.location_type === 'shopping_center') score += 20;
    if (location.location_type === 'library') score += 15;
    
    location.safety_features.forEach(feature => {
      if (feature === 'police_presence') score += 25;
      else if (feature === 'security_cameras') score += 15;
      else if (feature === 'well_lit') score += 10;
      else if (feature === 'high_traffic') score += 10;
      else score += 5;
    });
    
    return Math.min(score, 100);
  },

  getRecommendedMeetupTimes: (): { label: string; value: string; icon: string }[] => {
    return [
      { label: 'Saturday Morning (9AM-12PM)', value: 'saturday_morning', icon: '🌅' },
      { label: 'Saturday Afternoon (1PM-5PM)', value: 'saturday_afternoon', icon: '☀️' },
      { label: 'Sunday Morning (9AM-12PM)', value: 'sunday_morning', icon: '🌅' },
      { label: 'Sunday Afternoon (1PM-5PM)', value: 'sunday_afternoon', icon: '☀️' },
      { label: 'Weekday Evening (5PM-8PM)', value: 'weekday_evening', icon: '🌆' },
      { label: 'Flexible/Any Time', value: 'flexible', icon: '⏰' }
    ];
  }
};

// Constants for Dayton, OH
export const DAYTON_COORDINATES = {
  latitude: 39.7589,
  longitude: -84.1916
};

export const DEFAULT_SEARCH_RADIUS = 25; // miles
export const MAX_DELIVERY_DISTANCE = 50; // miles
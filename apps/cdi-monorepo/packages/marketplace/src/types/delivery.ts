// Delivery System Types

export type DeliveryType = 'self_pickup' | 'seller_delivery' | 'platform_delivery' | 'shipping';

export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'bike' | 'van';

export type BackgroundCheckStatus = 'pending' | 'approved' | 'rejected';

export type DriverStatus = 
  | 'pending'      // Waiting for driver to accept
  | 'accepted'     // Driver accepted, heading to pickup
  | 'picked_up'    // Driver has the item
  | 'in_transit'   // On the way to delivery
  | 'delivered'    // Successfully delivered
  | 'cancelled'    // Cancelled by driver/buyer/seller
  | 'failed';      // Delivery attempt failed

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type RaterType = 'buyer' | 'seller' | 'driver';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lon?: number;
  instructions?: string;
}

export interface CurrentLocation {
  lat: number;
  lon: number;
  updated_at: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface ShippingDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export interface DeliveryDriver {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  license_plate?: string;
  
  // Verification
  license_number?: string;
  insurance_verified: boolean;
  insurance_expiry?: string;
  background_check_status: BackgroundCheckStatus;
  background_check_date?: string;
  
  // Status
  is_active: boolean;
  is_available: boolean;
  
  // Performance
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  
  // Earnings
  total_earnings: number;
  total_tips: number;
  
  // Location
  current_location?: CurrentLocation;
  
  // Contact
  phone?: string;
  emergency_contact?: EmergencyContact;
  
  created_at: string;
  updated_at: string;
}

export interface DeliveryRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  
  // Delivery Type
  delivery_type: DeliveryType;
  
  // Addresses
  pickup_address: Address;
  delivery_address: Address;
  
  // Distance
  distance_miles?: number;
  
  // Driver Assignment
  driver_id?: string;
  driver_status: DriverStatus;
  
  // Fees
  delivery_fee: number;
  driver_tip: number;
  platform_cut: number;
  driver_earnings: number;
  
  // Item Details
  item_weight_lbs?: number;
  item_value?: number;
  special_instructions?: string;
  
  // Timing
  requested_pickup_time?: string;
  estimated_pickup_time?: string;
  actual_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  
  // Tracking & Proof
  notes?: string;
  pickup_signature_url?: string;
  pickup_photo_url?: string;
  delivery_signature_url?: string;
  delivery_photo_url?: string;
  
  // Coordination
  coordination_notes?: string;
  meeting_time?: string;
  meeting_location?: Address;
  
  // Payment
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  completed_at?: string;
}

export interface DeliveryRating {
  id: string;
  delivery_request_id: string;
  driver_id?: string;
  
  // Who is rating
  rater_id: string;
  rater_type: RaterType;
  
  // Rating
  rating: number; // 1-5
  comment?: string;
  
  // Specific feedback
  on_time?: boolean;
  professional?: boolean;
  item_condition?: boolean;
  
  created_at: string;
}

export interface DeliveryFeeCalculation {
  total_fee: number;
  platform_cut: number;
  driver_earnings: number;
  breakdown?: {
    base_fee: number;
    distance_fee: number;
    weight_fee: number;
    insurance_fee: number;
  };
}

// Extended Listing type with delivery options
export interface ListingWithDelivery {
  delivery_options: DeliveryType[];
  seller_delivery_fee?: number;
  seller_delivery_radius?: number; // miles
  pickup_location?: Address;
  requires_signature?: boolean;
  shipping_weight_lbs?: number;
  shipping_dimensions?: ShippingDimensions;
}

// Driver Application
export interface DriverApplication {
  vehicle_type: VehicleType;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  license_number: string;
  phone: string;
  emergency_contact: EmergencyContact;
  insurance_expiry: string;
}

// Delivery Request Creation
export interface CreateDeliveryRequest {
  listing_id: string;
  delivery_type: DeliveryType;
  pickup_address: Address;
  delivery_address: Address;
  item_weight_lbs?: number;
  item_value?: number;
  special_instructions?: string;
  requested_pickup_time?: string;
  driver_tip?: number;
}

// Driver stats for dashboard
export interface DriverStats {
  total_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  completion_rate: number;
  rating: number;
  total_ratings: number;
  total_earnings: number;
  total_tips: number;
  average_tip: number;
  this_week_deliveries: number;
  this_week_earnings: number;
  this_month_deliveries: number;
  this_month_earnings: number;
}

// Available delivery for driver to accept
export interface AvailableDelivery {
  id: string;
  listing_title: string;
  listing_image?: string;
  pickup_address: Address;
  delivery_address: Address;
  distance_miles: number;
  delivery_fee: number;
  driver_earnings: number;
  item_weight_lbs?: number;
  special_instructions?: string;
  estimated_duration_minutes: number;
  created_at: string;
}

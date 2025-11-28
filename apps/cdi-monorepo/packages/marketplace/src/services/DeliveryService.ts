import { supabase } from '../lib/supabase';
import type {
  DeliveryType,
  DeliveryDriver,
  DeliveryRequest,
  DeliveryRating,
  DeliveryFeeCalculation,
  CreateDeliveryRequest,
  DriverApplication,
  DriverStats,
  AvailableDelivery,
  Address
} from '../types/delivery';

/**
 * Delivery Service
 * Handles all delivery-related operations including driver management,
 * delivery requests, and fee calculations
 */
export class DeliveryService {
  /**
   * Calculate delivery fee based on distance, weight, and value
   */
  static calculateDeliveryFee(
    distance_miles: number,
    item_weight_lbs: number = 0,
    item_value: number = 0
  ): DeliveryFeeCalculation {
    const base_fee = 5.00;
    const per_mile = 1.50;
    const weight_fee = item_weight_lbs > 50 ? (item_weight_lbs - 50) * 0.10 : 0;
    const insurance_fee = item_value > 500 ? 2.00 : 0;
    
    const total_fee = base_fee + (distance_miles * per_mile) + weight_fee + insurance_fee;
    const platform_percentage = 0.20; // 20% to platform
    const platform_cut = parseFloat((total_fee * platform_percentage).toFixed(2));
    const driver_earnings = parseFloat((total_fee * (1 - platform_percentage)).toFixed(2));
    
    return {
      total_fee: parseFloat(total_fee.toFixed(2)),
      platform_cut,
      driver_earnings,
      breakdown: {
        base_fee,
        distance_fee: distance_miles * per_mile,
        weight_fee,
        insurance_fee
      }
    };
  }

  /**
   * Calculate distance between two addresses (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Register as a delivery driver
   */
  static async registerDriver(
    userId: string,
    application: DriverApplication
  ): Promise<DeliveryDriver> {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert({
        user_id: userId,
        ...application,
        background_check_status: 'pending',
        is_active: false // Needs admin approval
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get driver profile
   */
  static async getDriverProfile(userId: string): Promise<DeliveryDriver | null> {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update driver availability
   */
  static async updateDriverAvailability(
    userId: string,
    isAvailable: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('delivery_drivers')
      .update({ 
        is_available: isAvailable,
        current_location: isAvailable ? undefined : null
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Update driver location
   */
  static async updateDriverLocation(
    userId: string,
    lat: number,
    lon: number
  ): Promise<void> {
    const { error } = await supabase
      .from('delivery_drivers')
      .update({
        current_location: {
          lat,
          lon,
          updated_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Create a delivery request
   */
  static async createDeliveryRequest(
    buyerId: string,
    sellerId: string,
    request: CreateDeliveryRequest
  ): Promise<DeliveryRequest> {
    // Calculate distance if coordinates are provided
    let distance_miles: number | undefined;
    let feeCalculation: DeliveryFeeCalculation | undefined;

    if (request.delivery_type === 'platform_delivery') {
      if (request.pickup_address.lat && request.pickup_address.lon &&
          request.delivery_address.lat && request.delivery_address.lon) {
        distance_miles = this.calculateDistance(
          request.pickup_address.lat,
          request.pickup_address.lon,
          request.delivery_address.lat,
          request.delivery_address.lon
        );

        feeCalculation = this.calculateDeliveryFee(
          distance_miles,
          request.item_weight_lbs,
          request.item_value
        );
      }
    }

    const { data, error } = await supabase
      .from('delivery_requests')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_id: request.listing_id,
        delivery_type: request.delivery_type,
        pickup_address: request.pickup_address,
        delivery_address: request.delivery_address,
        distance_miles,
        delivery_fee: feeCalculation?.total_fee || 0,
        platform_cut: feeCalculation?.platform_cut || 0,
        driver_earnings: feeCalculation?.driver_earnings || 0,
        driver_tip: request.driver_tip || 0,
        item_weight_lbs: request.item_weight_lbs,
        item_value: request.item_value,
        special_instructions: request.special_instructions,
        requested_pickup_time: request.requested_pickup_time,
        driver_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get available deliveries for a driver
   */
  static async getAvailableDeliveries(
    driverUserId: string,
    maxDistance: number = 25
  ): Promise<AvailableDelivery[]> {
    // Get driver's current location
    const driver = await this.getDriverProfile(driverUserId);
    if (!driver || !driver.current_location) {
      return [];
    }

    const { data, error } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        listings:listing_id (
          title,
          images
        )
      `)
      .eq('delivery_type', 'platform_delivery')
      .eq('driver_status', 'pending')
      .is('driver_id', null);

    if (error) throw error;
    if (!data) return [];

    // Filter by distance and format response
    const available: AvailableDelivery[] = data
      .filter(req => {
        if (!req.pickup_address.lat || !req.pickup_address.lon) return false;
        
        const distance = this.calculateDistance(
          driver.current_location!.lat,
          driver.current_location!.lon,
          req.pickup_address.lat,
          req.pickup_address.lon
        );
        
        return distance <= maxDistance;
      })
      .map(req => ({
        id: req.id,
        listing_title: req.listings?.title || 'Item',
        listing_image: req.listings?.images?.[0],
        pickup_address: req.pickup_address,
        delivery_address: req.delivery_address,
        distance_miles: req.distance_miles || 0,
        delivery_fee: req.delivery_fee,
        driver_earnings: req.driver_earnings,
        item_weight_lbs: req.item_weight_lbs,
        special_instructions: req.special_instructions,
        estimated_duration_minutes: Math.ceil((req.distance_miles || 0) * 3), // ~20mph avg
        created_at: req.created_at
      }));

    return available;
  }

  /**
   * Accept a delivery request
   */
  static async acceptDelivery(
    deliveryId: string,
    driverUserId: string
  ): Promise<void> {
    // Get driver ID from user ID
    const driver = await this.getDriverProfile(driverUserId);
    if (!driver) throw new Error('Driver profile not found');

    const estimatedPickupTime = new Date();
    estimatedPickupTime.setMinutes(estimatedPickupTime.getMinutes() + 15);

    const { error } = await supabase
      .from('delivery_requests')
      .update({
        driver_id: driver.id,
        driver_status: 'accepted',
        estimated_pickup_time: estimatedPickupTime.toISOString()
      })
      .eq('id', deliveryId)
      .is('driver_id', null); // Only if not already assigned

    if (error) throw error;
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    updates: Partial<DeliveryRequest> = {}
  ): Promise<void> {
    const updateData: any = {
      driver_status: status,
      ...updates
    };

    // Set timestamps based on status
    if (status === 'picked_up') {
      updateData.actual_pickup_time = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.actual_delivery_time = new Date().toISOString();
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('delivery_requests')
      .update(updateData)
      .eq('id', deliveryId);

    if (error) throw error;
  }

  /**
   * Get delivery request by ID
   */
  static async getDeliveryRequest(id: string): Promise<DeliveryRequest | null> {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get user's delivery requests
   */
  static async getUserDeliveryRequests(userId: string): Promise<DeliveryRequest[]> {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get driver's delivery requests
   */
  static async getDriverDeliveryRequests(driverUserId: string): Promise<DeliveryRequest[]> {
    const driver = await this.getDriverProfile(driverUserId);
    if (!driver) return [];

    const { data, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Submit delivery rating
   */
  static async submitRating(
    deliveryId: string,
    raterId: string,
    raterType: string,
    rating: number,
    comment?: string,
    feedback?: {
      on_time?: boolean;
      professional?: boolean;
      item_condition?: boolean;
    }
  ): Promise<void> {
    const delivery = await this.getDeliveryRequest(deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const { error } = await supabase
      .from('delivery_ratings')
      .insert({
        delivery_request_id: deliveryId,
        driver_id: delivery.driver_id,
        rater_id: raterId,
        rater_type: raterType,
        rating,
        comment,
        ...feedback
      });

    if (error) throw error;
  }

  /**
   * Get driver statistics
   */
  static async getDriverStats(driverUserId: string): Promise<DriverStats | null> {
    const driver = await this.getDriverProfile(driverUserId);
    if (!driver) return null;

    // Get ratings
    const { data: ratings } = await supabase
      .from('delivery_ratings')
      .select('rating')
      .eq('driver_id', driver.id);

    const totalRatings = ratings?.length || 0;
    const completionRate = driver.total_deliveries > 0
      ? (driver.completed_deliveries / driver.total_deliveries) * 100
      : 0;

    // Get this week's stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekDeliveries } = await supabase
      .from('delivery_requests')
      .select('driver_earnings, driver_tip')
      .eq('driver_id', driver.id)
      .eq('driver_status', 'delivered')
      .gte('completed_at', weekAgo.toISOString());

    const weekEarnings = weekDeliveries?.reduce(
      (sum, d) => sum + d.driver_earnings + d.driver_tip, 0
    ) || 0;

    // Get this month's stats
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { data: monthDeliveries } = await supabase
      .from('delivery_requests')
      .select('driver_earnings, driver_tip')
      .eq('driver_id', driver.id)
      .eq('driver_status', 'delivered')
      .gte('completed_at', monthAgo.toISOString());

    const monthEarnings = monthDeliveries?.reduce(
      (sum, d) => sum + d.driver_earnings + d.driver_tip, 0
    ) || 0;

    return {
      total_deliveries: driver.total_deliveries,
      completed_deliveries: driver.completed_deliveries,
      cancelled_deliveries: driver.cancelled_deliveries,
      completion_rate: parseFloat(completionRate.toFixed(1)),
      rating: driver.rating,
      total_ratings: totalRatings,
      total_earnings: driver.total_earnings,
      total_tips: driver.total_tips,
      average_tip: driver.completed_deliveries > 0
        ? parseFloat((driver.total_tips / driver.completed_deliveries).toFixed(2))
        : 0,
      this_week_deliveries: weekDeliveries?.length || 0,
      this_week_earnings: parseFloat(weekEarnings.toFixed(2)),
      this_month_deliveries: monthDeliveries?.length || 0,
      this_month_earnings: parseFloat(monthEarnings.toFixed(2))
    };
  }
}

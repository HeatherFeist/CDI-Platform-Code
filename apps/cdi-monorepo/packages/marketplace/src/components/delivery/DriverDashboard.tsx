import { useState, useEffect } from 'react';
import { FiTruck, FiDollarSign, FiStar, FiMapPin, FiClock, FiPackage, FiTrendingUp, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { DeliveryService } from '../../services/DeliveryService';
import type { DeliveryDriver, DriverStats, AvailableDelivery } from '../../types/delivery';
import { Link } from 'react-router-dom';

export function DriverDashboard() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<DeliveryDriver | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadAvailableDeliveries, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;
    
    try {
      const [driverData, statsData] = await Promise.all([
        DeliveryService.getDriverProfile(user.id),
        DeliveryService.getDriverStats(user.id)
      ]);
      
      setDriver(driverData);
      setStats(statsData);
      
      if (driverData?.is_available) {
        await loadAvailableDeliveries();
      }
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDeliveries = async () => {
    if (!user) return;
    
    try {
      const deliveries = await DeliveryService.getAvailableDeliveries(user.id);
      setAvailableDeliveries(deliveries);
    } catch (error) {
      console.error('Failed to load available deliveries:', error);
    }
  };

  const toggleAvailability = async () => {
    if (!user || !driver) return;
    
    setUpdatingAvailability(true);
    try {
      const newStatus = !driver.is_available;
      await DeliveryService.updateDriverAvailability(user.id, newStatus);
      setDriver({ ...driver, is_available: newStatus });
      
      if (newStatus) {
        // Request location permission and update
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            await DeliveryService.updateDriverLocation(
              user.id,
              position.coords.latitude,
              position.coords.longitude
            );
            await loadAvailableDeliveries();
          });
        }
      } else {
        setAvailableDeliveries([]);
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    if (!user) return;
    
    try {
      await DeliveryService.acceptDelivery(deliveryId, user.id);
      setAvailableDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      // TODO: Navigate to active delivery view
      alert('Delivery accepted! Navigate to pickup location.');
    } catch (error: any) {
      alert(error.message || 'Failed to accept delivery');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTruck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Not a Driver Yet?
          </h2>
          <p className="text-gray-600 mb-6">
            Join our delivery team and start earning with flexible hours and great pay!
          </p>
          <Link
            to="/driver/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 shadow-lg transition-all"
          >
            <FiTruck className="w-5 h-5" />
            Become a Driver
          </Link>
        </div>
      </div>
    );
  }

  if (driver.background_check_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiClock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-900 mb-2">
            Application Under Review
          </h2>
          <p className="text-yellow-700 mb-4">
            Your driver application is being reviewed. We'll notify you once it's approved!
          </p>
          <p className="text-sm text-yellow-600">
            Typical review time: 1-2 business days
          </p>
        </div>
      </div>
    );
  }

  if (!driver.is_active) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            Account Inactive
          </h2>
          <p className="text-red-700">
            Your driver account is currently inactive. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Availability Toggle */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Driver Dashboard</h1>
            <p className="text-purple-100">
              {driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={updatingAvailability}
            className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
              driver.is_available
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {updatingAvailability ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Updating...
              </div>
            ) : driver.is_available ? (
              'Go Offline'
            ) : (
              'Go Online'
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${driver.is_available ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-medium">
            {driver.is_available ? 'Online - Accepting Deliveries' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats?.total_earnings.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            + ${stats?.total_tips.toFixed(2) || '0.00'} in tips
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.completed_deliveries || 0}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats?.completion_rate.toFixed(1)}% completion rate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiStar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.rating.toFixed(1) || '5.0'}
              </div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            From {stats?.total_ratings || 0} reviews
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats?.this_week_earnings.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats?.this_week_deliveries || 0} deliveries
          </div>
        </div>
      </div>

      {/* Available Deliveries */}
      {driver.is_available && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-purple-600" />
            Available Deliveries Nearby
          </h2>

          {availableDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No deliveries available right now</p>
              <p className="text-sm text-gray-500">Check back soon or try expanding your radius</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {delivery.listing_title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span>Pickup: {delivery.pickup_address.city}, {delivery.pickup_address.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-purple-500" />
                          <span>Deliver: {delivery.delivery_address.city}, {delivery.delivery_address.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-gray-400" />
                          <span>{delivery.distance_miles.toFixed(1)} miles • ~{delivery.estimated_duration_minutes} mins</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        ${delivery.driver_earnings.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">+ tips</div>
                    </div>
                  </div>

                  {delivery.special_instructions && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-sm text-yellow-800">
                      📝 {delivery.special_instructions}
                    </div>
                  )}

                  <button
                    onClick={() => acceptDelivery(delivery.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all"
                  >
                    <FiCheck className="w-5 h-5" />
                    Accept Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-purple-600" />
          This Month
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-800 mb-1">Deliveries</div>
            <div className="text-3xl font-bold text-green-600">
              {stats?.this_month_deliveries || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-800 mb-1">Earnings</div>
            <div className="text-3xl font-bold text-blue-600">
              ${stats?.this_month_earnings.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-800 mb-1">Avg Tip</div>
            <div className="text-3xl font-bold text-purple-600">
              ${stats?.average_tip.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

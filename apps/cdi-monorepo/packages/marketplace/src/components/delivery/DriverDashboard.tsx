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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="market-panel text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
            <FiTruck className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Not a Driver Yet?
          </h2>
          <p className="mb-6 text-slate-300">
            Join our delivery team and start earning with flexible hours and great pay!
          </p>
          <Link
            to="/driver/register"
            className="market-button-primary inline-flex items-center gap-2 px-6 py-3"
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
        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/20">
            <FiClock className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-amber-100">
            Application Under Review
          </h2>
          <p className="mb-4 text-amber-100/85">
            Your driver application is being reviewed. We'll notify you once it's approved!
          </p>
          <p className="text-sm text-amber-200/80">
            Typical review time: 1-2 business days
          </p>
        </div>
      </div>
    );
  }

  if (!driver.is_active) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center backdrop-blur-sm">
          <h2 className="mb-2 text-2xl font-bold text-rose-100">
            Account Inactive
          </h2>
          <p className="text-rose-100/85">
            Your driver account is currently inactive. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Availability Toggle */}
      <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950 p-6 text-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.45)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Driver Dashboard</h1>
            <p className="text-slate-200">
              {driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={updatingAvailability}
            className={`rounded-2xl px-6 py-3 font-semibold transition-all ${
              driver.is_available
                ? 'bg-rose-500/90 hover:bg-rose-400'
                : 'bg-emerald-500/90 hover:bg-emerald-400'
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
          <div className={`h-3 w-3 rounded-full ${driver.is_available ? 'bg-emerald-300 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-medium">
            {driver.is_available ? 'Online - Accepting Deliveries' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="market-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15">
              <FiDollarSign className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                ${stats?.total_earnings.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-slate-300">Total Earnings</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            + ${stats?.total_tips.toFixed(2) || '0.00'} in tips
          </div>
        </div>

        <div className="market-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15">
              <FiPackage className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats?.completed_deliveries || 0}
              </div>
              <div className="text-sm text-slate-300">Completed</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {stats?.completion_rate.toFixed(1)}% completion rate
          </div>
        </div>

        <div className="market-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15">
              <FiStar className="h-5 w-5 text-violet-200" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats?.rating.toFixed(1) || '5.0'}
              </div>
              <div className="text-sm text-slate-300">Rating</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            From {stats?.total_ratings || 0} reviews
          </div>
        </div>

        <div className="market-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/15">
              <FiTrendingUp className="h-5 w-5 text-amber-200" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                ${stats?.this_week_earnings.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-slate-300">This Week</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {stats?.this_week_deliveries || 0} deliveries
          </div>
        </div>
      </div>

      {/* Available Deliveries */}
      {driver.is_available && (
        <div className="market-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FiMapPin className="h-5 w-5 text-cyan-300" />
            Available Deliveries Nearby
          </h2>

          {availableDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <FiPackage className="h-8 w-8 text-slate-500" />
              </div>
              <p className="mb-2 text-slate-300">No deliveries available right now</p>
              <p className="text-sm text-slate-500">Check back soon or try expanding your radius</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 transition-all backdrop-blur-sm hover:border-cyan-400/35 hover:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-white">
                        {delivery.listing_title}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="h-4 w-4 text-slate-500" />
                          <span>Pickup: {delivery.pickup_address.city}, {delivery.pickup_address.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="h-4 w-4 text-cyan-300" />
                          <span>Deliver: {delivery.delivery_address.city}, {delivery.delivery_address.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="h-4 w-4 text-slate-500" />
                          <span>{delivery.distance_miles.toFixed(1)} miles • ~{delivery.estimated_duration_minutes} mins</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-emerald-300">
                        ${delivery.driver_earnings.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400">+ tips</div>
                    </div>
                  </div>

                  {delivery.special_instructions && (
                    <div className="mb-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100/90">
                      Notes: {delivery.special_instructions}
                    </div>
                  )}

                  <button
                    onClick={() => acceptDelivery(delivery.id)}
                    className="market-button-primary flex w-full items-center justify-center gap-2 px-4 py-2"
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
      <div className="market-panel p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
          <FiTrendingUp className="h-5 w-5 text-cyan-300" />
          This Month
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <div className="mb-1 text-sm text-emerald-100/85">Deliveries</div>
            <div className="text-3xl font-bold text-emerald-300">
              {stats?.this_month_deliveries || 0}
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <div className="mb-1 text-sm text-cyan-100/85">Earnings</div>
            <div className="text-3xl font-bold text-cyan-300">
              ${stats?.this_month_earnings.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="rounded-3xl border border-violet-400/25 bg-violet-500/10 p-4">
            <div className="mb-1 text-sm text-violet-100/85">Avg Tip</div>
            <div className="text-3xl font-bold text-violet-300">
              ${stats?.average_tip.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

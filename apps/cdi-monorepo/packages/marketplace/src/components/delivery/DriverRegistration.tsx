import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiUser, FiShield, FiPhone, FiCalendar, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { DeliveryService } from '../../services/DeliveryService';
import type { VehicleType, DriverApplication } from '../../types/delivery';

export function DriverRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<DriverApplication>({
    vehicle_type: 'car',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    license_plate: '',
    license_number: '',
    phone: '',
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    },
    insurance_expiry: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await DeliveryService.registerDriver(user.id, formData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard?tab=driver');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes: { value: VehicleType; label: string; icon: string }[] = [
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'truck', label: 'Truck', icon: '🚚' },
    { value: 'van', label: 'Van', icon: '🚐' },
    { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
    { value: 'bike', label: 'Bike', icon: '🚲' }
  ];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/20">
            <FiCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-emerald-100">
            Application Submitted!
          </h2>
          <p className="mb-4 text-emerald-100/85">
            Your driver application has been received. We'll review it and get back to you within 1-2 business days.
          </p>
          <p className="text-sm text-emerald-200/80">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-indigo-600/80 to-cyan-500/80 shadow-[0_16px_32px_-20px_rgba(34,211,238,0.8)]">
            <FiTruck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Become a Delivery Driver</h1>
            <p className="text-slate-300">Join our delivery team and start earning</p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-4">
          <div className="mb-1 text-2xl font-bold text-emerald-300">80-85%</div>
          <div className="text-sm text-emerald-100/85">Of delivery fee to you</div>
        </div>
        <div className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 p-4">
          <div className="mb-1 text-2xl font-bold text-cyan-300">100%</div>
          <div className="text-sm text-cyan-100/85">Of tips go to you</div>
        </div>
        <div className="rounded-3xl border border-violet-400/25 bg-violet-500/10 p-4">
          <div className="mb-1 text-2xl font-bold text-violet-300">Flexible</div>
          <div className="text-sm text-violet-100/85">Set your own schedule</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
          <FiAlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="market-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FiTruck className="h-5 w-5 text-cyan-300" />
            Vehicle Information
          </h2>

          <div className="space-y-4">
            {/* Vehicle Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {vehicleTypes.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: value })}
                    className={`rounded-2xl border p-3 text-center transition-all ${
                      formData.vehicle_type === value
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white'
                        : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-400/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Make *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  placeholder="Toyota"
                  className="market-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Model *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  placeholder="Camry"
                  className="market-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Year *
                </label>
                <input
                  type="number"
                  required
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className="market-input w-full"
                />
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                License Plate *
              </label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1234"
                className="market-input w-full uppercase"
              />
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="market-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FiUser className="h-5 w-5 text-cyan-300" />
            Driver Information
          </h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Driver's License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="DL123456789"
                  className="market-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-200">
                  <FiPhone className="w-4 h-4" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="market-input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div className="market-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FiShield className="h-5 w-5 text-cyan-300" />
            Insurance Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-200">
                <FiCalendar className="w-4 h-4" />
                Insurance Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.insurance_expiry}
                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="market-input w-full"
              />
            </div>
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-sm text-cyan-100/90">
              <p className="mb-1 font-medium">Insurance Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Valid auto insurance policy</li>
                <li>Minimum liability coverage required</li>
                <li>Proof of insurance will be verified during approval</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="market-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <FiPhone className="h-5 w-5 text-cyan-300" />
            Emergency Contact
          </h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergency_contact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, name: e.target.value }
                  })}
                  placeholder="John Doe"
                  className="market-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.emergency_contact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, phone: e.target.value }
                  })}
                  placeholder="(555) 987-6543"
                  className="market-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergency_contact.relationship}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, relationship: e.target.value }
                  })}
                  placeholder="Spouse, Parent, etc."
                  className="market-input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950 p-6 text-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.45)]">
          <h3 className="mb-2 font-semibold text-white">Next Steps</h3>
          <ul className="mb-4 space-y-1 text-sm text-slate-200">
            <li>✓ Submit your application</li>
            <li>✓ Background check will be initiated (if required)</li>
            <li>✓ Insurance verification</li>
            <li>✓ Approval notification (1-2 business days)</li>
            <li>✓ Start accepting deliveries!</li>
          </ul>
          
          <button
            type="submit"
            disabled={loading}
            className="market-button-primary flex w-full items-center justify-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <FiCheck className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

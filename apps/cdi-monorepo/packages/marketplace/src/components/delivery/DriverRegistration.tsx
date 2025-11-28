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
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-green-700 mb-4">
            Your driver application has been received. We'll review it and get back to you within 1-2 business days.
          </p>
          <p className="text-sm text-green-600">
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
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
            <FiTruck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Become a Delivery Driver</h1>
            <p className="text-gray-600">Join our delivery team and start earning</p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">80-85%</div>
          <div className="text-sm text-green-800">Of delivery fee to you</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
          <div className="text-sm text-blue-800">Of tips go to you</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600 mb-1">Flexible</div>
          <div className="text-sm text-purple-800">Set your own schedule</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <FiAlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTruck className="w-5 h-5 text-purple-600" />
            Vehicle Information
          </h2>

          <div className="space-y-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {vehicleTypes.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: value })}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      formData.vehicle_type === value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  placeholder="Toyota"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  placeholder="Camry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  required
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
              />
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-purple-600" />
            Driver Information
          </h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver's License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="DL123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FiPhone className="w-4 h-4" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-purple-600" />
            Insurance Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                Insurance Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.insurance_expiry}
                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Insurance Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Valid auto insurance policy</li>
                <li>Minimum liability coverage required</li>
                <li>Proof of insurance will be verified during approval</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiPhone className="w-5 h-5 text-purple-600" />
            Emergency Contact
          </h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            <li>✓ Submit your application</li>
            <li>✓ Background check will be initiated (if required)</li>
            <li>✓ Insurance verification</li>
            <li>✓ Approval notification (1-2 business days)</li>
            <li>✓ Start accepting deliveries!</li>
          </ul>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
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

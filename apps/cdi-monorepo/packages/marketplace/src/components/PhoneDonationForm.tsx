import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Smartphone, Gift, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function PhoneDonationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Device Info
    imei: '',
    deviceMake: '',
    deviceModel: '',
    storageCapacity: '',
    deviceCondition: 'good',
    physicalDamage: false,
    screenIntact: true,
    
    // Donor Info
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorAddress: '',
    donorCity: '',
    donorState: '',
    donorZip: '',
    
    // Delivery Method
    deliveryMethod: 'drop-off', // 'drop-off' or 'mail-in'
    preferredLocation: '',
    
    // Consent
    consentedToNotifications: true,
    consentedToJobOpportunities: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [raffleEntry, setRaffleEntry] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [dropOffLocations] = useState([
    { id: 1, name: 'Downtown Office', address: '123 Main St, City, ST 12345', hours: 'Mon-Fri 9AM-5PM' },
    { id: 2, name: 'Warehouse', address: '456 Industrial Blvd, City, ST 12345', hours: 'Mon-Sat 8AM-6PM' },
    { id: 3, name: 'Partner Location', address: '789 Commerce Dr, City, ST 12345', hours: 'Mon-Fri 10AM-4PM' },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getIMEI = () => {
    return "Power on your phone and dial *#06# to display the IMEI number. Or find it in Settings → About Phone → IMEI.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: user } = await supabase.auth.getUser();

      // Submit donation
      const { data, error: submitError } = await supabase
        .from('donated_phones')
        .insert({
          imei: formData.imei,
          device_make: formData.deviceMake,
          device_model: formData.deviceModel,
          storage_capacity: formData.storageCapacity,
          device_condition: formData.deviceCondition,
          physical_damage: formData.physicalDamage,
          screen_intact: formData.screenIntact,
          donor_id: user?.user?.id || null,
          donor_name: formData.donorName,
          donor_email: formData.donorEmail,
          donor_phone: formData.donorPhone,
          consented_to_notifications: formData.consentedToNotifications,
          consented_to_job_opportunities: formData.consentedToJobOpportunities,
          phone_status: 'received',
          is_eligible_for_drawing: true,
        })
        .select()
        .single();

      if (submitError) throw submitError;

      setRaffleEntry(data.raffle_entry_number);
      setSuccess(true);
      
      // TODO: Trigger IMEI verification in background
      // This will check with carrier API if device is clean/stolen
      
    } catch (err: any) {
      console.error('Error submitting donation:', err);
      setError(err.message || 'Failed to submit donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">You're Entered! 🎉</h2>
          
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-6 mb-6">
            <p className="text-sm uppercase tracking-wide mb-2">Your Raffle Entry Number</p>
            <p className="text-4xl font-bold tracking-wider">{raffleEntry}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-left space-y-4">
            <h3 className="font-bold text-xl mb-3">What Happens Next?</h3>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold">Device Verification (1-3 days)</p>
                <p className="text-sm text-blue-100">We'll verify your device with the carrier and check its status.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold">Random Drawing</p>
                <p className="text-sm text-blue-100">When a contractor needs a helper, we randomly draw an entry number!</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">💼</span>
              <div>
                <p className="font-semibold">Job Opportunity Notification</p>
                <p className="text-sm text-blue-100">If selected, you'll receive details about the work opportunity.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-semibold">Win Your Prize!</p>
                <p className="text-sm text-blue-100">Accept the job → Your donated phone activated + career training!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-500/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-300/50">
            <p className="text-sm font-semibold">
              📧 Check your email ({formData.donorEmail}) for confirmation and updates!
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all"
          >
            Donate Another Phone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-8 text-white text-center">
        <Gift className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Trade Your Phone, Win a Prize!</h1>
        <p className="text-blue-100 text-lg">
          Donate your unlocked or locked phone for a chance to win mystery prizes
        </p>
        <p className="text-sm text-blue-200 mt-2">
          Prizes may include activated phones, service plans, accessories, cash, or job opportunities!
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-x border-gray-200 p-6">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
            <span className="ml-2 text-sm font-medium">Device Info</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%', transition: 'width 0.3s' }}></div>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
            <span className="ml-2 text-sm font-medium">Your Info</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl border border-gray-200 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Device Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tell Us About Your Device</h3>

            {/* IMEI */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                IMEI Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="imei"
                value={formData.imei}
                onChange={handleInputChange}
                placeholder="Enter 15-digit IMEI number"
                required
                maxLength={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-600">
                💡 Dial <strong>*#06#</strong> on your phone to display IMEI, or find it in Settings → About
              </p>
            </div>

            {/* Device Make */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Device Brand <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceMake"
                value={formData.deviceMake}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select brand...</option>
                <option value="Apple">Apple (iPhone)</option>
                <option value="Samsung">Samsung</option>
                <option value="Google">Google (Pixel)</option>
                <option value="Motorola">Motorola</option>
                <option value="LG">LG</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Device Model */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Device Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deviceModel"
                value={formData.deviceModel}
                onChange={handleInputChange}
                placeholder="e.g., iPhone 12, Galaxy S21, Pixel 6"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Storage Capacity */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Storage Capacity</label>
              <select
                name="storageCapacity"
                value={formData.storageCapacity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unknown</option>
                <option value="64GB">64GB</option>
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
              </select>
            </div>

            {/* Device Condition */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Device Condition</label>
              <select
                name="deviceCondition"
                value={formData.deviceCondition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="excellent">Excellent (Like new)</option>
                <option value="good">Good (Minor wear)</option>
                <option value="fair">Fair (Some scratches/dents)</option>
                <option value="poor">Poor (Heavy wear)</option>
              </select>
            </div>

            {/* Physical Damage */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="physicalDamage"
                checked={formData.physicalDamage}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600"
              />
              <label className="text-gray-700">Device has physical damage (cracks, dents, water damage)</label>
            </div>

            {/* Screen Intact */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="screenIntact"
                checked={formData.screenIntact}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600"
              />
              <label className="text-gray-700">Screen is intact and functional</label>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              Continue to Contact Info →
            </button>
          </div>
        )}

        {/* Step 2: Donor Information */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Contact Information</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Privacy Note:</strong> Your information is kept anonymous and only used to notify you 
                about raffle results and potential job opportunities. We never share your data.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="donorEmail"
                value={formData.donorEmail}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-600">We'll send your raffle entry confirmation here</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="donorPhone"
                value={formData.donorPhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-600">For urgent prize notifications</p>
            </div>

            {/* Consent Checkboxes */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-gray-800">Communication Preferences</h4>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentedToNotifications"
                  checked={formData.consentedToNotifications}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 text-blue-600 mt-1"
                />
                <label className="text-gray-700 text-sm">
                  <strong>Yes, notify me about raffle results and prizes</strong> (Required)
                  <p className="text-gray-600 mt-1">We'll email/text you if you're selected in a drawing</p>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentedToJobOpportunities"
                  checked={formData.consentedToJobOpportunities}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 mt-1"
                />
                <label className="text-gray-700 text-sm">
                  <strong>Yes, notify me about job opportunities</strong> (Optional but recommended)
                  <p className="text-gray-600 mt-1">
                    Prize winnings may include paid work opportunities with contractors. This is how you WIN!
                  </p>
                </label>
              </div>
            </div>

            {/* Legal Disclaimers */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-semibold mb-2">Important:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>No purchase necessary to enter or win</li>
                <li>You must be 18+ or have parental consent</li>
                <li>Prize winnings may include devices, plans, accessories, cash, or job opportunities</li>
                <li>If device is reported stolen, it will be returned to carrier (you still keep raffle entry)</li>
                <li>Factory reset your device before donating</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Enter Raffle!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

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
      <div className="market-hero mx-auto max-w-2xl rounded-3xl p-8 text-white shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 shadow-2xl shadow-emerald-950/30">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">You're Entered! 🎉</h2>
          
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-lg">
            <p className="mb-2 text-sm uppercase tracking-[0.18em] text-slate-300">Your Raffle Entry Number</p>
            <p className="text-4xl font-bold tracking-wider">{raffleEntry}</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-left backdrop-blur-lg">
            <h3 className="font-bold text-xl mb-3">What Happens Next?</h3>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold">Device Verification (1-3 days)</p>
                <p className="text-sm text-slate-300">We'll verify your device with the carrier and check its status.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold">Random Drawing</p>
                <p className="text-sm text-slate-300">When a contractor needs a helper, we randomly draw an entry number!</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">💼</span>
              <div>
                <p className="font-semibold">Job Opportunity Notification</p>
                <p className="text-sm text-slate-300">If selected, you'll receive details about the work opportunity.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-semibold">Win Your Prize!</p>
                <p className="text-sm text-slate-300">Accept the job → Your donated phone activated + career training!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 backdrop-blur-lg">
            <p className="text-sm font-semibold">
              📧 Check your email ({formData.donorEmail}) for confirmation and updates!
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="market-button-primary mt-6 px-8 py-3 font-bold"
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
      <div className="market-hero rounded-t-3xl p-8 text-center text-white">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-xl shadow-indigo-950/40">
          <Gift className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Trade Your Phone, Win a Prize!</h1>
        <p className="text-lg text-slate-200">
          Donate your unlocked or locked phone for a chance to win mystery prizes
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Prizes may include activated phones, service plans, accessories, cash, or job opportunities!
        </p>
      </div>

      {/* Progress Steps */}
      <div className="border-x border-slate-800/70 bg-slate-950/70 p-6 backdrop-blur-xl">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-200' : 'text-slate-500'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>1</div>
            <span className="ml-2 text-sm font-medium">Device Info</span>
          </div>
          <div className="mx-4 h-1 flex-1 bg-slate-800">
            <div className={`h-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} style={{ width: step >= 2 ? '100%' : '0%', transition: 'width 0.3s' }}></div>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-200' : 'text-slate-500'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>2</div>
            <span className="ml-2 text-sm font-medium">Your Info</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="market-panel rounded-b-3xl rounded-t-none border-t-0 p-8">
        {error && (
          <div className="mb-6 flex items-start space-x-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: Device Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="mb-4 text-xl font-bold text-white">Tell Us About Your Device</h3>

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
                className="market-input w-full px-4 py-3"
              />
              <p className="mt-2 text-sm text-slate-400">
                💡 Dial <strong>*#06#</strong> on your phone to display IMEI, or find it in Settings → About
              </p>
            </div>

            {/* Device Make */}
            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Device Brand <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceMake"
                value={formData.deviceMake}
                onChange={handleInputChange}
                required
                className="market-input w-full px-4 py-3"
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
              <label className="mb-2 block font-medium text-slate-300">
                Device Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deviceModel"
                value={formData.deviceModel}
                onChange={handleInputChange}
                placeholder="e.g., iPhone 12, Galaxy S21, Pixel 6"
                required
                className="market-input w-full px-4 py-3"
              />
            </div>

            {/* Storage Capacity */}
            <div>
              <label className="mb-2 block font-medium text-slate-300">Storage Capacity</label>
              <select
                name="storageCapacity"
                value={formData.storageCapacity}
                onChange={handleInputChange}
                className="market-input w-full px-4 py-3"
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
              <label className="mb-2 block font-medium text-slate-300">Device Condition</label>
              <select
                name="deviceCondition"
                value={formData.deviceCondition}
                onChange={handleInputChange}
                className="market-input w-full px-4 py-3"
              >
                <option value="excellent">Excellent (Like new)</option>
                <option value="good">Good (Minor wear)</option>
                <option value="fair">Fair (Some scratches/dents)</option>
                <option value="poor">Poor (Heavy wear)</option>
              </select>
            </div>

            {/* Physical Damage */}
            <div className="flex items-center space-x-3 rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <input
                type="checkbox"
                name="physicalDamage"
                checked={formData.physicalDamage}
                onChange={handleInputChange}
                className="h-5 w-5 accent-indigo-500"
              />
              <label className="text-slate-200">Device has physical damage (cracks, dents, water damage)</label>
            </div>

            {/* Screen Intact */}
            <div className="flex items-center space-x-3 rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <input
                type="checkbox"
                name="screenIntact"
                checked={formData.screenIntact}
                onChange={handleInputChange}
                className="h-5 w-5 accent-indigo-500"
              />
              <label className="text-slate-200">Screen is intact and functional</label>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="market-button-primary w-full py-3 font-semibold"
            >
              Continue to Contact Info →
            </button>
          </div>
        )}

        {/* Step 2: Donor Information */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="mb-4 text-xl font-bold text-white">Your Contact Information</h3>

            <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-100">
                <strong>Privacy Note:</strong> Your information is kept anonymous and only used to notify you 
                about raffle results and potential job opportunities. We never share your data.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="market-input w-full px-4 py-3"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="donorEmail"
                value={formData.donorEmail}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
                className="market-input w-full px-4 py-3"
              />
              <p className="mt-1 text-sm text-slate-400">We'll send your raffle entry confirmation here</p>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block font-medium text-slate-300">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="donorPhone"
                value={formData.donorPhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                required
                className="market-input w-full px-4 py-3"
              />
              <p className="mt-1 text-sm text-slate-400">For urgent prize notifications</p>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-6">
              <h4 className="font-semibold text-white">Communication Preferences</h4>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentedToNotifications"
                  checked={formData.consentedToNotifications}
                  onChange={handleInputChange}
                  required
                  className="mt-1 h-5 w-5 accent-indigo-500"
                />
                <label className="text-sm text-slate-200">
                  <strong>Yes, notify me about raffle results and prizes</strong> (Required)
                  <p className="mt-1 text-slate-400">We'll email/text you if you're selected in a drawing</p>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="consentedToJobOpportunities"
                  checked={formData.consentedToJobOpportunities}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 accent-indigo-500"
                />
                <label className="text-sm text-slate-200">
                  <strong>Yes, notify me about job opportunities</strong> (Optional but recommended)
                  <p className="mt-1 text-slate-400">
                    Prize winnings may include paid work opportunities with contractors. This is how you WIN!
                  </p>
                </label>
              </div>
            </div>

            {/* Legal Disclaimers */}
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-slate-200">
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
                className="market-button-secondary flex-1 py-3 font-semibold"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="market-button-primary flex flex-1 items-center justify-center space-x-2 py-3 font-semibold disabled:opacity-50"
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

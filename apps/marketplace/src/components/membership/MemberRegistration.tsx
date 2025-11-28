import React, { useState } from 'react';
import { User, Store, Mail, Phone, MapPin, Building2, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MemberRegistrationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Store Information
  storeName: string;
  storeDescription: string;
  businessType: string;
  
  // Membership
  tierRequested: 'free' | 'partner' | 'professional' | 'enterprise';
  referralCode?: string;
  mentorUsername?: string;
  
  // Agreements
  agreeToTerms: boolean;
  agreeToNonprofitMission: boolean;
  agreeToMentorship: boolean;
}

const membershipTiers = [
  {
    id: 'free',
    name: 'Community Member',
    price: 'Free',
    icon: '🌱',
    description: 'Perfect for getting started in our community',
    features: [
      'Basic store listing',
      'Up to 10 active listings',
      'Community support forum',
      'Monthly marketplace fee: 5%'
    ],
    requirements: [
      'Complete application',
      'Agree to community guidelines',
      'Mentor assignment required'
    ]
  },
  {
    id: 'partner',
    name: 'Partner Level',
    price: '$29/month',
    icon: '🤝',
    description: 'Enhanced features for growing businesses',
    features: [
      'Enhanced store customization',
      'Up to 50 active listings',
      'Priority customer support',
      'Marketing toolkit access',
      'Monthly marketplace fee: 3%'
    ],
    requirements: [
      '3 months as Community Member',
      'Mentor recommendation',
      'Business plan submission'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79/month',
    icon: '⭐',
    description: 'Professional tools for established businesses',
    features: [
      'Custom store branding',
      'Unlimited listings',
      'Advanced analytics',
      'Priority listing placement',
      'Monthly marketplace fee: 2%'
    ],
    requirements: [
      '6 months as Partner',
      'Proven sales record',
      'Community contribution'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199/month',
    icon: '👑',
    description: 'Full-featured solution for serious businesses',
    features: [
      'White-label store options',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Monthly marketplace fee: 1%'
    ],
    requirements: [
      '12 months as Professional',
      'Significant community impact',
      'Board approval required'
    ]
  }
];

export default function MemberRegistration() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<MemberRegistrationData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    storeName: '',
    storeDescription: '',
    businessType: '',
    tierRequested: 'free',
    referralCode: '',
    mentorUsername: '',
    agreeToTerms: false,
    agreeToNonprofitMission: false,
    agreeToMentorship: false
  });

  const handleInputChange = (field: keyof MemberRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create member application record
      const { data: application, error: appError } = await supabase
        .from('member_applications')
        .insert({
          user_id: user.id,
          applicant_email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          store_name: formData.storeName,
          store_description: formData.storeDescription,
          business_type: formData.businessType,
          tier_requested: formData.tierRequested,
          referral_code: formData.referralCode,
          mentor_username: formData.mentorUsername,
          status: 'pending',
          application_data: formData
        })
        .select()
        .single();

      if (appError) throw appError;

      // Auto-approve free tier applications
      if (formData.tierRequested === 'free') {
        await processApplication(application.id);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processApplication = async (applicationId: string) => {
    try {
      // Create store slug
      const storeSlug = formData.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Create member store
      const { error: storeError } = await supabase
        .from('member_stores')
        .insert({
          user_id: user!.id,
          store_name: formData.storeName,
          store_slug: storeSlug,
          tier: formData.tierRequested,
          status: 'active',
          description: formData.storeDescription,
          business_type: formData.businessType
        });

      if (storeError) throw storeError;

      // Update user profile with member status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_nonprofit_member: true,
          member_tier: formData.tierRequested,
          city: formData.city,
          state: formData.state
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Update application status
      await supabase
        .from('member_applications')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

    } catch (error) {
      console.error('Error processing application:', error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            {formData.tierRequested === 'free' 
              ? "Congratulations! Your store has been automatically created. You can start listing items right away!"
              : "Thank you for your application. We'll review it and get back to you within 2-3 business days."
            }
          </p>
          {formData.tierRequested === 'free' && (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Go to My Store
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative min-h-[300px] bg-gradient-to-r from-green-600/90 to-blue-600/90 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80")'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/85 to-blue-600/85" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center min-h-[300px]">
          <div className="text-center w-full">
            <Store className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">Join Our Community</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto drop-shadow-md">
              Become a nonprofit member and get your own store in our marketplace
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= stepNum 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <ChevronRight className={`mx-2 ${
                    step > stepNum ? 'text-green-600' : 'text-gray-300'
                  }`} size={20} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-gray-600">
            Step {step} of 4: {
              step === 1 ? 'Personal Information' :
              step === 2 ? 'Store Setup' :
              step === 3 ? 'Membership Tier' :
              'Review & Submit'
            }
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 1 && (
            <PersonalInfoStep formData={formData} onChange={handleInputChange} />
          )}
          {step === 2 && (
            <StoreSetupStep formData={formData} onChange={handleInputChange} />
          )}
          {step === 3 && (
            <MembershipTierStep formData={formData} onChange={handleInputChange} />
          )}
          {step === 4 && (
            <ReviewStep formData={formData} onChange={handleInputChange} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.agreeToTerms || !formData.agreeToNonprofitMission}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function PersonalInfoStep({ formData, onChange }: { formData: MemberRegistrationData; onChange: (field: keyof MemberRegistrationData, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
            disabled
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => onChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => onChange('zipCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>
    </div>
  );
}

function StoreSetupStep({ formData, onChange }: { formData: MemberRegistrationData; onChange: (field: keyof MemberRegistrationData, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Store Setup</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
        <input
          type="text"
          value={formData.storeName}
          onChange={(e) => onChange('storeName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Your Amazing Store"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Store Description</label>
        <textarea
          value={formData.storeDescription}
          onChange={(e) => onChange('storeDescription', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Tell customers about your store and what you sell..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
        <select
          value={formData.businessType}
          onChange={(e) => onChange('businessType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        >
          <option value="">Select business type</option>
          <option value="handmade">Handmade/Crafts</option>
          <option value="retail">Retail/Resale</option>
          <option value="services">Services</option>
          <option value="art">Art/Creative</option>
          <option value="vintage">Vintage/Antiques</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code (Optional)</label>
          <input
            type="text"
            value={formData.referralCode}
            onChange={(e) => onChange('referralCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter referral code if you have one"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Mentor (Optional)</label>
          <input
            type="text"
            value={formData.mentorUsername}
            onChange={(e) => onChange('mentorUsername', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Mentor's username"
          />
        </div>
      </div>
    </div>
  );
}

function MembershipTierStep({ formData, onChange }: { formData: MemberRegistrationData; onChange: (field: keyof MemberRegistrationData, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Membership Tier</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {membershipTiers.map((tier) => (
          <div
            key={tier.id}
            onClick={() => onChange('tierRequested', tier.id)}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              formData.tierRequested === tier.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <p className="text-green-600 font-bold">{tier.price}</p>
                </div>
              </div>
              <input
                type="radio"
                checked={formData.tierRequested === tier.id}
                onChange={() => onChange('tierRequested', tier.id)}
                className="w-5 h-5 text-green-600"
              />
            </div>
            
            <p className="text-gray-600 mb-4">{tier.description}</p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {tier.requirements.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-gray-900">Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tier.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewStep({ formData, onChange }: { formData: MemberRegistrationData; onChange: (field: keyof MemberRegistrationData, value: any) => void }) {
  const selectedTier = membershipTiers.find(t => t.id === formData.tierRequested);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Application</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{formData.firstName} {formData.lastName}</p>
              <p>{formData.email}</p>
              <p>{formData.phone}</p>
              <p>{formData.address}</p>
              <p>{formData.city}, {formData.state} {formData.zipCode}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Store Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {formData.storeName}</p>
              <p><strong>Type:</strong> {formData.businessType}</p>
              <p><strong>Description:</strong> {formData.storeDescription}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Membership Tier</h3>
          {selectedTier && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">{selectedTier.icon}</span>
                <div>
                  <h4 className="font-semibold">{selectedTier.name}</h4>
                  <p className="text-green-600 font-bold">{selectedTier.price}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{selectedTier.description}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => onChange('agreeToTerms', e.target.checked)}
            className="mt-1"
            required
          />
          <div className="text-sm">
            <p className="text-gray-700">
              I agree to the <button className="text-green-600 hover:underline">Terms of Service</button> and{' '}
              <button className="text-green-600 hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={formData.agreeToNonprofitMission}
            onChange={(e) => onChange('agreeToNonprofitMission', e.target.checked)}
            className="mt-1"
            required
          />
          <div className="text-sm">
            <p className="text-gray-700">
              I understand and support Constructive Designs Inc.'s nonprofit mission of economic empowerment
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={formData.agreeToMentorship}
            onChange={(e) => onChange('agreeToMentorship', e.target.checked)}
            className="mt-1"
          />
          <div className="text-sm">
            <p className="text-gray-700">
              I am willing to participate in our mentorship program and help other community members when I'm able
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
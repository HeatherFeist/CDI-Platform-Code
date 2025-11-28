import { useState } from 'react';
import { FiCheck, FiUsers, FiHeart, FiTrendingUp, FiHome, FiStar } from 'react-icons/fi';

export function NonprofitApplication() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    
    // Eligibility
    eligibility_reason: '',
    household_income: '',
    household_size: '',
    employment_status: '',
    
    // Business Goals
    business_idea: '',
    products_to_sell: '',
    why_join: '',
    has_experience: false,
    
    // Commitments
    commit_meetings: false,
    commit_training: false,
    commit_community: false,
    
    // Referral (optional)
    referred_by: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Submit to Supabase
    console.log('Submitting application:', formData);
    
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-12 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Received! 🎉
          </h1>
          
          <p className="text-lg text-gray-700 mb-6">
            Thank you for applying to our nonprofit program, <strong>{formData.full_name}</strong>!
          </p>
          
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">What Happens Next:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Review (2-3 business days)</div>
                  <div className="text-sm text-gray-600">We'll review your application and verify eligibility</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Welcome Email</div>
                  <div className="text-sm text-gray-600">You'll receive login credentials and meeting schedule</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">First Meeting (Within 2 weeks)</div>
                  <div className="text-sm text-gray-600">Attend your first organization meeting to get started</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Free Google Site Setup</div>
                  <div className="text-sm text-gray-600">We'll help you create your free business site</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">5</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Start Selling!</div>
                  <div className="text-sm text-gray-600">List your first items with reduced 5% marketplace fee</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <a
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Return to Homepage
            </a>
            
            <p className="text-sm text-gray-600">
              Questions? Email us at <a href="mailto:nonprofit@platform.com" className="text-green-600 font-semibold">nonprofit@platform.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiHeart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Nonprofit Membership Application
        </h1>
        <p className="text-xl text-gray-600">
          Join our community and start your journey to economic independence
        </p>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          What You'll Receive (100% FREE):
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Free Google Site</div>
              <div className="text-sm text-gray-600">Your own business website (yourname.business.site)</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Complete Training</div>
              <div className="text-sm text-gray-600">Learn e-commerce, photography, pricing, marketing</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Reduced Fees</div>
              <div className="text-sm text-gray-600">5% marketplace fee (vs 10%) on first $1,000</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Mentorship</div>
              <div className="text-sm text-gray-600">Paired with successful seller to guide you</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Community Network</div>
              <div className="text-sm text-gray-600">Monthly meetings, networking, bulk buying co-ops</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Path to Ownership</div>
              <div className="text-sm text-gray-600">Eventual support for physical shop on your property</div>
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility Criteria */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Criteria</h2>
        <p className="text-gray-600 mb-4">You qualify if you meet ANY of these criteria:</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Household income below 200% of federal poverty line</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Currently receiving SNAP/EBT, WIC, or housing assistance</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Unemployed or underemployed (working less than desired hours)</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Single parent household</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Veteran or active military</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Previously incarcerated (re-entry support)</span>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Personal Information */}
        {step >= 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Personal Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Continue →
              </button>
            )}
          </div>
        )}

        {/* Step 2: Eligibility */}
        {step >= 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Eligibility Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which eligibility criterion applies to you? <span className="text-red-500">*</span>
                </label>
                <select
                  name="eligibility_reason"
                  value={formData.eligibility_reason}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select one...</option>
                  <option value="low_income">Low income (below 200% poverty line)</option>
                  <option value="snap">Receiving SNAP/EBT or housing assistance</option>
                  <option value="unemployed">Unemployed or underemployed</option>
                  <option value="single_parent">Single parent household</option>
                  <option value="veteran">Veteran or active military</option>
                  <option value="reentry">Previously incarcerated (re-entry)</option>
                </select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Household Income (approximate)
                  </label>
                  <select
                    name="household_income"
                    value={formData.household_income}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select range...</option>
                    <option value="under_15k">Under $15,000</option>
                    <option value="15k_25k">$15,000 - $25,000</option>
                    <option value="25k_35k">$25,000 - $35,000</option>
                    <option value="35k_50k">$35,000 - $50,000</option>
                    <option value="over_50k">Over $50,000</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Household Size
                  </label>
                  <input
                    type="number"
                    name="household_size"
                    value={formData.household_size}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Status
                </label>
                <select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="part_time">Part-time employed</option>
                  <option value="full_time">Full-time employed</option>
                  <option value="self_employed">Self-employed</option>
                  <option value="student">Student</option>
                  <option value="disabled">Disabled</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            
            {step === 2 && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Business Goals */}
        {step >= 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Your Business Goals</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What type of products do you plan to sell? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="products_to_sell"
                  value={formData.products_to_sell}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="e.g., Handmade jewelry, vintage clothing, home décor..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join our program? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="why_join"
                  value={formData.why_join}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Tell us your story and goals..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_experience"
                    checked={formData.has_experience}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    I have previous business or selling experience
                  </span>
                </label>
              </div>
            </div>
            
            {step === 3 && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Commitments */}
        {step >= 4 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Program Commitments</h2>
            
            <p className="text-gray-600 mb-4">
              Our program works best when members actively participate. Please confirm your commitment:
            </p>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                <input
                  type="checkbox"
                  name="commit_meetings"
                  checked={formData.commit_meetings}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                  <div className="font-semibold text-gray-900">Monthly Meetings</div>
                  <div className="text-sm text-gray-700">
                    I commit to attending at least 1 organization meeting per month (in-person or virtual)
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                <input
                  type="checkbox"
                  name="commit_training"
                  checked={formData.commit_training}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                  <div className="font-semibold text-gray-900">Complete Training</div>
                  <div className="text-sm text-gray-700">
                    I commit to completing the required training modules within 60 days
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                <input
                  type="checkbox"
                  name="commit_community"
                  checked={formData.commit_community}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-5 h-5 text-green-600 rounded-lg focus:ring-green-500"
                />
                <div>
                  <div className="font-semibold text-gray-900">Support Others</div>
                  <div className="text-sm text-gray-700">
                    Once I succeed, I commit to helping and mentoring other members
                  </div>
                </div>
              </label>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referred by (optional)
              </label>
              <input
                type="text"
                name="referred_by"
                value={formData.referred_by}
                onChange={handleInputChange}
                placeholder="If someone referred you, enter their name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {step === 4 && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Submit Application
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Questions? Email <a href="mailto:nonprofit@platform.com" className="text-green-600 font-semibold">nonprofit@platform.com</a>
        </p>
        <p className="mt-2">
          All information is kept confidential and used solely for program eligibility verification.
        </p>
      </div>
    </div>
  );
}

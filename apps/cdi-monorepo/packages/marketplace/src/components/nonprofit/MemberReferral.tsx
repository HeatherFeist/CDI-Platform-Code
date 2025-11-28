import { useState } from 'react';
import { FiUsers, FiHeart, FiTrendingUp, FiAward, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export function MemberReferral() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    referral_name: '',
    referral_email: '',
    referral_phone: '',
    relationship: '',
    why_good_fit: '',
    commitment_level: '',
    products_interest: '',
    
    sponsor_commitment: false,
    sponsor_availability: false,
    sponsor_experience: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [canSponsor, setCanSponsor] = useState(true); // TODO: Check from database
  const [currentMentees, setCurrentMentees] = useState(2); // TODO: Fetch from database
  const maxMentees = 5;

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
    console.log('Sending referral invitation:', formData);
    
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (!canSponsor) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
          <FiAlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Not Eligible to Sponsor Yet
          </h2>
          <p className="text-gray-700 mb-6">
            To become a sponsor/mentor, you need to:
          </p>
          
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Be a graduated member (completed training)</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Attended 4+ organization meetings</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Made 10+ successful sales</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Maintained 4.5+ star rating</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Earned $1,000+ in revenue</span>
              </div>
            </div>
          </div>
          
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
          >
            View My Progress
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-12 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Invitation Sent! 🎉
          </h1>
          
          <p className="text-lg text-gray-700 mb-6">
            <strong>{formData.referral_name}</strong> has received your invitation to join our community!
          </p>
          
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">What Happens Next:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{formData.referral_name} receives email</div>
                  <div className="text-sm text-gray-600">With your personal invitation and platform benefits</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">They create their account</div>
                  <div className="text-sm text-gray-600">Linked to you as their sponsor/mentor</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">You receive notification</div>
                  <div className="text-sm text-gray-600">Begin your mentorship journey together</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Training period begins (3-6 months)</div>
                  <div className="text-sm text-gray-600">Their donations support the nonprofit</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">5</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">They graduate & choose donation</div>
                  <div className="text-sm text-gray-600">You earn 10-15% of their sales as passive income!</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-purple-900 mb-2">💰 Potential Earnings</div>
            <div className="text-gray-700 text-sm">
              If <strong>{formData.referral_name}</strong> successfully builds a business doing <strong>$2,000/month</strong> in sales:
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-2">
              You earn $200-300/month
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Passive income for helping them succeed! Plus they can mentor others too.
            </div>
          </div>
          
          <div className="space-y-3">
            <a
              href="/dashboard/mentees"
              className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              View My Mentees
            </a>
            
            <button
              onClick={() => setSubmitted(false)}
              className="block mx-auto px-6 py-2 text-green-600 font-medium hover:text-green-700"
            >
              Refer Another Member
            </button>
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
          <FiUsers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Refer a New Member
        </h1>
        <p className="text-xl text-gray-600">
          Help someone start their entrepreneurial journey and earn passive income
        </p>
      </div>

      {/* Your Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{currentMentees}/{maxMentees}</div>
              <div className="text-sm text-gray-600">Active Mentees</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            You can mentor up to {maxMentees} members at once
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">$450</div>
              <div className="text-sm text-gray-600">Monthly from Mentees</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Passive income from your graduates
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiAward className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">8</div>
              <div className="text-sm text-gray-600">Successful Graduates</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Members you've helped succeed
          </div>
        </div>
      </div>

      {/* Benefits Callout */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Why Become a Mentor/Sponsor?
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Passive Income Stream</div>
              <div className="text-sm text-gray-700">Earn 10-15% of your mentees' sales after they graduate</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Community Impact</div>
              <div className="text-sm text-gray-700">Help lift someone out of poverty into prosperity</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Leadership Recognition</div>
              <div className="text-sm text-gray-700">Build your reputation as a community leader</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FiCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Network Growth</div>
              <div className="text-sm text-gray-700">Your mentees become partners, collaborators, friends</div>
            </div>
          </div>
        </div>
      </div>

      {/* The Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Person You're Referring */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Who Are You Referring?</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Their Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="referral_name"
                value={formData.referral_name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Jessica Martinez"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Their Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="referral_email"
                value={formData.referral_email}
                onChange={handleInputChange}
                required
                placeholder="jessica@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Their Phone (optional)
              </label>
              <input
                type="tel"
                name="referral_phone"
                value={formData.referral_phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Relationship <span className="text-red-500">*</span>
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="friend">Friend</option>
                <option value="family">Family Member</option>
                <option value="coworker">Coworker</option>
                <option value="neighbor">Neighbor</option>
                <option value="community">Community Member</option>
                <option value="acquaintance">Acquaintance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Why They're a Good Fit */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Why Are They a Good Fit?</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why would they succeed in our program? <span className="text-red-500">*</span>
              </label>
              <textarea
                name="why_good_fit"
                value={formData.why_good_fit}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe their work ethic, skills, motivation, situation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">
                This helps us understand if they're ready for the commitment
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What products might they sell? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="products_interest"
                value={formData.products_interest}
                onChange={handleInputChange}
                required
                placeholder="e.g., handmade crafts, vintage items, home goods..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Their commitment level <span className="text-red-500">*</span>
              </label>
              <select
                name="commitment_level"
                value={formData.commitment_level}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="full_time">Full-time focus (40+ hrs/week)</option>
                <option value="part_time">Part-time serious (20-40 hrs/week)</option>
                <option value="side_hustle">Side hustle (10-20 hrs/week)</option>
                <option value="casual">Casual/testing (5-10 hrs/week)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Your Commitment as Sponsor */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Your Commitment as Sponsor</h2>
          
          <p className="text-gray-600 mb-4">
            As their sponsor/mentor, you agree to:
          </p>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <input
                type="checkbox"
                name="sponsor_commitment"
                checked={formData.sponsor_commitment}
                onChange={handleInputChange}
                required
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <div className="font-semibold text-gray-900">Training & Support (3-6 months)</div>
                <div className="text-sm text-gray-700">
                  I commit to helping them set up their account, choose products, create listings, and answer questions during their training period
                </div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <input
                type="checkbox"
                name="sponsor_availability"
                checked={formData.sponsor_availability}
                onChange={handleInputChange}
                required
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <div className="font-semibold text-gray-900">Regular Check-ins</div>
                <div className="text-sm text-gray-700">
                  I will check in at least once per week and respond to their questions within 24-48 hours
                </div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <input
                type="checkbox"
                name="sponsor_experience"
                checked={formData.sponsor_experience}
                onChange={handleInputChange}
                required
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <div className="font-semibold text-gray-900">Share My Experience</div>
                <div className="text-sm text-gray-700">
                  I will share my successes, failures, and lessons learned to help them avoid mistakes I made
                </div>
              </div>
            </label>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>Important:</strong> If you fail to support your mentee, they can request reassignment to a different sponsor. 
                Multiple failures will result in loss of sponsorship privileges.
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Preview */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Your Potential Earnings</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-600 mb-1">If they do</div>
                <div className="text-2xl font-bold text-gray-900">$1,000/mo</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">You earn</div>
                <div className="text-xl font-bold text-purple-600">$100-150/mo</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-purple-400">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-600 mb-1">If they do</div>
                <div className="text-2xl font-bold text-purple-600">$2,000/mo</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">You earn</div>
                <div className="text-xl font-bold text-purple-600">$200-300/mo</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-600 mb-1">If they do</div>
                <div className="text-2xl font-bold text-gray-900">$5,000/mo</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">You earn</div>
                <div className="text-xl font-bold text-purple-600">$500-750/mo</div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            💡 <strong>The better they do, the better you do!</strong> Your success is aligned with theirs.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            Send Invitation
          </button>
        </div>
      </form>

      {/* FAQ */}
      <div className="mt-12 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">When do I start earning from my mentee?</h3>
            <p className="text-sm text-gray-600">
              After they graduate from training (3-6 months) AND choose to allocate their donation to you. 
              During training, their donations support the nonprofit.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">What if they don't choose to donate to me?</h3>
            <p className="text-sm text-gray-600">
              After graduation, it's their choice. Most choose their sponsor (80%+) out of gratitude, 
              but they can also choose the nonprofit or split. Your support during training influences their decision.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">How many mentees can I have?</h3>
            <p className="text-sm text-gray-600">
              Up to 5 active mentees in training at once. Once they graduate, you can mentor more. 
              This ensures quality mentorship for everyone.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Can I drop a mentee?</h3>
            <p className="text-sm text-gray-600">
              Yes, if they're unresponsive, violate guidelines, or aren't making effort. 
              They'll be reassigned or removed from the program. This protects your time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

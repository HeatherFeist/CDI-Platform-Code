import React, { useState } from 'react';
import { supabase } from '../../supabase';

/**
 * MembershipChoiceModal
 * 
 * Shown to new users during signup to explain the choice:
 * - FREE MEMBER: Join nonprofit, get @constructivedesignsinc.org email, full features
 * - PAID GUEST: Decline membership, pay $29.99/month, limited features
 * 
 * 99% of contractors will choose FREE MEMBER (obviously!)
 */

interface MembershipChoiceModalProps {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  onComplete: (membershipType: 'free_member' | 'paid_guest') => void;
}

export default function MembershipChoiceModal({
  profileId,
  firstName,
  lastName,
  email,
  onComplete,
}: MembershipChoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    license: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleJoinFree = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call accept_membership_terms function
      const { data, error: rpcError } = await supabase.rpc('accept_membership_terms', {
        p_profile_id: profileId,
        p_terms_version: '1.0',
        p_business_name: businessInfo.name || null,
        p_business_license: businessInfo.license || null,
        p_business_address: businessInfo.address || null,
        p_business_city: businessInfo.city || null,
        p_business_state: businessInfo.state || null,
        p_business_zip: businessInfo.zip || null,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      console.log('Membership accepted:', data);
      onComplete('free_member');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayToDecline = () => {
    // Redirect to Stripe checkout for $29.99/month subscription
    // (Very few will choose this!)
    alert('Paid guest subscription flow coming soon!');
    onComplete('paid_guest');
  };

  if (showTerms) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Membership Terms & Agreement</h2>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4">
            <section>
              <h3 className="font-bold text-lg mb-2">1. MEMBERSHIP BENEFITS (100% FREE FOREVER):</h3>
              <ul className="space-y-1 ml-4">
                <li>✅ Professional @constructivedesignsinc.org email address</li>
                <li>✅ Access to verified contractor directory</li>
                <li>✅ List and purchase materials on marketplace</li>
                <li>✅ Create and manage estimates in RenovVision</li>
                <li>✅ Time tracking in Quantum Wallet</li>
                <li>✅ Community support and networking</li>
                <li>✅ All features - Zero subscription fees</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">2. YOUR RESPONSIBILITIES:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Maintain valid contractor license (where required by law)</li>
                <li>• Conduct business professionally and ethically</li>
                <li>• Respect other members and the community</li>
                <li>• Provide accurate information in profiles and listings</li>
                <li>• Honor marketplace transactions and agreements</li>
                <li>• Use workspace email for professional purposes only</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">3. COMMUNITY STANDARDS:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Treat all members with respect</li>
                <li>• No spam or unsolicited marketing</li>
                <li>• No fraudulent listings or deceptive practices</li>
                <li>• No harassment or discriminatory behavior</li>
                <li>• Resolve disputes professionally</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">4. RATING & REVIEW SYSTEM:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Your performance will be rated by customers and peers</li>
                <li>• Low ratings may result in reduced visibility</li>
                <li>• Consistently poor ratings may lead to membership review</li>
                <li>• Ratings are public and permanent</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">5. ACCOUNT SUSPENSION:</h3>
              <p className="mb-2">Membership may be suspended or terminated for:</p>
              <ul className="space-y-1 ml-4">
                <li>• Fraudulent activity or misrepresentation</li>
                <li>• Repeated violations of community standards</li>
                <li>• Illegal activity</li>
                <li>• Abuse of platform or other members</li>
                <li>• Non-payment of marketplace transactions</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">6. DATA & PRIVACY:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Your profile information is visible to other members</li>
                <li>• Marketplace activity is public</li>
                <li>• Workspace email is managed by Google Workspace</li>
                <li>• We will never sell your data to third parties</li>
                <li>• You can export or delete your data anytime</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">7. OPTIONAL SUPPORT:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Membership is 100% free, always</li>
                <li>• Optional voluntary donations support our nonprofit mission</li>
                <li>• Donations are tax-deductible (501c3)</li>
                <li>• Never required, always appreciated</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">8. NO WARRANTY:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Platform provided "as-is"</li>
                <li>• We are not liable for disputes between members</li>
                <li>• Use marketplace at your own risk</li>
                <li>• Verify all transactions independently</li>
              </ul>
            </section>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={() => setShowTerms(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Welcome to Constructive Designs Inc!</h1>
          <p className="text-center text-gray-600 mb-8">Choose how you'd like to use our platform:</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* FREE MEMBER - The obvious choice! */}
            <div className="border-4 border-green-500 rounded-xl p-6 bg-green-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                ⭐ RECOMMENDED
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-green-600 mb-2">$0/mo</div>
                <div className="text-xl font-bold text-gray-900">FREE MEMBER</div>
                <div className="text-sm text-gray-600">Join our nonprofit organization</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Professional Email</div>
                    <div className="text-sm text-gray-600">@constructivedesignsinc.org address</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Member Directory</div>
                    <div className="text-sm text-gray-600">Connect with verified contractors</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Marketplace Full Access</div>
                    <div className="text-sm text-gray-600">Buy & sell materials, verified badge</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">All Features Unlocked</div>
                    <div className="text-sm text-gray-600">RenovVision, Quantum Wallet, everything!</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Community Support</div>
                    <div className="text-sm text-gray-600">Network with other pros</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Zero Commitment</div>
                    <div className="text-sm text-gray-600">Cancel anytime, no fees ever</div>
                  </div>
                </div>
              </div>

              {/* Optional business info */}
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Business Name (optional)"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="License Number (optional)"
                  value={businessInfo.license}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, license: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinFree}
                disabled={loading}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg mb-2"
              >
                {loading ? 'Joining...' : '🎉 Join FREE - Get Instant Access!'}
              </button>

              <button
                onClick={() => setShowTerms(true)}
                className="w-full text-sm text-green-700 hover:underline"
              >
                View Terms & Agreement
              </button>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>⚡ Instant Verification:</strong> Join now, get your @constructivedesignsinc.org email immediately!
              </div>
            </div>

            {/* PAID GUEST - Very few will choose this */}
            <div className="border-2 border-gray-300 rounded-xl p-6 bg-gray-50 relative opacity-75">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-600 mb-2">$29.99/mo</div>
                <div className="text-xl font-bold text-gray-900">PAID GUEST</div>
                <div className="text-sm text-gray-600">Use without joining</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">No Professional Email</div>
                    <div className="text-sm text-gray-500">Use your personal email only</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">No Member Directory</div>
                    <div className="text-sm text-gray-500">Can't see other contractors</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">Limited Marketplace</div>
                    <div className="text-sm text-gray-500">Can browse, but no verified badge</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">Basic Features Only</div>
                    <div className="text-sm text-gray-500">Limited estimate and wallet features</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">No Community Access</div>
                    <div className="text-sm text-gray-500">Isolated from network</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-700">Monthly Billing</div>
                    <div className="text-sm text-gray-500">$359.88/year recurring</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayToDecline}
                className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold text-lg mb-2"
              >
                Pay $29.99/Month
              </button>

              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <strong>⚠️ Why pay?</strong> Free membership gives you MORE features for $0!
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">🤔 Still not sure?</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Free membership has ZERO risk:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ No credit card required</li>
              <li>✅ No hidden fees</li>
              <li>✅ Cancel anytime (it's free anyway!)</li>
              <li>✅ Join 1,000+ contractors already saving money</li>
              <li>✅ 501(c)(3) nonprofit - we exist to help YOU</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

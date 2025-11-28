import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const MembershipComparisonModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'member' | 'non-member' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectMember = async () => {
    setIsProcessing(true);
    try {
      // User already gets member benefits by default
      // Just confirm they understand the voluntary donation model
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            is_organization_member: true,
            platform_donation_percentage: 15.00 
          })
          .eq('id', user.id);
      }
      
      alert('Welcome as an organization member! You now have access to all member benefits with $0 monthly fees.');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectNonMember = () => {
    alert('Non-member subscription coming soon! For now, enjoy free membership with all benefits.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Selling Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Organization Member - Recommended */}
            <div className="relative border-4 border-blue-500 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-white shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm">
                  ⭐ RECOMMENDED
                </span>
              </div>

              <div className="text-center mb-6 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Organization Member</h3>
                <div className="text-5xl font-bold text-blue-600 mb-2">$0</div>
                <div className="text-gray-600">per month</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Zero Monthly Fees</div>
                    <div className="text-sm text-gray-600">Completely free to use the platform</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Tax-Deductible Donations</div>
                    <div className="text-sm text-gray-600">Voluntary 15% donation per sale (customizable 0-30%)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Instant Tax Receipts</div>
                    <div className="text-sm text-gray-600">IRS-compliant receipts sent to your workspace email</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Professional Workspace Email</div>
                    <div className="text-sm text-gray-600">yourname@constructivedesignsinc.org</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Google Workspace Suite</div>
                    <div className="text-sm text-gray-600">Drive, Docs, Sheets, Calendar included</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">All Platform Features</div>
                    <div className="text-sm text-gray-600">Advanced analytics, bulk tools, integrations</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Priority Support</div>
                    <div className="text-sm text-gray-600">Faster response times and dedicated help</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Member Community</div>
                    <div className="text-sm text-gray-600">Forums, networking, training resources</div>
                  </div>
                </div>
              </div>

              {/* Tax Savings Example */}
              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded mb-6">
                <div className="text-sm font-semibold text-blue-900 mb-2">💰 Tax Savings Example:</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>$100 sale → $15 donation (tax-deductible)</div>
                  <div>Tax savings: ~$3-5 (depending on bracket)</div>
                  <div className="font-bold">Effective cost: ~$10-12 per $100 sale</div>
                </div>
              </div>

              <button
                onClick={handleSelectMember}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Become a Member (Free)'}
              </button>
            </div>

            {/* Non-Member Seller */}
            <div className="border-2 border-gray-300 rounded-2xl p-8 bg-white">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Non-Member Seller</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">$29.99</div>
                <div className="text-gray-600">per month</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Fixed Monthly Cost</div>
                    <div className="text-sm text-gray-600">Simple pricing, no surprises</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">No Per-Transaction Fees</div>
                    <div className="text-sm text-gray-600">Keep 100% of sale price</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Basic Features</div>
                    <div className="text-sm text-gray-600">Core selling functionality</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-xl mt-1">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500 line-through">Tax Deductions</div>
                    <div className="text-sm text-gray-400">Not available for non-members</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-xl mt-1">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500 line-through">Workspace Email</div>
                    <div className="text-sm text-gray-400">Not included</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-xl mt-1">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500 line-through">Google Workspace</div>
                    <div className="text-sm text-gray-400">Not included</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-xl mt-1">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500 line-through">Advanced Features</div>
                    <div className="text-sm text-gray-400">Limited functionality</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-xl mt-1">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500 line-through">Member Community</div>
                    <div className="text-sm text-gray-400">Not included</div>
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="bg-gray-100 border-l-4 border-gray-400 p-4 rounded mb-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">📊 Annual Cost (10 sales/mo):</div>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>$29.99 × 12 months = $360/year</div>
                  <div className="text-gray-500">(No tax benefits)</div>
                </div>
              </div>

              <button
                onClick={handleSelectNonMember}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition"
              >
                Select Non-Member Plan
              </button>
            </div>
          </div>

          {/* Comparison Note */}
          <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-6 rounded">
            <div className="text-sm font-semibold text-amber-900 mb-2">💡 Smart Money Choice:</div>
            <div className="text-sm text-amber-800">
              <strong>Organization membership is FREE and provides MORE value!</strong> With an average of 2-3 sales per month, 
              members pay less after tax deductions AND get professional email, Google Workspace, and advanced features. 
              The voluntary donation model means you control your costs while supporting the platform.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

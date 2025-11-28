import React, { useState } from 'react';
import { Heart, DollarSign, Check, Info, TrendingDown } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface MembershipConversionBannerProps {
  currentMonthlyFee?: number;
  showInline?: boolean; // Show as banner vs modal
}

export const MembershipConversionBanner: React.FC<MembershipConversionBannerProps> = ({
  currentMonthlyFee = 29.99,
  showInline = true
}) => {
  const { userProfile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const annualSavingsAsOutsideUser = currentMonthlyFee * 12; // What they currently pay
  const suggestedAnnualVoluntary = annualSavingsAsOutsideUser * 0.15; // 15% of what they'd pay

  const convertToMember = async () => {
    if (!userProfile?.id || !acknowledged) return;

    setConverting(true);
    try {
      // Get member tier ID
      const { data: memberTier } = await supabase
        .from('membership_tiers')
        .select('id')
        .eq('is_nonprofit_member', true)
        .single();

      if (!memberTier) throw new Error('Member tier not found');

      // Update user's membership
      const { error: updateError } = await supabase
        .from('user_memberships')
        .update({
          tier_id: memberTier.id,
          was_outside_user: true,
          converted_to_member_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.id);

      if (updateError) throw updateError;

      // Log acknowledgment
      await supabase.rpc('log_voluntary_acknowledgment', {
        p_user_id: userProfile.id,
        p_type: 'outside_to_member',
        p_text: 'I understand that by converting to a nonprofit member, all future fees become 100% voluntary donations. I can choose any amount including $0, and contributions are tax-deductible.',
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      // Success! Reload page to reflect new status
      alert('🎉 Welcome to the nonprofit family! All fees are now 100% voluntary donations.');
      window.location.reload();

    } catch (err) {
      console.error('Conversion error:', err);
      alert('Failed to convert membership. Please try again or contact support.');
    } finally {
      setConverting(false);
    }
  };

  if (showInline) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <Heart className="w-12 h-12 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              💰 Stop Paying Fees - Join as a Member!
            </h3>
            <p className="text-gray-700 mb-4">
              You're currently paying <span className="font-bold">${currentMonthlyFee}/month</span> as an outside user. 
              Join our nonprofit as a member and make <span className="font-bold text-blue-600">ALL fees 100% voluntary!</span>
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Current Status */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-gray-900">Your Current Plan</h4>
                </div>
                <p className="text-2xl font-bold text-red-600">${currentMonthlyFee}/mo</p>
                <p className="text-sm text-gray-600">= ${annualSavingsAsOutsideUser.toFixed(2)}/year</p>
                <p className="text-xs text-gray-500 mt-2">Mandatory subscription fee</p>
              </div>

              {/* Member Benefits */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">As a Member</h4>
                </div>
                <p className="text-2xl font-bold text-blue-600">$0 Required</p>
                <p className="text-sm text-blue-700">+ Voluntary donations (your choice!)</p>
                <p className="text-xs text-blue-600 mt-2">✨ Tax-deductible contributions</p>
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Example Savings:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• If you give 15% voluntarily: <span className="font-bold">${(annualSavingsAsOutsideUser * 0.15).toFixed(2)}/year</span> vs ${annualSavingsAsOutsideUser}/year now</p>
                <p>• <span className="font-bold text-green-600">Save ${(annualSavingsAsOutsideUser * 0.85).toFixed(2)}/year!</span> 🎉</p>
                <p>• If you give 0%: <span className="font-bold">$0/year</span> (still full access!)</p>
                <p>• Plus: ALL donations are <span className="font-bold">tax-deductible!</span></p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Join as Nonprofit Member - Make Fees Voluntary!
            </button>

            <p className="text-xs text-gray-600 text-center mt-2">
              No catch. No hidden fees. Just voluntary donations supporting our mission. ✨
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modal version
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Make my fees voluntary →
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Join as a Nonprofit Member
                  </h2>
                  <p className="text-blue-100">
                    Make ALL fees 100% voluntary - Choose what you give!
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Savings Calculator */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-bold text-green-900">
                    Your Potential Savings
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">You Pay Now</p>
                    <p className="text-3xl font-bold text-red-600">
                      ${annualSavingsAsOutsideUser}
                    </p>
                    <p className="text-xs text-gray-500">per year</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">At 15% Voluntary</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${suggestedAnnualVoluntary.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">per year (suggested)</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">You Save</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${(annualSavingsAsOutsideUser - suggestedAnnualVoluntary).toFixed(0)}
                    </p>
                    <p className="text-xs text-green-700">85% savings!</p>
                  </div>
                </div>

                <div className="mt-4 bg-white rounded p-3 text-sm text-gray-700">
                  <p className="font-semibold mb-2">Plus Tax Benefits:</p>
                  <p>If you donate ${suggestedAnnualVoluntary.toFixed(0)}/year at 24% tax bracket, you save an additional <span className="font-bold text-green-600">${(suggestedAnnualVoluntary * 0.24).toFixed(0)} in taxes!</span></p>
                </div>
              </div>

              {/* Member Benefits */}
              <div>
                <h3 className="text-lg font-bold mb-3">What You Get as a Member:</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { icon: '💙', text: '100% voluntary contributions - you choose!' },
                    { icon: '✨', text: 'Tax-deductible charitable donations' },
                    { icon: '🎯', text: 'Full platform access (same as now)' },
                    { icon: '🤝', text: 'Supporting our nonprofit mission' },
                    { icon: '📊', text: 'AI design tools & marketplace' },
                    { icon: '👥', text: 'Community directory & networking' },
                    { icon: '🎓', text: 'Priority support & training' },
                    { icon: '💰', text: 'Can give $0 - still full access!' }
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-xl">{benefit.icon}</span>
                      <span className="text-gray-700">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">How It Works:</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>You convert to nonprofit member (right now, free!)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Your $29.99/month subscription is cancelled</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Future payments show voluntary donation options (15% suggested)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>You choose any amount: 0%, 10%, 15%, 20%, custom, or $0</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>You get tax receipts for all voluntary donations!</span>
                  </li>
                </ol>
              </div>

              {/* Legal Acknowledgment */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  <Info className="w-5 h-5 inline mr-2 text-blue-600" />
                  Important Information:
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    By joining as a nonprofit member, you understand that:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All future contributions are <strong>100% voluntary donations</strong></li>
                    <li>You can choose to give any amount, including <strong>$0</strong></li>
                    <li>You will still have <strong>full platform access</strong> regardless of donation amount</li>
                    <li>Donations are <strong>tax-deductible</strong> charitable contributions</li>
                    <li>Your donations support our <strong>501(c)(3) nonprofit mission</strong></li>
                  </ul>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <span className="text-sm text-gray-800">
                  <strong>I understand and acknowledge</strong> that by converting to a nonprofit member, 
                  all my future fees become 100% voluntary donations. I can choose any amount including $0, 
                  and I will still have full access to the platform. My donations will be tax-deductible.
                </span>
              </label>

              {/* Convert Button */}
              <button
                onClick={convertToMember}
                disabled={!acknowledged || converting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {converting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <Heart className="w-6 h-6" />
                    Join as Nonprofit Member - Make Fees Voluntary!
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                This action is immediate and cannot be reversed. Your current subscription will be cancelled 
                and you'll switch to the voluntary donation model.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

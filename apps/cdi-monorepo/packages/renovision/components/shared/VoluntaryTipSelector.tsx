import React, { useState, useEffect } from 'react';
import { Heart, Info, DollarSign, Check } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface VoluntaryTipSelectorProps {
  baseAmount: number; // The cost of the service/product
  onTipChange: (tipPercentage: number, tipAmount: number, total: number) => void;
  transactionType?: string; // 'service_payment', 'marketplace_purchase', etc.
  showTaxInfo?: boolean;
}

export const VoluntaryTipSelector: React.FC<VoluntaryTipSelectorProps> = ({
  baseAmount,
  onTipChange,
  transactionType = 'service_payment',
  showTaxInfo = true
}) => {
  const { userProfile } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [selectedTipPercentage, setSelectedTipPercentage] = useState(15);
  const [customTipPercentage, setCustomTipPercentage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [showVoluntaryModal, setShowVoluntaryModal] = useState(false);

  const tipOptions = [0, 10, 15, 20, 25];

  useEffect(() => {
    checkMembershipStatus();
  }, [userProfile]);

  useEffect(() => {
    calculateAndNotify();
  }, [selectedTipPercentage, baseAmount]);

  const checkMembershipStatus = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          *,
          membership_tiers (
            is_nonprofit_member,
            default_tip_percentage
          )
        `)
        .eq('user_id', userProfile.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      if (data) {
        setIsMember(data.membership_tiers.is_nonprofit_member);
        setHasAcknowledged(data.has_acknowledged_voluntary);
        
        // Use custom tip if set, otherwise default
        const defaultTip = data.custom_tip_percentage || data.membership_tiers.default_tip_percentage || 15;
        setSelectedTipPercentage(defaultTip);

        // Show modal if member hasn't acknowledged voluntary nature
        if (data.membership_tiers.is_nonprofit_member && !data.has_acknowledged_voluntary) {
          setShowVoluntaryModal(true);
        }
      }
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const calculateAndNotify = () => {
    const tipAmount = (baseAmount * selectedTipPercentage) / 100;
    const total = baseAmount + tipAmount;
    onTipChange(selectedTipPercentage, tipAmount, total);
  };

  const handleTipSelection = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setShowCustomInput(false);
    setCustomTipPercentage('');
  };

  const handleCustomTipSubmit = () => {
    const customValue = parseFloat(customTipPercentage);
    if (!isNaN(customValue) && customValue >= 0 && customValue <= 100) {
      setSelectedTipPercentage(customValue);
      setShowCustomInput(false);
    }
  };

  const acknowledgeVoluntary = async () => {
    if (!userProfile?.id) return;

    try {
      // Log acknowledgment
      await supabase.rpc('log_voluntary_acknowledgment', {
        p_user_id: userProfile.id,
        p_type: 'payment_acknowledgment',
        p_text: `I understand that as a nonprofit member, all contributions including this ${transactionType.replace('_', ' ')} are 100% voluntary donations. I am choosing to support the mission with a ${selectedTipPercentage}% contribution.`,
        p_ip_address: null, // Would get from request in production
        p_user_agent: navigator.userAgent
      });

      setHasAcknowledged(true);
      setShowVoluntaryModal(false);
    } catch (err) {
      console.error('Error logging acknowledgment:', err);
    }
  };

  const tipAmount = (baseAmount * selectedTipPercentage) / 100;
  const total = baseAmount + tipAmount;

  return (
    <div className="bg-white rounded-lg border-2 border-blue-100 p-6">
      {/* Member Notice */}
      {isMember && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Thank You for Being a Member! 💙
              </h3>
              <p className="text-sm text-blue-800">
                As a <span className="font-bold">nonprofit member</span>, all contributions are <span className="font-bold">100% VOLUNTARY</span> donations to support our mission. 
                You choose how much to give!
              </p>
              {showTaxInfo && (
                <p className="text-xs text-blue-700 mt-2">
                  ✨ Your voluntary donation is <span className="font-semibold">tax-deductible</span> as a charitable contribution!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-Member Notice */}
      {!isMember && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Outside User Pricing
              </h3>
              <p className="text-sm text-amber-800">
                Join as a nonprofit member to make all fees <span className="font-bold">100% voluntary</span>!
              </p>
              <button className="text-xs text-amber-700 underline mt-1 hover:text-amber-900">
                Learn about membership →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-700">
          <span>Service/Product Cost:</span>
          <span className="font-semibold">${baseAmount.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700">
              {isMember ? 'Voluntary Contribution:' : 'Service Tip:'}
            </span>
            <span className="text-lg font-bold text-blue-600">
              ${tipAmount.toFixed(2)} ({selectedTipPercentage}%)
            </span>
          </div>

          {/* Tip Selection Buttons */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {tipOptions.map(percentage => (
              <button
                key={percentage}
                onClick={() => handleTipSelection(percentage)}
                className={`py-2 px-3 rounded-lg border-2 transition-all ${
                  selectedTipPercentage === percentage && !showCustomInput
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {percentage}%
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(true)}
              className={`py-2 px-3 rounded-lg border-2 transition-all ${
                showCustomInput
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Tip Input */}
          {showCustomInput && (
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customTipPercentage}
                  onChange={(e) => setCustomTipPercentage(e.target.value)}
                  placeholder="Enter %"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
              </div>
              <button
                onClick={handleCustomTipSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          )}

          {isMember && selectedTipPercentage === 0 && (
            <p className="text-xs text-gray-600 italic">
              No contribution this time. We appreciate your membership! 💙
            </p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total {isMember ? 'Donation' : 'Payment'}:</span>
          <span className="text-blue-600">${total.toFixed(2)}</span>
        </div>
        {isMember && (
          <p className="text-xs text-gray-600 text-right mt-1">
            (100% voluntary - you choose!)
          </p>
        )}
      </div>

      {/* Voluntary Acknowledgment Modal */}
      {showVoluntaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Welcome, Nonprofit Member!
              </h2>
              <p className="text-gray-600">
                Important information about your voluntary contributions
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                🎯 Tax-Exempt Status & Voluntary Donations
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  <strong>As a nonprofit member, you should know:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>All contributions are 100% VOLUNTARY</strong> - This includes service fees, platform usage, and any payments.
                  </li>
                  <li>
                    <strong>You choose the amount</strong> - We suggest 15% as a default, but you can give more, less, or $0.
                  </li>
                  <li>
                    <strong>Tax-deductible donations</strong> - Your voluntary contributions are charitable donations you can deduct on your taxes.
                  </li>
                  <li>
                    <strong>Supporting our mission</strong> - Your voluntary gifts help us serve the community and maintain our nonprofit status.
                  </li>
                  <li>
                    <strong>No mandatory fees</strong> - We will NEVER require payment from nonprofit members.
                  </li>
                </ul>
                <p className="mt-4 font-semibold">
                  We operate with strict adherence to our 501(c)(3) tax-exempt status and IRS regulations.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I understand that all my contributions are <strong>100% voluntary donations</strong> to support the nonprofit mission. 
                  I can choose any amount, including $0, and I am never required to pay mandatory fees as a member.
                </span>
              </label>
            </div>

            <button
              onClick={acknowledgeVoluntary}
              disabled={!hasAcknowledged}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              I Understand - Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

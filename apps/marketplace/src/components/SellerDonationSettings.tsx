import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SellerDonationSettingsProps {
  userId: string;
}

export const SellerDonationSettings: React.FC<SellerDonationSettingsProps> = ({ userId }) => {
  const [donationPct, setDonationPct] = useState<number>(0);
  const [isBoardVolunteer, setIsBoardVolunteer] = useState<boolean>(false);
  const [isTaxExempt, setIsTaxExempt] = useState<boolean>(false);
  const [boardRoleGroup, setBoardRoleGroup] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('seller_optional_donation_percentage, is_board_volunteer, tax_exempt_status, board_role_group')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setDonationPct(data?.seller_optional_donation_percentage || 0);
      setIsBoardVolunteer(data?.is_board_volunteer || false);
      setIsTaxExempt(data?.tax_exempt_status || false);
      setBoardRoleGroup(data?.board_role_group || '');
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ seller_optional_donation_percentage: donationPct })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: `Seller donation updated to ${donationPct}%` 
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExample = (saleAmount: number) => {
    const donation = (saleAmount * donationPct) / 100;
    const taxSavings = donation * 0.25; // 25% bracket estimate
    const netBenefit = taxSavings;
    return {
      donation: donation.toFixed(2),
      taxSavings: taxSavings.toFixed(2),
      netBenefit: netBenefit.toFixed(2),
    };
  };

  const example = calculateExample(100);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
        <h3 className="text-2xl font-bold mb-2">
          Seller Donation Settings
        </h3>
        <p className="text-amber-100 text-sm">
          Optional "sales tax replacement" charge - You get the tax receipt!
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Board Volunteer Status */}
        {isBoardVolunteer && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <div className="font-semibold text-green-900 mb-1">
                  You're a Board Volunteer - Tax-Exempt Seller!
                </div>
                <div className="text-sm text-green-800">
                  Role: <strong>{boardRoleGroup}</strong>
                </div>
                <div className="text-xs text-green-700 mt-2">
                  As a board volunteer, you're tax-exempt on resales. You already paid sales tax when 
                  purchasing these items. Now you can add an optional charge (0-7.5%) that buyers pay, 
                  and YOU get a tax-deductible receipt for it!
                </div>
              </div>
            </div>
          </div>
        )}

        {!isBoardVolunteer && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <div className="font-semibold text-blue-900 mb-1">
                  Join a Board Volunteer Group
                </div>
                <div className="text-xs text-blue-700">
                  Board volunteers qualify for tax-exempt seller status and can receive tax receipts 
                  for the optional donation charge. Choose from: Technology, Marketing, Operations, 
                  Finance, Community, or other volunteer roles.
                </div>
                <button className="mt-2 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Apply to Join Board Group →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Setting */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-amber-900">
              Current Optional Charge:
            </span>
            <span className="text-3xl font-bold text-amber-900">{donationPct}%</span>
          </div>
          <p className="text-xs text-amber-700">
            This percentage is added to buyer's checkout. They pay it, YOU get the tax receipt.
          </p>
        </div>

        {/* Slider Control */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Adjust Optional Seller Donation (0% - 7.5%)
          </label>
          
          <div className="flex items-center gap-4 mb-4">
            <input
              type="range"
              min="0"
              max="7.5"
              step="0.5"
              value={donationPct}
              onChange={(e) => setDonationPct(parseFloat(e.target.value))}
              className="flex-1 h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              style={{
                background: `linear-gradient(to right, #d97706 0%, #d97706 ${(donationPct / 7.5) * 100}%, #fef3c7 ${(donationPct / 7.5) * 100}%, #fef3c7 100%)`
              }}
            />
            <input
              type="number"
              min="0"
              max="7.5"
              step="0.5"
              value={donationPct}
              onChange={(e) => setDonationPct(Math.min(7.5, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-20 px-3 py-2 border-2 border-amber-300 rounded-lg text-center font-bold text-lg"
            />
            <span className="text-gray-700 font-semibold">%</span>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            <button
              onClick={() => setDonationPct(0)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              0% (None)
            </button>
            <button
              onClick={() => setDonationPct(3)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              3%
            </button>
            <button
              onClick={() => setDonationPct(5)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              5%
            </button>
            <button
              onClick={() => setDonationPct(7.5)}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
            >
              7.5% (Max)
            </button>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 border border-purple-200">
          <h4 className="text-sm font-bold text-gray-900 mb-3">💰 Example: $100 Sale</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Item sells for:</span>
              <span className="font-semibold text-gray-900">$100.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Optional charge ({donationPct}%):</span>
              <span className="font-semibold text-amber-600">+${example.donation}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Buyer pays:</span>
              <span>${(100 + parseFloat(example.donation)).toFixed(2)}</span>
            </div>
            <div className="border-t border-purple-300 pt-2 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-green-800">You receive (item price):</span>
                <span className="text-green-900">$100.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">Tax receipt you get:</span>
                <span className="text-purple-900 font-semibold">${example.donation}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Your tax savings (25% bracket):</span>
                <span className="text-blue-900 font-semibold">~${example.taxSavings}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-purple-300 pt-2 mt-2">
                <span className="font-bold text-purple-900">Your net benefit:</span>
                <span className="font-bold text-purple-900">${(100 + parseFloat(example.taxSavings)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="text-sm font-semibold text-amber-900 mb-2">💡 How This Works:</div>
          <ul className="text-xs text-amber-800 space-y-2 ml-4 list-disc">
            <li>This charge is <strong>completely optional</strong> - you choose the percentage (0-7.5%)</li>
            <li>Buyers see it clearly at checkout as "Support Seller" donation</li>
            <li>You receive 100% of your item price + shipping</li>
            <li>You get a <strong>tax-deductible receipt</strong> for the donation amount</li>
            <li>Similar to sales tax amount (7.5% typical) but YOU get the tax benefit</li>
            <li>As a board volunteer, you're tax-exempt so this is pure tax optimization</li>
            <li>Buyers often prefer this knowing it benefits you vs going to the government</li>
          </ul>
        </div>

        {/* Why 7.5% Maximum */}
        <details className="text-sm text-gray-700 cursor-pointer">
          <summary className="font-semibold hover:text-gray-900">Why is the maximum 7.5%?</summary>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            We cap this at 7.5% because that's the typical sales tax rate in most areas. This makes the 
            charge feel familiar to buyers (similar to sales tax) while being completely optional and 
            going to YOU as a tax deduction instead of the government. It's a win-win: buyers understand 
            the amount, you get tax benefits, and everyone supports the nonprofit mission.
          </p>
        </details>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={saveSettings}
            disabled={isSaving || !isBoardVolunteer}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {!isBoardVolunteer && (
          <p className="text-xs text-center text-gray-500">
            Join a board volunteer group to enable seller donation settings
          </p>
        )}

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
        )}

        {/* Transparency */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            This optional charge is completely transparent to buyers and helps you optimize your taxes 
            as a board volunteer. All tax receipts are IRS-compliant and sent instantly via email. 
            Thank you for supporting our nonprofit mission! 🏗️
          </p>
        </div>
      </div>
    </div>
  );
};

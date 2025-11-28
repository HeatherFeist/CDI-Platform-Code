import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Spinner from './Spinner';

interface ToolRental {
  id: string;
  tool_id: string;
  weekly_payment_amount: number;
  total_amount_to_own: number;
  amount_paid: number;
  remaining_balance: number;
  agreement_status: 'active' | 'completed' | 'defaulted' | 'pending';
  start_date: string;
  expected_ownership_date: string;
  auto_deduct_from_projects: boolean;
  trade_in_credit_applied: number;
  tool: {
    brand: string;
    model: string;
    serial_number: string;
    condition: string;
    photo_url: string;
    category: string;
    warranty_expiration: string;
  };
  payment_history: any[];
}

interface PaymentHistory {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  project_milestone_id?: string;
  notes: string;
}

interface UpgradeOption {
  current_tool_id: string;
  new_tool_id: string;
  new_tool: any;
  trade_in_value: number;
  trade_in_percentage: number;
  additional_cost: number;
  new_weekly_payment: number;
}

export default function MemberToolDashboard() {
  const [rentals, setRentals] = useState<ToolRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState<ToolRental | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showUpgradeCalculator, setShowUpgradeCalculator] = useState(false);
  const [showDonationPreview, setShowDonationPreview] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [donationValue, setDonationValue] = useState<any>(null);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tool_rental_agreements')
        .select(`
          *,
          tool:tool_inventory (
            brand,
            model,
            serial_number,
            condition,
            photo_url,
            category,
            warranty_expiration
          )
        `)
        .eq('member_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setRentals(data || []);

    } catch (error) {
      console.error('Error loading rentals:', error);
      alert('Failed to load rental information');
    } finally {
      setLoading(false);
    }
  };

  const calculateOwnershipProgress = (rental: ToolRental) => {
    if (rental.total_amount_to_own === 0) return 0;
    return (rental.amount_paid / rental.total_amount_to_own) * 100;
  };

  const calculateWeeksRemaining = (rental: ToolRental) => {
    if (rental.weekly_payment_amount === 0) return 0;
    return Math.ceil(rental.remaining_balance / rental.weekly_payment_amount);
  };

  const loadUpgradeOptions = async (currentRentalId: string) => {
    try {
      const rental = rentals.find(r => r.id === currentRentalId);
      if (!rental) return;

      // Calculate trade-in credit percentage based on payment completion
      const paymentPercentage = (rental.amount_paid / rental.total_amount_to_own) * 100;
      let tradeInPercentage = 0;
      
      if (paymentPercentage >= 70) tradeInPercentage = 70;
      else if (paymentPercentage >= 50) tradeInPercentage = 50;
      else if (paymentPercentage >= 25) tradeInPercentage = 25;

      const tradeInValue = rental.total_amount_to_own * (tradeInPercentage / 100);

      // Find available upgrade tools (better condition, newer, higher value)
      const { data: upgradeTools, error } = await supabase
        .from('tool_inventory')
        .select('*')
        .eq('current_status', 'available')
        .eq('category', rental.tool.category)
        .gte('retail_price', rental.total_amount_to_own * 1.2) // At least 20% more expensive
        .order('retail_price', { ascending: true })
        .limit(5);

      if (error) throw error;

      const options: UpgradeOption[] = upgradeTools?.map(tool => {
        const additionalCost = tool.retail_price - tradeInValue;
        const newWeeklyPayment = additionalCost / 52; // 1 year to own

        return {
          current_tool_id: rental.tool_id,
          new_tool_id: tool.id,
          new_tool: tool,
          trade_in_value: tradeInValue,
          trade_in_percentage: tradeInPercentage,
          additional_cost: additionalCost,
          new_weekly_payment: newWeeklyPayment
        };
      }) || [];

      setUpgradeOptions(options);
      setShowUpgradeCalculator(true);

    } catch (error) {
      console.error('Error loading upgrade options:', error);
      alert('Failed to load upgrade options');
    }
  };

  const processTradeIn = async (option: UpgradeOption) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the trade-in function
      const { data, error } = await supabase
        .rpc('process_tool_trade_in', {
          p_old_agreement_id: selectedRental!.id,
          p_new_tool_id: option.new_tool_id,
          p_credit_percentage: option.trade_in_percentage
        });

      if (error) throw error;

      alert(`🎉 Upgrade successful! Your ${option.new_tool.brand} ${option.new_tool.model} will be ready for pickup. Old tool will be assessed and refurbished.`);
      
      setShowUpgradeCalculator(false);
      setSelectedRental(null);
      loadRentals();

    } catch (error) {
      console.error('Error processing trade-in:', error);
      alert('Failed to process upgrade. Please contact support.');
    }
  };

  const previewDonationValue = async (rentalId: string) => {
    try {
      const rental = rentals.find(r => r.id === rentalId);
      if (!rental) return;

      // Check warranty status
      const warrantyActive = new Date(rental.tool.warranty_expiration) > new Date();
      
      // Assess donation value using the SQL function
      const { data, error } = await supabase
        .rpc('assess_donation_value', {
          p_condition: rental.tool.condition,
          p_has_active_warranty: warrantyActive,
          p_amount_paid_percentage: (rental.amount_paid / rental.total_amount_to_own) * 100
        });

      if (error) throw error;

      setDonationValue({
        ...data,
        rental: rental,
        warrantyActive: warrantyActive,
        estimatedTaxDeduction: rental.total_amount_to_own * (data.tax_deduction_percentage / 100),
        creditAmount: rental.total_amount_to_own * (data.credit_percentage / 100)
      });

      setShowDonationPreview(true);

    } catch (error) {
      console.error('Error calculating donation value:', error);
      alert('Failed to calculate donation value');
    }
  };

  const requestRepair = async (rentalId: string) => {
    const issueDescription = prompt('Please describe the issue with the tool:');
    if (!issueDescription) return;

    try {
      const rental = rentals.find(r => r.id === rentalId);
      if (!rental) return;

      // Create repair request
      const { error } = await supabase
        .from('tool_repairs')
        .insert([{
          tool_id: rental.tool_id,
          issue_description: issueDescription,
          repair_status: 'pending',
          estimated_cost: 0 // Will be assessed by mechanic
        }]);

      if (error) throw error;

      // Update tool status
      await supabase
        .from('tool_inventory')
        .update({ current_status: 'in_repair' })
        .eq('id', rental.tool_id);

      alert('✅ Repair request submitted! A mechanic will be assigned shortly. We\'ll provide a temporary replacement if needed.');
      loadRentals();

    } catch (error) {
      console.error('Error requesting repair:', error);
      alert('Failed to submit repair request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'defaulted': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWeeklyPayments = rentals
    .filter(r => r.agreement_status === 'active')
    .reduce((sum, r) => sum + r.weekly_payment_amount, 0);

  const totalInvested = rentals.reduce((sum, r) => sum + r.amount_paid, 0);
  
  const totalOwnedValue = rentals
    .filter(r => r.agreement_status === 'completed')
    .reduce((sum, r) => sum + r.total_amount_to_own, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 My Tool Rentals
        </h1>
        <p className="text-gray-600">
          Track your rent-to-own progress and manage your tool collection
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Rentals</div>
          <div className="text-3xl font-bold text-blue-600">
            {rentals.filter(r => r.agreement_status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Weekly Payment</div>
          <div className="text-3xl font-bold text-green-600">
            ${totalWeeklyPayments.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Invested</div>
          <div className="text-3xl font-bold text-purple-600">
            ${totalInvested.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Tools Owned</div>
          <div className="text-3xl font-bold text-green-600">
            ${totalOwnedValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Rentals Grid */}
      {rentals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <p className="text-gray-600 text-lg mb-2">No tool rentals yet</p>
          <p className="text-gray-400 text-sm mb-6">
            Browse the Tool Marketplace to start building your collection!
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Browse Tools
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rentals.map(rental => {
            const progress = calculateOwnershipProgress(rental);
            const weeksRemaining = calculateWeeksRemaining(rental);
            const isOwned = rental.agreement_status === 'completed';

            return (
              <div key={rental.id} className="bg-white rounded-lg shadow overflow-hidden">
                {rental.tool.photo_url && (
                  <img
                    src={rental.tool.photo_url}
                    alt={rental.tool.model}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1">
                        {rental.tool.brand} {rental.tool.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rental.tool.category} • SN: {rental.tool.serial_number}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.agreement_status)}`}>
                      {rental.agreement_status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {!isOwned && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Ownership Progress</span>
                        <span className="font-bold text-blue-600">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    {!isOwned && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Weekly Payment:</span>
                          <span className="font-bold">${rental.weekly_payment_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Paid So Far:</span>
                          <span className="font-medium text-green-600">
                            ${rental.amount_paid.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-bold text-blue-600">
                            ${rental.remaining_balance.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Own in:</span>
                          <span className="font-bold text-purple-600">
                            {weeksRemaining} weeks ({Math.ceil(weeksRemaining / 4)} months)
                          </span>
                        </div>
                      </>
                    )}
                    {isOwned && (
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎉</div>
                        <p className="font-bold text-green-600 text-lg">You Own This Tool!</p>
                        <p className="text-sm text-gray-600">
                          Total Invested: ${rental.amount_paid.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Auto-Deduct Status */}
                  {rental.auto_deduct_from_projects && !isOwned && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                      <span>✅</span>
                      <span>Auto-deducting from project earnings</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {!isOwned && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRental(rental);
                            loadUpgradeOptions(rental.id);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                          🚀 Upgrade
                        </button>
                        <button
                          onClick={() => requestRepair(rental.id)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                        >
                          🔧 Request Repair
                        </button>
                      </>
                    )}
                    {isOwned && (
                      <button
                        onClick={() => previewDonationValue(rental.id)}
                        className="col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        💝 Donate & Get Credit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgrade Calculator Modal */}
      {showUpgradeCalculator && selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                🚀 Upgrade Calculator
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Trade in your current tool for a better one and keep the savings!
              </p>
            </div>

            <div className="p-6">
              {/* Current Tool Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Your Current Tool</h3>
                <p className="text-lg font-medium">
                  {selectedRental.tool.brand} {selectedRental.tool.model}
                </p>
                <p className="text-sm text-gray-600">
                  Paid: ${selectedRental.amount_paid.toFixed(2)} of ${selectedRental.total_amount_to_own.toFixed(2)} ({calculateOwnershipProgress(selectedRental).toFixed(0)}%)
                </p>
              </div>

              {/* Upgrade Options */}
              {upgradeOptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No upgrade options available at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upgradeOptions.map((option, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg">
                            {option.new_tool.brand} {option.new_tool.model}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Condition: {option.new_tool.condition} • Category: {option.new_tool.category}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {option.trade_in_percentage}% Trade-In
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">New Tool Value:</span>
                          <span className="font-medium">${option.new_tool.retail_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Your Trade-In Credit:</span>
                          <span className="font-medium text-green-600">-${option.trade_in_value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600 font-medium">Additional Cost:</span>
                          <span className="font-bold text-blue-600">${option.additional_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">New Weekly Payment:</span>
                          <span className="font-bold">${option.new_weekly_payment.toFixed(2)}/week</span>
                        </div>
                      </div>

                      <button
                        onClick={() => processTradeIn(option)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Upgrade to This Tool
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowUpgradeCalculator(false);
                  setSelectedRental(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Preview Modal */}
      {showDonationPreview && donationValue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                💝 Donation Value Preview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                See what you'll receive for donating this tool back to the library
              </p>
            </div>

            <div className="p-6">
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-xl text-gray-900 mb-4">
                  {donationValue.rental.tool.brand} {donationValue.rental.tool.model}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Condition:</span>
                    <span className="font-medium">{donationValue.rental.tool.condition.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Warranty Status:</span>
                    <span className={`font-medium ${donationValue.warrantyActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {donationValue.warrantyActive ? '✅ Active' : '❌ Expired'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-green-200">
                    <span className="text-gray-700 font-bold">Tax Deduction:</span>
                    <span className="font-bold text-green-600 text-xl">
                      ${donationValue.estimatedTaxDeduction.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Rental Credit:</span>
                    <span className="font-bold text-blue-600 text-xl">
                      ${donationValue.creditAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>How it works:</strong> Donate your tool back to the library and receive a tax deduction
                  (IRS Form 8283) plus credit towards your next rental or tool purchase. Your donated tool will be
                  refurbished and help another Bronze member start their journey!
                </p>
              </div>

              <button
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
              >
                Proceed to Donation Wizard
              </button>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDonationPreview(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
